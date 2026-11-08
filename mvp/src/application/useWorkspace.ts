import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { BriefSchema, defaultBrief, type Brief } from "../domain/brief.ts";
import { eligibility, type EligibilityStatus } from "../domain/evaluation.ts";
import type { Listing } from "../domain/listing.ts";
import type { Bundle } from "../domain/transfer.ts";
import { demoListings } from "../data/demo-listings.ts";
import { db, type WorkspaceDB } from "../data/workspace-db.ts";
import { pruneSelection, toggleSelectedId } from "./workspace-selection.ts";
import { downloadWorkspace, readWorkspaceFile } from "./workspace-transfer.ts";

export type StatusFilter = "all" | EligibilityStatus;

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

export function useWorkspace(workspace: WorkspaceDB = db) {
  const [brief, setBrief] = useState<Brief>(defaultBrief);
  const [briefLoaded, setBriefLoaded] = useState(false);
  const briefRevision = useRef(0);
  const [selection, setSelection] = useState<string[]>([]);
  const [focusId, setFocusId] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");

  const snapshot = useLiveQuery(async () => {
    try {
      return { listings: await workspace.listings.toArray(), error: "" };
    } catch (error) {
      return { listings: [] as Listing[], error: errorMessage(error) };
    }
  }, [workspace]);

  useEffect(() => {
    let mounted = true;
    const revision = briefRevision.current;
    workspace
      .loadBrief()
      .then((stored) => {
        if (mounted && briefRevision.current === revision) setBrief(stored);
      })
      .catch((error) => {
        if (mounted && briefRevision.current === revision)
          setActionError(errorMessage(error));
      })
      .finally(() => {
        if (mounted) setBriefLoaded(true);
      });
    return () => {
      mounted = false;
    };
  }, [workspace]);

  const listings = snapshot?.listings ?? [];
  const selectedIds = pruneSelection(selection, listings);
  const selectedListings = selectedIds.flatMap((id) =>
    listings.filter((listing) => listing.id === id),
  );
  const focusedListing =
    listings.find((listing) => listing.id === focusId) ??
    selectedListings[0] ??
    listings[0];
  const visibleListings = listings.filter(
    (listing) =>
      listing.title.toLowerCase().includes(query.toLowerCase()) &&
      (statusFilter === "all" ||
        eligibility(listing, brief).status === statusFilter),
  );
  const summary = {
    total: listings.length,
    matched: listings.filter(
      (listing) => eligibility(listing, brief).status === "pass",
    ).length,
    unknown: listings.filter(
      (listing) => eligibility(listing, brief).status === "needs_clarification",
    ).length,
  };
  const isExtension = Boolean(
    (globalThis as { chrome?: { runtime?: { id?: string } } }).chrome?.runtime
      ?.id,
  );

  function success(message: string) {
    setNotice(message);
    setActionError("");
  }

  function reportError(error: unknown) {
    setNotice("");
    setActionError(errorMessage(error));
  }

  function resetNotice() {
    setNotice("");
    setActionError("");
  }

  function setFocusedListing(id: string) {
    setFocusId(id);
  }

  function toggleSelection(id: string) {
    setSelection((previous) => toggleSelectedId(previous, id, listings));
  }

  async function loadDemo(): Promise<void> {
    const saved = await workspace.saveListings(demoListings);
    setSelection(saved.slice(0, 3).map((listing) => listing.id));
    setFocusId(saved[0]?.id ?? "");
    success(
      "Добавлено 6 вымышленных примеров. Реальные объявления не загружались.",
    );
  }

  async function saveBrief(input: Brief): Promise<void> {
    const next = BriefSchema.parse(input);
    await workspace.saveBrief(next);
    briefRevision.current += 1;
    setBrief(next);
    success("Требования сохранены. Статусы карточек пересчитаны.");
  }

  async function saveListing(input: Listing): Promise<Listing> {
    const saved = await workspace.saveListing(input);
    setSelection((previous) =>
      previous.map((id) => (id === input.id ? saved.id : id)),
    );
    setFocusId(saved.id);
    success("Карточка и заявленные сведения сохранены.");
    return saved;
  }

  async function deleteListing(id: string): Promise<void> {
    await workspace.listings.delete(id);
    setSelection((previous) =>
      previous.filter((selectedId) => selectedId !== id),
    );
    setFocusId((previous) => (previous === id ? "" : previous));
    success("Карточка удалена из рабочей области.");
  }

  async function capture(): Promise<Listing> {
    if (!isExtension)
      throw new Error(
        "Снимок доступен в установленном расширении. Добавьте карточку вручную или импортируйте JSON.",
      );
    const { captureCurrentTab } =
      await import("../integrations/avito/capture.ts");
    const listing = await captureCurrentTab();
    const saved = await workspace.saveListing(listing);
    setFocusId(saved.id);
    success(
      "Карточка сохранена. Колёса, раму и состояние нужно подтвердить отдельно.",
    );
    return saved;
  }

  async function exportData(): Promise<void> {
    downloadWorkspace(await workspace.exportBundle());
    success("Рабочая область выгружена в JSON.");
  }

  async function importData(input: unknown): Promise<Bundle> {
    const imported = await workspace.importBundle(input);
    briefRevision.current += 1;
    setBrief(imported.brief);
    setSelection([]);
    setFocusId(imported.listings[0]?.id ?? "");
    success("Импортировано карточек: " + imported.listings.length);
    return imported;
  }

  async function importFile(file: File): Promise<Bundle> {
    return importData(await readWorkspaceFile(file));
  }

  async function openWorkspace(): Promise<void> {
    if (!isExtension)
      throw new Error(
        "Отдельная рабочая область доступна в установленном расширении.",
      );
    const { browser } = await import("wxt/browser");
    await browser.tabs.create({
      url: browser.runtime.getURL("/workspace.html"),
    });
  }

  return {
    listings,
    isLoading: snapshot === undefined || !briefLoaded,
    brief,
    selectedIds,
    selectedListings,
    focusedListing,
    query,
    statusFilter,
    visibleListings,
    summary,
    notice,
    error: actionError || snapshot?.error || "",
    isExtension,
    setQuery,
    setStatusFilter,
    setFocusedListing,
    toggleSelection,
    loadDemo,
    saveBrief,
    saveListing,
    deleteListing,
    capture,
    exportData,
    importData,
    importFile,
    openWorkspace,
    reportError,
    resetNotice,
  };
}

export type WorkspaceController = ReturnType<typeof useWorkspace>;

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { useWorkspace } from "./application/useWorkspace";
import type { Listing } from "./domain/listing";
import {
  WorkspaceLayout,
  type View,
} from "./components/layout/WorkspaceLayout";
import { Alert } from "./components/ui/Alert";
import { IconButton } from "./components/ui/IconButton";
import { RadarPage } from "./features/listings/RadarPage";
import { ListingImportDialog } from "./features/listings/ListingImportDialog";
import { ListingDetailDialog } from "./features/listings/ListingDetailDialog";
import { ComparisonPage } from "./features/comparison/ComparisonPage";
import { MarketPage } from "./features/market/MarketPage";
import { NegotiationPage } from "./features/negotiation/NegotiationPage";
import { BriefPage } from "./features/brief/BriefPage";

export function App() {
  const workspace = useWorkspace();
  const [view, setView] = useState<View>("radar");
  const [dialog, setDialog] = useState<"add" | "detail" | null>(null);
  // Keep the modal host alive through deletion so Base UI can restore focus.
  const [openedListing, setOpenedListing] = useState<Listing | null>(null);
  const detailListing =
    workspace.listings.find((item) => item.id === openedListing?.id) ??
    openedListing;
  const fileInput = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  function openDialog(next: "add" | "detail", id?: string) {
    returnFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (id) {
      workspace.setFocusedListing(id);
      setOpenedListing(
        workspace.listings.find((item) => item.id === id) ?? null,
      );
    }
    setDialog(next);
  }
  const run = (action: () => Promise<unknown>) => {
    void action().catch(workspace.reportError);
  };
  return (
    <WorkspaceLayout
      view={view}
      onViewChange={setView}
      selectedCount={workspace.selectedIds.length}
      isExtension={workspace.isExtension}
      onExport={() => run(workspace.exportData)}
      onImport={() => fileInput.current?.click()}
      onOpenWorkspace={() => run(workspace.openWorkspace)}
    >
      <input
        hidden
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        aria-label="Импорт JSON рабочей области"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) run(() => workspace.importFile(file));
          event.target.value = "";
        }}
      />
      {(workspace.notice || workspace.error) && (
        <Alert
          className="workspace-notice"
          tone={workspace.error ? "error" : "success"}
        >
          <span>{workspace.error || workspace.notice}</span>
          <IconButton
            label="Скрыть уведомление"
            size="sm"
            onClick={workspace.resetNotice}
          >
            <X size={16} />
          </IconButton>
        </Alert>
      )}
      {view === "radar" && (
        <RadarPage
          workspace={workspace}
          busy={workspace.isLoading}
          onAdd={() => openDialog("add")}
          onOpen={(id) => openDialog("detail", id)}
          onCompare={() => setView("compare")}
          onBrief={() => setView("brief")}
        />
      )}
      {view === "compare" && (
        <ComparisonPage
          listings={workspace.selectedListings}
          brief={workspace.brief}
        />
      )}
      {view === "market" && (
        <MarketPage
          listing={workspace.focusedListing}
          listings={workspace.listings}
        />
      )}
      {view === "draft" && (
        <NegotiationPage
          listing={workspace.focusedListing}
          brief={workspace.brief}
        />
      )}
      {view === "brief" && (
        <BriefPage
          key={JSON.stringify(workspace.brief)}
          brief={workspace.brief}
          onSave={workspace.saveBrief}
        />
      )}
      <ListingImportDialog
        open={dialog === "add"}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
        onSave={workspace.saveListing}
        returnFocus={returnFocus}
      />
      {detailListing && (
        <ListingDetailDialog
          listing={detailListing}
          brief={workspace.brief}
          open={dialog === "detail"}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          returnFocus={returnFocus}
          onSave={workspace.saveListing}
          onDelete={workspace.deleteListing}
          onNegotiate={() => {
            setDialog(null);
            setView("draft");
          }}
        />
      )}
    </WorkspaceLayout>
  );
}

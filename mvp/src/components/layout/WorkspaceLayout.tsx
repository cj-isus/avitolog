import {
  ArrowDownToLine,
  ArrowUpRight,
  Compass,
  GitCompareArrows,
  Layers3,
  MessageSquareText,
  Radar,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

export const views = [
  { id: "radar", name: "Мой радар", icon: Radar },
  { id: "compare", name: "Сравнение", icon: GitCompareArrows },
  { id: "market", name: "Ценовые ориентиры", icon: Layers3 },
  { id: "draft", name: "Подготовка торга", icon: MessageSquareText },
  { id: "brief", name: "Задача поиска", icon: SlidersHorizontal },
] as const;
export type View = (typeof views)[number]["id"];
type Props = {
  view: View;
  onViewChange: (view: View) => void;
  selectedCount: number;
  isExtension: boolean;
  onExport: () => void;
  onImport: () => void;
  onOpenWorkspace: () => void;
  children: ReactNode;
};

export function WorkspaceLayout({
  view,
  onViewChange,
  selectedCount,
  isExtension,
  onExport,
  onImport,
  onOpenWorkspace,
  children,
}: Props) {
  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-content">
        К содержимому
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            onViewChange("radar");
          }}
          aria-label="АВИТОЛОГ — мой радар"
        >
          <span className="brand-mark">
            <Compass aria-hidden="true" />
          </span>
          <span>
            АВИТОЛОГ<small>Личная лаборатория покупок</small>
          </span>
        </a>
        <div className="sidebar-caption">
          РАБОЧАЯ ОБЛАСТЬ <Badge>DEMO</Badge>
        </div>
        <nav className="workspace-nav" aria-label="Разделы рабочей области">
          {views.map(({ id, name, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={view === id ? "page" : undefined}
              onClick={() => onViewChange(id)}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{name}</span>
              {id === "compare" && (
                <span className="nav-count">{selectedCount}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="local-dot" />{" "}
          <strong>Данные на этом устройстве</strong>
          <p>
            Карточки и задача хранятся в браузере. Сохраните JSON для переноса.
          </p>
          <a href="../" target="_blank" rel="noreferrer">
            База знаний проекта <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="topbar-context">
            <span className="local-dot" /> Локальный режим{" "}
            <span className="topbar-separator">/</span>
            <span>{isExtension ? "Расширение" : "Веб-демо"}</span>
          </div>
          <div className="topbar-actions">
            <Button size="sm" variant="ghost" onClick={onImport}>
              <Upload size={16} aria-hidden="true" /> Импорт JSON
            </Button>
            <Button size="sm" variant="ghost" onClick={onExport}>
              <ArrowDownToLine size={16} aria-hidden="true" /> Экспорт
            </Button>
            {isExtension && (
              <Button size="sm" onClick={onOpenWorkspace}>
                Открыть отдельно <ArrowUpRight size={16} aria-hidden="true" />
              </Button>
            )}
          </div>
        </header>
        <main
          id="workspace-content"
          className="workspace-content"
          tabIndex={-1}
        >
          {children}
        </main>
        <footer className="workspace-footer">
          АВИТОЛОГ / Прототип 0.2{" "}
          <span>ИИ и отправка сообщений не подключены</span>
        </footer>
      </div>
    </div>
  );
}

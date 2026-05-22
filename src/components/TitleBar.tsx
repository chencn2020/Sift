import type { AppState, ViewName } from "../app/types";

interface TitleBarProps {
  state: AppState;
  title: string;
  t: (key: string) => string;
  onBack: () => void;
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onToggleInspector: () => void;
  onOpenCommand: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

const viewLabels: Record<ViewName, string> = {
  welcome: "projects",
  library: "library",
  loupe: "loupe",
  compare: "compare",
  people: "people"
};

export function TitleBar({
  state,
  title,
  t,
  onBack,
  onToggleTheme,
  onToggleSidebar,
  onToggleInspector,
  onOpenCommand,
  onOpenSettings,
  onOpenExport
}: TitleBarProps) {
  const onProject = state.view !== "welcome";
  const crumb = onProject ? `${title} · ${t(viewLabels[state.view])}` : t("appName");

  return (
    <header className="titlebar" id="titlebar">
      <div className="traffic-lights">
        <button className="tl tl-close" aria-label="Close" />
        <button className="tl tl-min" aria-label="Minimize" />
        <button className="tl tl-zoom" aria-label="Zoom" />
      </div>

      <div className="tb-left">
        {onProject ? (
          <button className="btn-back" id="btn-back" onClick={onBack}>
            <span className="arr">‹</span>
            <span>{t("projects")}</span>
          </button>
        ) : null}
        <span className="tb-crumbs" id="tb-crumbs">
          {crumb}
        </span>
      </div>

      <div className="tb-center" id="tb-center" />

      <div className="tb-right">
        {onProject ? (
          <>
            <button className="tb-toggle" title="Toggle sidebar" onClick={onToggleSidebar}>
              <svg>
                <use href="#ico-sidebar" />
              </svg>
            </button>
            <button className="tb-toggle" title="Toggle inspector" onClick={onToggleInspector}>
              <svg>
                <use href="#ico-inspector" />
              </svg>
            </button>
          </>
        ) : null}
        <span style={{ width: 6 }} />
        <button className="tb-icon" title="Command palette" onClick={onOpenCommand}>
          ⌘K
        </button>
        <button className="tb-icon" title="Toggle theme" onClick={onToggleTheme}>
          ◐
        </button>
        <button className="tb-icon" title={t("settings")} aria-label={t("settings")} onClick={onOpenSettings}>
          ⚙
        </button>
        {onProject ? (
          <button className="tb-btn primary" id="btn-export" onClick={onOpenExport}>
            {t("export")}
          </button>
        ) : null}
      </div>
    </header>
  );
}

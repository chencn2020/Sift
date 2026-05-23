import { useEffect, useRef, useState } from "react";
interface AppToolbarProps {
  title: string;
  t: (key: string) => string;
  backLabel: string;
  onBack: () => void;
  onToggleSidebar: () => void;
  onToggleInspector: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onRenameProject: (name: string) => void;
}

export function AppToolbar({
  title,
  t,
  backLabel,
  onBack,
  onToggleSidebar,
  onToggleInspector,
  onOpenSettings,
  onOpenExport,
  onRenameProject
}: AppToolbarProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(title);
  }, [title]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  function commitRename() {
    const nextName = draft.trim();
    if (nextName && nextName !== title) {
      onRenameProject(nextName);
    } else {
      setDraft(title);
    }
    setEditing(false);
  }

  function cancelRename() {
    setDraft(title);
    setEditing(false);
  }

  return (
    <header className="app-toolbar" id="app-toolbar">
      <div className="tb-left">
        <button className="btn-back" id="btn-back" onClick={onBack}>
          <span className="arr">‹</span>
          <span>{backLabel}</span>
        </button>
        {editing ? (
          <input
            ref={inputRef}
            className="tb-crumbs editing project-title-input"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onBlur={commitRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") commitRename();
              if (event.key === "Escape") cancelRename();
            }}
            aria-label={t("projectName")}
          />
        ) : (
          <button className="tb-crumbs editable project-title-button" id="tb-crumbs" onClick={() => setEditing(true)}>
            {title}
          </button>
        )}
      </div>

      <div className="tb-right">
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
        <button className="tb-icon" title={t("settings")} aria-label={t("settings")} onClick={onOpenSettings}>
          ⚙
        </button>
        <button className="tb-btn primary" id="btn-export" onClick={onOpenExport}>
          {t("export")}
        </button>
      </div>
    </header>
  );
}

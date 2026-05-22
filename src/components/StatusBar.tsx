import type { AppState, ViewName } from "../app/types";

interface StatusBarProps {
  state: AppState;
  t: (key: string) => string;
  onModeChange: (view: ViewName) => void;
  onThumbSizeChange: (size: number) => void;
  onOpenAi: () => void;
}

export function StatusBar({ state, t, onModeChange, onThumbSizeChange, onOpenAi }: StatusBarProps) {
  if (state.view === "welcome" || state.view === "people") return null;

  return (
    <footer className="statusbar" id="statusbar">
      <div className="sb-left">
        <button className="tb-btn" id="btn-tools" onClick={onOpenAi}>
          ✦ {t("aiOrganize")}
        </button>
        <span className="muted">
          {state.photos.length.toLocaleString()} {t("photos")}
        </span>
      </div>
      <div className="sb-center">
        <div className="seg">
          <button className={`seg-btn ${state.view === "library" ? "active" : ""}`} onClick={() => onModeChange("library")}>
            {t("grid")}
          </button>
          <button className={`seg-btn ${state.view === "loupe" ? "active" : ""}`} onClick={() => onModeChange("loupe")}>
            {t("loupe")}
          </button>
          <button className={`seg-btn ${state.view === "compare" ? "active" : ""}`} onClick={() => onModeChange("compare")}>
            {t("compare")}
          </button>
        </div>
      </div>
      <div className="sb-right">
        <span className="muted">Size</span>
        <input
          className="sb-slider"
          type="range"
          min={120}
          max={280}
          value={state.thumbSize}
          onChange={(event) => onThumbSizeChange(Number(event.currentTarget.value))}
        />
      </div>
    </footer>
  );
}

import { photoGradient } from "../../app/mockData";
import type { AppState } from "../../app/types";

interface CompareViewProps {
  state: AppState;
  t: (key: string) => string;
  onSelectPhoto: (photoId: number) => void;
  onPick: (photoId: number) => void;
  onLayoutChange: (layout: 2 | 4 | 9) => void;
}

export function CompareView({ state, t, onSelectPhoto, onPick, onLayoutChange }: CompareViewProps) {
  const burst = state.photos
    .filter((photo) => photo.burstId === "burst-1432")
    .sort((a, b) => b.bestInBurst - a.bestInBurst || b.sharpness - a.sharpness);
  const photos = burst.slice(0, state.compareLayout);

  return (
    <section className="view active" data-view="compare">
      <div className="compare-layout">
        <div className="compare-top">
          <div>
            <h2>连拍 14:32 · {burst.length} 张</h2>
            <p>{t("aiBest")}</p>
          </div>
          <div className="seg">
            {[2, 4, 9].map((layout) => (
              <button
                className={`seg-btn ${state.compareLayout === layout ? "active" : ""}`}
                key={layout}
                onClick={() => onLayoutChange(layout as 2 | 4 | 9)}
              >
                {layout}
              </button>
            ))}
          </div>
        </div>

        <div className={`cmp-grid layout-${state.compareLayout}`} id="cmp-grid">
          {photos.map((photo, index) => (
            <div
              className={`cmp-cell ${index === 0 ? "best" : ""}`}
              key={photo.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectPhoto(photo.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectPhoto(photo.id);
              }}
            >
              <div className="cmp-image" style={{ background: photoGradient(photo) }}>
                <span>{photo.filename}</span>
              </div>
              <div className="cmp-meta">
                <b>{index === 0 ? "✦ AI 最佳" : photo.filename}</b>
                <span>
                  清晰 {Math.round(photo.sharpness * 100)} · 眼睛 {photo.eyesClosed ? "闭眼" : "睁眼"}
                </span>
              </div>
              <button className="cmp-pick" onClick={(event) => (event.stopPropagation(), onPick(photo.id))}>
                ✓ {t("pick")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

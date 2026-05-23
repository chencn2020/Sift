import type { AppState, CompareSort } from "../../app/types";
import { sortPhotosForCompare } from "./compareSort";
import { PhotoImage } from "./PhotoImage";

interface CompareViewProps {
  state: AppState;
  t: (key: string) => string;
  onSelectPhoto: (photoId: number) => void;
  onPick: (photoId: number) => void;
  onLayoutChange: (layout: 2 | 4 | 9) => void;
  onSortChange: (sort: CompareSort) => void;
}

const SORT_OPTIONS: Array<{ value: CompareSort; labelKey: string }> = [
  { value: "name-asc", labelKey: "sortNameAsc" },
  { value: "name-desc", labelKey: "sortNameDesc" },
  { value: "time-asc", labelKey: "sortTimeAsc" },
  { value: "time-desc", labelKey: "sortTimeDesc" }
];

export function CompareView({ state, t, onSelectPhoto, onPick, onLayoutChange, onSortChange }: CompareViewProps) {
  const sortedPhotos = sortPhotosForCompare(state.photos, state.compareSort);
  const selectedIndex = Math.max(
    0,
    sortedPhotos.findIndex((photo) => photo.id === state.selectedPhotoId)
  );
  const selected = sortedPhotos[selectedIndex];
  const burstPhotos = selected?.burstId
    ? sortPhotosForCompare(
        sortedPhotos.filter((photo) => photo.burstId === selected.burstId),
        state.compareSort
      )
    : [];
  const candidates = burstPhotos.length >= 2 ? burstPhotos : sortedPhotos.slice(selectedIndex, selectedIndex + state.compareLayout);
  const photos = candidates.slice(0, state.compareLayout);

  return (
    <section className="view active" data-view="compare">
      <div className="compare-layout">
        <div className="compare-top">
          <div>
            <h2>{burstPhotos.length >= 2 ? `${t("bursts")} · ${burstPhotos.length}` : t("compareCurrent")}</h2>
            <p>{burstPhotos.length >= 2 ? t("compareBurstHint") : t("compareSequenceHint")}</p>
          </div>
          <div className="compare-actions">
            <label className="compare-sort">
              <span>{t("sort")}</span>
              <select className="select-sm" value={state.compareSort} onChange={(event) => onSortChange(event.target.value as CompareSort)}>
                {SORT_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <div className="seg" aria-label={t("compareLayout")}>
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
        </div>

        {photos.length ? (
          <div className={`cmp-grid layout-${state.compareLayout}`} id="cmp-grid">
            {photos.map((photo, index) => (
              <div
                className={`cmp-cell ${photo.id === state.selectedPhotoId ? "best" : ""}`}
                key={photo.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectPhoto(photo.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSelectPhoto(photo.id);
                }}
              >
                <PhotoImage photo={photo} className="cmp-image" showName />
                <div className="cmp-meta">
                  <b>{index === 0 && burstPhotos.length >= 2 && photo.analyzed ? t("aiBest") : photo.filename}</b>
                  <span>
                    {photo.analyzed
                      ? `${t("sharp")} ${Math.round(photo.sharpness * 100)} · ${photo.eyesClosed ? t("eyesClosed") : t("eyesOpen")}`
                      : t("notAnalyzed")}
                  </span>
                </div>
                <button className="cmp-pick" onClick={(event) => (event.stopPropagation(), onPick(photo.id))}>
                  ✓ {t("pick")}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h2>{t("noPhotos")}</h2>
            <p>{t("importFirstProject")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

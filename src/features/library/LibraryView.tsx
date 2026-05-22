import type { AppState, CollectionKey } from "../../app/types";
import { visiblePhotos } from "../../app/state";
import { Inspector } from "./Inspector";
import { LibrarySidebar } from "./LibrarySidebar";
import { photoCounts } from "./photoRules";
import { PhotoCard } from "./PhotoCard";
import type { CSSProperties } from "react";

interface LibraryViewProps {
  state: AppState;
  t: (key: string) => string;
  onCollectionChange: (collection: CollectionKey) => void;
  onToggleFilter: (filter: string) => void;
  onPersonSelect: (personId: string | null) => void;
  onOpenPeople: () => void;
  onSelectPhoto: (photoId: number) => void;
  onOpenPhoto: (photoId: number) => void;
}

export function LibraryView({
  state,
  t,
  onCollectionChange,
  onToggleFilter,
  onPersonSelect,
  onOpenPeople,
  onSelectPhoto,
  onOpenPhoto
}: LibraryViewProps) {
  const counts = photoCounts(state.photos);
  const photos = visiblePhotos(state);
  const selectedPhoto = state.photos.find((photo) => photo.id === state.selectedPhotoId) ?? null;

  return (
    <section className="view active" data-view="library">
      <div
        className={`lib-layout ${state.sidebarCollapsed ? "collapsed-sidebar" : ""} ${
          state.inspectorCollapsed ? "collapsed-inspector" : ""
        }`}
        id="lib-layout"
      >
        <LibrarySidebar
          state={state}
          t={t}
          onCollectionChange={onCollectionChange}
          onPersonSelect={onPersonSelect}
          onOpenPeople={onOpenPeople}
        />

        <div className="lib-content">
          <div className="filter-bar">
            <div className="tabs" id="tabs">
              <Tab active={state.collection === "all"} label={t("all")} count={counts.all} onClick={() => onCollectionChange("all")} />
              <Tab active={state.collection === "picks"} label={t("picks")} count={counts.picks} onClick={() => onCollectionChange("picks")} />
              <Tab active={state.collection === "rejects"} label={t("rejects")} count={counts.rejects} onClick={() => onCollectionChange("rejects")} />
              <Tab active={state.collection === "unrated"} label={t("unrated")} count={counts.unrated} onClick={() => onCollectionChange("unrated")} />
            </div>

            <div className="chips" id="chips">
              <Chip active={state.filters.includes("rating")} label="★ ≥ 3" onClick={() => onToggleFilter("rating")} />
              <Chip active={state.filters.includes("sharp")} label="清晰 ✓" onClick={() => onToggleFilter("sharp")} />
              <Chip active={state.filters.includes("eyes")} label="睁眼" onClick={() => onToggleFilter("eyes")} />
              <Chip active={state.filters.includes("nodup")} label="非重复" onClick={() => onToggleFilter("nodup")} />
              <Chip active={state.filters.includes("people")} label="+ 人物" onClick={() => onToggleFilter("people")} />
            </div>
          </div>

          <div className="grid-scroll" id="grid-scroll">
            <div className="photo-grid" id="photo-grid" style={{ "--thumb-size": `${state.thumbSize}px` } as CSSProperties}>
              {photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  selected={photo.id === state.selectedPhotoId}
                  onSelect={onSelectPhoto}
                  onOpen={onOpenPhoto}
                />
              ))}
            </div>
          </div>
        </div>

        {!state.inspectorCollapsed ? <Inspector photo={selectedPhoto} people={state.people} t={t} /> : <div />}
      </div>
    </section>
  );
}

function Tab({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button className={`tab ${active ? "active" : ""}`} onClick={onClick}>
      <span>{label}</span> <em>{count}</em>
    </button>
  );
}

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className={`chip ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

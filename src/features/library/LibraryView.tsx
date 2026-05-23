import type { AppState, CollectionKey } from "../../app/types";
import { visiblePhotos } from "../../app/state";
import { Inspector } from "./Inspector";
import { LibrarySidebar } from "./LibrarySidebar";
import { photoCounts } from "./photoRules";
import { PhotoCard } from "./PhotoCard";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

interface LibraryViewProps {
  state: AppState;
  t: (key: string) => string;
  onCollectionChange: (collection: CollectionKey) => void;
  onToggleFilter: (filter: string) => void;
  onPersonSelect: (personId: string | null) => void;
  onOpenPeople: () => void;
  onOpenRegisterPerson: () => void;
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
  onOpenRegisterPerson,
  onSelectPhoto,
  onOpenPhoto
}: LibraryViewProps) {
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState({ scrollTop: 0, height: 0, width: 0 });
  const counts = useMemo(() => photoCounts(state.photos), [state.photos]);
  const photos = useMemo(
    () => visiblePhotos(state),
    [state.photos, state.collection, state.filters, state.selectedPersonId]
  );
  const selectedPhoto = useMemo(
    () => state.photos.find((photo) => photo.id === state.selectedPhotoId) ?? null,
    [state.photos, state.selectedPhotoId]
  );
  const virtualGrid = useVirtualGrid({
    photoCount: photos.length,
    scrollTop: viewport.scrollTop,
    viewportHeight: viewport.height,
    viewportWidth: viewport.width,
    minThumbSize: state.thumbSize
  });
  const renderedPhotos = useMemo(
    () => photos.slice(virtualGrid.startIndex, virtualGrid.endIndex),
    [photos, virtualGrid.endIndex, virtualGrid.startIndex]
  );

  useEffect(() => {
    const scroller = gridScrollRef.current;
    if (!scroller) return undefined;

    const updateViewport = () => {
      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        setViewport({
          scrollTop: scroller.scrollTop,
          height: scroller.clientHeight,
          width: scroller.clientWidth
        });
      });
    };

    const updateViewportNow = () => {
      setViewport({
        scrollTop: scroller.scrollTop,
        height: scroller.clientHeight,
        width: scroller.clientWidth
      });
    };

    updateViewportNow();
    const resizeObserver = new ResizeObserver(updateViewportNow);
    resizeObserver.observe(scroller);
    scroller.addEventListener("scroll", updateViewport, { passive: true });

    return () => {
      if (scrollFrameRef.current !== null) window.cancelAnimationFrame(scrollFrameRef.current);
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", updateViewport);
    };
  }, []);

  useEffect(() => {
    const scroller = gridScrollRef.current;
    if (!scroller || state.selectedPhotoId == null) return;
    const selectedIndex = photos.findIndex((photo) => photo.id === state.selectedPhotoId);
    if (selectedIndex < 0) return;

    const selectedRow = Math.floor(selectedIndex / virtualGrid.columns);
    const rowTop = selectedRow * virtualGrid.rowStride;
    const rowBottom = rowTop + virtualGrid.rowHeight;
    if (rowTop < scroller.scrollTop) {
      scroller.scrollTop = rowTop;
    } else if (rowBottom > scroller.scrollTop + scroller.clientHeight) {
      scroller.scrollTop = rowBottom - scroller.clientHeight;
    }
  }, [photos, state.selectedPhotoId, virtualGrid.columns, virtualGrid.rowHeight, virtualGrid.rowStride]);

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
          onOpenRegisterPerson={onOpenRegisterPerson}
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

          <div className="grid-scroll" id="grid-scroll" ref={gridScrollRef}>
            <div
              className="photo-grid"
              id="photo-grid"
              style={
                {
                  "--thumb-size": `${state.thumbSize}px`,
                  gridTemplateColumns: `repeat(${virtualGrid.columns}, minmax(0, 1fr))`
                } as CSSProperties
              }
            >
              {virtualGrid.topSpacerHeight > 0 ? <div className="grid-spacer" style={{ height: virtualGrid.topSpacerHeight }} /> : null}
              {renderedPhotos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  selected={photo.id === state.selectedPhotoId}
                  onSelect={onSelectPhoto}
                  onOpen={onOpenPhoto}
                />
              ))}
              {virtualGrid.bottomSpacerHeight > 0 ? <div className="grid-spacer" style={{ height: virtualGrid.bottomSpacerHeight }} /> : null}
            </div>
          </div>
        </div>

        {!state.inspectorCollapsed ? <Inspector photo={selectedPhoto} people={state.people} t={t} /> : <div />}
      </div>
    </section>
  );
}

function useVirtualGrid({
  photoCount,
  scrollTop,
  viewportHeight,
  viewportWidth,
  minThumbSize
}: {
  photoCount: number;
  scrollTop: number;
  viewportHeight: number;
  viewportWidth: number;
  minThumbSize: number;
}) {
  const gap = 6;
  const safeWidth = Math.max(minThumbSize, viewportWidth);
  const columns = Math.max(1, Math.floor((safeWidth + gap) / (minThumbSize + gap)));
  const cellWidth = Math.max(minThumbSize, (safeWidth - gap * (columns - 1)) / columns);
  const rowHeight = Math.ceil((cellWidth * 2) / 3 + 34);
  const rowStride = rowHeight + gap;
  const rowCount = Math.ceil(photoCount / columns);
  const overscanRows = 2;
  const startRow = Math.max(0, Math.floor(scrollTop / rowStride) - overscanRows);
  const endRow = Math.min(rowCount, Math.ceil((scrollTop + viewportHeight) / rowStride) + overscanRows);
  const startIndex = startRow * columns;
  const endIndex = Math.min(photoCount, endRow * columns);

  return {
    columns,
    rowHeight,
    rowStride,
    startIndex,
    endIndex,
    topSpacerHeight: startRow * rowStride,
    bottomSpacerHeight: Math.max(0, (rowCount - endRow) * rowStride)
  };
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

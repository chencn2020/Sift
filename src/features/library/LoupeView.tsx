import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { AppState } from "../../app/types";
import { visiblePhotos } from "../../app/state";
import { getFilmstripWindow } from "./filmstrip";
import { PhotoCard } from "./PhotoCard";
import { PhotoImage } from "./PhotoImage";
import { basicPhotoInfo } from "./photoInfo";

interface LoupeViewProps {
  state: AppState;
  t: (key: string) => string;
  onSelectPhoto: (photoId: number) => void;
  onRate: (photoId: number, rating: number) => void;
  onPick: (photoId: number) => void;
  onReject: (photoId: number) => void;
}

const ZOOM_LEVELS = [1, 1.5, 2, 3, 4];

export function LoupeView({ state, t, onSelectPhoto, onRate, onPick, onReject }: LoupeViewProps) {
  const photos = visiblePhotos(state);
  const photo = photos.find((item) => item.id === state.selectedPhotoId) ?? photos[0];
  const filmstripRef = useRef<HTMLDivElement>(null);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [focusPoint, setFocusPoint] = useState({ x: 50, y: 50 });
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  if (!photo) {
    return (
      <section className="view active" data-view="loupe">
        <div className="loupe-layout">{t("noProject")}</div>
      </section>
    );
  }

  const index = photos.findIndex((item) => item.id === photo.id);
  const filmstripPhotos = getFilmstripWindow(photos, photo.id);
  const zoom = ZOOM_LEVELS[zoomIndex] ?? 1;
  const fullImageSrc = photo.originalSrc ?? photo.src ?? photo.thumbSrc;
  const metaLine = basicPhotoInfo(photo).join(" · ");
  const frameStyle = {
    "--zoom": zoom,
    "--focus-x": `${focusPoint.x}%`,
    "--focus-y": `${focusPoint.y}%`
  } as CSSProperties;
  const selectByOffset = (offset: number) => {
    const next = photos[(index + offset + photos.length) % photos.length];
    if (next) onSelectPhoto(next.id);
  };

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= 1) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setFocusPoint({
      x: clamp(((event.clientX - bounds.left) / bounds.width) * 100, 0, 100),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * 100, 0, 100)
    });
  }

  useEffect(() => {
    const selected = filmstripRef.current?.querySelector<HTMLElement>(`.photo-card[data-photo-id="${photo.id}"]`);
    selected?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [photo.id, filmstripPhotos.length]);

  return (
    <section className="view active" data-view="loupe">
      <div className="loupe-layout">
        <div className="loupe-stage" id="loupe-stage">
          <button className="loupe-nav prev" onClick={() => selectByOffset(-1)} aria-label="Previous">
            ‹
          </button>
          <div
            className={`loupe-frame ${zoom > 1 ? "zoomed" : ""}`}
            id="loupe-frame"
            style={frameStyle}
            onPointerMove={handlePointerMove}
          >
            <div className="loupe-zoom-surface">
              <PhotoImage photo={photo} className="loupe-art" showName variant="full" fallbackLabel={t("missingSourceFile")} />
            </div>
          </div>
          <button className="loupe-nav next" onClick={() => selectByOffset(1)} aria-label="Next">
            ›
          </button>

          <div className="loupe-counter">
            {index + 1} / {photos.length}
          </div>

          <div className="loupe-overlay">
            {photo.state ? <div className={`loupe-state-badge ${photo.state}`}>{photo.state === "pick" ? t("picked") : t("rejected")}</div> : null}
            <div className="loupe-meta">
              <b>{photo.filename}</b>
              {metaLine || t("metadataUnavailable")}
            </div>
            <div className="loupe-actions">
              <div className="zoom-bar" aria-label={t("zoom")}>
                <button onClick={() => setZoomIndex((value) => Math.max(0, value - 1))} disabled={zoomIndex === 0}>
                  -
                </button>
                <span>{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoomIndex((value) => Math.min(ZOOM_LEVELS.length - 1, value + 1))} disabled={zoomIndex === ZOOM_LEVELS.length - 1}>
                  +
                </button>
              </div>
              <div className="rating-bar" onMouseLeave={() => setHoverRating(null)}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    className={`rb-star ${(hoverRating ?? photo.rating) >= rating ? "active" : ""}`}
                    key={rating}
                    aria-pressed={(hoverRating ?? photo.rating) >= rating}
                    onMouseEnter={() => setHoverRating(rating)}
                    onFocus={() => setHoverRating(rating)}
                    onBlur={() => setHoverRating(null)}
                    onClick={() => onRate(photo.id, rating)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="flag-bar">
                <button
                  className={`fb-btn pick ${photo.state === "pick" ? "on" : ""}`}
                  aria-pressed={photo.state === "pick"}
                  onClick={() => onPick(photo.id)}
                >
                  ✓ {photo.state === "pick" ? t("picked") : t("pick")}
                </button>
                <button
                  className={`fb-btn rej ${photo.state === "reject" ? "on" : ""}`}
                  aria-pressed={photo.state === "reject"}
                  onClick={() => onReject(photo.id)}
                >
                  ✗ {photo.state === "reject" ? t("rejected") : t("reject")}
                </button>
              </div>
            </div>
          </div>

          {zoom > 1 && fullImageSrc ? (
            <div className="loupe-minimap" aria-label={t("zoomNavigator")}>
              <img src={fullImageSrc} alt="" />
              <span
                style={{
                  width: `${100 / zoom}%`,
                  height: `${100 / zoom}%`,
                  left: `${clamp(focusPoint.x - 50 / zoom, 0, 100 - 100 / zoom)}%`,
                  top: `${clamp(focusPoint.y - 50 / zoom, 0, 100 - 100 / zoom)}%`
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="filmstrip" id="filmstrip" ref={filmstripRef}>
          {filmstripPhotos.map((item) => (
            <PhotoCard key={item.id} photo={item} selected={item.id === photo.id} onSelect={onSelectPhoto} />
          ))}
        </div>
      </div>
    </section>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

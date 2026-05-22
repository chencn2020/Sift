import { photoGradient } from "../../app/mockData";
import type { AppState } from "../../app/types";
import { visiblePhotos } from "../../app/state";
import { PhotoCard } from "./PhotoCard";

interface LoupeViewProps {
  state: AppState;
  t: (key: string) => string;
  onSelectPhoto: (photoId: number) => void;
  onBackToGrid: () => void;
  onRate: (photoId: number, rating: number) => void;
  onPick: (photoId: number) => void;
  onReject: (photoId: number) => void;
}

export function LoupeView({ state, t, onSelectPhoto, onBackToGrid, onRate, onPick, onReject }: LoupeViewProps) {
  const photos = visiblePhotos(state);
  const photo = photos.find((item) => item.id === state.selectedPhotoId) ?? photos[0];

  if (!photo) {
    return (
      <section className="view active" data-view="loupe">
        <div className="loupe-layout">{t("noProject")}</div>
      </section>
    );
  }

  const index = photos.findIndex((item) => item.id === photo.id);
  const selectByOffset = (offset: number) => {
    const next = photos[(index + offset + photos.length) % photos.length];
    if (next) onSelectPhoto(next.id);
  };

  return (
    <section className="view active" data-view="loupe">
      <div className="loupe-layout">
        <div className="loupe-stage" id="loupe-stage">
          <button className="loupe-nav prev" onClick={() => selectByOffset(-1)} aria-label="Previous">
            ‹
          </button>
          <button className="loupe-frame" id="loupe-frame" onClick={onBackToGrid}>
            <div className="loupe-art" style={{ background: photoGradient(photo) }}>
              <span>{photo.filename}</span>
            </div>
          </button>
          <button className="loupe-nav next" onClick={() => selectByOffset(1)} aria-label="Next">
            ›
          </button>

          <div className="loupe-overlay">
            <div className="loupe-meta">
              <b>{photo.filename}</b>
              {photo.camera.aperture} · {photo.camera.shutter} · ISO {photo.camera.iso}
            </div>
            <div className="loupe-actions">
              <div className="rating-bar">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button className={`rb-star ${photo.rating >= rating ? "active" : ""}`} key={rating} onClick={() => onRate(photo.id, rating)}>
                    ★
                  </button>
                ))}
              </div>
              <div className="flag-bar">
                <button className="fb-btn pick" onClick={() => onPick(photo.id)}>
                  ✓ {t("pick")}
                </button>
                <button className="fb-btn rej" onClick={() => onReject(photo.id)}>
                  ✗ {t("reject")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="filmstrip" id="filmstrip">
          {photos.slice(0, 32).map((item) => (
            <PhotoCard key={item.id} photo={item} selected={item.id === photo.id} onSelect={onSelectPhoto} />
          ))}
        </div>
      </div>
    </section>
  );
}

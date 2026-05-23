import type { PhotoSummary } from "../../app/types";
import { rejectReasons } from "./photoRules";
import type { CSSProperties } from "react";
import { memo } from "react";
import { PhotoImage } from "./PhotoImage";

interface PhotoCardProps {
  photo: PhotoSummary;
  selected: boolean;
  thumbSize?: number;
  onSelect: (photoId: number) => void;
  onOpen?: (photoId: number) => void;
}

export const PhotoCard = memo(function PhotoCard({ photo, selected, thumbSize, onSelect, onOpen }: PhotoCardProps) {
  const reasons = rejectReasons(photo);
  return (
    <button
      className={`photo-card ${selected ? "selected" : ""} ${photo.state === "pick" ? "is-pick" : ""} ${
        photo.state === "reject" ? "is-reject" : ""
      }`}
      data-photo-id={photo.id}
      aria-pressed={selected}
      tabIndex={-1}
      style={thumbSize ? ({ "--thumb-size": `${thumbSize}px` } as CSSProperties) : undefined}
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => onSelect(photo.id)}
      onDoubleClick={() => onOpen?.(photo.id)}
    >
      <div className="photo-thumb">
        <PhotoImage photo={photo} className="photo-art" />
        {photo.state === "pick" ? <span className="flag pick">✓</span> : null}
        {photo.state === "reject" ? <span className="flag reject">×</span> : null}
        {photo.burstId ? <span className="stack-badge">▤</span> : null}
      </div>
      <div className="photo-caption">
        <span>{photo.filename}</span>
        <span className="stars">{"★".repeat(photo.rating)}</span>
      </div>
      {photo.state === "reject" && reasons.length > 0 ? <div className="reject-reasons">{reasons.join(" · ")}</div> : null}
    </button>
  );
});

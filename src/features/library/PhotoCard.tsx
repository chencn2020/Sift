import { photoGradient } from "../../app/mockData";
import type { PhotoSummary } from "../../app/types";
import { rejectReasons } from "./photoRules";
import type { CSSProperties } from "react";

interface PhotoCardProps {
  photo: PhotoSummary;
  selected: boolean;
  thumbSize?: number;
  onSelect: (photoId: number) => void;
  onOpen?: (photoId: number) => void;
}

export function PhotoCard({ photo, selected, thumbSize, onSelect, onOpen }: PhotoCardProps) {
  const reasons = rejectReasons(photo);
  return (
    <button
      className={`photo-card ${selected ? "selected" : ""} ${photo.state === "pick" ? "is-pick" : ""} ${
        photo.state === "reject" ? "is-reject" : ""
      }`}
      style={thumbSize ? ({ "--thumb-size": `${thumbSize}px` } as CSSProperties) : undefined}
      onClick={() => onSelect(photo.id)}
      onDoubleClick={() => onOpen?.(photo.id)}
    >
      <div className="photo-thumb">
        <div className="photo-art" style={{ background: photoGradient(photo) }}>
          <span>{photo.filename.slice(4, 8)}</span>
        </div>
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
}

import { useEffect, useState } from "react";
import type { PhotoSummary } from "../../app/types";

interface PhotoImageProps {
  photo: PhotoSummary;
  className: string;
  showName?: boolean;
  variant?: "thumb" | "full";
  fallbackLabel?: string;
}

export function PhotoImage({ photo, className, showName = false, variant = "thumb", fallbackLabel = "找不到索引文件" }: PhotoImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = variant === "full" ? photo.originalSrc ?? photo.src ?? photo.thumbSrc : photo.thumbSrc ?? photo.src;

  useEffect(() => {
    setFailedSrc(null);
  }, [src]);

  if (src && failedSrc !== src) {
    if (variant !== "full" && !src) {
      return <div className={`${className} photo-img loading`} aria-label={photo.filename} />;
    }

    return (
      <img
        className={`${className} photo-img`}
        src={src}
        alt={photo.filename}
        loading="lazy"
        decoding="async"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  return (
    <div className={`${className} file-tile`}>
      <span className="file-ext">{photo.format?.toUpperCase() || "IMG"}</span>
      {showName || failedSrc ? <span className="file-name">{failedSrc ? fallbackLabel : photo.filename}</span> : null}
    </div>
  );
}

import type { DragEvent, ReactNode } from "react";

interface ModalProps {
  title?: string;
  className?: string;
  open: boolean;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function Modal({ title, className = "", open, children, footer, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      onDragEnter={stopFileDrag}
      onDragOver={stopFileDrag}
      onDrop={stopFileDrag}
    >
      <div className={`modal-card ${className}`}>
        <div className="modal-head">
          {title ? <h2>{title}</h2> : <span />}
          <button className="modal-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

function stopFileDrag(event: DragEvent<HTMLDivElement>) {
  if (!Array.from(event.dataTransfer.types).includes("Files")) return;
  event.preventDefault();
  event.stopPropagation();
}

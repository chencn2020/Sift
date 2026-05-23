import { useEffect, useRef, useState } from "react";
import { Modal } from "../../components/Modal";
import type { ProjectSummary } from "../../app/types";

interface ProjectCardProps {
  project: ProjectSummary;
  t: (key: string) => string;
  onOpen: (projectId: string) => void;
  onRename: (projectId: string, name: string) => void;
  onTogglePinned: (projectId: string) => void;
  onRate: (projectId: string, rating: number) => void;
  onDelete: (projectId: string) => void;
  showLastOpened?: boolean;
}

export function ProjectCard({ project, t, onOpen, onRename, onTogglePinned, onRate, onDelete, showLastOpened = false }: ProjectCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeMenu = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  return (
    <>
      <article className={`project-card ${project.pinned ? "is-pinned" : ""}`}>
        <button className="project-open" onClick={() => onOpen(project.id)}>
          <ProjectCover project={project} t={t} />
          <div className="project-meta">
            <div className="project-name">
              <span>{project.name}</span>
              <span>{project.status === "ready" ? "✓" : "…"}</span>
            </div>
            <div className="project-date">{project.date}</div>
            {showLastOpened ? (
              <div className="project-last-opened">
                {t("lastOpened")} {formatProjectTime(project.lastOpenedAt) || t("notOpenedYet")}
              </div>
            ) : null}
            <div className="project-stats">
              <span className="pill">
                {project.total.toLocaleString()} {t("photos")}
              </span>
              <span>{project.status === "ready" ? t("ready") : t("inProgress")}</span>
            </div>
            {project.rating ? <div className="project-rating">{"★".repeat(project.rating)}</div> : null}
          </div>
        </button>

        <div className="project-menu" ref={menuRef}>
          <button
            className="project-menu-trigger"
            aria-label={t("projectActions")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ···
          </button>
          {menuOpen ? (
            <div className="project-menu-list" role="menu">
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setRenameOpen(true);
                }}
              >
                {t("rename")}
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onTogglePinned(project.id);
                }}
              >
                {project.pinned ? t("unpin") : t("pin")}
              </button>
              <div className="project-menu-stars" role="group" aria-label={t("rateProject")} onMouseLeave={() => setHoverRating(null)}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    className={rating <= (hoverRating ?? project.rating ?? 0) ? "active" : ""}
                    aria-label={`${rating} ${t("stars")}`}
                    onMouseEnter={() => setHoverRating(rating)}
                    onFocus={() => setHoverRating(rating)}
                    onBlur={() => setHoverRating(null)}
                    onClick={() => onRate(project.id, project.rating === rating ? 0 : rating)}
                  >
                    ★
                  </button>
                ))}
              </div>
              <button
                role="menuitem"
                className="danger"
                onClick={() => {
                  setMenuOpen(false);
                  setDeleteOpen(true);
                }}
              >
                {t("delete")}
              </button>
            </div>
          ) : null}
        </div>
      </article>

      <RenameProjectModal
        open={renameOpen}
        name={project.name}
        t={t}
        onClose={() => setRenameOpen(false)}
        onSave={(name) => {
          onRename(project.id, name);
          setRenameOpen(false);
        }}
      />
      <DeleteProjectModal
        open={deleteOpen}
        projectName={project.name}
        t={t}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          onDelete(project.id);
          setDeleteOpen(false);
        }}
      />
    </>
  );
}

function formatProjectTime(value: string | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function ProjectCover({ project, t }: { project: ProjectSummary; t: (key: string) => string }) {
  const covers = project.coverUrls?.length ? project.coverUrls : project.coverUrl ? [project.coverUrl] : [];

  return (
    <div className={`project-thumb cover-count-${Math.min(4, covers.length)}`}>
      {covers.length ? (
        covers.slice(0, 4).map((src, index) => <img src={src} alt="" key={`${src}-${index}`} />)
      ) : (
        <div className="project-art">{project.name.slice(0, 2)}</div>
      )}
      {project.pinned ? <span className="project-pin-badge">{t("pinned")}</span> : null}
    </div>
  );
}

function RenameProjectModal({
  open,
  name,
  t,
  onClose,
  onSave
}: {
  open: boolean;
  name: string;
  t: (key: string) => string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [value, setValue] = useState(name);

  useEffect(() => {
    if (open) setValue(name);
  }, [name, open]);

  return (
    <Modal
      open={open}
      title={t("renameProject")}
      className="md-project-action"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn-primary" onClick={() => value.trim() && onSave(value.trim())}>
            {t("save")}
          </button>
        </>
      }
    >
      <div className="form-row">
        <label htmlFor="project-rename-input">{t("projectName")}</label>
        <input
          id="project-rename-input"
          type="text"
          className="input"
          autoFocus
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && value.trim()) onSave(value.trim());
          }}
        />
      </div>
    </Modal>
  );
}

function DeleteProjectModal({
  open,
  projectName,
  t,
  onClose,
  onConfirm
}: {
  open: boolean;
  projectName: string;
  t: (key: string) => string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      title={t("deleteProject")}
      className="md-project-action"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn-primary danger-action" onClick={onConfirm}>
            {t("delete")}
          </button>
        </>
      }
    >
      <p className="confirm-text">
        {t("deleteProjectConfirm")} <b>{projectName}</b>
      </p>
      <p className="confirm-text safe-note">{t("deleteProjectSafeNote")}</p>
    </Modal>
  );
}

import { useState } from "react";
import { Modal } from "../../components/Modal";
import type { ProjectSummary } from "../../app/types";

interface RecentlyDeletedSheetProps {
  open: boolean;
  projects: ProjectSummary[];
  t: (key: string) => string;
  onClose: () => void;
  onRestore: (projectId: string) => void;
  onEmpty: () => void;
}

export function RecentlyDeletedSheet({ open, projects, t, onClose, onRestore, onEmpty }: RecentlyDeletedSheetProps) {
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  return (
    <Modal
      open={open}
      title={t("recentlyDeleted")}
      className="md-projects-sheet"
      onClose={() => {
        setConfirmEmpty(false);
        onClose();
      }}
      footer={
        projects.length ? (
          <>
            <button className="btn-ghost" onClick={onClose}>
              {t("cancel")}
            </button>
            <button
              className="btn-primary danger-action"
              onClick={() => {
                if (!confirmEmpty) {
                  setConfirmEmpty(true);
                  return;
                }
                onEmpty();
                setConfirmEmpty(false);
              }}
            >
              {confirmEmpty ? t("confirmEmptyTrash") : t("emptyTrash")}
            </button>
          </>
        ) : undefined
      }
    >
      <p className="trash-note">{t("trashOriginalsSafe")}</p>
      {projects.length ? (
        <div className="trash-list">
          {projects.map((project) => (
            <article className="trash-row" key={project.id}>
              <div>
                <b>{project.name}</b>
                <span>
                  {project.total.toLocaleString()} {t("photos")}
                  {project.deletedAt ? ` · ${t("deletedAt")} ${formatTrashTime(project.deletedAt)}` : ""}
                </span>
              </div>
              <div className="trash-actions">
                <button className="btn-ghost" onClick={() => onRestore(project.id)}>
                  {t("restore")}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>{t("trashEmpty")}</h2>
          <p>{t("trashOriginalsSafe")}</p>
        </div>
      )}
    </Modal>
  );
}

function formatTrashTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

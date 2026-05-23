import { Modal } from "../../components/Modal";
import type { ProjectSummary } from "../../app/types";
import { ProjectCard } from "./ProjectCard";

interface ProjectsSheetProps {
  open: boolean;
  projects: ProjectSummary[];
  t: (key: string) => string;
  onClose: () => void;
  onOpenProject: (projectId: string) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onToggleProjectPinned: (projectId: string) => void;
  onRateProject: (projectId: string, rating: number) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectsSheet({
  open,
  projects,
  t,
  onClose,
  onOpenProject,
  onRenameProject,
  onToggleProjectPinned,
  onRateProject,
  onDeleteProject
}: ProjectsSheetProps) {
  return (
    <Modal open={open} title={t("allProjects")} className="md-projects-sheet" onClose={onClose}>
      <div className="sheet-summary">
        <span>
          {projects.length.toLocaleString()} {t("projects")}
        </span>
        <span>{t("allProjectsHint")}</span>
      </div>
      <div className="project-grid all-project-grid">
        {projects.length ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              t={t}
              showLastOpened
              onOpen={(projectId) => {
                onOpenProject(projectId);
                onClose();
              }}
              onRename={onRenameProject}
              onTogglePinned={onToggleProjectPinned}
              onRate={onRateProject}
              onDelete={onDeleteProject}
            />
          ))
        ) : (
          <div className="empty-state">
            <h2>{t("noProjects")}</h2>
            <p>{t("importFirstProject")}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

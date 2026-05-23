import { useMemo, useRef, useState, type DragEvent } from "react";
import type { ProjectSummary, UserProfile } from "../../app/types";
import { UserAvatar } from "../../components/UserAvatar";
import { ProfileModal } from "../profile/ProfileModal";
import { filesFromDataTransfer } from "./localImport";
import { ProjectCard } from "./ProjectCard";
import { ProjectsSheet } from "./ProjectsSheet";
import { RecentlyDeletedSheet } from "./RecentlyDeletedSheet";
import { allProjects, recentProjects } from "./projectOrdering";

interface WelcomeViewProps {
  projects: ProjectSummary[];
  deletedProjects: ProjectSummary[];
  user: UserProfile;
  t: (key: string) => string;
  onOpenProject: (projectId: string) => void;
  onImportFiles: (files: File[]) => void | Promise<void>;
  onOpenSettings: () => void;
  onUpdateUser: (profile: UserProfile) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onToggleProjectPinned: (projectId: string) => void;
  onRateProject: (projectId: string, rating: number) => void;
  onDeleteProject: (projectId: string) => void;
  onRestoreProject: (projectId: string) => void;
  onEmptyTrash: () => void;
  externalDragging?: boolean;
}

const directoryInputProps = {
  webkitdirectory: "",
  directory: ""
};

export function WelcomeView({
  projects,
  deletedProjects,
  user,
  t,
  onOpenProject,
  onImportFiles,
  onOpenSettings,
  onUpdateUser,
  onRenameProject,
  onToggleProjectPinned,
  onRateProject,
  onDeleteProject,
  onRestoreProject,
  onEmptyTrash,
  externalDragging = false
}: WelcomeViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [allProjectsOpen, setAllProjectsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);
  const isDragging = dragging || externalDragging;
  const recent = useMemo(() => recentProjects(projects), [projects]);
  const all = useMemo(() => allProjects(projects), [projects]);

  const openFolderPicker = () => fileInputRef.current?.click();

  function isFileDrag(event: DragEvent<HTMLElement>) {
    return Array.from(event.dataTransfer.types).includes("Files");
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  }

  async function handleDrop(event: DragEvent<HTMLElement>) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    const files = await filesFromDataTransfer(event.dataTransfer);
    await onImportFiles(files);
  }

  return (
    <section
      className={`view active welcome-drop-target ${isDragging ? "dragging" : ""}`}
      data-view="welcome"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(event) => void handleDrop(event)}
    >
      <div className="welcome">
        <div className="welcome-top">
          <div className="welcome-brand">
            <span className="logo-mark" style={{ width: 28, height: 28 }}>
              <svg>
                <use href="#logo-mark" />
              </svg>
            </span>
            <span className="word">Sift</span>
          </div>
          <button className="btn-primary me-settings-btn" onClick={onOpenSettings}>
            {t("settings")}
          </button>
        </div>

        <button className="me-card profile-entry" onClick={() => setProfileOpen(true)}>
          <UserAvatar profile={user} size="md" />
          <div className="me-info">
            <div className="me-name">{user.displayName}</div>
            <div className="me-sub">
              <span className="badge-local">Local</span>
              <span>{t("localOnly")}</span>
            </div>
          </div>
          <div className="me-quick">
            <span>
              {t("projects")} <b>{projects.length}</b>
            </span>
            <span>
              <span className="dot on" /> {t("gpu")} <b>{t("enabled")}</b>
            </span>
            <span>
              <b>{t("local")}</b> {t("privacyMode")}
            </span>
          </div>
        </button>

        <div className="welcome-head">
          <h1>{t("projects")}</h1>
          <button className="btn-ghost" onClick={openFolderPicker}>
            {t("newFromFolder")}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          {...directoryInputProps}
          onChange={(event) => {
            void onImportFiles(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
        />

        <button
          className={`dropzone ${isDragging ? "over" : ""}`}
          id="dropzone"
          onClick={openFolderPicker}
        >
          <div className="dropzone-inner">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <div className="dz-title">{t("dropFolder")}</div>
            <div className="dz-hint">{t("browseHint")}</div>
          </div>
        </button>

        <div className="section-head">
          <h2>{t("recent")}</h2>
          <div className="section-actions">
            <button className="btn-ghost" onClick={() => setTrashOpen(true)}>
              {t("recentlyDeleted")}
              {deletedProjects.length ? ` · ${deletedProjects.length}` : ""}
            </button>
            <button className="btn-ghost" onClick={() => setAllProjectsOpen(true)}>
              {t("allProjects")}
            </button>
          </div>
        </div>

        <div className="project-grid recent-project-grid" id="project-grid">
          {recent.length ? (
            recent.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                t={t}
                showLastOpened
                onOpen={onOpenProject}
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
      </div>

      <ProjectsSheet
        open={allProjectsOpen}
        projects={all}
        t={t}
        onClose={() => setAllProjectsOpen(false)}
        onOpenProject={onOpenProject}
        onRenameProject={onRenameProject}
        onToggleProjectPinned={onToggleProjectPinned}
        onRateProject={onRateProject}
        onDeleteProject={onDeleteProject}
      />
      <RecentlyDeletedSheet
        open={trashOpen}
        projects={deletedProjects}
        t={t}
        onClose={() => setTrashOpen(false)}
        onRestore={onRestoreProject}
        onEmpty={onEmptyTrash}
      />
      <ProfileModal
        open={profileOpen}
        profile={user}
        t={t}
        onClose={() => setProfileOpen(false)}
        onSave={onUpdateUser}
      />
    </section>
  );
}

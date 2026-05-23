import { useEffect, useMemo, useReducer, useState } from "react";
import { AppToolbar } from "../components/AppToolbar";
import { LogoSymbols } from "../components/LogoSymbols";
import { StatusBar } from "../components/StatusBar";
import { AiOrganizeModal } from "../features/ai/AiOrganizeModal";
import { CommandPalette } from "../features/commands/CommandPalette";
import { ExportModal } from "../features/export/ExportModal";
import { CompareView } from "../features/library/CompareView";
import { LibraryView } from "../features/library/LibraryView";
import { LoupeView } from "../features/library/LoupeView";
import { getGridColumnCount, getNextPhotoId } from "../features/library/navigation";
import { planAiChanges } from "../features/library/photoRules";
import { PeopleView } from "../features/people/PeopleView";
import { RegisterPersonModal } from "../features/people/RegisterPersonModal";
import { canUseDesktopImport, createProjectFromPaths, subscribeToDesktopDrops } from "../features/projects/desktopImport";
import { selectProjectCoverUrls } from "../features/projects/imageMetadata";
import { createProjectFromFiles } from "../features/projects/localImport";
import type { LocalImportResult } from "../features/projects/localImport";
import {
  allowOriginalPaths,
  clearPersistentThumbnailCache,
  countPhotosNeedingThumbnails,
  ensurePhotoThumbnails,
  hydrateCachedThumbnails
} from "../features/projects/thumbnails";
import { WelcomeView } from "../features/projects/WelcomeView";
import { SettingsModal } from "../features/settings/SettingsModal";
import { createTranslator } from "./i18n";
import { appReducer, initialState, visiblePhotos } from "./state";
import { initializeDatabase, loadCatalog, persistCatalog, resolveStorageInfo, type StorageInfo } from "./storage";
import type { CollectionKey, ExportOptions, ImportProgress, ProjectSummary, ViewName } from "./types";
import { saveUserProfile } from "./userProfile";

type ModalName = "settings" | "export" | "commands" | "ai" | "registerPerson" | null;

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [modal, setModal] = useState<ModalName>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [desktopDragging, setDesktopDragging] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"dark" | "light">(() => getSystemTheme());
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [progressTasks, setProgressTasks] = useState<ImportProgress[]>([]);
  const t = useMemo(() => createTranslator(state.language), [state.language]);

  useEffect(() => {
    const effectiveTheme = state.theme === "system" ? systemTheme : state.theme;
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.dataset.themeMode = state.theme;
  }, [state.theme, systemTheme]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(media.matches ? "dark" : "light");
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const info = await resolveStorageInfo();
        if (!cancelled) setStorageInfo(info);
        await initializeDatabase();
        const snapshot = await loadCatalog();
        if (!cancelled && snapshot) {
          const [projects, deletedProjects] = await Promise.all([
            hydrateProjectCatalog(snapshot.projects),
            hydrateProjectCatalog(snapshot.deletedProjects)
          ]);
          if (!cancelled) dispatch({ type: "load-catalog", projects, deletedProjects, people: snapshot.people });
        }
      } finally {
        if (!cancelled) setCatalogLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!catalogLoaded) return undefined;
    const timer = window.setTimeout(() => {
      void persistCatalog({ projects: state.projects, deletedProjects: state.deletedProjects, people: state.people });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [catalogLoaded, state.projects, state.deletedProjects, state.people]);

  useEffect(() => {
    if (!canUseDesktopImport() || state.view !== "welcome" || modal !== null) {
      setDesktopDragging(false);
      return undefined;
    }

    let cancelled = false;
    let unlisten: (() => void) | undefined;
    void subscribeToDesktopDrops({
      onHoverChange: setDesktopDragging,
      onDrop: async (paths) => {
        setDesktopDragging(false);
        const taskId = createProgressTaskId("drop");
        startProgress(taskId, "scanning", 0, 0, t("scanningFiles"));
        try {
          const result = await createProjectFromPaths(paths, (progress) => {
            startProgress(taskId, "thumbnailing", progress.current, progress.total, progress.label);
          });
          if (!cancelled) applyImportResult(result);
        } finally {
          stopProgress(taskId);
        }
      }
    }).then((dispose) => {
      unlisten = dispose;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [modal, state.view, t]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inInput = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setModal("commands");
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setModal("export");
        return;
      }
      if (inInput || state.view === "welcome") return;
      if ((event.key === " " || event.key === "Spacebar") && state.view === "library" && state.selectedPhotoId) {
        event.preventDefault();
        dispatch({ type: "set-view", view: "loupe" });
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        selectByOffset(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        selectByOffset(-1);
      }
      if (state.view === "library" && event.key === "ArrowDown") {
        event.preventDefault();
        selectByOffset(getGridColumnCount(document.getElementById("photo-grid")));
      }
      if (state.view === "library" && event.key === "ArrowUp") {
        event.preventDefault();
        selectByOffset(-getGridColumnCount(document.getElementById("photo-grid")));
      }
      if (event.key.toLowerCase() === "g") dispatch({ type: "set-view", view: "library" });
      if (event.key.toLowerCase() === "l") dispatch({ type: "set-view", view: "loupe" });
      if (event.key.toLowerCase() === "c") dispatch({ type: "set-view", view: "compare" });
      if (event.key.toLowerCase() === "p" && state.selectedPhotoId) pickPhoto(state.selectedPhotoId);
      if (event.key.toLowerCase() === "x" && state.selectedPhotoId) rejectPhoto(state.selectedPhotoId);
      if (/^[1-5]$/.test(event.key) && state.selectedPhotoId) {
        const rating = Number(event.key);
        dispatch({ type: "rate-photo", photoId: state.selectedPhotoId, rating });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  const currentProject = state.projects.find((project) => project.id === state.currentProjectId);
  const projectTitle = currentProject?.name ?? t("appName");

  async function openProject(projectId: string) {
    const project = state.projects.find((item) => item.id === projectId);
    const photos = project?.photos ?? [];
    if (!photos.length) {
      dispatch({ type: "open-project", projectId, photos });
      return;
    }

    let taskId: string | null = null;
    try {
      await allowOriginalPaths(photos);
      const missingThumbnails = countPhotosNeedingThumbnails(photos);
      if (!missingThumbnails) {
        dispatch({ type: "open-project", projectId, photos });
        return;
      }
      taskId = createProgressTaskId(project?.name ?? projectId);
      startProgress(taskId, "thumbnailing", 0, missingThumbnails, project?.name ?? t("checkingThumbnails"));
      const readyPhotos = await ensurePhotoThumbnails(photos, (progress) => {
        if (taskId) startProgress(taskId, "thumbnailing", progress.current, progress.total, progress.label);
      });
      dispatch({ type: "open-project", projectId, photos: readyPhotos });
    } finally {
      if (taskId) stopProgress(taskId);
    }
  }

  async function importFiles(files: File[]) {
    const taskId = createProgressTaskId("import");
    startProgress(taskId, "scanning", 0, files.length, t("scanningFiles"));
    try {
      const result = await createProjectFromFiles(files, (progress) => {
        startProgress(taskId, "thumbnailing", progress.current, progress.total, progress.label);
      });
      applyImportResult(result);
    } finally {
      stopProgress(taskId);
    }
  }

  function applyImportResult(result: LocalImportResult) {
    if (!result.photos.length) {
      flash(t("noSupportedPhotos"));
      return;
    }

    dispatch({ type: "import-project", project: result.project, photos: result.photos });
    const ignored = result.ignoredCount > 0 ? `, ${result.ignoredCount} ${t("ignored")}` : "";
    flash(`${t("imported")} ${result.photos.length.toLocaleString()} ${t("photos")}${ignored}`);
  }

  function startProgress(id: string, phase: ImportProgress["phase"], current: number, total: number, label: string) {
    setProgressTasks((tasks) => {
      const task = { id, active: true, phase, current, total, label };
      if (tasks.some((item) => item.id === id)) {
        return tasks.map((item) => (item.id === id ? task : item));
      }
      return [...tasks, task].slice(-4);
    });
  }

  function stopProgress(id: string) {
    window.setTimeout(() => {
      setProgressTasks((tasks) => tasks.filter((task) => task.id !== id));
    }, 450);
  }

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  function selectByOffset(offset: number) {
    const photos = state.view === "library" || state.view === "loupe" ? visiblePhotos(state) : state.photos;
    const nextPhotoId = getNextPhotoId(photos, state.selectedPhotoId, offset);
    if (nextPhotoId !== null) dispatch({ type: "select-photo", photoId: nextPhotoId });
  }

  function pickPhoto(photoId: number) {
    dispatch({ type: "flag-photo", photoId, state: "pick" });
  }

  function rejectPhoto(photoId: number) {
    dispatch({ type: "flag-photo", photoId, state: "reject" });
  }

  async function clearThumbnailCache() {
    await clearPersistentThumbnailCache();
    dispatch({ type: "invalidate-thumbnails" });
    flash(t("thumbnailCacheCleared"));
  }

  function applyAiOrganize() {
    dispatch({ type: "apply-ai", changes: planAiChanges(state) });
    setModal(null);
    flash("AI 整理已应用到本地元数据。");
  }

  function exportSelection(_options: ExportOptions) {
    setModal(null);
    const selected = state.photos.filter((photo) => photo.state === "pick");
    const photos = selected.length ? selected : state.photos;
    const manifest = {
      project: currentProject?.name ?? "Sift",
      exportedAt: new Date().toISOString(),
      options: _options,
      photos: photos.map((photo) => ({
        filename: photo.filename,
        relativePath: photo.relativePath,
        rating: photo.rating,
        state: photo.state,
        tags: photo.tags
      }))
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentProject?.name ?? "sift"}-export-manifest.json`;
    link.click();
    URL.revokeObjectURL(url);
    flash(t("exportManifestReady"));
  }

  return (
    <>
      <LogoSymbols />
      <div className="app-shell" id="app-shell">
        {state.view !== "welcome" && currentProject ? (
          <AppToolbar
            title={projectTitle}
            t={t}
            backLabel={state.view === "loupe" || state.view === "compare" ? t("grid") : t("projects")}
            onBack={() =>
              dispatch({
                type: "set-view",
                view: state.view === "loupe" || state.view === "compare" ? "library" : "welcome"
              })
            }
            onToggleSidebar={() => dispatch({ type: "toggle-sidebar" })}
            onToggleInspector={() => dispatch({ type: "toggle-inspector" })}
            onOpenSettings={() => setModal("settings")}
            onOpenExport={() => setModal("export")}
            onRenameProject={(name) => dispatch({ type: "rename-project", projectId: currentProject.id, name })}
          />
        ) : null}

        <main className="main" id="main">
          {state.view === "welcome" ? (
            <WelcomeView
              projects={state.projects}
              deletedProjects={state.deletedProjects}
              user={state.user}
              t={t}
              onOpenProject={(projectId) => void openProject(projectId)}
              onImportFiles={(files) => void importFiles(files)}
              onOpenSettings={() => setModal("settings")}
              onUpdateUser={(user) => {
                const normalizedUser = saveUserProfile(user);
                dispatch({ type: "update-user", user: normalizedUser });
              }}
              onRenameProject={(projectId, name) => dispatch({ type: "rename-project", projectId, name })}
              onToggleProjectPinned={(projectId) => dispatch({ type: "toggle-project-pin", projectId })}
              onRateProject={(projectId, rating) => dispatch({ type: "rate-project", projectId, rating })}
              onDeleteProject={(projectId) => dispatch({ type: "delete-project", projectId })}
              onRestoreProject={(projectId) => dispatch({ type: "restore-project", projectId })}
              onEmptyTrash={() => dispatch({ type: "empty-trash" })}
              externalDragging={desktopDragging}
            />
          ) : null}

          {state.view === "library" ? (
            <LibraryView
              state={state}
              t={t}
              onCollectionChange={(collection: CollectionKey) => dispatch({ type: "set-collection", collection })}
              onToggleFilter={(filter) => dispatch({ type: "toggle-filter", filter })}
              onPersonSelect={(personId) => dispatch({ type: "select-person", personId })}
              onOpenPeople={() => dispatch({ type: "set-view", view: "people" })}
              onOpenRegisterPerson={() => setModal("registerPerson")}
              onSelectPhoto={(photoId) => dispatch({ type: "select-photo", photoId })}
              onOpenPhoto={(photoId) => {
                dispatch({ type: "select-photo", photoId });
                dispatch({ type: "set-view", view: "loupe" });
              }}
            />
          ) : null}

          {state.view === "loupe" ? (
            <LoupeView
              state={state}
              t={t}
              onSelectPhoto={(photoId) => dispatch({ type: "select-photo", photoId })}
              onRate={(photoId, rating) => dispatch({ type: "rate-photo", photoId, rating })}
              onPick={pickPhoto}
              onReject={rejectPhoto}
            />
          ) : null}

          {state.view === "compare" ? (
            <CompareView
              state={state}
              t={t}
              onSelectPhoto={(photoId) => dispatch({ type: "select-photo", photoId })}
              onPick={pickPhoto}
              onLayoutChange={(layout) => dispatch({ type: "set-compare-layout", layout })}
              onSortChange={(sort) => dispatch({ type: "set-compare-sort", sort })}
            />
          ) : null}

          {state.view === "people" ? (
            <PeopleView
              state={state}
              t={t}
              onSelectPerson={(personId) => dispatch({ type: "select-person", personId })}
              onSelectPhoto={(photoId) => dispatch({ type: "select-photo", photoId })}
              onOpenExport={() => setModal("export")}
              onOpenRegisterPerson={() => setModal("registerPerson")}
            />
          ) : null}
        </main>

        <StatusBar
          state={state}
          t={t}
          onModeChange={(view: ViewName) => dispatch({ type: "set-view", view })}
          onThumbSizeChange={(size) => dispatch({ type: "set-thumb-size", size })}
          onOpenAi={() => setModal("ai")}
        />
      </div>

      <SettingsModal
        open={modal === "settings"}
        state={state}
        t={t}
        onClose={() => setModal(null)}
        onGpuChange={(enabled) => dispatch({ type: "set-gpu", enabled })}
        onThemeChange={(theme) => dispatch({ type: "set-theme", theme })}
        onLanguageChange={(language) => dispatch({ type: "set-language", language })}
        storageInfo={storageInfo}
        onClearThumbnailCache={() => void clearThumbnailCache()}
        onOpenRegisterPerson={() => setModal("registerPerson")}
        onRenamePerson={(personId, name) => dispatch({ type: "rename-person", personId, name })}
        onDeletePerson={(personId) => dispatch({ type: "delete-person", personId })}
      />
      <RegisterPersonModal
        open={modal === "registerPerson"}
        t={t}
        onClose={() => setModal(null)}
        onRegister={(person) => dispatch({ type: "register-person", person })}
      />
      <ExportModal open={modal === "export"} state={state} t={t} onClose={() => setModal(null)} onExport={exportSelection} />
      <AiOrganizeModal
        open={modal === "ai"}
        state={state}
        t={t}
        onClose={() => setModal(null)}
        onApply={applyAiOrganize}
        onRuleChange={(rule, enabled) => dispatch({ type: "set-ai-rule", rule, enabled })}
      />
      <CommandPalette
        open={modal === "commands"}
        t={t}
        onClose={() => setModal(null)}
        onOpenAi={() => setModal("ai")}
        onOpenExport={() => setModal("export")}
      />
      {toast ? <div className="shortcut-hint">{toast}</div> : null}
      <ProgressOverlay tasks={progressTasks} t={t} />
    </>
  );
}

async function hydrateProjectCatalog(projects: ProjectSummary[]) {
  return Promise.all(
    projects.map(async (project) => {
      if (!project.photos?.length) return project;
      const photos = await hydrateCachedThumbnails(project.photos);
      const coverUrls = selectProjectCoverUrls(photos);
      return {
        ...project,
        photos,
        coverUrl: coverUrls[0] ?? project.coverUrl,
        coverUrls: coverUrls.length ? coverUrls : project.coverUrls
      };
    })
  );
}

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function createProgressTaskId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ProgressOverlay({ tasks, t }: { tasks: ImportProgress[]; t: (key: string) => string }) {
  const activeTasks = tasks.filter((task) => task.active);
  if (!activeTasks.length) return null;

  return (
    <div className="import-progress-list">
      {activeTasks.map((progress) => {
        const percent = progress.total ? Math.round((progress.current / progress.total) * 100) : 0;
        return (
          <div className="import-progress" key={progress.id}>
            <div className="import-progress-head">
              <b>{t(progress.phase)}</b>
              <span>
                {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
              </span>
            </div>
            <div className="import-progress-bar">
              <i style={{ width: `${percent}%` }} />
            </div>
            <div className="import-progress-label">{progress.label}</div>
          </div>
        );
      })}
    </div>
  );
}

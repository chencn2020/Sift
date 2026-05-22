import { useEffect, useMemo, useReducer, useState } from "react";
import { LogoSymbols } from "../components/LogoSymbols";
import { StatusBar } from "../components/StatusBar";
import { TitleBar } from "../components/TitleBar";
import { AiOrganizeModal } from "../features/ai/AiOrganizeModal";
import { CommandPalette } from "../features/commands/CommandPalette";
import { ExportModal } from "../features/export/ExportModal";
import { CompareView } from "../features/library/CompareView";
import { LibraryView } from "../features/library/LibraryView";
import { LoupeView } from "../features/library/LoupeView";
import { planAiChanges } from "../features/library/photoRules";
import { PeopleView } from "../features/people/PeopleView";
import { WelcomeView } from "../features/projects/WelcomeView";
import { SettingsModal } from "../features/settings/SettingsModal";
import { createTranslator } from "./i18n";
import { makeDemoPhotos } from "./mockData";
import { appReducer, initialState } from "./state";
import type { CollectionKey, ExportOptions, ViewName } from "./types";

type ModalName = "settings" | "export" | "commands" | "ai" | null;

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [modal, setModal] = useState<ModalName>(null);
  const [toast, setToast] = useState<string | null>(null);
  const t = useMemo(() => createTranslator(state.language), [state.language]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

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
      if (event.key === "ArrowRight") selectByOffset(1);
      if (event.key === "ArrowLeft") selectByOffset(-1);
      if (event.key.toLowerCase() === "g") dispatch({ type: "set-view", view: "library" });
      if (event.key.toLowerCase() === "l") dispatch({ type: "set-view", view: "loupe" });
      if (event.key.toLowerCase() === "c") dispatch({ type: "set-view", view: "compare" });
      if (event.key.toLowerCase() === "p" && state.selectedPhotoId) pickPhoto(state.selectedPhotoId);
      if (event.key.toLowerCase() === "x" && state.selectedPhotoId) rejectPhoto(state.selectedPhotoId);
      if (/^[1-5]$/.test(event.key) && state.selectedPhotoId) {
        dispatch({ type: "rate-photo", photoId: state.selectedPhotoId, rating: Number(event.key) });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.photos, state.selectedPhotoId, state.view]);

  const currentProject = state.projects.find((project) => project.id === state.currentProjectId);
  const projectTitle = currentProject?.name ?? t("appName");

  function openProject(projectId: string) {
    dispatch({ type: "open-project", projectId, photos: makeDemoPhotos(180) });
    flash("已打开项目。真实导入会通过 Python sidecar 扫描文件夹。");
  }

  function createProject() {
    openProject(state.projects[0]?.id ?? "demo");
  }

  function flash(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 1800);
  }

  function selectByOffset(offset: number) {
    if (!state.photos.length) return;
    const currentIndex = state.photos.findIndex((photo) => photo.id === state.selectedPhotoId);
    const next = state.photos[(currentIndex + offset + state.photos.length) % state.photos.length];
    if (next) dispatch({ type: "select-photo", photoId: next.id });
  }

  function pickPhoto(photoId: number) {
    dispatch({ type: "flag-photo", photoId, state: "pick" });
  }

  function rejectPhoto(photoId: number) {
    dispatch({ type: "flag-photo", photoId, state: "reject" });
  }

  function applyAiOrganize() {
    dispatch({ type: "apply-ai", changes: planAiChanges(state) });
    setModal(null);
    flash("AI 整理已应用到本地元数据。");
  }

  function exportSelection(_options: ExportOptions) {
    setModal(null);
    flash("导出任务接口已预留，后续由 Python sidecar 执行。");
  }

  return (
    <>
      <LogoSymbols />
      <div className="desktop" />
      <div className="window" id="window">
        <TitleBar
          state={state}
          title={projectTitle}
          t={t}
          onBack={() => dispatch({ type: "set-view", view: "welcome" })}
          onToggleTheme={() => dispatch({ type: "set-theme", theme: state.theme === "dark" ? "light" : "dark" })}
          onToggleSidebar={() => dispatch({ type: "toggle-sidebar" })}
          onToggleInspector={() => dispatch({ type: "toggle-inspector" })}
          onOpenCommand={() => setModal("commands")}
          onOpenSettings={() => setModal("settings")}
          onOpenExport={() => setModal("export")}
        />

        <main className="main" id="main">
          {state.view === "welcome" ? (
            <WelcomeView
              projects={state.projects}
              t={t}
              onOpenProject={openProject}
              onCreateProject={createProject}
              onOpenSettings={() => setModal("settings")}
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
              onBackToGrid={() => dispatch({ type: "set-view", view: "library" })}
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
            />
          ) : null}

          {state.view === "people" ? (
            <PeopleView
              state={state}
              t={t}
              onSelectPerson={(personId) => dispatch({ type: "select-person", personId })}
              onSelectPhoto={(photoId) => dispatch({ type: "select-photo", photoId })}
              onOpenExport={() => setModal("export")}
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

      <SettingsModal open={modal === "settings"} state={state} t={t} onClose={() => setModal(null)} onGpuChange={(enabled) => dispatch({ type: "set-gpu", enabled })} />
      <ExportModal open={modal === "export"} state={state} t={t} onClose={() => setModal(null)} onExport={exportSelection} />
      <AiOrganizeModal open={modal === "ai"} state={state} t={t} onClose={() => setModal(null)} onApply={applyAiOrganize} />
      <CommandPalette
        open={modal === "commands"}
        t={t}
        onClose={() => setModal(null)}
        onOpenAi={() => setModal("ai")}
        onOpenExport={() => setModal("export")}
      />
      {toast ? <div className="shortcut-hint">{toast}</div> : null}
    </>
  );
}

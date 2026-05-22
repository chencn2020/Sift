import type { ProjectSummary } from "../../app/types";

interface WelcomeViewProps {
  projects: ProjectSummary[];
  t: (key: string) => string;
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
  onOpenSettings: () => void;
}

export function WelcomeView({ projects, t, onOpenProject, onCreateProject, onOpenSettings }: WelcomeViewProps) {
  return (
    <section className="view active" data-view="welcome">
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

        <div className="me-card">
          <div className="me-avatar">本</div>
          <div className="me-info">
            <div className="me-name">本地用户</div>
            <div className="me-sub">
              <span className="badge-local">Local</span>
              <span>{t("localOnly")}</span>
            </div>
          </div>
          <div className="me-quick">
            <span>
              {t("cache")} <b>4.2 GB</b>
            </span>
            <span>
              <span className="dot on" /> {t("gpu")} <b>on</b>
            </span>
            <span>
              <b>4</b> {t("modelsReady")}
            </span>
          </div>
        </div>

        <div className="welcome-head">
          <h1>{t("projects")}</h1>
          <button className="btn-ghost" onClick={onCreateProject}>
            {t("newFromFolder")}
          </button>
        </div>

        <button className="dropzone" id="dropzone" onClick={onCreateProject}>
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
          <div className="section-tools">
            <select className="select-sm" aria-label="Sort projects">
              <option>Modified</option>
              <option>Name</option>
              <option>Size</option>
            </select>
          </div>
        </div>

        <div className="project-grid" id="project-grid">
          {projects.map((project) => (
            <button className="project-card" key={project.id} onClick={() => onOpenProject(project.id)}>
              <div className="project-thumb">
                <div className="project-art" data-seed={project.seed} />
              </div>
              <div className="project-meta">
                <div className="project-name">
                  <span>{project.name}</span>
                  <span>{project.status === "ready" ? "✓" : "…"}</span>
                </div>
                <div className="project-date">{project.date}</div>
                <div className="project-stats">
                  <span className="pill">
                    {project.total.toLocaleString()} {t("photos")}
                  </span>
                  <span>{project.status === "ready" ? t("ready") : t("inProgress")}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

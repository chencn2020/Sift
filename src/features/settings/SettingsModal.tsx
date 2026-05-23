import { useMemo, useState } from "react";
import type { AppState, PersonSummary } from "../../app/types";
import type { StorageInfo } from "../../app/storage";
import { Modal } from "../../components/Modal";
import { checkForUpdates, CURRENT_VERSION, type UpdateCheckResult } from "./updateCheck";

type SettingsTab = "general" | "storage" | "people" | "ai" | "export" | "about";

interface SettingsModalProps {
  open: boolean;
  state: AppState;
  t: (key: string) => string;
  onClose: () => void;
  onGpuChange: (enabled: boolean) => void;
  onThemeChange: (theme: AppState["theme"]) => void;
  onLanguageChange: (language: AppState["language"]) => void;
  storageInfo: StorageInfo | null;
  onClearThumbnailCache: () => void;
  onOpenRegisterPerson: () => void;
  onRenamePerson: (personId: string, name: string) => void;
  onDeletePerson: (personId: string) => void;
}

const tabs: Array<{ id: SettingsTab; labelKey: string; icon: string }> = [
  { id: "general", labelKey: "settingsGeneral", icon: "⚙" },
  { id: "storage", labelKey: "settingsStorage", icon: "▤" },
  { id: "people", labelKey: "settingsPeople", icon: "◎" },
  { id: "ai", labelKey: "settingsAi", icon: "✦" },
  { id: "export", labelKey: "settingsExport", icon: "↑" },
  { id: "about", labelKey: "settingsAbout", icon: "◌" }
];

export function SettingsModal({
  open,
  state,
  t,
  onClose,
  onGpuChange,
  onThemeChange,
  onLanguageChange,
  storageInfo,
  onClearThumbnailCache,
  onOpenRegisterPerson,
  onRenamePerson,
  onDeletePerson
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const analyzedCount = useMemo(() => state.photos.filter((photo) => photo.analyzed).length, [state.photos]);
  const registeredPeople = useMemo(() => state.people.filter((person) => person.kind === "registered"), [state.people]);

  async function runUpdateCheck() {
    setCheckingUpdate(true);
    try {
      setUpdateCheck(await checkForUpdates());
    } finally {
      setCheckingUpdate(false);
    }
  }

  return (
    <Modal open={open} className="md-settings" title={t("settings")} onClose={onClose}>
      <div className="settings-layout">
        <nav className="settings-tabs" aria-label={t("settings")}>
          {tabs.map((tab) => (
            <button
              className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <span className="icon">{tab.icon}</span>
              <span>{t(tab.labelKey)}</span>
            </button>
          ))}
        </nav>

        <div className="settings-pane">
          {activeTab === "general" ? (
            <>
              <PaneHeader title={t("settingsGeneral")} subtitle={t("settingsGeneralSub")} />
              <section className="settings-row">
                <span className="lbl">{t("language")}</span>
                <div className="val">
                  <div className="seg">
                    <button className={`seg-btn ${state.language === "cn" ? "active" : ""}`} onClick={() => onLanguageChange("cn")}>
                      中文
                    </button>
                    <button className={`seg-btn ${state.language === "en" ? "active" : ""}`} onClick={() => onLanguageChange("en")}>
                      English
                    </button>
                  </div>
                </div>
              </section>
              <section className="settings-row">
                <span className="lbl">{t("theme")}</span>
                <div className="val">
                  <div className="seg">
                    <button className={`seg-btn ${state.theme === "system" ? "active" : ""}`} onClick={() => onThemeChange("system")}>
                      {t("system")}
                    </button>
                    <button className={`seg-btn ${state.theme === "dark" ? "active" : ""}`} onClick={() => onThemeChange("dark")}>
                      {t("dark")}
                    </button>
                    <button className={`seg-btn ${state.theme === "light" ? "active" : ""}`} onClick={() => onThemeChange("light")}>
                      {t("light")}
                    </button>
                  </div>
                </div>
              </section>
              <section className="settings-row">
                <span className="lbl">{t("privacy")}</span>
                <div className="val">
                  <label className="check">
                    <input type="checkbox" checked readOnly /> {t("localOnly")}
                  </label>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "storage" ? (
            <>
              <PaneHeader title={t("settingsStorage")} subtitle={t("settingsStorageSub")} />
              <section className="settings-row">
                <span className="lbl">{t("projectLibrary")}</span>
                <div className="val">
                  <input type="text" value={storageInfo?.databasePath ?? t("resolvingStorage")} readOnly />
                  <p className="hint">{t("sqliteCatalogHint")}</p>
                </div>
              </section>
              <section className="settings-row">
                <span className="lbl">{t("cache")}</span>
                <div className="val">
                  <div className="path-row">
                    <input type="text" value={storageInfo?.thumbnailCacheDir ?? t("resolvingStorage")} readOnly />
                    <button className="danger" onClick={onClearThumbnailCache}>
                      {t("clearCache")}
                    </button>
                  </div>
                  <p className="hint">{t("cacheRebuildable")}</p>
                </div>
              </section>
              <section className="settings-row">
                <span className="lbl">{t("faceCache")}</span>
                <div className="val">
                  <input type="text" value={storageInfo?.faceCacheDir ?? t("resolvingStorage")} readOnly />
                  <p className="hint">{t("faceCacheHint")}</p>
                </div>
              </section>
              <section className="settings-row">
                <span className="lbl">{t("dataDirectory")}</span>
                <div className="val">
                  <input type="text" value={storageInfo?.dataDir ?? t("resolvingStorage")} readOnly />
                  <p className="hint">{t("originalsUntouched")}</p>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "people" ? (
            <>
              <PaneHeader title={t("settingsPeople")} subtitle={t("settingsPeopleSub")} />
              <section className="settings-row face-register-row">
                <span className="lbl">{t("registerPortrait")}</span>
                <div className="val">
                  <button className="btn-primary" onClick={onOpenRegisterPerson}>
                    {t("registerNewPerson")}
                  </button>
                  <p className="hint">{t("registerPortraitHint")}</p>
                </div>
              </section>
              <section className="settings-row face-manage-row">
                <span className="lbl">{t("registeredPeople")}</span>
                <div className="val">
                  {registeredPeople.length ? (
                    <div className="face-list settings-face-list">
                      {registeredPeople.map((person) => (
                        <FaceRow key={person.id} person={person} t={t} onRename={onRenamePerson} onDelete={onDeletePerson} />
                      ))}
                    </div>
                  ) : (
                    <p className="hint">{t("noRegisteredPeople")}</p>
                  )}
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "ai" ? (
            <>
              <PaneHeader title={t("settingsAi")} subtitle={t("settingsAiSub")} />
              <section className="settings-row">
                <span className="lbl">{t("gpu")}</span>
                <div className="val inline-val">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={state.gpuEnabled} onChange={(event) => onGpuChange(event.currentTarget.checked)} />
                    <span className="slider" />
                  </label>
                  <span>{state.gpuEnabled ? t("enabled") : t("disabled")}</span>
                </div>
              </section>
              <section className="settings-row">
                <span className="lbl">{t("analysis")}</span>
                <div className="val">
                  <b>
                    {analyzedCount.toLocaleString()} / {state.photos.length.toLocaleString()} {t("photos")}
                  </b>
                  <p className="hint">{t("aiLocalOnly")}</p>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "export" ? (
            <>
              <PaneHeader title={t("settingsExport")} subtitle={t("settingsExportSub")} />
              <section className="settings-row">
                <span className="lbl">{t("defaultFormat")}</span>
                <div className="val">
                  <b>JPG / PNG / Original</b>
                  <p className="hint">{t("exportDefaultsHint")}</p>
                </div>
              </section>
              <section className="settings-row">
                <span className="lbl">{t("selectedPhotos")}</span>
                <div className="val">
                  <b>{state.photos.filter((photo) => photo.state === "pick").length.toLocaleString()}</b>
                  <p className="hint">{t("exportPicksHint")}</p>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === "about" ? (
            <>
              <PaneHeader title={t("settingsAbout")} subtitle={t("settingsAboutSub")} />
              <div className="about-box">
                <div className="logo-wordmark lg">
                  <span className="logo-mark lg">
                    <svg>
                      <use href="#logo-mark" />
                    </svg>
                  </span>
                  <span className="word">Sift</span>
                </div>
                <div className="tag">{t("aboutTagline")}</div>
                <div className="ver">{CURRENT_VERSION}</div>
              </div>
              <section className="settings-row update-row">
                <span className="lbl">{t("updates")}</span>
                <div className="val">
                  <div className="path-row">
                    <input type="text" value={updateStatusText(updateCheck, checkingUpdate, t)} readOnly />
                    <button onClick={() => void runUpdateCheck()} disabled={checkingUpdate}>
                      {checkingUpdate ? t("checkingUpdates") : t("checkForUpdates")}
                    </button>
                  </div>
                  {updateCheck?.status === "available" ? (
                    <a className="update-link" href={updateCheck.releaseUrl} target="_blank" rel="noreferrer">
                      {t("openRelease")}
                    </a>
                  ) : null}
                </div>
              </section>
              <div className="about-links">
                <a href="https://github.com/chencn2020/Sift" target="_blank" rel="noreferrer">
                  GitHub
                </a>
                <a href="https://github.com/chencn2020/Sift/blob/main/LICENSE" target="_blank" rel="noreferrer">
                  MIT
                </a>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function updateStatusText(updateCheck: UpdateCheckResult | null, checking: boolean, t: (key: string) => string) {
  if (checking) return t("checkingUpdates");
  if (!updateCheck) return t("updateNotChecked");
  if (updateCheck.status === "available") {
    return `${t("updateAvailable")}: ${updateCheck.latestVersion}`;
  }
  if (updateCheck.status === "current") {
    return `${t("upToDate")}: ${updateCheck.currentVersion}`;
  }
  if (updateCheck.status === "none") return t("noReleaseYet");
  return `${t("updateCheckFailed")}: ${updateCheck.message}`;
}

function FaceRow({
  person,
  t,
  onRename,
  onDelete
}: {
  person: PersonSummary;
  t: (key: string) => string;
  onRename: (personId: string, name: string) => void;
  onDelete: (personId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(person.name);

  return (
    <div className="face-row">
      <span className="av" style={{ backgroundImage: person.avatarUrl ? `url(${person.avatarUrl})` : undefined, backgroundColor: person.color }} />
      <div>
        {editing ? (
          <input className="face-name-input" value={name} autoFocus onChange={(event) => setName(event.currentTarget.value)} />
        ) : (
          <span className="nm">{person.name}</span>
        )}
        <span className="ct">
          {person.refs} {t("refs")} · {person.count} {t("photos")}
        </span>
      </div>
      <div className="face-actions">
        {editing ? (
          <button
            onClick={() => {
              if (name.trim()) onRename(person.id, name.trim());
              setEditing(false);
            }}
          >
            {t("save")}
          </button>
        ) : (
          <button onClick={() => setEditing(true)}>{t("rename")}</button>
        )}
        <button className="del" onClick={() => onDelete(person.id)}>
          {t("delete")}
        </button>
      </div>
    </div>
  );
}

function PaneHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h3 className="pane-h">{title}</h3>
      <p className="pane-sub">{subtitle}</p>
    </>
  );
}

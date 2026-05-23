import type { AppState, CollectionKey } from "../../app/types";
import { photoCounts } from "./photoRules";

interface LibrarySidebarProps {
  state: AppState;
  t: (key: string) => string;
  onCollectionChange: (collection: CollectionKey) => void;
  onPersonSelect: (personId: string | null) => void;
  onOpenPeople: () => void;
  onOpenRegisterPerson: () => void;
}

export function LibrarySidebar({ state, t, onCollectionChange, onPersonSelect, onOpenPeople, onOpenRegisterPerson }: LibrarySidebarProps) {
  const counts = photoCounts(state.photos);
  const registered = state.people.filter((person) => person.kind === "registered");
  const clusters = state.people.filter((person) => person.kind === "cluster");
  const burstCount = new Set(state.photos.map((photo) => photo.burstId).filter(Boolean)).size;
  const duplicateCount = new Set(state.photos.map((photo) => photo.duplicateGroupId).filter(Boolean)).size;

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sb-section">
        <div className="sb-head">{t("library")}</div>
        <SidebarItem active={state.collection === "all"} label={t("all")} count={counts.all} onClick={() => onCollectionChange("all")} />
        <SidebarItem active={state.collection === "picks"} label={t("picks")} count={counts.picks} dot="pick" onClick={() => onCollectionChange("picks")} />
        <SidebarItem
          active={state.collection === "rejects"}
          label={t("rejects")}
          count={counts.rejects}
          dot="rej"
          onClick={() => onCollectionChange("rejects")}
        />
        <SidebarItem active={state.collection === "unrated"} label={t("unrated")} count={counts.unrated} dot="ghost" onClick={() => onCollectionChange("unrated")} />
      </div>

      <div className="sb-section">
        <div className="sb-head">{t("smart")}</div>
        <SidebarItem active={state.collection === "smart-sharp"} label={t("sharp")} glyph="▲" onClick={() => onCollectionChange("smart-sharp")} />
        <SidebarItem active={state.collection === "smart-blurry"} label={t("blurry")} glyph="▽" onClick={() => onCollectionChange("smart-blurry")} />
        <SidebarItem
          active={state.collection === "smart-eyes-closed"}
          label={t("eyesClosed")}
          glyph="◌"
          onClick={() => onCollectionChange("smart-eyes-closed")}
        />
        <SidebarItem active={state.collection === "smart-best"} label={t("aiBest")} glyph="✦" onClick={() => onCollectionChange("smart-best")} />
      </div>

      <div className="sb-section">
        <div className="sb-head">
          <span>{t("people")}</span>
          <span className="sb-head-actions">
            <button className="sb-mini" onClick={onOpenRegisterPerson} title={t("registerPortrait")}>
              +
            </button>
            <button className="sb-mini" onClick={onOpenPeople} title={t("people")}>
              ›
            </button>
          </span>
        </div>
        {[...registered, ...clusters].length ? (
          [...registered, ...clusters].map((person) => (
            <button
              className={`sb-person ${state.selectedPersonId === person.id ? "active" : ""}`}
              key={person.id}
              onClick={() => onPersonSelect(state.selectedPersonId === person.id ? null : person.id)}
            >
              <span className="avatar-dot" style={{ background: person.color }} />
              <span>{person.name}</span>
              <em>{person.count}</em>
            </button>
          ))
        ) : (
          <div className="sb-empty">{t("noPeopleYet")}</div>
        )}
      </div>

      <div className="sb-section">
        <div className="sb-head">{t("stacks")}</div>
        <SidebarItem label={t("bursts")} glyph="▤" count={burstCount} onClick={() => onCollectionChange("smart-best")} />
        <SidebarItem label={t("duplicates")} glyph="⫶" count={duplicateCount} onClick={() => onCollectionChange("all")} />
      </div>
    </aside>
  );
}

function SidebarItem({
  active,
  label,
  count,
  dot,
  glyph,
  onClick
}: {
  active?: boolean;
  label: string;
  count?: number;
  dot?: string;
  glyph?: string;
  onClick: () => void;
}) {
  return (
    <button className={`sb-item ${active ? "active" : ""}`} onClick={onClick}>
      {glyph ? <span className="sb-glyph">{glyph}</span> : <span className={`sb-dot ${dot ?? ""}`} />}
      <span className="sb-label">{label}</span>
      {typeof count === "number" ? <span className="sb-count">{count}</span> : null}
    </button>
  );
}

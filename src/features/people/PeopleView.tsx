import type { AppState } from "../../app/types";
import { PhotoCard } from "../library/PhotoCard";

interface PeopleViewProps {
  state: AppState;
  t: (key: string) => string;
  onSelectPerson: (personId: string) => void;
  onSelectPhoto: (photoId: number) => void;
  onOpenExport: () => void;
  onOpenRegisterPerson: () => void;
}

export function PeopleView({ state, t, onSelectPerson, onSelectPhoto, onOpenExport, onOpenRegisterPerson }: PeopleViewProps) {
  const selectedPerson = state.people.find((person) => person.id === state.selectedPersonId) ?? state.people[0];
  const matches = selectedPerson ? state.photos.filter((photo) => photo.people.includes(selectedPerson.id)) : [];
  const registered = state.people.filter((person) => person.kind === "registered");
  const clusters = state.people.filter((person) => person.kind === "cluster");

  return (
    <section className="view active" data-view="people">
      <div className="people-layout">
        <div className="people-head">
          <div>
            <h1>
              {t("people")} · {state.people.length}
            </h1>
            <p>{t("localOnly")}</p>
          </div>
          <button className="btn-primary" onClick={onOpenRegisterPerson}>
            {t("registerNewPerson")}
          </button>
        </div>

        {state.people.length ? (
          <div className="people-body">
            <aside className="people-list">
              <h2>{t("registeredPeople")}</h2>
              <PersonGrid people={registered} selectedId={selectedPerson?.id} onSelectPerson={onSelectPerson} />
              <h2>{t("detectedClusters")}</h2>
              <PersonGrid people={clusters} selectedId={selectedPerson?.id} onSelectPerson={onSelectPerson} />
            </aside>

            <main className="people-detail">
              {selectedPerson ? (
                <>
                  <div className="person-hero">
                    <span className="person-avatar" style={{ background: selectedPerson.color }}>
                      {selectedPerson.name.slice(0, 1)}
                    </span>
                    <div>
                      <h2>{selectedPerson.name}</h2>
                      <p>
                        {matches.length} {t("photos")} · {selectedPerson.refs} refs
                      </p>
                    </div>
                    <button className="btn-primary" onClick={onOpenExport}>
                      {t("exportSelected")}
                    </button>
                  </div>
                  <div className="ppl-photos">
                    {matches.map((photo) => (
                      <PhotoCard key={photo.id} photo={photo} selected={photo.id === state.selectedPhotoId} onSelect={onSelectPhoto} />
                    ))}
                  </div>
                </>
              ) : null}
            </main>
          </div>
        ) : (
          <div className="empty-state">
            <h2>{t("noPeopleYet")}</h2>
            <p>{t("peopleAfterAnalysis")}</p>
            <button className="btn-primary" onClick={onOpenRegisterPerson}>
              {t("registerNewPerson")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function PersonGrid({
  people,
  selectedId,
  onSelectPerson
}: {
  people: AppState["people"];
  selectedId?: string;
  onSelectPerson: (personId: string) => void;
}) {
  return (
    <div className="ppl-grid">
      {people.map((person) => (
        <button className={`ppl-card ${selectedId === person.id ? "active" : ""}`} key={person.id} onClick={() => onSelectPerson(person.id)}>
          <span className="person-avatar" style={{ background: person.color }}>
            {person.name.slice(0, 1)}
          </span>
          <b>{person.name}</b>
          <span>{person.count} photos</span>
        </button>
      ))}
    </div>
  );
}

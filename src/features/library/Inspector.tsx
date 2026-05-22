import type { PersonSummary, PhotoSummary } from "../../app/types";

interface InspectorProps {
  photo: PhotoSummary | null;
  people: PersonSummary[];
  t: (key: string) => string;
}

export function Inspector({ photo, people, t }: InspectorProps) {
  if (!photo) {
    return (
      <aside className="inspector" id="inspector">
        <div className="insp-empty">
          <div className="insp-empty-icon">◇</div>
          <div>{t("choosePhoto")}</div>
        </div>
      </aside>
    );
  }

  const personLookup = new Map(people.map((person) => [person.id, person]));

  return (
    <aside className="inspector" id="inspector">
      <div className="insp-content">
        <div className="insp-preview">
          <div className="photo-art large">
            <span>{photo.filename}</span>
          </div>
        </div>

        <section className="insp-section">
          <h3>Camera</h3>
          <div className="meta-row">
            <span>Body</span>
            <b>{photo.camera.body}</b>
          </div>
          <div className="meta-row">
            <span>Lens</span>
            <b>{photo.camera.lens}</b>
          </div>
          <div className="meta-row">
            <span>Exposure</span>
            <b>
              {photo.camera.aperture} · {photo.camera.shutter} · ISO {photo.camera.iso}
            </b>
          </div>
        </section>

        <section className="insp-section">
          <h3>AI quality</h3>
          <Bar label={t("sharp")} value={photo.sharpness} />
          <Bar label="曝光" value={photo.exposure} />
          <Bar label="噪点" value={photo.noise} />
          <Bar label="微笑" value={photo.smile} />
          <div className="meta-row">
            <span>Eyes</span>
            <b>{photo.eyesClosed ? "闭眼" : "睁眼"}</b>
          </div>
        </section>

        <section className="insp-section">
          <h3>{t("people")}</h3>
          <div className="face-list">
            {photo.people.length ? (
              photo.people.map((personId) => {
                const person = personLookup.get(personId);
                return (
                  <span className="face-chip" key={personId}>
                    <span className="avatar-dot" style={{ background: person?.color }} />
                    {person?.name ?? personId}
                  </span>
                );
              })
            ) : (
              <span className="muted">未检测到人脸</span>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar">
        <i style={{ width: `${Math.round(value * 100)}%` }} />
      </div>
      <b>{Math.round(value * 100)}</b>
    </div>
  );
}

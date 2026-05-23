import type { PersonSummary, PhotoSummary } from "../../app/types";
import { formatBytes } from "../projects/imageMetadata";
import { PhotoImage } from "./PhotoImage";
import { cameraInfo } from "./photoInfo";

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
  const camera = cameraInfo(photo);
  const cameraRows = [
    { label: "Body", value: camera.body },
    { label: "Lens", value: camera.lens },
    { label: t("exposure"), value: camera.exposure }
  ].filter((row) => row.value);

  return (
    <aside className="inspector" id="inspector">
      <div className="insp-content">
        <div className="insp-preview">
          <PhotoImage photo={photo} className="photo-art large" showName />
        </div>

        {cameraRows.length ? (
          <section className="insp-section">
            <h3>Camera</h3>
            {cameraRows.map((row) => (
              <div className="meta-row" key={row.label}>
                <span>{row.label}</span>
                <b>{row.value}</b>
              </div>
            ))}
          </section>
        ) : null}

        <section className="insp-section">
          <h3>{t("fileInfo")}</h3>
          <div className="meta-row">
            <span>{t("capturedAt")}</span>
            <b>{photo.takenAt || "—"}</b>
          </div>
          <div className="meta-row">
            <span>{t("resolution")}</span>
            <b>{photo.width && photo.height ? `${photo.width} × ${photo.height}` : "—"}</b>
          </div>
          <div className="meta-row">
            <span>{t("fileSize")}</span>
            <b>{formatBytes(photo.sizeBytes)}</b>
          </div>
          <div className="meta-row">
            <span>{t("format")}</span>
            <b>{photo.format?.toUpperCase() || "—"}</b>
          </div>
        </section>

        <section className="insp-section">
          <h3>AI quality</h3>
          {photo.analyzed ? (
            <>
              <Bar label={t("sharp")} value={photo.sharpness} />
              <Bar label={t("exposure")} value={photo.exposure} />
              <Bar label={t("noise")} value={photo.noise} />
              <Bar label={t("smile")} value={photo.smile} />
              <div className="meta-row">
                <span>Eyes</span>
                <b>{photo.eyesClosed ? t("eyesClosed") : t("eyesOpen")}</b>
              </div>
            </>
          ) : (
            <p className="hint">{t("notAnalyzed")}</p>
          )}
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

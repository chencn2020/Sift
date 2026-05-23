import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import type { PersonSummary } from "../../app/types";
import { Modal } from "../../components/Modal";
import { readImageAsDataUrl, saveFaceReferenceImages } from "../settings/faceReferences";

interface RegisterPersonModalProps {
  open: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onRegister: (person: PersonSummary) => void;
}

interface ReferenceDraft {
  file: File;
  previewUrl: string;
}

const MAX_REFS = 5;

export function RegisterPersonModal({ open, t, onClose, onRegister }: RegisterPersonModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [refs, setRefs] = useState<ReferenceDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const canSubmit = name.trim().length > 0 && refs.length > 0 && !saving;

  useEffect(() => {
    if (open) return undefined;
    setName("");
    setSaving(false);
    setDragging(false);
    setRefs((current) => {
      current.forEach((ref) => URL.revokeObjectURL(ref.previewUrl));
      return [];
    });
    return undefined;
  }, [open]);

  const refHint = useMemo(() => `${refs.length} / ${MAX_REFS}`, [refs.length]);

  function addFiles(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/")).slice(0, MAX_REFS - refs.length);
    if (!images.length) return;
    setRefs((current) => [
      ...current,
      ...images.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }))
    ]);
  }

  function removeRef(index: number) {
    setRefs((current) => {
      const next = [...current];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  function handleDrag(event: DragEvent<HTMLDivElement>, active: boolean) {
    if (!Array.from(event.dataTransfer.types).includes("Files")) return;
    event.preventDefault();
    event.stopPropagation();
    setDragging(active);
  }

  async function submit() {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const personId = `person-${Date.now()}`;
      const dataUrls = await Promise.all(refs.map((ref) => readImageAsDataUrl(ref.file)));
      const saved = await saveFaceReferenceImages(personId, dataUrls);
      onRegister({
        id: personId,
        name: name.trim(),
        count: 0,
        refs: saved.length,
        color: colorForId(personId),
        kind: "registered",
        avatarUrl: saved[0]?.avatarUrl,
        cachePath: saved[0]?.cachePath,
        referencePaths: saved.map((item) => item.cachePath).filter((path): path is string => Boolean(path)),
        createdAt: new Date().toISOString()
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={t("registerPortrait")}
      className="md-register"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn-primary" onClick={() => void submit()} disabled={!canSubmit}>
            {saving ? t("saving") : t("registerAndFind")}
          </button>
        </>
      }
    >
      <div className="register-person">
        <div className="form-row">
          <label htmlFor="register-person-name">{t("personName")}</label>
          <input
            id="register-person-name"
            type="text"
            value={name}
            placeholder={t("personNamePlaceholder")}
            onChange={(event) => setName(event.currentTarget.value)}
            autoFocus
          />
        </div>

        <div className="form-row">
          <div className="register-row-head">
            <label>{t("referencePhotos")}</label>
            <span>{refHint}</span>
          </div>
          <div
            className={`register-dropzone ${dragging ? "over" : ""}`}
            onDragEnter={(event) => handleDrag(event, true)}
            onDragOver={(event) => handleDrag(event, true)}
            onDragLeave={(event) => handleDrag(event, false)}
            onDrop={(event) => {
              handleDrag(event, false);
              event.stopPropagation();
              addFiles(Array.from(event.dataTransfer.files));
            }}
            onClick={(event) => {
              event.stopPropagation();
              inputRef.current?.click();
            }}
          >
            <div className="dz-title">{t("dropReferencePhotos")}</div>
            <div className="dz-hint">{t("referencePhotosHint")}</div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(event) => {
              addFiles(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = "";
            }}
          />
          {refs.length ? (
            <div className="ref-photos">
              {refs.map((ref, index) => (
                <button className="ref-photo" key={ref.previewUrl} onClick={() => removeRef(index)} type="button" title={t("delete")}>
                  <img src={ref.previewUrl} alt="" />
                  <span>×</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function colorForId(id: string) {
  const colors = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff375f", "#00c7be"];
  const index = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

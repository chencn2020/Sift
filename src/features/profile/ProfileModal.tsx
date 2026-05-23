import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "../../app/types";
import { DEFAULT_AVATARS, normalizeUserProfile } from "../../app/userProfile";
import { Modal } from "../../components/Modal";
import { UserAvatar } from "../../components/UserAvatar";

interface ProfileModalProps {
  open: boolean;
  profile: UserProfile;
  t: (key: string) => string;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
}

export function ProfileModal({ open, profile, t, onClose, onSave }: ProfileModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<UserProfile>(profile);

  useEffect(() => {
    if (open) setDraft(profile);
  }, [open, profile]);

  function save() {
    const nextProfile = normalizeUserProfile(draft);
    if (!nextProfile.displayName) return;
    onSave(nextProfile);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={t("editProfile")}
      className="md-profile"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            {t("cancel")}
          </button>
          <button className="btn-primary" onClick={save} disabled={!draft.displayName.trim()} type="button">
            {t("save")}
          </button>
        </>
      }
    >
      <div className="profile-editor">
        <div className="profile-preview">
          <UserAvatar profile={draft} size="lg" />
          <div>
            <b>{draft.displayName || t("displayName")}</b>
            <span>{t("localOnly")}</span>
          </div>
        </div>

        <div className="form-grid profile-fields">
          <label htmlFor="profile-display-name">{t("displayName")}</label>
          <input
            id="profile-display-name"
            type="text"
            maxLength={32}
            value={draft.displayName}
            onChange={(event) => {
              const displayName = event.currentTarget.value;
              setDraft((value) => ({ ...value, displayName }));
            }}
          />
        </div>

        <div className="avatar-section">
          <div className="avatar-section-head">
            <span>{t("defaultAvatars")}</span>
            <button className="btn-ghost" onClick={() => fileInputRef.current?.click()} type="button">
              {t("uploadAvatar")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                event.currentTarget.value = "";
                if (!file) return;
                void readAvatarPreview(file)
                  .then((avatarDataUrl) => {
                    setDraft((value) => ({ ...value, avatarDataUrl }));
                  })
                  .catch(() => undefined);
              }}
            />
          </div>
          <div className="avatar-grid">
            {DEFAULT_AVATARS.map((avatar) => (
              <button
                className={`avatar-choice ${draft.avatarId === avatar.id && !draft.avatarDataUrl ? "active" : ""}`}
                key={avatar.id}
                onClick={() => setDraft((value) => ({ ...value, avatarId: avatar.id, avatarDataUrl: undefined }))}
                type="button"
              >
                <span
                  aria-hidden="true"
                  style={{
                    backgroundColor: avatar.colors[0],
                    backgroundImage: `url(${avatar.src})`
                  }}
                />
                <b>{avatar.label}</b>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function readAvatarPreview(file: File, maxSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) {
          reject(new Error("avatar canvas unavailable"));
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("avatar image read failed"));
    };
    image.src = url;
  });
}

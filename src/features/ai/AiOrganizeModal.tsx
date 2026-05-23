import type { AppState } from "../../app/types";
import { Modal } from "../../components/Modal";
import { planAiChanges } from "../library/photoRules";

interface AiOrganizeModalProps {
  open: boolean;
  state: AppState;
  t: (key: string) => string;
  onClose: () => void;
  onApply: () => void;
  onRuleChange: (rule: keyof AppState["aiRules"], enabled: boolean) => void;
}

export function AiOrganizeModal({ open, state, t, onClose, onApply, onRuleChange }: AiOrganizeModalProps) {
  const changes = planAiChanges(state);
  const analyzed = state.photos.filter((photo) => photo.analyzed);
  const picks = changes.filter((change) => change.state === "pick").length;
  const rejects = changes.filter((change) => change.state === "reject").length;
  const blurCount = analyzed.filter((photo) => photo.sharpness < 0.55).length;
  const closedEyesCount = analyzed.filter((photo) => photo.eyesClosed).length;
  const burstCount = new Set(state.photos.map((photo) => photo.burstId).filter(Boolean)).size;
  const duplicateCount = new Set(state.photos.map((photo) => photo.duplicateGroupId).filter(Boolean)).size;
  const highRatedCount = state.photos.filter((photo) => photo.rating >= 4).length;
  const canApply = changes.length > 0;

  return (
    <Modal
      open={open}
      className="md-ai"
      title={t("aiOrganize")}
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>
            {t("cancel")}
          </button>
          <button className="btn-primary" disabled={!canApply} onClick={onApply}>
            {t("apply")}
          </button>
        </>
      }
    >
      <div className="ai-intro">
        <h3>{t("smartCulling")}</h3>
        <p>
          {analyzed.length.toLocaleString()} / {state.photos.length.toLocaleString()} {t("photos")} {t("analyzed")}
        </p>
      </div>
      <div className="ai-rules">
        <Rule
          checked={state.aiRules.bestOfBurst}
          label={t("ruleBestOfBurst")}
          count={`${burstCount}`}
          onChange={(enabled) => onRuleChange("bestOfBurst", enabled)}
        />
        <Rule
          checked={state.aiRules.rejectEyesClosed}
          label={t("ruleRejectEyesClosed")}
          count={`${closedEyesCount}`}
          onChange={(enabled) => onRuleChange("rejectEyesClosed", enabled)}
        />
        <Rule
          checked={state.aiRules.rejectBlurry}
          label={t("ruleRejectBlurry")}
          count={`${blurCount}`}
          onChange={(enabled) => onRuleChange("rejectBlurry", enabled)}
        />
        <Rule
          checked={state.aiRules.rejectDuplicates}
          label={t("ruleRejectDuplicates")}
          count={`${duplicateCount}`}
          onChange={(enabled) => onRuleChange("rejectDuplicates", enabled)}
        />
        <Rule
          checked={state.aiRules.pickHighRated}
          label={t("rulePickHighRated")}
          count={`${highRatedCount}`}
          onChange={(enabled) => onRuleChange("pickHighRated", enabled)}
        />
      </div>
      <div className="ai-summary">
        <span>
          {t("pick")} <b>{picks}</b>
        </span>
        <span>
          {t("reject")} <b>{rejects}</b>
        </span>
        <span>{canApply ? t("readyToApply") : t("nothingToApply")}</span>
      </div>
    </Modal>
  );
}

function Rule({
  checked,
  label,
  count,
  onChange
}: {
  checked: boolean;
  label: string;
  count: string;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className="ai-rule">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.currentTarget.checked)} />
      <span>{label}</span>
      <em>{count}</em>
    </label>
  );
}

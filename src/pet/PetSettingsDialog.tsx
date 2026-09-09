import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { AiSettings, ProviderId } from "../tauri/aiTypes";
import { KEYED_PROVIDERS, PROVIDER_LABELS } from "../tauri/aiTypes";

type PetSettingsDialogProps = {
  isOpen: boolean;
  settings: AiSettings;
  onSave: (settings: AiSettings) => void;
  onClose: () => void;
};

const DEFAULT_MODELS: Record<ProviderId, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-6",
  deepseek: "deepseek-chat",
  groq: "llama-3.3-70b-versatile",
  ollama: "llama3",
  gemini: "gemini-2.5-flash",
};

export function PetSettingsDialog({
  isOpen,
  settings,
  onSave,
  onClose,
}: PetSettingsDialogProps): JSX.Element | null {
  const [provider, setProvider] = useState<ProviderId>(
    settings.provider ?? "openai",
  );
  const [model, setModel] = useState(
    settings.model ?? DEFAULT_MODELS[settings.provider ?? "openai"],
  );
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const needsKey = KEYED_PROVIDERS.includes(provider);

  useEffect(() => {
    if (!isOpen) return;
    setApiKey("");
    if (needsKey) {
      void window.api.hasProviderKey(provider).then(setHasStoredKey);
    } else {
      setHasStoredKey(false);
    }
  }, [isOpen, provider, needsKey]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaveState("saving");
    if (needsKey && apiKey.trim()) {
      await window.api.saveProviderKey(provider, apiKey.trim());
    }
    const nextSettings: AiSettings = {
      provider,
      model: model.trim(),
      baseUrl: baseUrl.trim() || undefined,
    };
    await window.api.setAiSettings(nextSettings);
    setSaveState("saved");
    onSave(nextSettings);
  };

  return (
    <div
      className="stv-dialog-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 2100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        className="stv-dialog-panel"
        style={{
          width: "380px",
          background: "var(--color-surface-elevated)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
          padding: "18px",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{ fontSize: "14px", marginBottom: "14px", fontWeight: 700 }}
        >
          AI Settings
        </div>

        <label style={labelStyle}>
          Provider
          <select
            className="stv-input"
            value={provider}
            onChange={(event) => {
              const next = event.target.value as ProviderId;
              setProvider(next);
              setModel(DEFAULT_MODELS[next]);
            }}
            style={inputStyle}
          >
            {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((id) => (
              <option key={id} value={id}>
                {PROVIDER_LABELS[id]}
              </option>
            ))}
          </select>
        </label>

        <label style={labelStyle}>
          Model
          <input
            className="stv-input"
            value={model}
            onChange={(event) => setModel(event.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Base URL (optional override)
          <input
            className="stv-input"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder={
              provider === "ollama"
                ? "http://localhost:11434"
                : "Provider default"
            }
            style={inputStyle}
          />
        </label>

        {needsKey && (
          <label style={labelStyle}>
            API key{" "}
            {hasStoredKey && (
              <span style={{ color: "var(--color-text-muted)" }}>
                (already saved — leave blank to keep it)
              </span>
            )}
            <input
              className="stv-input"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={hasStoredKey ? "••••••••" : "sk-…"}
              style={inputStyle}
            />
          </label>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "16px",
          }}
        >
          <button onClick={onClose} className="stv-btn" style={cancelBtnStyle}>
            Close
          </button>
          <button
            onClick={() => void handleSave()}
            className="stv-btn"
            style={saveBtnStyle}
          >
            {saveState === "saving" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "12px",
  color: "var(--color-text-muted)",
  marginBottom: "10px",
};
const inputStyle: CSSProperties = {
  fontSize: "13px",
  color: "var(--color-text)",
};
const cancelBtnStyle: CSSProperties = {
  minWidth: "72px",
  padding: "8px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-2)",
  color: "var(--color-text)",
  cursor: "pointer",
  fontWeight: 600,
};
const saveBtnStyle: CSSProperties = {
  minWidth: "72px",
  padding: "8px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--color-accent-strong)",
  background:
    "linear-gradient(180deg, var(--color-accent) 0%, var(--color-accent-strong) 100%)",
  color: "#f7f8f8",
  cursor: "pointer",
  fontWeight: 700,
};

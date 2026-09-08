import type { CSSProperties } from "react";
import type { AiSettings, ProviderId } from "../tauri/aiTypes";
import { PROVIDER_LABELS } from "../tauri/aiTypes";

type ProviderModelSelectProps = {
  settings: AiSettings;
  onChange: (next: AiSettings) => void;
  onOpenFullSettings: () => void;
};

const DEFAULT_MODELS: Record<ProviderId, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-6",
  deepseek: "deepseek-chat",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.5-flash",
  ollama: "llama3",
};

/** A compact, single-row provider + model picker that lives in the
 * composer header. It reads/writes the same `AiSettings` (persisted via
 * `window.api.setAiSettings`, exactly like `PetSettingsDialog`) so the
 * two surfaces never fall out of sync — this is deliberately *not* a
 * second settings/state system. API key entry stays exclusive to
 * `PetSettingsDialog` (opened here via `onOpenFullSettings`), since a
 * secret-entry field doesn't belong in an always-visible toolbar. */
export function ProviderModelSelect({
  settings,
  onChange,
  onOpenFullSettings,
}: ProviderModelSelectProps): JSX.Element {
  const provider = settings.provider ?? "openai";
  const model = settings.model ?? DEFAULT_MODELS[provider];

  return (
    <div style={rowStyle}>
      <select
        className="stv-input"
        style={selectStyle}
        value={provider}
        onChange={(event) => {
          const next = event.target.value as ProviderId;
          void window.api
            .setAiSettings({
              ...settings,
              provider: next,
              model: DEFAULT_MODELS[next],
            })
            .then(() =>
              onChange({
                ...settings,
                provider: next,
                model: DEFAULT_MODELS[next],
              }),
            );
        }}
        title="AI provider"
      >
        {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((id) => (
          <option key={id} value={id}>
            {PROVIDER_LABELS[id]}
          </option>
        ))}
      </select>

      <input
        className="stv-input"
        style={modelInputStyle}
        value={model}
        onChange={(event) => {
          const next = event.target.value;
          onChange({ ...settings, provider, model: next });
        }}
        onBlur={() => {
          void window.api.setAiSettings({ ...settings, provider, model });
        }}
        title="Model"
        placeholder="model id"
      />

      <button
        type="button"
        className="stv-icon-btn"
        style={gearStyle}
        onClick={onOpenFullSettings}
        title="AI provider settings"
        aria-label="AI provider settings"
      >
        ⚙
      </button>
    </div>
  );
}

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  minWidth: 0,
};

const selectStyle: CSSProperties = {
  fontSize: "11px",
  padding: "3px 6px",
  height: "var(--control-size-compact)",
  maxWidth: "112px",
  flexShrink: 0,
};

const modelInputStyle: CSSProperties = {
  fontSize: "11px",
  padding: "3px 6px",
  height: "var(--control-size-compact)",
  minWidth: 0,
  flex: 1,
};

const gearStyle: CSSProperties = {
  flexShrink: 0,
  width: "var(--control-size-compact)",
  height: "var(--control-size-compact)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

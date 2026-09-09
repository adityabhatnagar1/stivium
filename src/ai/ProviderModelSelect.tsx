import type { AiSettings, ProviderId } from "../tauri/aiTypes";
import { PROVIDER_LABELS } from "../tauri/aiTypes";
import { IconSettings, IconLayers, IconChevronDown } from "../components/Icons";

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

/** A compact provider + model picker that lives in the composer
 * toolbar, styled as a single pill trigger (à la the reference design's
 * "Skills" control). It reads/writes the same `AiSettings` (persisted
 * via `window.api.setAiSettings`, exactly like `PetSettingsDialog`) so
 * the two surfaces never fall out of sync — this is deliberately *not*
 * a second settings/state system. API key entry stays exclusive to
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
    <div className="stv-ai-model-picker">
      <div className="stv-ai-model-picker__pill" title="AI provider">
        <IconLayers size={12} />
        <select
          className="stv-ai-model-picker__select"
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
        >
          {(Object.keys(PROVIDER_LABELS) as ProviderId[]).map((id) => (
            <option key={id} value={id}>
              {PROVIDER_LABELS[id]}
            </option>
          ))}
        </select>
        <IconChevronDown size={11} className="stv-ai-model-picker__chevron" />
      </div>

      <input
        className="stv-input stv-ai-model-picker__model-input"
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
        className="stv-ai-composer__icon-btn"
        onClick={onOpenFullSettings}
        title="AI provider settings"
        aria-label="AI provider settings"
      >
        <IconSettings size={14} />
      </button>
    </div>
  );
}

import { useRef } from "react";
import type { AiSettings } from "../tauri/aiTypes";
import { ProviderModelSelect } from "./ProviderModelSelect";

type ComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isBusy: boolean;
  isConfigured: boolean;
  contextLabel: string | null;
  aiSettings: AiSettings;
  onSettingsChange: (next: AiSettings) => void;
  onOpenFullSettings: () => void;
};

const MAX_TEXTAREA_HEIGHT_PX = 160;

export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  isBusy,
  isConfigured,
  contextLabel,
  aiSettings,
  onSettingsChange,
  onOpenFullSettings,
}: ComposerProps): JSX.Element {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const autosize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT_PX)}px`;
  };

  const canSend = isConfigured && !isBusy && value.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend();
    requestAnimationFrame(autosize);
  };

  return (
    <div className="stv-ai-composer">
      {contextLabel && (
        <div className="stv-ai-composer__context">{contextLabel}</div>
      )}

      <textarea
        ref={textareaRef}
        className="stv-ai-composer__input"
        value={value}
        placeholder={
          isConfigured
            ? "Ask about this file… (Enter to send, Shift+Enter for a new line)"
            : "Configure an AI provider to start chatting…"
        }
        disabled={!isConfigured}
        rows={1}
        onChange={(event) => {
          onChange(event.target.value);
          autosize();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
      />

      <div className="stv-ai-composer__toolbar">
        <ProviderModelSelect
          settings={aiSettings}
          onChange={onSettingsChange}
          onOpenFullSettings={onOpenFullSettings}
        />

        {isBusy ? (
          <button
            type="button"
            className="stv-ai-composer__send stv-ai-composer__send--stop"
            onClick={onStop}
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            className="stv-ai-composer__send"
            onClick={handleSend}
            disabled={!canSend}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}

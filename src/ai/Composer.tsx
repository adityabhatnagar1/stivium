import { useRef, useState } from "react";
import type { AiSettings } from "../tauri/aiTypes";
import { ProviderModelSelect } from "./ProviderModelSelect";
import {
  IconArrowUp,
  IconStop,
  IconMaximize2,
  IconPaperclip,
} from "../components/Icons";

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
const MAX_TEXTAREA_HEIGHT_EXPANDED_PX = 320;

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
  const [isExpanded, setIsExpanded] = useState(false);

  const autosize = () => {
    const el = textareaRef.current;
    if (!el) return;
    const cap = isExpanded
      ? MAX_TEXTAREA_HEIGHT_EXPANDED_PX
      : MAX_TEXTAREA_HEIGHT_PX;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, cap)}px`;
  };

  const canSend = isConfigured && !isBusy && value.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSend();
    requestAnimationFrame(autosize);
  };

  return (
    <div className="stv-ai-composer">
      <div
        className={`stv-ai-composer__box${
          isExpanded ? " stv-ai-composer__box--expanded" : ""
        }`}
      >
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

          <span className="stv-ai-composer__toolbar-spacer" />

          <button
            type="button"
            className={`stv-ai-composer__icon-btn${
              isExpanded ? " stv-ai-composer__icon-btn--active" : ""
            }`}
            onClick={() => {
              setIsExpanded((prev) => !prev);
              requestAnimationFrame(autosize);
            }}
            title={isExpanded ? "Collapse composer" : "Expand composer"}
            aria-label={isExpanded ? "Collapse composer" : "Expand composer"}
            aria-pressed={isExpanded}
          >
            <IconMaximize2 size={13} />
          </button>

          <button
            type="button"
            className="stv-ai-composer__icon-btn"
            disabled
            title="Attachments — coming soon"
            aria-label="Attachments — coming soon"
          >
            <IconPaperclip size={14} />
          </button>

          {isBusy ? (
            <button
              type="button"
              className="stv-ai-composer__send stv-ai-composer__send--stop"
              onClick={onStop}
              title="Stop generating"
              aria-label="Stop generating"
            >
              <IconStop size={12} />
            </button>
          ) : (
            <button
              type="button"
              className="stv-ai-composer__send"
              onClick={handleSend}
              disabled={!canSend}
              title="Send"
              aria-label="Send"
            >
              <IconArrowUp size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

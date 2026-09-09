import type { ConversationMessage } from "../tauri/aiTypes";
import { StreamingMarkdown } from "./StreamingMarkdown";
import { IconFile, IconFileDiff, IconChevronDown } from "../components/Icons";

type MessageProps = {
  message: ConversationMessage;
  isThinking: boolean;
  isStreaming: boolean;
  durationMs?: number;
  onProposeEdit?: (content: string) => void;
};

function formatDuration(ms: number): string {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} sec`;
}

export function Message({
  message,
  isThinking,
  isStreaming,
  durationMs,
  onProposeEdit,
}: MessageProps): JSX.Element {
  const isUser = message.role === "user";
  const canProposeEdit =
    !isUser &&
    !isStreaming &&
    !isThinking &&
    !message.incomplete &&
    message.content.trim().length > 0 &&
    Boolean(onProposeEdit);

  return (
    <div className={`stv-ai-msg stv-ai-msg--${isUser ? "user" : "assistant"}`}>
      {message.contextLabel && (
        <div className="stv-ai-context-chip" title={message.contextLabel}>
          <span className="stv-ai-context-chip__icon">
            <IconFile size={10} />
          </span>
          <span className="stv-ai-context-chip__label">
            {message.contextLabel}
          </span>
          <span>added to context</span>
        </div>
      )}

      <div className="stv-ai-msg__bubble">
        {isThinking ? (
          <div className="stv-ai-thinking" aria-label="Thinking">
            <span />
            <span />
            <span />
          </div>
        ) : isUser ? (
          <p className="stv-md-p stv-ai-msg__plain">{message.content}</p>
        ) : (
          <>
            {typeof durationMs === "number" && (
              <div className="stv-ai-msg__activity">
                <IconChevronDown size={11} />
                <span>Worked for {formatDuration(durationMs)}</span>
              </div>
            )}
            <StreamingMarkdown
              messageId={message.id}
              text={message.content}
              isFinal={!isStreaming}
            />
          </>
        )}

        {message.incomplete && !isStreaming && (
          <div className="stv-ai-msg__incomplete">
            {message.content.trim().length > 0
              ? "Response stopped early."
              : "No response was generated."}
          </div>
        )}
      </div>

      {canProposeEdit && (
        <button
          type="button"
          className="stv-ai-msg__propose"
          onClick={() => onProposeEdit?.(message.content)}
        >
          <span className="stv-ai-msg__propose-icon">
            <IconFileDiff size={14} />
          </span>
          <span className="stv-ai-msg__propose-text">
            <span className="stv-ai-msg__propose-title">
              Review as file edit
            </span>
            <span className="stv-ai-msg__propose-subtitle">
              Apply this response to the active file
            </span>
          </span>
          <span className="stv-ai-msg__propose-chevron">
            <IconChevronDown
              size={13}
              style={{ transform: "rotate(-90deg)" }}
            />
          </span>
        </button>
      )}
    </div>
  );
}

import type { ConversationMessage } from "../tauri/aiTypes";
import { StreamingMarkdown } from "./StreamingMarkdown";

type MessageProps = {
  message: ConversationMessage;
  isThinking: boolean;
  isStreaming: boolean;
  onProposeEdit?: (content: string) => void;
};

export function Message({
  message,
  isThinking,
  isStreaming,
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
        <div className="stv-ai-msg__context" title={message.contextLabel}>
          {message.contextLabel}
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
          <StreamingMarkdown
            messageId={message.id}
            text={message.content}
            isFinal={!isStreaming}
          />
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
          Review as file edit…
        </button>
      )}
    </div>
  );
}

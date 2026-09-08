import { useEffect, useRef } from "react";
import type { ConversationMessage } from "../tauri/aiTypes";
import { Message } from "./Message";

type MessageListProps = {
  messages: ConversationMessage[];
  isThinking: boolean;
  streamingMessageId: string | null;
  onProposeEdit: (content: string) => void;
};

const NEAR_BOTTOM_THRESHOLD_PX = 72;

export function MessageList({
  messages,
  isThinking,
  streamingMessageId,
  onProposeEdit,
}: MessageListProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < NEAR_BOTTOM_THRESHOLD_PX;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  });

  if (messages.length === 0 && !isThinking) {
    return (
      <div className="stv-ai-empty">
        <p>
          Ask about the active file, request a testbench, or describe a change.
        </p>
        <p className="stv-ai-empty__muted">
          Stivium attaches your current selection or file automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="stv-ai-messages" ref={scrollRef} onScroll={handleScroll}>
      {messages.map((message) => (
        <Message
          key={message.id}
          message={message}
          isThinking={isThinking && message.id === streamingMessageId}
          isStreaming={message.id === streamingMessageId}
          onProposeEdit={
            message.role === "assistant" ? onProposeEdit : undefined
          }
        />
      ))}
    </div>
  );
}

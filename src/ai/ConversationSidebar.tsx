import type { Conversation } from "../tauri/aiTypes";
import { IconClose, IconPlus } from "../components/Icons";
type ConversationSidebarProps = {
  conversations: Conversation[];
  activeId: string | null;
  streamingConversationId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
};

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function ConversationSidebar({
  conversations,
  activeId,
  streamingConversationId,
  onSelect,
  onCreate,
  onDelete,
}: ConversationSidebarProps): JSX.Element {
  return (
    <div className="stv-ai-sidebar">
      <div className="stv-ai-sidebar__header">
        <span>Conversations</span>
        <button
          type="button"
          className="stv-ai-sidebar__new"
          onClick={onCreate}
          title="New conversation"
          aria-label="New conversation"
        >
          <IconPlus size={11} />
        </button>
      </div>

      <div className="stv-ai-sidebar__list">
        {conversations.length === 0 && (
          <div className="stv-ai-sidebar__empty">No conversations yet.</div>
        )}
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeId;
          const isStreamingHere = conversation.id === streamingConversationId;
          return (
            <div
              key={conversation.id}
              className={`stv-ai-sidebar__item${
                isActive ? " stv-ai-sidebar__item--active" : ""
              }`}
              onClick={() => onSelect(conversation.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(conversation.id);
                }
              }}
            >
              <div className="stv-ai-sidebar__item-main">
                <span className="stv-ai-sidebar__item-title">
                  {isStreamingHere && (
                    <span
                      className="stv-ai-sidebar__pulse"
                      aria-label="Generating"
                    />
                  )}
                  {conversation.title}
                </span>
                <span className="stv-ai-sidebar__item-time">
                  {formatRelativeTime(conversation.updatedAt)}
                </span>
              </div>
              <button
                type="button"
                className="stv-ai-sidebar__delete"
                title="Delete conversation"
                aria-label="Delete conversation"
                disabled={isStreamingHere}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(conversation.id);
                }}
              >
                <IconClose size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

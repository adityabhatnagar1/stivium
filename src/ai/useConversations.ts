import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation, ConversationMessage } from "../tauri/aiTypes";

type PersistMode = "immediate" | "debounced" | "none";

type UseConversationsResult = {
  conversations: Conversation[];
  activeId: string | null;
  activeConversation: Conversation | undefined;
  loaded: boolean;
  setActiveId: (id: string | null) => void;
  createConversation: () => string;
  deleteConversation: (id: string) => void;
  updateConversation: (
    id: string,
    updater: (conversation: Conversation) => Conversation,
    mode?: PersistMode,
  ) => void;
};

function deriveTitle(userText: string): string {
  const collapsed = userText.trim().replace(/\s+/g, " ");
  if (collapsed.length === 0) return "New conversation";
  return collapsed.length > 48 ? `${collapsed.slice(0, 48)}…` : collapsed;
}

/** Owns the conversation list and its persistence to `conversations.json`
 * via the Rust commands in `src-tauri/src/ai/conversations.rs`. Writes
 * are split into "immediate" (user sends a message, generation
 * finishes/errors/cancels — anything the user would be upset to lose)
 * and "debounced" (in-flight streaming token updates, which fire far
 * too often — once per animation frame — to write the whole file on
 * every one of them without visibly costing IDE responsiveness). */
export function useConversations(): UseConversationsResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const debounceTimers = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    void window.api.listConversations().then((list) => {
      if (cancelled) return;
      setConversations(list);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      // Flush every pending debounced write immediately on unmount
      // (panel closed / app closing) instead of silently dropping the
      // last ~800ms of streamed content.
      for (const handle of timers.values()) window.clearTimeout(handle);
      timers.clear();
    };
  }, []);

  const persist = useCallback(
    (conversation: Conversation, mode: PersistMode) => {
      if (mode === "none") return;

      const timers = debounceTimers.current;
      const pending = timers.get(conversation.id);
      if (pending !== undefined) {
        window.clearTimeout(pending);
        timers.delete(conversation.id);
      }

      if (mode === "immediate") {
        void window.api.saveConversation(conversation);
        return;
      }

      const handle = window.setTimeout(() => {
        timers.delete(conversation.id);
        void window.api.saveConversation(conversation);
      }, 800);
      timers.set(conversation.id, handle);
    },
    [],
  );

  const updateConversation = useCallback(
    (
      id: string,
      updater: (conversation: Conversation) => Conversation,
      mode: PersistMode = "immediate",
    ) => {
      setConversations((prev) => {
        let updated: Conversation | null = null;
        const next = prev.map((conversation) => {
          if (conversation.id !== id) return conversation;
          updated = updater(conversation);
          return updated;
        });
        if (updated) persist(updated, mode);
        return next;
      });
    },
    [persist],
  );

  const createConversation = useCallback((): string => {
    const now = Date.now();
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title: "New conversation",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
    persist(conversation, "immediate");
    return conversation.id;
  }, [persist]);

  const deleteConversation = useCallback((id: string) => {
    const timers = debounceTimers.current;
    const pending = timers.get(id);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      timers.delete(id);
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
    void window.api.deleteConversation(id);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId);

  return {
    conversations,
    activeId,
    activeConversation,
    loaded,
    setActiveId,
    createConversation,
    deleteConversation,
    updateConversation,
  };
}

export function appendMessage(
  conversation: Conversation,
  message: ConversationMessage,
): Conversation {
  const isFirstUserMessage =
    conversation.messages.length === 0 && message.role === "user";
  return {
    ...conversation,
    title: isFirstUserMessage
      ? deriveTitle(message.content)
      : conversation.title,
    updatedAt: Date.now(),
    messages: [...conversation.messages, message],
  };
}

export function replaceMessageById(
  conversation: Conversation,
  messageId: string,
  updater: (message: ConversationMessage) => ConversationMessage,
): Conversation {
  let changed = false;
  const messages = conversation.messages.map((message) => {
    if (message.id !== messageId) return message;
    changed = true;
    return updater(message);
  });
  if (!changed) return conversation;
  return { ...conversation, updatedAt: Date.now(), messages };
}

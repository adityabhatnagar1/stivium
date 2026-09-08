import { useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import type { Tab } from "../types";
import type {
  AiSettings,
  ChatMessage,
  ConversationMessage,
} from "../tauri/aiTypes";
import { getLanguage, getSelectedCodeFromEditor } from "../utils/editor";
import { useAiSession, type AiSessionStatus } from "../pet/useAiSession";
import {
  useConversations,
  appendMessage,
  replaceMessageById,
} from "./useConversations";
import { ConversationSidebar } from "./ConversationSidebar";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";

type AiWorkspacePanelProps = {
  activeTab: Tab | undefined;
  monacoEditorRef: MutableRefObject<MonacoEditor.IStandaloneCodeEditor | null>;
  aiSettings: AiSettings;
  onAiSettingsChange: (next: AiSettings) => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onStatusChange: (status: AiSessionStatus) => void;
  onProposeEdit: (proposedContent: string) => void;
};

const MAX_HISTORY_MESSAGES = 24;

function buildContextLabel(
  activeTab: Tab | undefined,
  selectedCode: string | null,
): string | undefined {
  if (!activeTab) return undefined;
  if (selectedCode) {
    const lines = selectedCode.split("\n").length;
    return `${activeTab.name} — selection (${lines} line${lines === 1 ? "" : "s"})`;
  }
  return `${activeTab.name} (full file)`;
}

function buildSystemContext(
  activeTab: Tab | undefined,
  selectedCode: string | null,
): string {
  if (!activeTab) return "The user has no file open in the editor.";
  const language = getLanguage(activeTab.name);
  const codeForContext = selectedCode ?? activeTab.content;
  const label = selectedCode
    ? "the user's current selection"
    : "the full active file";
  return [
    `You are an assistant embedded in Stivium, an RTL/Verilog IDE.`,
    `The user is editing "${activeTab.name}" (${language}).`,
    `Below is ${label}:`,
    "```" + language,
    codeForContext,
    "```",
  ].join("\n");
}

const QUICK_ACTIONS: Array<{ label: string; prompt: string }> = [
  {
    label: "Explain this code",
    prompt: "Explain what this code does, concisely.",
  },
  {
    label: "Generate a testbench",
    prompt:
      "Write a Verilog testbench for this module. Only output the testbench code.",
  },
];

export function AiWorkspacePanel({
  activeTab,
  monacoEditorRef,
  aiSettings,
  onAiSettingsChange,
  onClose,
  onOpenSettings,
  onStatusChange,
  onProposeEdit,
}: AiWorkspacePanelProps): JSX.Element {
  const {
    conversations,
    activeId,
    activeConversation,
    loaded,
    setActiveId,
    createConversation,
    deleteConversation,
    updateConversation,
  } = useConversations();

  const [prompt, setPrompt] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [streamingConversationId, setStreamingConversationId] = useState<
    string | null
  >(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null,
  );
  const streamingConversationIdRef = useRef<string | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const { status, responseText, errorMessage, send, cancel } = useAiSession({
    onStatusChange,
  });

  // Feeds provider output into whichever conversation/message the
  // in-flight request actually belongs to — captured in refs at send
  // time, not "whatever conversation happens to be selected right now".
  // This is what lets the user switch to a different thread mid-stream
  // without interrupting or misrouting the generation in progress.
  useEffect(() => {
    const conversationId = streamingConversationIdRef.current;
    const messageId = streamingMessageIdRef.current;
    if (!conversationId || !messageId) return;

    if (status === "streaming") {
      updateConversation(
        conversationId,
        (c) =>
          replaceMessageById(c, messageId, (m) => ({
            ...m,
            content: responseText,
          })),
        "debounced",
      );
      return;
    }

    if (status === "done") {
      updateConversation(
        conversationId,
        (c) =>
          replaceMessageById(c, messageId, (m) => ({
            ...m,
            content: responseText,
          })),
        "immediate",
      );
    } else if (status === "error") {
      const suffix = `_Error: ${errorMessage ?? "Unknown error"}_`;
      updateConversation(
        conversationId,
        (c) =>
          replaceMessageById(c, messageId, (m) => ({
            ...m,
            content: responseText ? `${responseText}\n\n${suffix}` : suffix,
            incomplete: true,
          })),
        "immediate",
      );
    } else if (status === "cancelled") {
      updateConversation(
        conversationId,
        (c) =>
          replaceMessageById(c, messageId, (m) => ({
            ...m,
            content: responseText,
            incomplete: true,
          })),
        "immediate",
      );
    } else {
      return;
    }

    streamingConversationIdRef.current = null;
    streamingMessageIdRef.current = null;
    setStreamingConversationId(null);
    setStreamingMessageId(null);
  }, [status, responseText, errorMessage, updateConversation]);

  const isConfigured = Boolean(aiSettings.provider && aiSettings.model);
  const isBusy = status === "thinking" || status === "streaming";

  const runPrompt = (userText: string) => {
    if (!isConfigured || !aiSettings.provider || !aiSettings.model) return;
    if (isBusy) return;

    const selectedCode = getSelectedCodeFromEditor(monacoEditorRef.current);
    const contextLabel = buildContextLabel(activeTab, selectedCode);
    const systemContext = buildSystemContext(activeTab, selectedCode);

    const priorMessages =
      activeId !== null ? (activeConversation?.messages ?? []) : [];

    const conversationId = activeId ?? createConversation();

    const now = Date.now();
    const userMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      createdAt: now,
      contextLabel,
    };
    const assistantMessage: ConversationMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      createdAt: now + 1,
    };

    updateConversation(conversationId, (c) => appendMessage(c, userMessage));
    updateConversation(conversationId, (c) =>
      appendMessage(c, assistantMessage),
    );
    setActiveId(conversationId);

    streamingConversationIdRef.current = conversationId;
    streamingMessageIdRef.current = assistantMessage.id;
    setStreamingConversationId(conversationId);
    setStreamingMessageId(assistantMessage.id);

    const history: ChatMessage[] = priorMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-MAX_HISTORY_MESSAGES)
      .map((m) => ({ role: m.role, content: m.content }));

    const messages: ChatMessage[] = [
      { role: "system", content: systemContext },
      ...history,
      { role: "user", content: userText },
    ];

    void send({
      provider: aiSettings.provider,
      model: aiSettings.model,
      baseUrl: aiSettings.baseUrl,
      messages,
    });
  };

  const handleSend = () => {
    const text = prompt.trim();
    if (!text) return;
    runPrompt(text);
    setPrompt("");
  };

  const contextPreview = activeTab
    ? (buildContextLabel(
        activeTab,
        getSelectedCodeFromEditor(monacoEditorRef.current),
      ) ?? null)
    : null;

  return (
    <div className="stv-ai-panel">
      <div className="stv-ai-panel__header">
        <button
          type="button"
          className="stv-icon-btn"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          title={isSidebarOpen ? "Hide conversations" : "Show conversations"}
          aria-label="Toggle conversation list"
          aria-pressed={isSidebarOpen}
        >
          ☰
        </button>
        <span className="stv-ai-panel__title">Atiyah</span>
        <button
          type="button"
          className="stv-icon-btn"
          onClick={onClose}
          title="Close AI workspace"
          aria-label="Close AI workspace"
        >
          ✕
        </button>
      </div>

      <div className="stv-ai-panel__body">
        {isSidebarOpen && (
          <ConversationSidebar
            conversations={conversations}
            activeId={activeId}
            streamingConversationId={streamingConversationId}
            onSelect={setActiveId}
            onCreate={createConversation}
            onDelete={deleteConversation}
          />
        )}

        <div className="stv-ai-panel__main">
          {!isConfigured ? (
            <div className="stv-ai-empty">
              <p>No AI provider configured yet.</p>
              <button
                type="button"
                className="stv-ai-msg__propose"
                onClick={onOpenSettings}
              >
                Open settings
              </button>
            </div>
          ) : !loaded ? (
            <div className="stv-ai-empty" aria-hidden="true" />
          ) : (
            <MessageList
              messages={activeConversation?.messages ?? []}
              isThinking={status === "thinking"}
              streamingMessageId={streamingMessageId}
              onProposeEdit={onProposeEdit}
            />
          )}

          {isConfigured && (
            <div className="stv-ai-quick-actions">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="stv-ai-quick-actions__btn"
                  disabled={isBusy || !activeTab}
                  onClick={() => runPrompt(action.prompt)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <Composer
            value={prompt}
            onChange={setPrompt}
            onSend={handleSend}
            onStop={cancel}
            isBusy={isBusy}
            isConfigured={isConfigured}
            contextLabel={contextPreview}
            aiSettings={aiSettings}
            onSettingsChange={onAiSettingsChange}
            onOpenFullSettings={onOpenSettings}
          />
        </div>
      </div>
    </div>
  );
}

import { useCallback, useRef, useState } from "react";
import type { ChatMessage } from "../tauri/aiTypes";

export type AiSessionStatus =
  | "idle"
  | "thinking"
  | "streaming"
  | "done"
  | "error"
  | "cancelled";

type UseAiSessionParams = {
  onStatusChange: (status: AiSessionStatus) => void;
};

type UseAiSessionResult = {
  status: AiSessionStatus;
  responseText: string;
  errorMessage: string | null;
  send: (params: {
    provider: string;
    model: string;
    baseUrl: string | undefined;
    messages: ChatMessage[];
  }) => Promise<void>;
  cancel: () => void;
};

/**
 * Owns exactly one AI request at a time. Never fakes progress with a
 * timer: `status` only ever changes in response to a real
 * `window.api.onAiEvent` callback, which only ever fires from a real
 * `ai-event-{id}` emit coming out of the Rust side.
 */
export function useAiSession({
  onStatusChange,
}: UseAiSessionParams): UseAiSessionResult {
  const [status, setStatusRaw] = useState<AiSessionStatus>("idle");
  const [responseText, setResponseText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const pendingChunkRef = useRef("");
  const flushHandleRef = useRef<number | null>(null);

  const statusRef = useRef<AiSessionStatus>("idle");

  const setStatus = useCallback(
    (next: AiSessionStatus) => {
      statusRef.current = next;
      setStatusRaw(next);
      onStatusChange(next);
    },
    [onStatusChange],
  );

  const send = useCallback(
    async ({
      provider,
      model,
      baseUrl,
      messages,
    }: {
      provider: string;
      model: string;
      baseUrl: string | undefined;
      messages: ChatMessage[];
    }) => {
      unlistenRef.current?.();
      if (flushHandleRef.current !== null) {
        cancelAnimationFrame(flushHandleRef.current);
        flushHandleRef.current = null;
      }
      pendingChunkRef.current = "";

      const requestId = crypto.randomUUID();
      requestIdRef.current = requestId;
      setResponseText("");
      setErrorMessage(null);
      setStatus("thinking");

      const flushPending = () => {
        if (flushHandleRef.current !== null) {
          cancelAnimationFrame(flushHandleRef.current);
          flushHandleRef.current = null;
        }
        if (pendingChunkRef.current) {
          const chunk = pendingChunkRef.current;
          pendingChunkRef.current = "";
          setResponseText((prev) => prev + chunk);
        }
      };

      unlistenRef.current = window.api.onAiEvent(requestId, (event) => {
        if (requestIdRef.current !== requestId) return; // stale listener from a superseded request
        switch (event.type) {
          case "chunk":
            // Only dispatch a status transition once, not on every token
            // (fixes Issue F — this is what was reaching App-level
            // setAiState() on every chunk).
            if (statusRef.current !== "streaming") setStatus("streaming");
            // Accumulate tokens in a ref and flush at most once per
            // animation frame instead of re-rendering on every token
            // (fixes Issue D).
            pendingChunkRef.current += event.token;
            if (flushHandleRef.current === null) {
              flushHandleRef.current = requestAnimationFrame(() => {
                flushHandleRef.current = null;
                if (pendingChunkRef.current) {
                  const chunk = pendingChunkRef.current;
                  pendingChunkRef.current = "";
                  setResponseText((prev) => prev + chunk);
                }
              });
            }
            break;
          case "done":
            flushPending();
            setStatus("done");
            break;
          case "error":
            flushPending();
            setErrorMessage(event.message);
            setStatus("error");
            break;
          case "cancelled":
            flushPending();
            setStatus("cancelled");
            break;
        }
      });

      try {
        await window.api.runAi(
          requestId,
          provider as never,
          model,
          baseUrl,
          messages,
        );
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : String(err));
        setStatus("error");
      }
    },
    [setStatus],
  );

  const cancel = useCallback(() => {
    if (!requestIdRef.current) return;
    void window.api.cancelAi(requestIdRef.current);
  }, []);

  return { status, responseText, errorMessage, send, cancel };
}

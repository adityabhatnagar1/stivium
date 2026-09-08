import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import {
  createStvMarkdownController,
  type StvMarkdownController,
} from "./markdownRenderer";

type StreamingMarkdownProps = {
  /** Stable identity for the message this content belongs to. When this
   * changes, the renderer resets (new parser, cleared container)
   * instead of trying to diff unrelated text. */
  messageId: string;
  /** The full text so far. The component tracks how much of it has
   * already been written to the incremental parser and only writes the
   * new suffix — this is what makes re-renders during streaming O(new
   * chunk) instead of O(whole message) every time. */
  text: string;
  /** True once no more text is coming for this message (done / error /
   * cancelled) so the parser can be flushed via `parser_end`. */
  isFinal: boolean;
};

export function StreamingMarkdown({
  messageId,
  text,
  isFinal,
}: StreamingMarkdownProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<StvMarkdownController | null>(null);
  const writtenLengthRef = useRef(0);
  const messageIdRef = useRef<string | null>(null);

  // (Re)create the controller whenever the container mounts or the
  // message identity changes — never while only `text` changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.replaceChildren();
    controllerRef.current = createStvMarkdownController(container, monaco);
    writtenLengthRef.current = 0;
    messageIdRef.current = messageId;
    return () => {
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || messageIdRef.current !== messageId) return;
    if (text.length > writtenLengthRef.current) {
      controller.write(text.slice(writtenLengthRef.current));
      writtenLengthRef.current = text.length;
    }
    if (isFinal) controller.end();
  }, [messageId, text, isFinal]);

  return <div className="stv-md" ref={containerRef} />;
}

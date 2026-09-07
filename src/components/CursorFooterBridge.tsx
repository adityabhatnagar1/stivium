import { useEffect, useRef, useState } from "react";
import { FooterBar } from "./FooterBar";

type CursorSetter = (line: number, column: number) => void;

type CursorFooterBridgeProps = {
  cursorSetterRef: React.MutableRefObject<CursorSetter | null>;
  workspaceName: string;
  language: string;
  encoding: string;
};

/**
 * Owns cursorLine/cursorColumn itself instead of App owning them.
 * EditorPane's onCursorChange calls `cursorSetterRef.current?.(...)`
 * (a stable function identity that never changes), so cursor movement
 * — one of the most frequent events in the whole IDE — only re-renders
 * this small bridge component and FooterBar, never App's editor/pet/
 * terminal/file-tree subtrees (fixes Issue O).
 */
export function CursorFooterBridge({
  cursorSetterRef,
  workspaceName,
  language,
  encoding,
}: CursorFooterBridgeProps): JSX.Element {
  const [cursor, setCursor] = useState({ line: 1, column: 1 });

  useEffect(() => {
    cursorSetterRef.current = (line, column) => setCursor({ line, column });
    return () => {
      cursorSetterRef.current = null;
    };
  }, [cursorSetterRef]);

  return (
    <FooterBar
      workspaceName={workspaceName}
      line={cursor.line}
      column={cursor.column}
      language={language}
      encoding={encoding}
    />
  );
}

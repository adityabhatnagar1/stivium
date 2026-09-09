import { memo, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import type { editor as MonacoEditor } from "monaco-editor";
import type { MutableRefObject } from "react";
import type { Tab } from "../types";
import { getLanguage } from "../utils/editor";

// Hoisted to module scope so this object has a single stable identity
// for the lifetime of the app, instead of a fresh object (and therefore
// a "changed" props diff for Monaco) on every EditorPane render.
const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily:
    "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontLigatures: true,
} as const;

type EditorPaneProps = {
  activeTab: Tab | undefined;
  monacoEditorRef: MutableRefObject<MonacoEditor.IStandaloneCodeEditor | null>;
  onEditorChange: (value: string | undefined) => void;
  onCursorChange: (line: number, column: number) => void;
};

function EditorPaneImpl({
  activeTab,
  monacoEditorRef,
  onEditorChange,
  onCursorChange,
}: EditorPaneProps): JSX.Element {
  // Monaco ships with "vs-dark" (#1e1e1e) as its only built-in dark
  // theme, which reads as a visibly different app skin against
  // Stivium's darker near-black surfaces. This defines the editor's
  // palette to match, once, the first time an editor mounts. It only
  // recolors chrome (background/gutter/selection/cursor) — token
  // colors are left to Monaco's default TextMate rules.
  const themeRegistered = useRef(false);
  const registerTheme = (instance: typeof monaco) => {
    if (themeRegistered.current) return;

    themeRegistered.current = true;

    // Monaco's defineTheme() colors require literal hex values.
    // They cannot use CSS custom properties like var(--color-bg).
    // Keep these values synchronized with main.css.
    instance.editor.defineTheme("stivium-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#08090a",
        "editor.foreground": "#f7f8f8",
        "editor.lineHighlightBackground": "#131417",
        "editor.lineHighlightBorder": "#00000000",
        "editorLineNumber.foreground": "#3f4147",
        "editorLineNumber.activeForeground": "#8a8f98",
        "editorCursor.foreground": "#5e6ad2",
        "editor.selectionBackground": "#2a2d5c",
        "editor.inactiveSelectionBackground": "#1c1e2e",
        "editorIndentGuide.background": "#1c1d21",
        "editorIndentGuide.activeBackground": "#33353b",
        "editorWidget.background": "#17181c",
        "editorWidget.border": "#23262b",
        "editorGutter.background": "#08090a",
        "scrollbarSlider.background": "#26282d80",
        "scrollbarSlider.hoverBackground": "#5e6ad280",
      },
    });
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      {activeTab ? (
        <Editor
          height="100%"
          path={monaco.Uri.file(activeTab.path).toString()}
          language={getLanguage(activeTab.name)}
          theme="stivium-dark"
          value={activeTab.content}
          onChange={onEditorChange}
          beforeMount={registerTheme}
          onMount={(editorInstance: MonacoEditor.IStandaloneCodeEditor) => {
            monacoEditorRef.current = editorInstance;
            const position = editorInstance.getPosition();
            if (position) {
              onCursorChange(position.lineNumber, position.column);
            }
            editorInstance.onDidChangeCursorPosition((event) => {
              onCursorChange(event.position.lineNumber, event.position.column);
            });
          }}
          options={EDITOR_OPTIONS}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--color-text-muted)",
            fontSize: "var(--text-heading)",
          }}
        >
          Open a file to start editing
        </div>
      )}
    </div>
  );
}

export const EditorPane = memo(EditorPaneImpl);

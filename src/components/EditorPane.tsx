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
  // Stivium's darker green-black surfaces. This defines the editor's
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
        "editor.background": "#0a120e",
        "editor.foreground": "#d9f5e6",
        "editor.lineHighlightBackground": "#11201a",
        "editor.lineHighlightBorder": "#00000000",
        "editorLineNumber.foreground": "#3d6552",
        "editorLineNumber.activeForeground": "#7fa896",
        "editorCursor.foreground": "#35d68c",
        "editor.selectionBackground": "#1f4433",
        "editor.inactiveSelectionBackground": "#17301f",
        "editorIndentGuide.background": "#1a2e24",
        "editorIndentGuide.activeBackground": "#2a4a3a",
        "editorWidget.background": "#101d17",
        "editorWidget.border": "#1f4433",
        "editorGutter.background": "#0a120e",
        "scrollbarSlider.background": "#244a3a80",
        "scrollbarSlider.hoverBackground": "#35d68c80",
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

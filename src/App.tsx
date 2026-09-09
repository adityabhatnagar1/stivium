/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type MouseEvent,
} from "react";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "@xterm/xterm/css/xterm.css";
import appIcon from "./assets/icon.svg";
import type { editor as MonacoEditor } from "monaco-editor";
import { LeftPane } from "./components/LeftPane";
import { TerminalPanel } from "./components/TerminalPanel";
import { ContextMenu } from "./components/ContextMenu";
import { NameDialog } from "./components/NameDialog";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { ErrorToast } from "./components/ErrorToast";
import { CursorFooterBridge } from "./components/CursorFooterBridge";
import { TitleBar } from "./components/TitleBar";
import { EditorTabs } from "./components/EditorTabs";
import { EditorPane } from "./components/EditorPane";
// import {} from "./components/Icons";
import { LanguageClientsManager } from "./lsp/client";
import { StiviumPet } from "./pet/StiviumPet";
import { AiWorkspacePanel } from "./ai/AiWorkspacePanel";
import { PetSettingsDialog } from "./pet/PetSettingsDialog";
import { PetReviewDialog } from "./pet/PetReviewDialog";
import { usePetState } from "./pet/usePetState";
import type { PetState } from "./pet/types";
import type { AiSettings } from "./tauri/aiTypes";
import {
  getBuiltInLspClientConfigs,
  registerBuiltInLanguages,
} from "./lsp/registry";
import { getLanguage, resolveActiveTabPath } from "./utils/editor";
import { useTerminalManager } from "./hooks/useTerminalManager";
import { useRtlRunner } from "./hooks/useRtlRunner";
import { useWorkspaceActions } from "./hooks/useWorkspaceActions";
import { useAppShortcuts } from "./hooks/useAppShortcuts";
import { useEditorTabs } from "./hooks/useEditorTabs";
import { useWindowChrome } from "./hooks/useWindowChrome";
import { useDisableBrowserBehaviors } from "./hooks/useDisableBrowserBehaviors";
import type { Tab, TreeNode } from "./types";

loader.config({ monaco });
registerBuiltInLanguages();

function App() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  useDisableBrowserBehaviors();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);
  const [leftPaneTab, setLeftPaneTab] = useState<"workspace" | "search">(
    "workspace",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const cursorSetterRef = useRef<
    ((line: number, column: number) => void) | null
  >(null);
  const [leftPaneWidth, setLeftPaneWidth] = useState(280);
  const [aiPanelWidth, setAiPanelWidth] = useState(360);
  const [isAiPanelMaximized, setIsAiPanelMaximized] = useState(false);
  const aiPanelWidthBeforeMaximizeRef = useRef(360);
  const [terminalHeight, setTerminalHeight] = useState(260);
  const [isPetVisible, setIsPetVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>({});
  const [reviewContent, setReviewContent] = useState<string | null>(null);

  const {
    petState,
    setAiState,
    setHovering,
    setClicking,
    setDragging,
    forcedState,
    setForcedState,
  } = usePetState();

  const centerPaneRef = useRef<HTMLDivElement | null>(null);
  const leftPaneRef = useRef<HTMLDivElement | null>(null);
  const aiPanelRef = useRef<HTMLDivElement | null>(null);
  const terminalPanelRef = useRef<HTMLDivElement | null>(null);
  const lspManagerRef = useRef<LanguageClientsManager | null>(null);
  const monacoEditorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(
    null,
  );

  const {
    fileTree,
    selectedNode,
    setSelectedNode,
    clipboard,
    nameDialog,
    setNameDialog,
    confirmDialog,
    setConfirmDialog,
    contextMenu,
    setContextMenu,
    searchResults,
    setSearchResults,
    refreshWorkspace,
    handleOpenWorkspace,
    handleCloseWorkspace,
    handleFileClick,
    handleCreateFile,
    handleCreateFolder,
    submitNameDialog,
    openContextMenu,
    runContextAction,
    runWorkspaceAction,
  } = useWorkspaceActions({
    tabs,
    activeTabPath,
    setTabs,
    setActiveTabPath,
    setErrorMessage,
  });

  const {
    termTabs,
    activeTermId,
    setActiveTermId,
    createTerminal,
    closeTerminal,
    appendOutputLine,
    clearOutput,
  } = useTerminalManager({
    workspacePath: fileTree?.path,
    terminalHeight,
  });

  const {
    isWindowMaximized,
    isWindowFocused,
    isTopMenuExpanded,
    setIsTopMenuExpanded,
    handleTopMenu,
    handleMinimize,
    handleToggleMaximize,
    handleClose,
  } = useWindowChrome({
    onOpenWorkspace: handleOpenWorkspace,
    onCloseWorkspace: handleCloseWorkspace,
    onOpenSearch: () => setLeftPaneTab("search"),
  });

  useEffect(() => {
    if (!lspManagerRef.current) {
      lspManagerRef.current = new LanguageClientsManager();
    }
    const manager = lspManagerRef.current;
    let cancelled = false;

    const configs = getBuiltInLspClientConfigs();
    manager.stopAll();

    if (fileTree?.path) {
      void manager.startAll(configs, fileTree.path).then(() => {
        if (cancelled) manager.stopAll();
      });
    }

    return () => {
      cancelled = true;
    };
  }, [fileTree?.path]);

  useEffect(() => {
    return () => {
      lspManagerRef.current?.stopAll();
      lspManagerRef.current = null;
    };
  }, []);

  useEffect(() => {
    void window.api.getAiSettings().then(setAiSettings);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const PET_STATES: PetState[] = [
      "idle",
      "hover",
      "click",
      "dragging",
      "thinking",
      "working",
      "ready",
      "error",
      "needsInput",
      "review",
    ];
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey || !event.shiftKey) return;
      // "1".."9" then "0" maps to PET_STATES[0..9] (10 states total).
      const index = event.key === "0" ? 9 : Number(event.key) - 1;
      if (Number.isNaN(index) || index < 0 || index >= PET_STATES.length)
        return;
      event.preventDefault();
      const requested = PET_STATES[index];
      // Pressing the same state's key again releases the forced state
      // back to real (AI/pointer-driven) state instead of getting stuck.
      setForcedState(forcedState === requested ? null : requested);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [forcedState, setForcedState]);

  useEffect(() => {
    const closeContextMenu = () => setContextMenu(null);
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
        setNameDialog((prev) => ({ ...prev, isOpen: false }));
        setConfirmDialog((prev) => ({
          ...prev,
          isOpen: false,
          onConfirm: null,
        }));
      }
    };

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("keydown", onEscape);
    };
  }, [setConfirmDialog, setContextMenu, setNameDialog]);

  const {
    handleSaveCurrent,
    handleSaveAll,
    handleCloseTab,
    handleEditorChange,
  } = useEditorTabs({
    tabs,
    activeTabPath,
    setTabs,
    setActiveTabPath,
    setConfirmDialog,
    setErrorMessage,
    monacoEditorRef,
  });

  useAppShortcuts({
    monacoEditorRef,
    handleSaveCurrent,
    handleSaveAll,
    runWorkspaceAction: async (action) => {
      if (leftPaneTab !== "workspace") return false;
      return runWorkspaceAction(action);
    },
    leftPaneTab,
    nameDialogOpen: nameDialog.isOpen,
    confirmDialogOpen: confirmDialog.isOpen,
    appendOutputLine,
  });

  const startLeftPaneResize = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    let rafId: number | null = null;
    let latestWidth = leftPaneWidth;

    const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const nextWidth = Math.min(520, Math.max(200, moveEvent.clientX));
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        latestWidth = nextWidth;
        if (leftPaneRef.current) {
          leftPaneRef.current.style.width = `${nextWidth}px`;
        }
      });
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      setLeftPaneWidth(latestWidth);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const startAiPanelResize = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    let rafId: number | null = null;
    let latestWidth = aiPanelWidth;

    const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const nextWidth = Math.min(
        640,
        Math.max(320, window.innerWidth - moveEvent.clientX),
      );

      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        latestWidth = nextWidth;

        if (aiPanelRef.current) {
          aiPanelRef.current.style.width = `${nextWidth}px`;
        }
      });
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      setAiPanelWidth(latestWidth);
      // A manual drag supersedes whatever the maximize toggle set, so
      // the header button's pressed state doesn't lie about the panel
      // no longer being at its maximize width.
      setIsAiPanelMaximized(false);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleToggleAiPanelMaximize = () => {
    setIsAiPanelMaximized((prev) => {
      const next = !prev;
      if (next) {
        aiPanelWidthBeforeMaximizeRef.current = aiPanelWidth;
        setAiPanelWidth(640);
      } else {
        setAiPanelWidth(aiPanelWidthBeforeMaximizeRef.current);
      }
      return next;
    });
  };

  const startTerminalResize = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = terminalHeight;
    // Measure once at drag-start instead of on every mousemove.
    const centerHeight =
      centerPaneRef.current?.getBoundingClientRect().height ??
      window.innerHeight;
    let rafId: number | null = null;
    let latestHeight = startHeight;

    const onMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const nextHeight = Math.min(
        Math.max(160, startHeight + deltaY),
        Math.max(160, centerHeight - 180),
      );
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        latestHeight = nextHeight;
        // Apply the live height directly to the DOM node during the
        // drag — no React state update, no App re-render, no xterm
        // fit() per pixel (fixes Issue K).
        if (terminalPanelRef.current) {
          terminalPanelRef.current.style.height = `${nextHeight}px`;
        }
      });
    };
    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Commit the final height to React state once, at drag-end. This
      // is what actually triggers `useTerminalManager`'s
      // terminalHeight-keyed effect to call xterm's fit().
      setTerminalHeight(latestHeight);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };
  const handleCursorChange = useCallback((line: number, column: number) => {
    cursorSetterRef.current?.(line, column);
  }, []);

  const handleSelectNode = useCallback(
    (node: TreeNode, parentPath: string) =>
      setSelectedNode({ node, parentPath }),
    [setSelectedNode],
  );

  const handleCreateTerminal = useCallback(
    (cwd?: string) => void createTerminal(cwd),
    [createTerminal],
  );

  const handlePetClick = useCallback(() => {
    setClicking(true);
    window.setTimeout(() => setClicking(false), 180);
    setIsChatOpen((prev) => !prev);
  }, [setClicking]);
  const resolvedActiveTabPath = resolveActiveTabPath(tabs, activeTabPath);
  const activeTab = tabs.find((t) => t.path === resolvedActiveTabPath);
  const hasContextNode = Boolean(contextMenu?.node);

  const { isRunning, canRun, runCurrentFile } = useRtlRunner({
    activeTab,
    onRun: () => setActiveTermId("output"),
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      <TitleBar
        appIcon={appIcon}
        isTopMenuExpanded={isTopMenuExpanded}
        isWindowMaximized={isWindowMaximized}
        isWindowFocused={isWindowFocused}
        isAiActive={isPetVisible}
        isRunning={isRunning}
        canRun={canRun}
        onRun={() => void runCurrentFile()}
        onToggleMenu={() => setIsTopMenuExpanded((prev) => !prev)}
        onOpenMenu={handleTopMenu}
        onToggleAi={() => setIsPetVisible((prev) => !prev)}
        onMinimize={handleMinimize}
        onToggleMaximize={() => void handleToggleMaximize()}
        onClose={handleClose}
      />

      <div
        style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        <div
          ref={leftPaneRef}
          style={{
            width: leftPaneWidth,
            minWidth: 0,
            flexShrink: 0,
            height: "100%",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <LeftPane
            fileTree={fileTree}
            leftPaneTab={leftPaneTab}
            selectedNode={selectedNode}
            searchQuery={searchQuery}
            replaceQuery={replaceQuery}
            searchResults={searchResults}
            onLeftPaneTabChange={setLeftPaneTab}
            onSearchQueryChange={setSearchQuery}
            onReplaceQueryChange={setReplaceQuery}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onOpenWorkspace={() => void handleOpenWorkspace()}
            onOpenSearchResult={(path) =>
              void handleFileClick(
                path,
                path.split(/[\\/]/).slice(-1)[0] || path,
              )
            }
            onFind={() => {
              if (!fileTree || !searchQuery.trim()) return;
              void window.api
                .findInFiles(fileTree.path, searchQuery)
                .then(setSearchResults);
            }}
            onReplaceAll={() => {
              if (!fileTree || !searchQuery.trim()) return;
              void window.api
                .replaceInFiles(fileTree.path, searchQuery, replaceQuery)
                .then(async (changed) => {
                  appendOutputLine(`Replaced in ${changed} file(s)`);
                  await refreshWorkspace();
                  const results = await window.api.findInFiles(
                    fileTree.path,
                    searchQuery,
                  );
                  setSearchResults(results);
                });
            }}
            onOpenContextMenu={openContextMenu}
            onSelectNode={handleSelectNode}
            onFileClick={handleFileClick}
          />
        </div>
        <div
          onMouseDown={startLeftPaneResize}
          className="stv-resize-handle stv-resize-handle--vertical"
          style={{
            width: "6px",
            cursor: "col-resize",
            background: "var(--color-border)",
            flexShrink: 0,
          }}
        />

        <div
          ref={centerPaneRef}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            backgroundColor: "var(--color-bg)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "stretch" }}>
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <EditorTabs
                tabs={tabs}
                activeTabPath={resolvedActiveTabPath}
                onSelectTab={setActiveTabPath}
                onCloseTab={handleCloseTab}
              />
            </div>
          </div>

          <EditorPane
            activeTab={activeTab}
            monacoEditorRef={monacoEditorRef}
            onEditorChange={handleEditorChange}
            onCursorChange={handleCursorChange}
          />

          <div
            onMouseDown={startTerminalResize}
            className="stv-resize-handle stv-resize-handle--horizontal"
            style={{
              height: "6px",
              cursor: "row-resize",
              background: "var(--color-border)",
              flexShrink: 0,
            }}
          />

          <TerminalPanel
            panelRef={terminalPanelRef}
            termTabs={termTabs}
            activeTermId={activeTermId}
            fileTreePath={fileTree?.path}
            height={terminalHeight}
            onSelectTab={setActiveTermId}
            onCloseTab={closeTerminal}
            onCreateTerminal={createTerminal}
            onClearOutput={clearOutput}
          />

          <StiviumPet
            containerRef={centerPaneRef}
            petState={petState}
            visible={isPetVisible}
            onHoverChange={setHovering}
            onDragStateChange={setDragging}
            onClick={handlePetClick}
          />
        </div>

        {isChatOpen && (
          <div
            className="stv-ai-panel-resize"
            onMouseDown={startAiPanelResize}
          />
        )}

        <div
          ref={aiPanelRef}
          className="stv-ai-panel-wrapper"
          style={{ width: isChatOpen ? aiPanelWidth : 0 }}
        >
          {isChatOpen && (
            <AiWorkspacePanel
              activeTab={activeTab}
              monacoEditorRef={monacoEditorRef}
              aiSettings={aiSettings}
              onAiSettingsChange={setAiSettings}
              onClose={() => setIsChatOpen(false)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onStatusChange={(status) => {
                if (status === "thinking") setAiState("thinking");
                else if (status === "streaming") setAiState("working");
                else if (status === "done") setAiState("ready");
                else if (status === "error") setAiState("error");
                else setAiState(null);
              }}
              onProposeEdit={(proposedContent) => {
                setAiState("review");
                setReviewContent(proposedContent);
              }}
              isMaximized={isAiPanelMaximized}
              onToggleMaximize={handleToggleAiPanelMaximize}
            />
          )}
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasContextNode={hasContextNode}
          hasClipboard={Boolean(clipboard)}
          onAction={(action) => void runContextAction(action)}
        />
      )}

      <NameDialog
        isOpen={nameDialog.isOpen}
        title={nameDialog.title}
        value={nameDialog.value}
        placeholder={nameDialog.placeholder}
        onValueChange={(value) => setNameDialog((prev) => ({ ...prev, value }))}
        onCancel={() => setNameDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => void submitNameDialog()}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        defaultAction={confirmDialog.defaultAction}
        onCancel={() =>
          setConfirmDialog((prev) => ({
            ...prev,
            isOpen: false,
            onConfirm: null,
          }))
        }
        onConfirm={() => {
          const confirmAction = confirmDialog.onConfirm;
          setConfirmDialog((prev) => ({
            ...prev,
            isOpen: false,
            onConfirm: null,
          }));
          if (confirmAction) void confirmAction();
        }}
      />

      <ErrorToast
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />

      <PetSettingsDialog
        isOpen={isSettingsOpen}
        settings={aiSettings}
        onSave={(next) => {
          setAiSettings(next);
          setIsSettingsOpen(false);
        }}
        onClose={() => setIsSettingsOpen(false)}
      />

      <PetReviewDialog
        isOpen={reviewContent !== null}
        fileName={activeTab?.name ?? "untitled"}
        currentContent={activeTab?.content ?? ""}
        proposedContent={reviewContent ?? ""}
        onDiscard={() => {
          setReviewContent(null);
          setAiState(null);
        }}
        onApply={() => {
          if (reviewContent !== null) {
            handleEditorChange(reviewContent);
          }
          setReviewContent(null);
          setAiState("ready");
        }}
      />

      <CursorFooterBridge
        cursorSetterRef={cursorSetterRef}
        workspaceName={fileTree?.name || "No workspace open"}
        language={activeTab ? getLanguage(activeTab.name) : "plaintext"}
        encoding="UTF-8"
      />
    </div>
  );
}

export default App;

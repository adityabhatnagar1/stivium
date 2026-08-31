import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Menu,
  Submenu,
  MenuItem,
  PredefinedMenuItem,
} from "@tauri-apps/api/menu";
import { LogicalPosition } from "@tauri-apps/api/dpi";
import type {
  AppMenuId,
  DirTreeNode,
  FindInFilesResult,
  LspExitInfo,
  LspSpawnOptions,
  LspSpawnResult,
  RunRtlResult,
} from "./types";

let _appWindow: ReturnType<typeof getCurrentWindow> | null = null;
function appWindow(): ReturnType<typeof getCurrentWindow> {
  if (!_appWindow) _appWindow = getCurrentWindow();
  return _appWindow;
}

// ---------------------------------------------------------------------------
// Tiny local event bus used for menu-triggered actions (Save, Open Workspace,
// Find in Files, ...). In Electron these round-tripped through the main
// process; here the app menu is built and popped entirely in the webview, so
// item clicks can dispatch directly to local listeners.
// ---------------------------------------------------------------------------
type BusEvents = {
  "menu-open-workspace": [];
  "menu-close-workspace": [];
  "menu-save-current": [];
  "menu-save-all": [];
  "menu-open-search": [replaceMode: boolean];
};
type BusListener<K extends keyof BusEvents> = (...args: BusEvents[K]) => void;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const busListeners: Partial<Record<keyof BusEvents, BusListener<any>[]>> = {};
function busReplace<K extends keyof BusEvents>(
  event: K,
  cb: BusListener<K>,
): void {
  busListeners[event] = [cb];
}
function busEmit<K extends keyof BusEvents>(
  event: K,
  ...args: BusEvents[K]
): void {
  const list = busListeners[event];
  if (!list) return;
  for (const cb of list) cb(...args);
}

// ---------------------------------------------------------------------------
// Per-channel listener tracking so repeated calls behave like
// ipcRenderer.removeAllListeners(channel) followed by ipcRenderer.on(...).
// ---------------------------------------------------------------------------
const activeUnlisten = new Map<string, UnlistenFn>();

function replaceListener(channel: string, unlisten: UnlistenFn): void {
  const previous = activeUnlisten.get(channel);
  if (previous) previous();
  activeUnlisten.set(channel, unlisten);
}

async function buildAppMenu(menuId: AppMenuId): Promise<Menu> {
  const app = await Menu.new({ items: [] });

  const item = async (
    text: string,
    accelerator: string | undefined,
    action: () => void,
  ) => {
    const menuItem = await MenuItem.new({ text, accelerator, action });
    return menuItem;
  };
  const sep = () => PredefinedMenuItem.new({ item: "Separator" });

  if (menuId === "file") {
    const sub = await Submenu.new({
      text: "File",
      items: [
        await item("Open Workspace", undefined, () =>
          busEmit("menu-open-workspace"),
        ),
        await item("Close Workspace", undefined, () =>
          busEmit("menu-close-workspace"),
        ),
        await sep(),
        await item("Save", "CmdOrCtrl+S", () => busEmit("menu-save-current")),
        await item("Save All", "CmdOrCtrl+Shift+S", () =>
          busEmit("menu-save-all"),
        ),
        await sep(),
        await item("Close", undefined, () => void appWindow().close()),
        await item("Quit", undefined, () => void invoke("quit_app")),
      ],
    });
    await app.append(sub);
  } else if (menuId === "edit") {
    const sub = await Submenu.new({
      text: "Edit",
      items: [
        await PredefinedMenuItem.new({ item: "Undo" }),
        await PredefinedMenuItem.new({ item: "Redo" }),
        await sep(),
        await PredefinedMenuItem.new({ item: "Cut" }),
        await PredefinedMenuItem.new({ item: "Copy" }),
        await PredefinedMenuItem.new({ item: "Paste" }),
        await PredefinedMenuItem.new({ item: "SelectAll" }),
        await sep(),
        await item("Find in Files", "CmdOrCtrl+Shift+F", () =>
          busEmit("menu-open-search", false),
        ),
        await item("Replace in Files", "CmdOrCtrl+Shift+H", () =>
          busEmit("menu-open-search", true),
        ),
      ],
    });
    await app.append(sub);
  } else if (menuId === "selection") {
    const sub = await Submenu.new({
      text: "Selection",
      items: [await PredefinedMenuItem.new({ item: "SelectAll" })],
    });
    await app.append(sub);
  } else if (menuId === "view") {
    const sub = await Submenu.new({
      text: "View",
      items: [
        await item("Reload", undefined, () => window.location.reload()),
        await item(
          "Toggle DevTools",
          undefined,
          () => void invoke("toggle_devtools"),
        ),
        await sep(),
        await item("Toggle Fullscreen", undefined, async () => {
          const isFullscreen = await appWindow().isFullscreen();
          await appWindow().setFullscreen(!isFullscreen);
        }),
      ],
    });
    await app.append(sub);
  } else if (menuId === "help") {
    const sub = await Submenu.new({
      text: "Help",
      items: [
        await item("About", undefined, () => void invoke("show_about_dialog")),
      ],
    });
    await app.append(sub);
  }

  return app;
}

const api = {
  triggerBuild: (): void => {
    void invoke("trigger_build");
  },
  onTerminalOutput: (callback: (data: string) => void): void => {
    void listen<string>("terminal-output", (event) =>
      callback(event.payload),
    ).then((unlisten) => replaceListener("terminal-output", unlisten));
  },
  openFolder: (): Promise<DirTreeNode | null> => invoke("open_folder"),
  getLastWorkspace: (): Promise<string | null> => invoke("get_last_workspace"),
  setLastWorkspace: (workspacePath: string | null): Promise<boolean> =>
    invoke("set_last_workspace", { workspacePath }),
  readDirTree: (dirPath: string): Promise<DirTreeNode> =>
    invoke("read_dir_tree", { dirPath }),
  readFile: (filePath: string): Promise<string> =>
    invoke("read_file", { filePath }),
  writeFile: (filePath: string, content: string): Promise<boolean> =>
    invoke("write_file", { filePath, content }),
  createFile: (dirPath: string, name: string): Promise<boolean> =>
    invoke("create_file", { dirPath, name }),
  createFolder: (dirPath: string, name: string): Promise<boolean> =>
    invoke("create_folder", { dirPath, name }),
  renamePath: (targetPath: string, newName: string): Promise<boolean> =>
    invoke("rename_path", { targetPath, newName }),
  deletePath: (targetPath: string): Promise<boolean> =>
    invoke("delete_path", { targetPath }),
  pastePath: (
    sourcePath: string,
    destinationDir: string,
    cut: boolean,
  ): Promise<boolean> =>
    invoke("paste_path", { sourcePath, destinationDir, cut }),
  findInFiles: (rootDir: string, query: string): Promise<FindInFilesResult[]> =>
    invoke("find_in_files", { rootDir, query }),
  replaceInFiles: (
    rootDir: string,
    query: string,
    replacement: string,
  ): Promise<number> =>
    invoke("replace_in_files", { rootDir, query, replacement }),

  spawnTerminal: (id: string, cwd?: string): Promise<string> =>
    invoke("spawn_terminal", { id, cwd }),
  writeTerminal: (id: string, data: string): void => {
    void invoke("write_terminal", { id, data });
  },
  resizeTerminal: (id: string, cols: number, rows: number): void => {
    void invoke("resize_terminal", { id, cols, rows });
  },
  killTerminal: (id: string): void => {
    void invoke("kill_terminal", { id });
  },
  onTerminalData: (id: string, callback: (data: string) => void): void => {
    const channel = `terminal-data-${id}`;
    void listen<string>(channel, (event) => callback(event.payload)).then(
      (unlisten) => replaceListener(channel, unlisten),
    );
  },
  runRtl: (filePath: string, source: string): Promise<RunRtlResult> =>
    invoke("run_rtl", { filePath, source }),
  minimizeWindow: (): void => {
    void appWindow().minimize();
  },
  toggleMaximizeWindow: (): void => {
    void appWindow().toggleMaximize();
  },
  closeWindow: (): void => {
    void appWindow().close();
  },
  isWindowMaximized: (): Promise<boolean> => appWindow().isMaximized(),
  showAppMenu: async (
    menuId: AppMenuId,
    x?: number,
    y?: number,
  ): Promise<void> => {
    const menu = await buildAppMenu(menuId);
    if (typeof x === "number" && typeof y === "number") {
      await menu.popup(new LogicalPosition(x, y));
    } else {
      await menu.popup();
    }
  },
  onMenuOpenWorkspace: (callback: () => void): void =>
    busReplace("menu-open-workspace", callback),
  onMenuCloseWorkspace: (callback: () => void): void =>
    busReplace("menu-close-workspace", callback),
  onMenuSaveCurrent: (callback: () => void): void =>
    busReplace("menu-save-current", callback),
  onMenuSaveAll: (callback: () => void): void =>
    busReplace("menu-save-all", callback),
  onMenuOpenSearch: (callback: (replaceMode: boolean) => void): void =>
    busReplace("menu-open-search", callback),
};

const lsp = {
  spawn: (options: LspSpawnOptions): Promise<LspSpawnResult> =>
    invoke("lsp_spawn", { options }),
  write: (id: string, payloadBase64: string): void => {
    void invoke("lsp_write", { id, payloadBase64 });
  },
  stop: (id: string): void => {
    void invoke("lsp_stop", { id });
  },
  onData: (
    id: string,
    callback: (payloadBase64: string) => void,
  ): (() => void) => {
    let cancelled = false;
    let unlisten: UnlistenFn | null = null;
    void listen<string>(`lsp-data-${id}`, (event) =>
      callback(event.payload),
    ).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      unlisten = fn;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  },
  onStderr: (id: string, callback: (text: string) => void): (() => void) => {
    let cancelled = false;
    let unlisten: UnlistenFn | null = null;
    void listen<string>(`lsp-stderr-${id}`, (event) =>
      callback(event.payload),
    ).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      unlisten = fn;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  },
  onExit: (id: string, callback: (info: LspExitInfo) => void): (() => void) => {
    let cancelled = false;
    let unlisten: UnlistenFn | null = null;
    void listen<LspExitInfo>(`lsp-exit-${id}`, (event) =>
      callback(event.payload),
    ).then((fn) => {
      if (cancelled) {
        fn();
        return;
      }
      unlisten = fn;
    });
    return () => {
      cancelled = true;
      unlisten?.();
    };
  },
};

export function installTauriBridge(): void {
  window.api = api;
  window.lsp = lsp;

  // Electron's setWindowOpenHandler denied in-app popups and forwarded them
  // to the OS browser. Mirror that for any window.open() call (e.g. target
  //="_blank" links) inside the webview.
  const originalOpen = window.open.bind(window);
  window.open = (...args: Parameters<typeof window.open>) => {
    const url = args[0];
    if (typeof url === "string" && /^https?:\/\//.test(url)) {
      void openUrl(url);
      return null;
    }
    return originalOpen(...args);
  };

  // Reveal the window once the first paint has happened, mirroring the old
  // Electron `ready-to-show` -> `show()` flow so there's no flash of an
  // unstyled/blank frame.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      void invoke("notify_ready");
    });
  });
}

import { useEffect } from "react";

export function useDisableBrowserBehaviors(): void {
  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const blocked =
        key === "f5" ||
        (e.ctrlKey && key === "r") ||
        (e.ctrlKey && e.shiftKey && key === "r") ||
        (e.ctrlKey && key === "p") ||
        (e.ctrlKey && (key === "=" || key === "-" || key === "0")) ||
        (e.altKey && (key === "arrowleft" || key === "arrowright"));
      if (blocked) e.preventDefault();
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault(); // stop browser pinch/ctrl+scroll zoom
    };

    // Only attach the non-passive (sync-dispatch) wheel listener while
    // Ctrl is actually held down, instead of on every scroll wheel
    // event for the lifetime of the app. Ordinary scrolling (the
    // overwhelming majority of wheel events) is completely unaffected
    // by this listener once Ctrl isn't held.
    const onKeyDownForWheelScope = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        document.addEventListener("wheel", onWheel, { passive: false });
      }
    };
    const onKeyUpForWheelScope = (e: KeyboardEvent) => {
      if (e.key === "Control") {
        document.removeEventListener("wheel", onWheel);
      }
    };

    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => e.preventDefault();

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keydown", onKeyDownForWheelScope);
    document.addEventListener("keyup", onKeyUpForWheelScope);
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keydown", onKeyDownForWheelScope);
      document.removeEventListener("keyup", onKeyUpForWheelScope);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, []);
}

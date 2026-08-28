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

    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => e.preventDefault();

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("dragover", onDragOver);
    document.addEventListener("drop", onDrop);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("drop", onDrop);
    };
  }, []);
}

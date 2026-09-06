import { useCallback, useEffect, useRef, useState } from "react";

const PET_SIZE = 48; // sprite box, px — keep in sync with pet.css's --pet-size
const EDGE_MARGIN = 8;

type Bounds = { width: number; height: number };

function clamp(position: { x: number; y: number }, bounds: Bounds) {
  return {
    x: Math.min(
      Math.max(position.x, EDGE_MARGIN),
      bounds.width - PET_SIZE - EDGE_MARGIN,
    ),
    y: Math.min(
      Math.max(position.y, EDGE_MARGIN),
      bounds.height - PET_SIZE - EDGE_MARGIN,
    ),
  };
}

type UsePetPositionParams = {
  containerRef: React.RefObject<HTMLElement>;
};

type UsePetPositionResult = {
  position: { x: number; y: number };
  isDragging: boolean;
  startDrag: (event: React.PointerEvent) => void;
};

/**
 * Position is relative to `containerRef` (Stivium's `centerPaneRef`), so
 * the pet stays anchored over the editor pane specifically, not the whole
 * window — matching the report's "central editor pane" placement
 * requirement without the pet drifting when the side panel is resized.
 */
export function usePetPosition({
  containerRef,
}: UsePetPositionParams): UsePetPositionResult {
  const [position, setPosition] = useState({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const loadedOnce = useRef(false);

  // Load persisted position once on mount, then clamp it against the
  // container's *current* size (it may have been saved from a different
  // window size last session).
  useEffect(() => {
    void window.api.getPetPosition().then((saved) => {
      loadedOnce.current = true;
      if (!saved) return;
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) {
        setPosition(saved);
        return;
      }
      setPosition(clamp(saved, { width: bounds.width, height: bounds.height }));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-clamp whenever the window (and therefore the editor pane) resizes,
  // covering maximize/restore and multi-monitor moves — mirroring how
  // useWindowChrome already listens on `window`'s native "resize" event
  // for isWindowMaximized.
  useEffect(() => {
    const onResize = () => {
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;
      setPosition((prev) =>
        clamp(prev, { width: bounds.width, height: bounds.height }),
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [containerRef]);

  // Persist on every change, but only after the initial load has resolved
  // — otherwise the very first render's default position would overwrite
  // a real saved position in a race.
  useEffect(() => {
    if (!loadedOnce.current) return;
    void window.api.setPetPosition(position);
  }, [position]);

  const startDrag = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!bounds) return;

      dragOffset.current = {
        x: event.clientX - bounds.left - position.x,
        y: event.clientY - bounds.top - position.y,
      };
      setIsDragging(true);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const innerBounds = containerRef.current?.getBoundingClientRect();
        if (!innerBounds) return;
        const next = {
          x: moveEvent.clientX - innerBounds.left - dragOffset.current.x,
          y: moveEvent.clientY - innerBounds.top - dragOffset.current.y,
        };
        setPosition(
          clamp(next, { width: innerBounds.width, height: innerBounds.height }),
        );
      };
      const onPointerUp = () => {
        setIsDragging(false);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [containerRef, position],
  );

  return { position, isDragging, startDrag };
}

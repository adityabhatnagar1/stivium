import { memo, useEffect, useRef, useState } from "react";
import type { PetState } from "./types";
import { usePetPosition } from "./usePetPosition";

// The pet's art is the supplied Atiyah Codex Pet spritesheet
// (`src/assets/pet-atiyah-spritesheet.webp`). It's rendered as a plain CSS
// background-position sprite (see `.stv-pet-sprite--<state>` in
// `pet.css`), not an <img src>, since a single element needs to step
// through different frames per `petState` — the state-to-row/frame mapping
// lives in `petAnimations.ts`. This div only ever needs its class name to
// change; it never touches raw frame numbers.

type StiviumPetProps = {
  containerRef: React.RefObject<HTMLElement | null>;
  petState: PetState;
  visible: boolean;
  onHoverChange: (hovering: boolean) => void;
  onClick: () => void;
  onDragStateChange: (dragging: boolean) => void;
};

function StiviumPetImpl({
  containerRef,
  petState,
  visible,
  onHoverChange,
  onClick,
  onDragStateChange,
}: StiviumPetProps): JSX.Element | null {
  const { position, isDragging, startDrag } = usePetPosition({ containerRef });
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  const [suppressNextClick, setSuppressNextClick] = useState(false);

  useEffect(() => {
    onDragStateChange(isDragging);
  }, [isDragging, onDragStateChange]);

  if (!visible) return null;

  const handlePointerDown = (event: React.PointerEvent) => {
    pointerDownAt.current = { x: event.clientX, y: event.clientY };
    setSuppressNextClick(false);
    startDrag(event);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!pointerDownAt.current) return;
    const dx = event.clientX - pointerDownAt.current.x;
    const dy = event.clientY - pointerDownAt.current.y;
    // A real drag (beyond a small jitter threshold) should not also fire
    // the click handler on release.
    if (Math.hypot(dx, dy) > 4) setSuppressNextClick(true);
  };

  const handlePointerUp = () => {
    pointerDownAt.current = null;
  };

  return (
    <div
      className={`stv-pet-hitbox${isDragging ? " stv-pet-hitbox--dragging" : ""}`}
      style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onClick={() => {
        if (suppressNextClick) {
          setSuppressNextClick(false);
          return;
        }
        onClick();
      }}
      role="button"
      tabIndex={0}
      aria-label="Stivium AI assistant"
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div
        aria-hidden="true"
        className={`stv-pet-sprite stv-pet-sprite--${petState}`}
      />
      {(petState === "thinking" ||
        petState === "working" ||
        petState === "ready" ||
        petState === "error" ||
        petState === "needsInput" ||
        petState === "review") && (
        <span className={`stv-pet-badge stv-pet-badge--${petState}`} />
      )}
    </div>
  );
}

export const StiviumPet = memo(StiviumPetImpl);

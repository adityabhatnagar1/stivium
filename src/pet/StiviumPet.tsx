import { useEffect, useRef, useState } from "react";
import type { PetState } from "./types";
import { usePetPosition } from "./usePetPosition";

// Placeholder sprite: swap `src` for the real 32x32 Jungle-Babbler pixel-art
// asset from the Phase 1 art pass once it's exported. Referencing a single
// static image here (rather than a spritesheet-stepping <canvas>) keeps
// this component decoupled from however that asset ends up packaged; if
// the final art is a spritesheet, only this <img>/background-image needs
// to change, not the state machine or drag/clamp logic around it.
import petSprite from "../assets/pet-sprite.png";

type StiviumPetProps = {
  containerRef: React.RefObject<HTMLElement>;
  petState: PetState;
  visible: boolean;
  onHoverChange: (hovering: boolean) => void;
  onClick: () => void;
  onDragStateChange: (dragging: boolean) => void;
};

export function StiviumPet({
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
      style={{ left: position.x, top: position.y }}
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
      <img
        src={petSprite}
        alt=""
        draggable={false}
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

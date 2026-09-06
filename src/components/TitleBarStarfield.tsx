import { useMemo } from "react";
import type { CSSProperties } from "react";

const STAR_COUNT = 26;
const STAR_COLORS = ["#eafff5", "#9df5c8", "#35d68c", "#55e0c8", "#c8ffe6"];

type Star = {
  size: number;
  top: number;
  left: number;
  duration: number;
  delay: number;
  color: string;
};

function makeStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const r = Math.random();
    const size = r < 0.75 ? 1 : r < 0.94 ? 2 : 3;
    stars.push({
      size,
      top: Math.random() * 100,
      left: Math.random() * 100,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 4,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    });
  }
  return stars;
}

type TitleBarStarfieldProps = {
  /** True when the OS window has lost focus — freezes the decorative
   * animation instead of burning compositor cycles on a strip nobody
   * is looking at. */
  isPaused?: boolean;
};

export function TitleBarStarfield({
  isPaused = false,
}: TitleBarStarfieldProps): JSX.Element {
  const stars = useMemo(makeStars, []);

  return (
    <div
      className={`stv-titlebar-fx${isPaused ? " stv-titlebar-fx--paused" : ""}`}
      aria-hidden="true"
    >
      <div className="stv-titlebar-stars">
        {stars.map((star, i) => (
          <span
            key={i}
            style={
              {
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: `${star.top}%`,
                left: `${star.left}%`,
                color: star.color,
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="stv-titlebar-shooting-star" />
      <div className="stv-titlebar-vignette" />
    </div>
  );
}

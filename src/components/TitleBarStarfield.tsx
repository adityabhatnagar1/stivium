import { useMemo } from "react";
import type { CSSProperties } from "react";

const STAR_COUNT = 26; // thin 36px strip — fewer stars than a full topbar needs
const STAR_COLORS = ["#ffffff", "#dbeafe", "#c4b5fd", "#fde68a", "#93c5fd"];

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
      duration: Math.random() * 3 + 2, // 2s-5s per star, deliberately slow
      delay: Math.random() * 4,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    });
  }
  return stars;
}

/**
 * Decorative, always-on background for the titlebar: a faint nebula
 * gradient, a handful of twinkling stars (low-fps via steps() easing
 * in interactions.css), a shooting star every ~10s, and a vignette
 * to keep titlebar text readable on top. Purely visual — sits behind
 * the real titlebar content via z-index, pointer-events: none.
 *
 * Ported from the user's own "Notate" project background and rescaled
 * from a full-width topbar down to Stivium's 36px titlebar.
 */
export function TitleBarStarfield(): JSX.Element {
  const stars = useMemo(makeStars, []);

  return (
    <div className="stv-titlebar-fx" aria-hidden="true">
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

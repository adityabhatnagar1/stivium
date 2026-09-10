/**
 * spaceRenderer.ts
 *
 * Self-contained Canvas 2D renderer for the Stivium boot screen background.
 *
 * Star depth/fly-through motion is adapted from the approach used in
 * tdous/star-field-canvas (MIT) — stars carry a z-depth that decreases each
 * frame, are reprojected from (x, y, z) onto the 2D canvas around a center
 * origin, and are recycled to the far plane when they pass the camera.
 * Reference: https://github.com/tdous/star-field-canvas (MIT License)
 *
 * Comet spawning/trail-fade timing is adapted from the minimal approach in
 * grok-shooting-stars (MIT) — a rare random spawn check per frame, a
 * fixed-lifetime particle with a linear-gradient trail that fades to zero.
 * The glow treatment on the comet head/trail is a from-scratch canvas
 * reinterpretation of the layered-blur look used by community "comet" CSS/SVG
 * loaders (e.g. Uiverse's chase2k25 orbiting-comet snippet) — same idea of a
 * soft additive glow trailing a bright point, redone here with shadowBlur
 * instead of SVG filters, plus a slight gravity term so the path arcs instead
 * of running dead straight.
 * Both ideas are reimplemented with rarer spawn rates, varied angles, varied
 * trail lengths, and a distinct render pipeline suited to a calm, restrained
 * boot atmosphere rather than a busy demo background.
 *
 * No React state lives in this module — it is a plain imperative renderer.
 */

import type { SpaceRendererOptions, SpaceRenderer } from "./bootTypes";

interface BgStar {
  x: number; // centered coordinate space, -halfW..halfW
  y: number;
  z: number;
  vz: number;
  radius: number;
  twinklePhase: number;
  twinkleSpeed: number;
  brightness: number; // base opacity multiplier, most stars are subtle
}

interface Comet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
  width: number;
}

const TWO_PI = Math.PI * 2;
const DEFAULT_COMET_GLOW = "rgba(195, 214, 142, 0.9)";

export function createSpaceRenderer(
  canvas: HTMLCanvasElement,
  options: SpaceRendererOptions = {},
): SpaceRenderer {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    throw new Error("spaceRenderer: 2D context unavailable");
  }

  let reducedMotion = !!options.reducedMotion;
  const focalPoint = options.focalPoint ?? [0.5, 0.42];
  const onCometNearCenter = options.onCometNearCenter;
  const cometGlow = options.cometGlowColor ?? DEFAULT_COMET_GLOW;

  let dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
  let cssW = 0;
  let cssH = 0;
  let halfW = 0;
  let halfH = 0;

  let stars: BgStar[] = [];
  let comets: Comet[] = [];

  let rafId = 0;
  let running = false;
  let lastCometCheck = 0;
  let cometCooldownUntil = 0;

  function starDensityFor(w: number, h: number): number {
    const area = w * h;
    // Roughly one star per ~5500px² of CSS area, clamped to a sane range.
    const target = Math.round(area / 5500);
    return Math.max(90, Math.min(options.starCount ?? target, 420));
  }

  function farZ(): number {
    return (cssW > cssH ? cssH : cssW) * 1.6;
  }

  function makeStar(initial: boolean): BgStar {
    const z = initial ? Math.random() * farZ() + 1 : farZ();
    const speedTier = Math.random();
    // Most stars drift slowly; a small minority move noticeably faster,
    // giving the field a sense of varied depth rather than uniform speed.
    const vz =
      speedTier > 0.92
        ? 0.55 + Math.random() * 0.5
        : 0.12 + Math.random() * 0.28;
    const isBright = Math.random() > 0.93;
    return {
      x: (Math.random() * 2 - 1) * (cssW * 0.9),
      y: (Math.random() * 2 - 1) * (cssH * 0.9),
      z,
      vz,
      radius: isBright ? 1.4 + Math.random() * 0.9 : 0.5 + Math.random() * 0.8,
      twinklePhase: Math.random() * TWO_PI,
      twinkleSpeed: 0.4 + Math.random() * 0.8,
      brightness: isBright
        ? 0.85 + Math.random() * 0.15
        : 0.25 + Math.random() * 0.4,
    };
  }

  function buildStars() {
    const count = reducedMotion
      ? Math.round(starDensityFor(cssW, cssH) * 0.6)
      : starDensityFor(cssW, cssH);
    stars = Array.from({ length: count }, () => makeStar(true));
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    cssW = Math.max(1, rect.width);
    cssH = Math.max(1, rect.height);
    halfW = cssW / 2;
    halfH = cssH / 2;
    dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));

    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildStars();
    comets = [];
  }

  function spawnComet(now: number) {
    if (reducedMotion) return;
    if (comets.length > 0) return;
    if (now < cometCooldownUntil) return;
    if (now - lastCometCheck < 220) return;
    lastCometCheck = now;

    // Rare: roughly one attempt succeeds every several seconds on average.
    if (Math.random() > 0.06) return;

    const fromLeft = Math.random() > 0.5;
    const angle = (Math.random() * 28 + 18) * (Math.PI / 180); // 18–46deg downward
    const speed = cssW * (0.5 + Math.random() * 0.45); // px/sec, varies per comet
    const startX = fromLeft ? -cssW * 0.08 : cssW * 1.08;
    const startY = Math.random() * cssH * 0.5 - cssH * 0.1;
    const dir = fromLeft ? 1 : -1;

    comets.push({
      x: startX,
      y: startY,
      vx: dir * Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.6 + Math.random() * 0.4, // seconds
      length: cssW * (0.09 + Math.random() * 0.09),
      width: 1.1 + Math.random() * 1.1,
    });

    // Keep comets rare — enforce a quiet gap before the next one may spawn.
    cometCooldownUntil = now + 2600 + Math.random() * 3200;
  }

  function updateAndDrawComets(dt: number, now: number) {
    spawnComet(now);
    if (comets.length === 0) return;

    // Gentle downward pull so the trail arcs rather than running dead
    // straight — a restrained nod to the curved orbit path in the
    // Uiverse comet reference, without literally reusing its geometry.
    const gravity = cssH * 0.12;

    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i];
      c.vy += gravity * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt / c.maxLife;

      if (
        c.life <= 0 ||
        c.x < -cssW * 0.2 ||
        c.x > cssW * 1.2 ||
        c.y > cssH * 1.2
      ) {
        comets.splice(i, 1);
        continue;
      }

      const dirLen = Math.hypot(c.vx, c.vy) || 1;
      const ux = c.vx / dirLen;
      const uy = c.vy / dirLen;
      const tailX = c.x - ux * c.length;
      const tailY = c.y - uy * c.length;

      const opacity = Math.max(0, Math.min(1, c.life));
      const grad = ctx.createLinearGradient(c.x, c.y, tailX, tailY);
      grad.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      grad.addColorStop(0.4, `rgba(220, 232, 210, ${opacity * 0.35})`);
      grad.addColorStop(1, "rgba(220, 232, 210, 0)");

      ctx.save();
      ctx.shadowColor = cometGlow;
      ctx.shadowBlur = 10 + c.width * 4;

      ctx.strokeStyle = grad;
      ctx.lineWidth = c.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // Bright head — a slightly stronger glow than the trail so the
      // point of light reads clearly against the star field.
      ctx.shadowBlur = 14 + c.width * 5;
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.arc(c.x, c.y, c.width * 0.8, 0, TWO_PI);
      ctx.fill();
      ctx.restore();

      // Notify the logo layer if the comet passes near the focal point,
      // so it can receive a brief, restrained highlight. This is
      // deliberately rare and atmospheric, not a "collision" effect.
      if (onCometNearCenter) {
        const fx = focalPoint[0] * cssW;
        const fy = focalPoint[1] * cssH;
        const dist = Math.hypot(c.x - fx, c.y - fy);
        const threshold = Math.min(cssW, cssH) * 0.22;
        if (dist < threshold) {
          onCometNearCenter(1 - dist / threshold);
        }
      }
    }
  }

  function drawStars(dt: number, now: number) {
    const zSpan = farZ();

    for (const s of stars) {
      s.z -= s.vz * dt * 60;
      if (s.z <= 1) {
        Object.assign(s, makeStar(false));
        continue;
      }

      const px = (s.x / s.z) * (zSpan * 0.5) + halfW;
      const py = (s.y / s.z) * (zSpan * 0.5) + halfH;

      if (px < -20 || px > cssW + 20 || py < -20 || py > cssH + 20) {
        continue;
      }

      const depthFactor = 1 - s.z / zSpan; // 0 far -> 1 near
      const r = Math.max(0.3, s.radius * (0.35 + depthFactor * 1.1));

      let twinkle = 1;
      if (!reducedMotion) {
        twinkle =
          0.75 + 0.25 * Math.sin(now * 0.001 * s.twinkleSpeed + s.twinklePhase);
      }

      const alpha = Math.max(
        0,
        Math.min(1, s.brightness * (0.3 + depthFactor * 0.9) * twinkle),
      );

      ctx.beginPath();
      ctx.fillStyle = `rgba(180, 190, 170, ${alpha.toFixed(3)})`;
      ctx.arc(px, py, r, 0, TWO_PI);
      ctx.fill();
    }
  }

  let lastFrameTime = 0;

  function frame(now: number) {
    if (!running) return;
    const dt = lastFrameTime
      ? Math.min((now - lastFrameTime) / 1000, 0.05)
      : 0.016;
    lastFrameTime = now;

    ctx.clearRect(0, 0, cssW, cssH);
    drawStars(dt, now);
    updateAndDrawComets(dt, now);

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastFrameTime = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  function destroy() {
    stop();
    stars = [];
    comets = [];
  }

  resize();

  return { start, stop, resize, destroy };
}

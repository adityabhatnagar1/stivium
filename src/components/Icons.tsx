import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number | undefined): SVGProps<SVGSVGElement> {
  return {
    width: size ?? 16,
    height: size ?? 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
}

export function IconMenu({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconMinimize({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} viewBox="0 0 512 512" fill="currentColor" stroke="none" {...rest}>
      {/* Replaced embedded PNG with a clean vector rectangle that scales perfectly */}
      <rect x="100" y="236" width="312" height="40" rx="10" />
    </svg>
  );
}

export function IconMaximize({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} viewBox="0 0 512 512" fill="currentColor" stroke="none" {...rest}>
      <path fillRule="evenodd" d="M 105,195 L 102,199 L 99,206 L 99,395 L 100,396 L 100,399 L 103,404 L 110,410 L 115,411 L 116,412 L 305,412 L 315,407 L 319,402 L 321,397 L 321,393 L 322,392 L 321,390 L 321,385 L 318,379 L 313,374 L 310,372 L 304,371 L 303,370 L 142,370 L 141,369 L 141,208 L 140,207 L 139,201 L 137,198 L 132,193 L 126,190 L 122,190 L 121,189 L 114,190 L 109,192 Z M 195,105 L 192,109 L 190,114 L 190,118 L 189,119 L 190,126 L 193,132 L 198,137 L 201,139 L 207,140 L 208,141 L 369,141 L 370,142 L 370,303 L 371,304 L 372,310 L 374,313 L 379,318 L 385,321 L 390,321 L 391,322 L 393,321 L 397,321 L 402,319 L 406,316 L 409,312 L 412,305 L 412,116 L 411,115 L 411,112 L 408,107 L 401,101 L 396,100 L 395,99 L 206,99 L 199,102 Z" />
    </svg>
  );
}

export function IconClose({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} viewBox="0 0 512 512" fill="currentColor" stroke="none" {...rest}>
      <path fillRule="evenodd" d="M 109,104 L 104,109 L 101,115 L 101,119 L 100,120 L 101,127 L 105,135 L 225,255 L 225,256 L 105,376 L 102,381 L 101,388 L 100,389 L 101,396 L 104,402 L 109,407 L 115,410 L 119,410 L 120,411 L 127,410 L 135,406 L 255,286 L 256,286 L 376,406 L 381,409 L 388,410 L 389,411 L 396,410 L 402,407 L 407,402 L 410,396 L 410,392 L 411,391 L 410,384 L 406,376 L 286,256 L 286,255 L 406,135 L 409,130 L 410,123 L 411,122 L 410,115 L 407,109 L 402,104 L 396,101 L 392,101 L 391,100 L 384,101 L 376,105 L 256,225 L 255,225 L 135,105 L 130,102 L 123,100 L 115,101 Z" />
    </svg>
  );
}

export function IconRestore({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} viewBox="0 0 512 512" fill="currentColor" stroke="none" {...rest}>
      <path fillRule="evenodd" d="M 93,281 L 87,288 L 85,301 L 88,310 L 94,316 L 102,319 L 191,319 L 192,320 L 192,409 L 195,417 L 201,423 L 206,425 L 215,426 L 226,422 L 230,418 L 234,407 L 234,296 L 230,285 L 226,281 L 215,277 L 104,277 L 96,279 Z M 285,89 L 279,96 L 277,104 L 277,215 L 281,226 L 285,230 L 296,234 L 407,234 L 418,230 L 422,226 L 425,220 L 426,211 L 423,201 L 417,195 L 409,192 L 320,192 L 319,191 L 319,102 L 316,94 L 310,88 L 305,86 L 296,85 L 288,87 Z" />
    </svg>
  );
}

export function IconPlay({ size, ...rest }: IconProps): JSX.Element {
  return (
    // Solid fill with a highly subtle 1px corner radius for optical softness
    <svg {...base(size)} fill="currentColor" stroke="none" {...rest}>
      <path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5Z" />
    </svg>
  );
}

export function IconFolder({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 8.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

export function IconFolderOpen({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v4" />
      <path d="M3 10h19l-2.5 9H4.5L3 10Z" />
    </svg>
  );
}

export function IconFile({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function IconSearch({ size, ...rest }: IconProps): JSX.Element {
  return (
    // Slightly offset search tail for better visual balance
    <svg {...base(size)} {...rest}>
      <circle cx="10.5" cy="10.5" r="7.5" />
      <path d="m21 21-5.2-5.2" />
    </svg>
  );
}

export function IconReplace({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M17 3v4a1 1 0 0 1-1 1H4" />
      <path d="M7 21v-4a1 1 0 0 1 1-1h12" />
      <path d="M7 4 4 7l3 3" />
      <path d="M17 20l3-3-3-3" />
    </svg>
  );
}

export function IconTerminal({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <path d="M7 9.5 10.5 12 7 14.5M12.5 14.5H17" />
    </svg>
  );
}

export function IconCaretRight({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function IconCaretDown({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconPlus({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconSettings({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5c.04-.5.04-1 0-1.5l1.9-1.5-2-3.4-2.2.9a7.6 7.6 0 0 0-1.3-.75L15.5 5h-4l-.3 2.25c-.47.2-.9.45-1.3.75l-2.2-.9-2 3.4L7.6 12c-.04.5-.04 1 0 1.5l-1.9 1.5 2 3.4 2.2-.9c.4.3.83.55 1.3.75L11.5 21h4l.3-2.25c.47-.2.9-.45 1.3-.75l2.2.9 2-3.4-1.9-1.5Z" />
    </svg>
  );
}

export function IconSparkle({ size, ...rest }: IconProps): JSX.Element {
  return (
    // Uses bezier curves (c) for a smooth, premium fluid star shape
    <svg {...base(size)} fill="currentColor" stroke="none" {...rest}>
      <path d="M12 2c.2 4.8 3.8 8.4 8.6 8.6-4.8.2-8.4 3.8-8.6 8.6-.2-4.8-3.8-8.4-8.6-8.6C8.2 10.4 11.8 6.8 12 2Z" />
    </svg>
  );
}

/* ---- AI workspace icon set ----
 * Sourced from Lucide (ISC license, lucide.dev/icons) and redrawn as
 * inline components so they inherit the same `base()` stroke/viewBox
 * contract as the rest of this file — no separate icon runtime, no new
 * dependency, just paths that match Lucide's actual geometry. Scoped to
 * the AI chat panel redesign; the older hand-drawn icons above are left
 * untouched since TitleBar / EditorTabs / TerminalPanel still use them. */

export function IconPanelLeft({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M9 3v18" />
    </svg>
  );
}

export function IconMinimize2({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m14 10 7-7" />
      <path d="M20 10h-6V4" />
      <path d="m3 21 7-7" />
      <path d="M4 14h6v6" />
    </svg>
  );
}

export function IconMaximize2({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M15 3h6v6" />
      <path d="m21 3-7 7" />
      <path d="m3 21 7-7" />
      <path d="M9 21H3v-6" />
    </svg>
  );
}

export function IconPaperclip({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" />
    </svg>
  );
}

export function IconArrowUp({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m5 12 7-7 7 7" />
      <path d="M12 19V5" />
    </svg>
  );
}

export function IconStop({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} fill="currentColor" stroke="none" {...rest}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function IconChevronDown({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconGitBranch({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M15 6a9 9 0 0 0-9 9V3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
    </svg>
  );
}

export function IconLayers({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
      <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
      <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
    </svg>
  );
}

export function IconFileDiff({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M9 10h6" />
      <path d="M12 13V7" />
      <path d="M9 17h6" />
    </svg>
  );
}

export function IconExternalLink({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
      <path d="m21 3-9 9" />
      <path d="M15 3h6v6" />
    </svg>
  );
}

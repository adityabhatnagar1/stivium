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
    <svg {...base(size)} {...rest}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function IconMaximize({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
    </svg>
  );
}

export function IconClose({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function IconRestore({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="7.5" y="4.5" width="11" height="11" rx="1.3" />
      <path d="M5.5 8.5v9a1.3 1.3 0 0 0 1.3 1.3h9" />
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

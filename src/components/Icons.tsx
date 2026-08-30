import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(size: number | undefined): SVGProps<SVGSVGElement> {
  return {
    width: size ?? 15,
    height: size ?? 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
}

export function IconMenu({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function IconMinimize({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconMaximize({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <rect x="5.5" y="5.5" width="13" height="13" rx="1.5" />
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

export function IconClose({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconFolder({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3.5 6.5a1 1 0 0 1 1-1H9l1.6 2H19a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1v-11Z" />
    </svg>
  );
}

export function IconFolderOpen({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M3.5 8V6.5a1 1 0 0 1 1-1H9l1.6 2H19a1 1 0 0 1 1 1v.5" />
      <path d="M3.5 8h16l-1.6 9.2a1 1 0 0 1-1 .8H6.1a1 1 0 0 1-1-.8L3.5 8Z" />
    </svg>
  );
}

export function IconFile({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <path d="M7 3.5h7l4 4V19a1.2 1.2 0 0 1-1.2 1.2H7A1.2 1.2 0 0 1 5.8 19V4.7A1.2 1.2 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4.5" />
    </svg>
  );
}

export function IconSearch({ size, ...rest }: IconProps): JSX.Element {
  return (
    <svg {...base(size)} {...rest}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15.2 15.2 20 20" />
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

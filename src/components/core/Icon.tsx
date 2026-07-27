import type { CSSProperties } from 'react';

/* Material Icons Outlined — the icon font used for every glyph in the UI
   (README §7). Ligature name in, glyph out. */

export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

export default function Icon({ name, size = 18, color, style, className }: IconProps) {
  return (
    <span
      className={`material-icons-outlined${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      style={{ fontSize: size, color, lineHeight: 1, flexShrink: 0, ...style }}
    >
      {name}
    </span>
  );
}

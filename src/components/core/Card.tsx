import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

/* Card (README §2.4) — surface, 18px radius, --shadow-card, no border. */

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Standard 20px, compact 16px, detail 20px 22px — or pass your own. */
  padding?: number | string;
  radius?: number | string;
  /** Lifts to --shadow-pop on hover (README §9 Q1, pre-resolved). */
  hoverable?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}

export default function Card({
  padding = 20,
  radius = 18,
  hoverable = false,
  children,
  style,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={`${hoverable ? 'aq-lift ' : ''}${className ?? ''}`.trim() || undefined}
      style={{
        background: 'var(--surface-card)',
        borderRadius: radius,
        boxShadow: 'var(--shadow-card)',
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** A recessed tile on the page ground — used for stat tiles and sunken rows. */
export function SunkenTile({
  padding = 14,
  radius = 14,
  children,
  style,
  ...rest
}: CardProps) {
  return (
    <div
      style={{
        background: 'var(--surface-page)',
        borderRadius: radius,
        padding,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

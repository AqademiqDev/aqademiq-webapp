import { useRef, type CSSProperties } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
   CodeInput — the boxed character run used by the OTP screen (00.4) and the
   referral step (01.1).

   The frames draw a partially-entered state: filled boxes take an accent
   border on the card ground, the *next* box shows a dim preview character on
   the page ground, and the rest sit empty. `ghost` reproduces that preview —
   it clears as soon as the user types into that box.
   ───────────────────────────────────────────────────────────────────────── */

export interface CodeInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Dim preview character shown in the first empty box. */
  ghost?: string;
  length?: number;
  boxWidth?: number;
  boxHeight?: number;
  radius?: number;
  fontSize?: number;
  mono?: boolean;
  numeric?: boolean;
  uppercase?: boolean;
  error?: boolean;
  gap?: number;
  label?: string;
  style?: CSSProperties;
}

export default function CodeInput({
  value,
  onChange,
  ghost,
  length = value.length,
  boxWidth = 56,
  boxHeight = 64,
  radius = 14,
  fontSize = 26,
  mono = false,
  numeric = false,
  uppercase = false,
  error = false,
  gap = 10,
  label = 'Character',
  style,
}: CodeInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const firstEmpty = value.findIndex((v) => !v);

  function setAt(i: number, raw: string) {
    let ch = raw.slice(-1);
    if (numeric) ch = ch.replace(/\D/g, '');
    if (uppercase) ch = ch.toUpperCase();
    const next = [...value];
    next[i] = ch;
    onChange(next);
    if (ch && i < length - 1) inputs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < length - 1) inputs.current[i + 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent) {
    let text = e.clipboardData.getData('text');
    if (numeric) text = text.replace(/\D/g, '');
    if (uppercase) text = text.toUpperCase();
    text = text.slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(Array.from({ length }, (_, i) => text[i] ?? ''));
    inputs.current[Math.min(text.length, length - 1)]?.focus();
  }

  return (
    <div style={{ display: 'flex', gap, justifyContent: 'center', ...style }}>
      {Array.from({ length }, (_, i) => {
        const ch = value[i] ?? '';
        const showGhost = !ch && ghost && i === firstEmpty;
        return (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={ch}
            maxLength={1}
            inputMode={numeric ? 'numeric' : 'text'}
            aria-label={`${label} ${i + 1}`}
            placeholder={showGhost ? ghost : undefined}
            onChange={(e) => setAt(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            onPaste={onPaste}
            className="focus-ring aq-code-box"
            style={{
              width: boxWidth,
              height: boxHeight,
              borderRadius: radius,
              border: `1.5px solid ${error ? 'var(--aq-danger)' : ch ? 'var(--accent)' : 'var(--border-hairline)'}`,
              background: ch ? 'var(--surface-card)' : 'var(--surface-page)',
              textAlign: 'center',
              fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
              fontWeight: 800,
              fontSize,
              color: 'var(--text-primary)',
              outline: 'none',
              padding: 0,
            }}
          />
        );
      })}
    </div>
  );
}

import Toggle from '../../../components/core/Toggle';
import Segmented from '../../../components/core/Segmented';
import { PanelHead, Row } from '../Settings';
import { useAppState, type Accent, type Warmth } from '../../../hooks/useAppState';

/* Frame 13.1 — Appearance. */

const ACCENTS: { id: Accent; hex: string }[] = [
  { id: 'periwinkle', hex: '#6b5cf0' },
  { id: 'rose', hex: '#e85476' },
  { id: 'green', hex: '#2a9d6b' },
];

export default function Appearance() {
  const { theme, accent, warmth, set, toggleTheme } = useAppState();

  return (
    <>
      <PanelHead title="Appearance" sub="Tune Aqademiq to your sanctuary." />

      <Row
        title="Dark mode"
        sub="Near-black paper, periwinkle leads"
        padding="14px 0"
        control={<Toggle checked={theme === 'dark'} onChange={toggleTheme} aria-label="Dark mode" />}
      />

      <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-hairline)' }}>
        <div style={{ font: '800 13px var(--font-sans)', marginBottom: 12 }}>Brand accent</div>
        <div role="radiogroup" aria-label="Brand accent" style={{ display: 'flex', gap: 14 }}>
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={accent === a.id}
              aria-label={a.id}
              onClick={() => set({ accent: a.id })}
              className="aq-press focus-ring"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: a.hex,
                border: accent === a.id ? '3px solid var(--text-primary)' : '3px solid transparent',
                boxShadow: '0 0 0 1px var(--border-hairline)',
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 0' }}>
        <div style={{ font: '800 13px var(--font-sans)', marginBottom: 12 }}>Background warmth</div>
        <Segmented
          variant="sunken"
          aria-label="Background warmth"
          value={warmth}
          onChange={(w: Warmth) => set({ warmth: w })}
          options={[
            { value: 'warm', label: 'Warm' },
            { value: 'neutral', label: 'Neutral' },
            { value: 'cool', label: 'Cool' },
          ]}
          style={{ maxWidth: 320, gap: 6, font: '800 12px var(--font-sans)' }}
        />
      </div>
    </>
  );
}

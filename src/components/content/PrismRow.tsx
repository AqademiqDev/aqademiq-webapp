import PrismGlyph, { type PrismMode } from '../brand/PrismGlyph';
import Icon from '../core/Icon';

/* Prism mode row (README §2.13) — frames 01.10, 04.2, 13.5. */

export default function PrismRow({
  mode,
  selected,
  onSelect,
}: {
  mode: PrismMode;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className="aq-press focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 15px',
        borderRadius: 14,
        width: '100%',
        textAlign: 'left',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-hairline)'}`,
        background: selected ? 'var(--accent-soft)' : 'transparent',
        transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      }}
    >
      <PrismGlyph size={20} color={mode.color} muted={mode.id === 'none'} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '800 13px var(--font-sans)' }}>{mode.name}</div>
        <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-secondary)' }}>{mode.desc}</div>
      </div>
      {selected && <Icon name="check_circle" size={18} color="var(--accent)" />}
    </button>
  );
}

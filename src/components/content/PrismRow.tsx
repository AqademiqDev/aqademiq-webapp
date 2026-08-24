import PrismGlyph, { type PrismMode } from '../brand/PrismGlyph';
import Icon from '../core/Icon';

/* Prism mode row (README §2.13) — frames 01.10, 04.2, 13.5. */

export default function PrismRow({
  mode,
  selected,
  onSelect,
  onPreview,
  previewing = false,
}: {
  mode: PrismMode;
  selected: boolean;
  onSelect: () => void;
  /** Omitted for silence, which has nothing to audition. */
  onPreview?: () => void;
  previewing?: boolean;
}) {
  /* The row used to be one big <button>. A preview control has to live inside
     it, and a button cannot contain a button, so the radio and the preview are
     now siblings inside a wrapper that carries the selected styling. */
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 14,
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-hairline)'}`,
        background: selected ? 'var(--accent-soft)' : 'transparent',
        paddingRight: onPreview ? 8 : 0,
        transition:
          'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      }}
    >
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
          borderRadius: 13,
          flex: 1,
          minWidth: 0,
          textAlign: 'left',
          background: 'transparent',
        }}
      >
        <PrismGlyph size={20} color={mode.color} muted={mode.id === 'none'} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '800 13px var(--font-sans)' }}>{mode.name}</div>
          <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-secondary)' }}>
            {mode.desc}
          </div>
        </div>
        {selected && <Icon name="check_circle" size={18} color="var(--accent)" />}
      </button>

      {onPreview && (
        <button
          type="button"
          onClick={onPreview}
          aria-label={previewing ? `Stop previewing ${mode.name}` : `Preview ${mode.name}`}
          title={previewing ? 'Stop' : 'Preview'}
          className="aq-press focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            flexShrink: 0,
            borderRadius: '50%',
            background: previewing ? 'var(--accent)' : 'var(--surface-page)',
          }}
        >
          <Icon
            name={previewing ? 'stop_circle' : 'play_arrow'}
            size={16}
            color={previewing ? '#fff' : 'var(--text-secondary)'}
          />
        </button>
      )}
    </div>
  );
}

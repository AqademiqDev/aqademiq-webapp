import { useState } from 'react';
import Icon from '../../../components/core/Icon';
import Toggle from '../../../components/core/Toggle';
import PrismRow from '../../../components/content/PrismRow';
import { PRISM_MODES, type PrismModeId } from '../../../components/brand/PrismGlyph';
import { EyebrowLabel, Slider } from '../../../components/core/Misc';
import { PanelHead, Row } from '../Settings';

/* Frame 13.5 — Prism. */

export default function Prism() {
  const [play, setPlay] = useState(true);
  const [mode, setMode] = useState<PrismModeId>('deep');
  const [volume, setVolume] = useState(64);

  return (
    <>
      <PanelHead title="Prism" sub="Focus soundscapes tuned to the kind of work you're doing." gap={20} />

      <Row
        title="Play Prism during focus"
        sub="Starts automatically when a session begins"
        padding="14px 0"
        control={<Toggle checked={play} onChange={setPlay} aria-label="Play Prism during focus" />}
      />

      <EyebrowLabel style={{ margin: '18px 0 10px' }}>DEFAULT MODE</EyebrowLabel>
      <div
        role="radiogroup"
        aria-label="Default Prism mode"
        style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22, maxWidth: 560 }}
      >
        {PRISM_MODES.map((m) => (
          <PrismRow key={m.id} mode={m} selected={mode === m.id} onSelect={() => setMode(m.id)} />
        ))}
      </div>

      <EyebrowLabel style={{ marginBottom: 10 }}>VOLUME</EyebrowLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: 560 }}>
        <Icon name="volume_down" size={18} color="var(--text-dim)" />
        <Slider
          value={volume}
          min={0}
          max={100}
          onChange={setVolume}
          aria-label="Prism volume"
          trackHeight={6}
        />
        <Icon name="volume_up" size={18} color="var(--text-dim)" />
      </div>
    </>
  );
}

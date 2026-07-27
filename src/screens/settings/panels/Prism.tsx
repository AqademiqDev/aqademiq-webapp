import { useState } from 'react';
import Icon from '../../../components/core/Icon';
import Toggle from '../../../components/core/Toggle';
import PrismRow from '../../../components/content/PrismRow';
import { PRISM_MODES, type PrismMode } from '../../../components/brand/PrismGlyph';
import { EmptyState, ErrorState, Loading } from '../../../components/core/Async';
import { EyebrowLabel, Slider } from '../../../components/core/Misc';
import { InlineError, PanelHead, Row } from '../Settings';
import { usePrismModes, usePrismPreferences, useUpdatePrismPreferences } from '../../../hooks/data';
import type { PrismModeDto } from '../../../lib/api';

/* Frame 13.5 — Prism.

   The catalogue is the server's (`/prism-modes`), so the labels are its own —
   the drawn PRISM_MODES table now only supplies the glyph skin: the silent mode
   keeps the muted slash, the rest cycle the drawn hues in catalogue order. */

const SILENT = PRISM_MODES[PRISM_MODES.length - 1];
const HUES = PRISM_MODES.filter((m) => m.id !== 'none');

function skin(mode: PrismModeDto, index: number): PrismMode {
  const drawn = mode.key === 'none' ? SILENT : HUES[index % HUES.length];
  return { id: drawn.id, name: mode.label, desc: mode.description, color: drawn.color };
}

export default function Prism() {
  const modes = usePrismModes();
  const prefs = usePrismPreferences();
  const update = useUpdatePrismPreferences();

  /* The slider has to track the thumb locally; the value is committed once the
     drag or key repeat ends rather than on every tick. */
  const [drag, setDrag] = useState<number | null>(null);
  const volume = drag ?? prefs.data?.volume_level ?? 50;

  const list = modes.data ?? [];
  let hue = -1;

  function commitVolume() {
    if (drag === null || drag === prefs.data?.volume_level) return;
    update.mutate({ volume_level: drag });
  }

  return (
    <>
      <PanelHead title="Prism" sub="Focus soundscapes tuned to the kind of work you're doing." gap={20} />

      <Row
        title="Play Prism during focus"
        sub="Starts automatically when a session begins"
        padding="14px 0"
        control={
          <Toggle
            checked={prefs.data?.play_in_focus ?? true}
            disabled={prefs.isLoading || prefs.isError || update.isPending}
            onChange={(v) => update.mutate({ play_in_focus: v })}
            aria-label="Play Prism during focus"
          />
        }
      />

      <EyebrowLabel style={{ margin: '18px 0 10px' }}>DEFAULT MODE</EyebrowLabel>

      {(modes.isLoading || prefs.isLoading) && <Loading label="Loading soundscapes…" padding="10px 0" />}
      {modes.isError && <ErrorState error={modes.error} onRetry={modes.refetch} padding="10px 0" />}
      {prefs.isError && !modes.isError && (
        <ErrorState error={prefs.error} onRetry={prefs.refetch} padding="10px 0" />
      )}
      {!modes.isLoading && !modes.isError && list.length === 0 && (
        <EmptyState icon="graphic_eq" title="No soundscapes yet" caption="The Prism catalogue is empty." padding="10px 0" />
      )}

      {!modes.isLoading && !modes.isError && list.length > 0 && (
        <div
          role="radiogroup"
          aria-label="Default Prism mode"
          style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22, maxWidth: 560 }}
        >
          {list.map((m) => {
            if (m.key !== 'none') hue += 1;
            // A mode with a null `url` is still selectable — it just has no
            // stream to preview, and 13.5 draws no preview control anyway.
            return (
              <PrismRow
                key={m.key}
                mode={skin(m, hue)}
                selected={prefs.data?.default_mode === m.key}
                onSelect={() =>
                  update.mutate({ default_mode: m.key, default_preset_id: m.preset_id ?? null })
                }
              />
            );
          })}
        </div>
      )}

      <EyebrowLabel style={{ marginBottom: 10 }}>VOLUME</EyebrowLabel>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: 560 }}
        onPointerUp={commitVolume}
        onKeyUp={commitVolume}
        onBlur={commitVolume}
      >
        <Icon name="volume_down" size={18} color="var(--text-dim)" />
        <Slider
          value={volume}
          min={0}
          max={100}
          onChange={setDrag}
          aria-label="Prism volume"
          trackHeight={6}
        />
        <Icon name="volume_up" size={18} color="var(--text-dim)" />
      </div>

      <InlineError error={update.error} style={{ maxWidth: 560 }} />

      {/* no drawn control: `adaptive_audio` has no switch in 13.5, so it is left
          exactly as the server has it. */}
    </>
  );
}

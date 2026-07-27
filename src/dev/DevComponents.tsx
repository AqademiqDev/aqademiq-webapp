import { useState } from 'react';

import AdaCube, { CUBE_TONES, MOOD_LABELS, type CubeExpr } from '../components/brand/AdaCube';
import IceTimer from '../components/brand/IceTimer';
import LockBadge from '../components/brand/LockBadge';
import PrismGlyph, { PRISM_MODES } from '../components/brand/PrismGlyph';
import Button from '../components/core/Button';
import Card from '../components/core/Card';
import Icon from '../components/core/Icon';
import Input, { Textarea } from '../components/core/Input';
import Segmented from '../components/core/Segmented';
import TagChip, { TAG_COLORS } from '../components/core/TagChip';
import Toggle from '../components/core/Toggle';
import CodeInput from '../components/core/CodeInput';
import { EyebrowLabel, ProgressBar, SectionHeader, Slider, Stepper } from '../components/core/Misc';
import TaskCard from '../components/content/TaskCard';
import MoodScale from '../components/content/MoodScale';
import Modal from '../components/overlay/Modal';
import Popover from '../components/overlay/Popover';
import { moodExpr, moodMelt } from '../data/tasks';
import { useAppState } from '../hooks/useAppState';

/* ─────────────────────────────────────────────────────────────────────────
   /dev/components — a scratch gallery for eyeballing every variant and state.
   Dev-only: App.tsx mounts this route behind `import.meta.env.DEV`, so it is
   never present in a production build.
   ───────────────────────────────────────────────────────────────────────── */

const EXPRESSIONS: CubeExpr[] = ['happy', 'smile', 'neutral', 'meh', 'sad', 'focused'];

export default function DevComponents() {
  const { theme, toggleTheme } = useAppState();
  const [seg, setSeg] = useState('day');
  const [on, setOn] = useState(true);
  const [tag, setTag] = useState('Class');
  const [mood, setMood] = useState<number | null>(3);
  const [slider, setSlider] = useState(45);
  const [count, setCount] = useState(19);
  const [code, setCode] = useState(['A', 'D', '', '', '']);
  const [open, setOpen] = useState(true);
  const [modal, setModal] = useState(false);
  const [pop, setPop] = useState(false);
  const [progress, setProgress] = useState(0.38);

  return (
    <div
      className="aq-scroll"
      style={{
        height: '100%',
        overflow: 'auto',
        background: 'var(--surface-page)',
        padding: '30px 40px',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
        <div style={{ font: '800 26px var(--font-sans)', letterSpacing: '-.5px' }}>Component gallery</div>
        <Button variant="ghost" onClick={toggleTheme} icon={theme === 'dark' ? 'light_mode' : 'dark_mode'}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </Button>
      </div>

      <Section title="AdaCube — melt ramp (rating 0→4)">
        <Row>
          {MOOD_LABELS.map((label, r) => (
            <Stack key={label} label={label}>
              <AdaCube size={64} rating={r} melt={moodMelt(r)} expr={moodExpr(r)} />
            </Stack>
          ))}
        </Row>
      </Section>

      <Section title="AdaCube — expressions & flags">
        <Row>
          {EXPRESSIONS.map((e) => (
            <Stack key={e} label={e}>
              <AdaCube size={64} expr={e} />
            </Stack>
          ))}
          <Stack label="cheeks">
            <AdaCube size={64} expr="happy" cheeks />
          </Stack>
          <Stack label="sparkles">
            <AdaCube size={64} expr="happy" sparkles />
          </Stack>
          <Stack label="sweat">
            <AdaCube size={64} expr="meh" sweat />
          </Stack>
          <Stack label="tone[0]">
            <AdaCube size={64} tone={CUBE_TONES[0]} expr="sad" melt={1} />
          </Stack>
        </Row>
      </Section>

      <Section title="AdaCube — sizes used across the frames">
        <Row>
          {[28, 34, 46, 60, 68, 84, 96, 110, 126].map((s) => (
            <Stack key={s} label={`${s}px`}>
              <AdaCube size={s} expr="happy" />
            </Stack>
          ))}
        </Row>
      </Section>

      <Section title="IceTimer — idle · running · frozen · done">
        <Row>
          <Stack label="progress 0">
            <IceTimer progress={0} size={140} />
          </Stack>
          <Stack label="drip .38">
            <IceTimer progress={0.38} size={140} drip />
          </Stack>
          <Stack label="frost .38">
            <IceTimer progress={0.38} size={140} frost />
          </Stack>
          <Stack label="progress 1">
            <IceTimer progress={1} size={140} />
          </Stack>
          <Stack label={`live ${Math.round(progress * 100)}%`}>
            <IceTimer progress={progress} size={140} drip />
          </Stack>
        </Row>
        <div style={{ maxWidth: 320, marginTop: 14 }}>
          <Slider value={progress * 100} min={0} max={100} onChange={(v) => setProgress(v / 100)} aria-label="Progress" />
        </div>
      </Section>

      <Section title="PrismGlyph · LockBadge">
        <Row>
          {PRISM_MODES.map((m) => (
            <Stack key={m.id} label={m.name}>
              <PrismGlyph size={28} color={m.color} muted={m.id === 'none'} />
            </Stack>
          ))}
          <Stack label="lock 14">
            <LockBadge size={14} />
          </Stack>
          <Stack label="lock 28">
            <LockBadge size={28} ringWidth={3} />
          </Stack>
        </Row>
      </Section>

      <Section title="Buttons">
        <Row>
          <Button>Primary ink</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="soft">Soft accent</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="smallInk">Small ink</Button>
          <Button variant="dashed" icon="add">
            Dashed add
          </Button>
        </Row>
        <Row>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button icon="play_arrow">With icon</Button>
          <Button trailingIcon="arrow_forward">Trailing</Button>
        </Row>
      </Section>

      <Section title="Inputs">
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', maxWidth: 780 }}>
          <Input label="DEFAULT" defaultValue="Ridhwan Ahamed" wrapperStyle={{ width: 240 }} />
          <Input label="FOCUSED" defaultValue="Compiler Construction" focusedStyle wrapperStyle={{ width: 240 }} />
          <Input label="PLACEHOLDER" placeholder="Optional" wrapperStyle={{ width: 240 }} />
          <Input label="ERROR" defaultValue="not-an-email" error="Enter a valid email address." wrapperStyle={{ width: 240 }} />
          <Textarea label="TEXTAREA" defaultValue="Auto-import assignment due dates." wrapperStyle={{ width: 380 }} />
        </div>
        <div style={{ marginTop: 16 }}>
          <CodeInput value={code} onChange={setCode} ghost="A" mono uppercase boxWidth={48} boxHeight={56} radius={12} fontSize={22} gap={8} />
        </div>
      </Section>

      <Section title="Segmented · Toggle · Chips">
        <Row>
          <Segmented
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
          />
          <div style={{ width: 300 }}>
            <Segmented
              variant="sunken"
              value={seg}
              onChange={setSeg}
              options={[
                { value: 'day', label: 'Warm' },
                { value: 'week', label: 'Neutral' },
                { value: 'month', label: 'Cool' },
              ]}
            />
          </div>
          <Toggle checked={on} onChange={setOn} aria-label="Toggle" />
          <Toggle checked={!on} onChange={() => setOn((v) => !v)} small aria-label="Small toggle" />
        </Row>
        <Row>
          {Object.entries(TAG_COLORS).map(([name, color]) => (
            <TagChip key={name} label={name} color={color} selected={tag === name} onClick={() => setTag(name)} />
          ))}
        </Row>
        <Row>
          <TagChip label="All" ink selected noDot filter onClick={() => {}} />
          <TagChip label="Planned" color="#6b5cf0" filter onCard onClick={() => {}} />
          <TagChip label="Shipped" color="#2a9d6b" filter selected onClick={() => {}} />
        </Row>
      </Section>

      <Section title="Cards · TaskCard · SectionHeader">
        <Row>
          <Card padding={16} style={{ width: 220 }}>
            Compact 16px
          </Card>
          <Card padding={20} hoverable style={{ width: 220 }}>
            Standard, hoverable
          </Card>
        </Row>
        <div style={{ maxWidth: 520, marginTop: 14 }}>
          <SectionHeader label="ANYTIME" count={2} open={open} onToggle={() => setOpen((v) => !v)} />
          {open && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <TaskCard title="Read chapter 4" dur="10 min" tag="CC 401" color="#6b5cf0" />
              <TaskCard title="LL(1) parsing notes" dur="30 min" tag="CC 401" color="#6b5cf0" bar />
              <TaskCard title="Done task" dur="20 min" tag="NLP 302" color="#5cbbff" done />
              <TaskCard title="Dimmed task" dur="20 min" tag="NET 305" color="#2a9d6b" dim />
            </div>
          )}
        </div>
      </Section>

      <Section title="MoodScale · ProgressBar · Slider · Stepper">
        <div style={{ maxWidth: 460 }}>
          <MoodScale value={mood} onChange={setMood} />
        </div>
        <Row>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 320 }}>
            <EyebrowLabel>STEP 3 OF 7</EyebrowLabel>
            <ProgressBar value={0.42} />
          </div>
          <div style={{ width: 260 }}>
            <Slider value={slider} min={5} max={120} step={5} onChange={setSlider} aria-label="Minutes" />
          </div>
          <Stepper
            value={count}
            onChange={setCount}
            boxStyle={{
              width: 120,
              border: '2px solid var(--accent)',
              borderRadius: 14,
              padding: '12px 0',
              textAlign: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 30,
            }}
          >
            {count}
          </Stepper>
        </Row>
      </Section>

      <Section title="Overlays">
        <Row>
          <Button variant="ghost" onClick={() => setModal(true)}>
            Open modal
          </Button>
          <Button variant="ghost" onClick={() => setPop(true)}>
            Open popover
          </Button>
        </Row>
      </Section>

      <Section title="Icons in use">
        <Row>
          {[
            'calendar_today', 'menu_book', 'timer', 'blur_on', 'bar_chart', 'search', 'settings',
            'dark_mode', 'light_mode', 'add', 'close', 'chevron_left', 'chevron_right', 'expand_more',
            'arrow_back', 'arrow_forward', 'arrow_upward', 'play_arrow', 'ac_unit', 'stop_circle',
            'schedule', 'today', 'hourglass_empty', 'repeat', 'lock', 'person_outline',
            'mark_email_read', 'visibility_off', 'cloud_upload', 'picture_as_pdf', 'description',
            'attach_file', 'redeem', 'verified_user', 'wb_sunny', 'wb_twilight', 'check',
            'check_circle', 'delete_outline', 'logout', 'shield', 'palette', 'sell',
            'notifications_none', 'graphic_eq', 'chat_bubble_outline', 'help_outline', 'star_outline',
            'ios_share', 'edit_note', 'edit_square', 'view_sidebar', 'menu_open',
            'format_list_bulleted', 'view_kanban', 'swap_vert', 'trending_up', 'lightbulb', 'tune',
            'bug_report', 'bookmark_added', 'music_note', 'volume_up', 'volume_down',
            'keyboard_arrow_up', 'block',
          ].map((n) => (
            <span key={n} title={n} style={{ display: 'flex' }}>
              <Icon name={n} size={20} color="var(--text-secondary)" />
            </span>
          ))}
        </Row>
      </Section>

      <Modal open={modal} onClose={() => setModal(false)} title="Example modal" maxWidth={460}>
        <div style={{ font: '600 12.5px/1.6 var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 20 }}>
          Scrim, panel lift and the 24px 26px padding, as every sheet in the frames uses.
        </div>
        <Button full onClick={() => setModal(false)}>
          Done
        </Button>
      </Modal>

      <Popover open={pop} onClose={() => setPop(false)} width={320} anchor={{ top: 40, right: 40 }} panelStyle={{ padding: 16 }}>
        <div style={{ font: '800 15px var(--font-sans)', marginBottom: 6 }}>Example popover</div>
        <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-secondary)' }}>
          Anchored, dimmed to rgba(20,15,28,.22), no full scrim.
        </div>
      </Popover>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 34 }}>
      <EyebrowLabel style={{ marginBottom: 12 }}>{title}</EyebrowLabel>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginBottom: 12 }}>
      {children}
    </div>
  );
}

function Stack({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      {children}
      <span style={{ font: '700 9px var(--font-sans)', color: 'var(--text-dim)' }}>{label}</span>
    </div>
  );
}

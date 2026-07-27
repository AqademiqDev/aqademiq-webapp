import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import AdaCube from '../../components/brand/AdaCube';
import Button from '../../components/core/Button';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import { EyebrowLabel } from '../../components/core/Misc';
import Popover from '../../components/overlay/Popover';
import SuggestModal from './SuggestModal';
import { StatusChip, SuggestionRow, VotePill } from './parts';
import {
  BOARD_LANES,
  SUGGESTIONS,
  STATUS_STYLE,
  TYPE_ICON,
  type SuggestionStatus,
} from '../../data/suggestions';

/* ─────────────────────────────────────────────────────────────────────────
   Section 06b — Feedback (frames 06b.1–06b.5).
   List and Board views selected by ?view=, plus the suggest modal and the
   sort popover.
   ───────────────────────────────────────────────────────────────────────── */

const FILTERS: (SuggestionStatus | 'All')[] = [
  'All',
  'Under review',
  'Planned',
  'In progress',
  'Shipped',
  'Declined',
];

/** The board's community total, as the frame's eyebrow reads. The mock list
 *  holds the most-voted slice of it; filtering falls back to the real count. */
const TOTAL_SUGGESTIONS = 24;

export default function Feedback() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const board = params.get('view') === 'board';

  const [filter, setFilter] = useState<SuggestionStatus | 'All'>('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'voted' | 'newest'>('voted');
  const [sortOpen, setSortOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [votes, setVotes] = useState<Record<string, boolean>>(
    Object.fromEntries(SUGGESTIONS.filter((s) => s.voted).map((s) => [s.id, true])),
  );

  /* Search filters the visible list client-side (brief, pre-resolved item 9). */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = SUGGESTIONS.filter(
      (s) =>
        (filter === 'All' || s.status === filter) &&
        (!q || s.title.toLowerCase().includes(q) || (s.body ?? '').toLowerCase().includes(q)),
    );
    return sort === 'voted' ? [...list].sort((a, b) => b.votes - a.votes) : list;
  }, [filter, query, sort]);

  const toggleVote = (id: string) => setVotes((v) => ({ ...v, [id]: !v[id] }));

  const backButton = (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      aria-label="Back to profile"
      className="aq-press aq-darken focus-ring"
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon name="arrow_back" size={19} />
    </button>
  );

  const viewToggle = (
    <div style={{ display: 'flex', gap: 6 }}>
      {([
        { on: !board, icon: 'format_list_bulleted', label: 'List', to: {} },
        { on: board, icon: 'view_kanban', label: 'Board', to: { view: 'board' } },
      ] as const).map((v) => (
        <button
          key={v.label}
          type="button"
          onClick={() => setParams(v.to as Record<string, string>, { replace: true })}
          aria-pressed={v.on}
          className="aq-press focus-ring"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '9px 15px',
            borderRadius: 11,
            border: `1.5px solid ${v.on ? 'var(--accent)' : 'transparent'}`,
            background: v.on ? 'var(--accent-soft)' : 'var(--surface-card)',
            boxShadow: v.on ? undefined : 'var(--shadow-card)',
            color: v.on ? 'var(--accent)' : 'var(--text-secondary)',
            font: '800 12px var(--font-sans)',
          }}
        >
          <Icon name={v.icon} size={16} />
          {v.label}
        </button>
      ))}
    </div>
  );

  const sortPill = (
    <button
      type="button"
      onClick={() => setSortOpen(true)}
      className="aq-press aq-darken focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        height: 42,
        background: 'var(--surface-card)',
        boxShadow: 'var(--shadow-card)',
        borderRadius: 100,
        padding: '0 16px',
        font: '800 12px var(--font-sans)',
        flexShrink: 0,
      }}
    >
      <Icon name="swap_vert" size={17} />
      {sort === 'voted' ? 'Top' : 'New'}
    </button>
  );

  /* ── 06b.2 Board ───────────────────────────────────────────────── */
  if (board) {
    return (
      <>
        <Content padding="24px 26px">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {backButton}
              <div style={{ font: '800 24px var(--font-sans)', letterSpacing: '-.4px' }}>Feedback</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {viewToggle}
              {sortPill}
              <Button
                icon="add"
                onClick={() => setSuggestOpen(true)}
                style={{ width: 'auto', padding: '0 18px', height: 42 }}
              >
                Suggest
              </Button>
            </div>
          </div>

          <div className="aq-scroll" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', overflowX: 'auto' }}>
            {BOARD_LANES.map((lane) => (
              <div key={lane.name} className="aq-board-lane" style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 13px',
                    background: 'var(--surface-page)',
                    borderRadius: 12,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: lane.dot }} />
                  <span style={{ flex: 1, font: '800 12px var(--font-sans)' }}>{lane.name}</span>
                  <span style={{ font: '700 11px var(--font-sans)', color: 'var(--text-dim)' }}>
                    {lane.cards.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {lane.cards.map((c) => (
                    <Card
                      key={c.title}
                      padding="12px 13px"
                      hoverable
                      onClick={c.id ? () => navigate(`/feedback/${c.id}`) : undefined}
                      style={{
                        cursor: c.id ? 'pointer' : undefined,
                        opacity: lane.status === 'Declined' ? 0.72 : 1,
                        borderLeft:
                          lane.status === 'Planned' || lane.status === 'In progress' || lane.status === 'Shipped'
                            ? `3px solid ${lane.dot}`
                            : undefined,
                      }}
                    >
                      <div style={{ font: '800 12px/1.3 var(--font-sans)', marginBottom: 7 }}>{c.title}</div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          font: '600 10px var(--font-sans)',
                          color: 'var(--text-dim)',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icon name={TYPE_ICON[c.type]} size={13} />
                          {c.type}
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Icon name={lane.status === 'Shipped' ? 'check' : 'keyboard_arrow_up'} size={14} />
                          {c.votes}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Content>

        <SuggestModal open={suggestOpen} onClose={() => setSuggestOpen(false)} />
        <SortPopover open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} />
      </>
    );
  }

  /* ── 06b.1 List ────────────────────────────────────────────────── */
  return (
    <>
      <Content padding="24px 26px" style={{ alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: 860, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              {backButton}
              <div style={{ font: '800 24px var(--font-sans)', letterSpacing: '-.4px' }}>Feedback</div>
            </div>
            <Button
              icon="add"
              onClick={() => setSuggestOpen(true)}
              style={{ width: 'auto', padding: '0 20px', height: 42 }}
            >
              Make a suggestion
            </Button>
          </div>

          {/* Info banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'var(--accent-soft)',
              borderRadius: 16,
              padding: '12px 18px',
              marginBottom: 12,
            }}
          >
            <AdaCube size={34} expr="happy" cheeks />
            <div style={{ flex: 1, font: '600 12px/1.5 var(--font-sans)' }}>
              We&apos;d love to hear your ideas — suggest features and upvote what matters to you. We read everything.
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
                alignItems: 'flex-end',
                whiteSpace: 'nowrap',
              }}
            >
              <button type="button" className="focus-ring" style={{ font: '800 11.5px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}>
                Join user research →
              </button>
              <button type="button" className="focus-ring" style={{ font: '800 11.5px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}>
                Found a bug?
              </button>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {viewToggle}
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                height: 42,
                background: 'var(--surface-card)',
                boxShadow: 'var(--shadow-card)',
                borderRadius: 100,
                padding: '0 16px',
              }}
            >
              <Icon name="search" size={18} color="var(--text-dim)" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search suggestions"
                aria-label="Search suggestions"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 0,
                  outline: 'none',
                  background: 'transparent',
                  font: '600 12.5px var(--font-sans)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
            {sortPill}
          </div>

          {/* Status filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => {
              const on = filter === f;
              const style = f === 'All' ? null : STATUS_STYLE[f];
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={on}
                  className="aq-press focus-ring"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: f === 'All' ? '7px 15px' : '7px 14px',
                    borderRadius: 100,
                    font: '800 11.5px var(--font-sans)',
                    ...(on
                      ? { background: 'var(--surface-ink)', color: '#fff' }
                      : {
                          background: 'var(--surface-card)',
                          boxShadow: 'var(--shadow-card)',
                          color: 'var(--text-secondary)',
                        }),
                  }}
                >
                  {style && (
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: on ? '#fff' : style.dot }} />
                  )}
                  {f}
                </button>
              );
            })}
          </div>

          <EyebrowLabel style={{ marginBottom: 10 }}>
            SUGGESTIONS ({filter === 'All' && !query.trim() ? TOTAL_SUGGESTIONS : visible.length})
          </EyebrowLabel>

          {visible.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {visible.map((s) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  voted={!!votes[s.id]}
                  onVote={() => toggleVote(s.id)}
                  onOpen={() => navigate(`/feedback/${s.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </Content>

      <SuggestModal open={suggestOpen} onClose={() => setSuggestOpen(false)} />
      <SortPopover open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} />
    </>
  );
}

/* Empty state — reuses the guest-empty pattern from 00b.2 (brief item 8). */
function EmptyState({ query }: { query: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}
      >
        <AdaCube size={62} expr="neutral" melt={0.5} rating={2} />
      </div>
      <div style={{ font: '800 22px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 8 }}>
        Nothing here yet
      </div>
      <div
        style={{
          font: '600 12.5px/1.6 var(--font-sans)',
          color: 'var(--text-secondary)',
          maxWidth: 420,
          margin: '0 auto',
        }}
      >
        {query
          ? `No suggestions match “${query}”. Try a different search.`
          : 'No suggestions in this status yet — be the first to add one.'}
      </div>
    </div>
  );
}

/* ── 06b.5 Sort suggestions popover ──────────────────────────────── */
function SortPopover({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: 'voted' | 'newest';
  onChange: (v: 'voted' | 'newest') => void;
}) {
  const OPTIONS = [
    { id: 'voted' as const, icon: 'trending_up', title: 'Most voted', sub: 'What the community wants most' },
    { id: 'newest' as const, icon: 'schedule', title: 'Newest', sub: 'Fresh ideas first' },
  ];

  return (
    <Popover
      open={open}
      onClose={onClose}
      width={310}
      anchor={{ top: 150 - 58, right: 64 }}
      panelStyle={{ padding: '16px 16px 14px' }}
      aria-label="Sort suggestions"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ font: '800 14px var(--font-sans)' }}>Sort suggestions</div>
          <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 2 }}>
            Choose how the list is ordered
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="aq-press focus-ring" style={{ display: 'flex', borderRadius: '50%' }}>
          <Icon name="close" size={18} color="var(--text-dim)" />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {OPTIONS.map((o) => {
          const on = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => {
                onChange(o.id);
                onClose();
              }}
              className="aq-press focus-ring"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '11px 13px',
                borderRadius: 12,
                border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-hairline)'}`,
                background: on ? 'var(--accent-soft)' : 'transparent',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <Icon name={o.icon} size={19} color={on ? 'var(--accent)' : 'var(--text-secondary)'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ font: '800 12.5px var(--font-sans)', color: on ? 'var(--accent)' : undefined }}>
                  {o.title}
                </div>
                <div style={{ font: '600 10px var(--font-sans)', color: 'var(--text-secondary)' }}>{o.sub}</div>
              </div>
              {on && <Icon name="check_circle" size={18} color="var(--accent)" />}
            </button>
          );
        })}
      </div>
    </Popover>
  );
}

export { StatusChip, VotePill };

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import AdaCube from '../../components/brand/AdaCube';
import Button from '../../components/core/Button';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import { EyebrowLabel } from '../../components/core/Misc';
import { AsyncSection, errorMessage } from '../../components/core/Async';
import Popover from '../../components/overlay/Popover';
import SuggestModal from './SuggestModal';
import RateAppModal from './RateApp';
import { InlineError, SuggestionRow, toSuggestion } from './parts';
import {
  useBoardCanParticipate,
  useBoardMeta,
  useBoardPosts,
  useBoardRoadmap,
  useToggleBoardVote,
} from '../../hooks/data';
import type { BoardPostDto } from '../../lib/api';
import {
  STATUS_BY_KEY,
  STATUS_STYLE,
  TYPE_BY_KEY,
  TYPE_ICON,
  type SuggestionStatus,
} from '../../data/suggestions';

/* ─────────────────────────────────────────────────────────────────────────
   Section 06b — Feedback (frames 06b.1–06b.5).
   List and Board views selected by ?view=, plus the suggest modal and the
   sort popover. Everything reads `/v1/feedback/*`; posts are addressed by
   their public `ref` number.
   ───────────────────────────────────────────────────────────────────────── */

type SortKey = 'top' | 'new';

interface StatusOption {
  key: string;
  label: string;
}

/** Drawn while `/feedback/meta` is in flight, so the chip row never reflows. */
const DEFAULT_STATUSES: StatusOption[] = [
  'under_review',
  'planned',
  'in_progress',
  'shipped',
  'declined',
].map((key) => ({ key, label: STATUS_BY_KEY[key] }));

export default function Feedback() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const board = params.get('view') === 'board';

  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('top');
  const [sortOpen, setSortOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  /* Home for the star rating, which used to be a second feedback row on the
     stats screen. One destination, both intents. */
  const [rateOpen, setRateOpen] = useState(false);
  const [suggestCategory, setSuggestCategory] = useState<string | undefined>(undefined);

  const meta = useBoardMeta();

  /* The search box drives the `q` param rather than filtering locally. */
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  const statusOptions = useMemo<StatusOption[]>(() => {
    const fromMeta = (meta.data?.statuses ?? []).map((s) => ({
      key: s.key,
      label: STATUS_BY_KEY[s.key] ?? s.label,
    }));
    return [{ key: '', label: 'All' }, ...(fromMeta.length ? fromMeta : DEFAULT_STATUSES)];
  }, [meta.data]);

  // Posting, voting and commenting all 403 for guests ("Create an account
  // to …"), so every write control routes them to the upgrade path instead of
  // letting the request fail.
  const canParticipate = useBoardCanParticipate();

  const openSuggest = (category?: string) => {
    if (!canParticipate) return navigate('/signup');
    setSuggestCategory(category);
    setSuggestOpen(true);
  };

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
      {sort === 'top' ? 'Top' : 'New'}
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
                variant="ghost"
                icon="star_outline"
                onClick={() => setRateOpen(true)}
                style={{ width: 'auto', padding: '0 16px', height: 42 }}
              >
                Rate the app
              </Button>
              <Button
                icon="add"
                onClick={() => openSuggest()}
                style={{ width: 'auto', padding: '0 18px', height: 42 }}
              >
                Suggest
              </Button>
            </div>
          </div>

          <BoardLanes sort={sort} onOpen={(ref) => navigate(`/feedback/${ref}`)} />
        </Content>

        <SuggestModal
          open={suggestOpen}
          onClose={() => setSuggestOpen(false)}
          initialCategory={suggestCategory}
        />
        <SortPopover open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} />
        <RateAppModal open={rateOpen} onClose={() => setRateOpen(false)} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Button
                variant="ghost"
                icon="star_outline"
                onClick={() => setRateOpen(true)}
                style={{ width: 'auto', padding: '0 16px', height: 42 }}
              >
                Rate the app
              </Button>
              <Button
                icon="add"
                onClick={() => openSuggest()}
                style={{ width: 'auto', padding: '0 20px', height: 42 }}
              >
                Make a suggestion
              </Button>
            </div>
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
              {/* no endpoint: there is no research-panel signup route in /v1 — hand off to support. */}
              <button
                type="button"
                onClick={() => {
                  window.location.href =
                    'mailto:support@aqademiq.com?subject=Join%20user%20research';
                }}
                className="focus-ring"
                style={{ font: '800 11.5px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}
              >
                Join user research →
              </button>
              <button
                type="button"
                onClick={() => openSuggest('bug')}
                className="focus-ring"
                style={{ font: '800 11.5px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}
              >
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
            {statusOptions.map((f) => {
              const on = status === f.key;
              const style = f.key ? STATUS_STYLE[f.label as SuggestionStatus] : null;
              return (
                <button
                  key={f.key || 'all'}
                  type="button"
                  onClick={() => setStatus(f.key)}
                  aria-pressed={on}
                  className="aq-press focus-ring"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: f.key ? '7px 14px' : '7px 15px',
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
                  {f.label}
                </button>
              );
            })}
          </div>

          <SuggestionList
            status={status}
            sort={sort}
            q={debouncedQuery}
            onOpen={(ref) => navigate(`/feedback/${ref}`)}
          />
        </div>
      </Content>

      <SuggestModal
        open={suggestOpen}
        onClose={() => setSuggestOpen(false)}
        initialCategory={suggestCategory}
      />
      <SortPopover open={sortOpen} onClose={() => setSortOpen(false)} value={sort} onChange={setSort} />
      <RateAppModal open={rateOpen} onClose={() => setRateOpen(false)} />
    </>
  );
}

/* ── 06b.1 rows — `GET /feedback/posts` ──────────────────────────── */
function SuggestionList({
  status,
  sort,
  q,
  onOpen,
}: {
  status: string;
  sort: SortKey;
  q: string;
  onOpen: (ref: number) => void;
}) {
  const navigate = useNavigate();
  const posts = useBoardPosts({
    status: status || undefined,
    sort,
    q: q || undefined,
  });
  const vote = useToggleBoardVote();
  const canParticipate = useBoardCanParticipate();
  const rows = posts.data ?? [];

  return (
    <>
      <EyebrowLabel style={{ marginBottom: 10 }}>
        {posts.data ? `SUGGESTIONS (${rows.length})` : 'SUGGESTIONS'}
      </EyebrowLabel>

      <AsyncSection
        query={posts}
        loadingLabel="Loading suggestions…"
        empty={{ when: rows.length === 0, node: <EmptyState query={q} /> }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((p) => (
            <SuggestionRow
              key={p.ref}
              suggestion={toSuggestion(p)}
              voteDisabled={vote.isPending}
              onVote={() =>
                canParticipate ? vote.mutate({ ref: p.ref, voted: p.you_voted }) : navigate('/signup')
              }
              onOpen={() => onOpen(p.ref)}
            />
          ))}
        </div>
      </AsyncSection>

      {vote.isError && <InlineError message={errorMessage(vote.error)} style={{ textAlign: 'center' }} />}
    </>
  );
}

/* ── 06b.2 lanes ─────────────────────────────────────────────────────
   `/feedback/roadmap` only groups the on-roadmap statuses (planned, in
   progress, shipped), so the Open and Declined lanes come from filtered
   post queries. */
function BoardLanes({ sort, onOpen }: { sort: SortKey; onOpen: (ref: number) => void }) {
  const roadmap = useBoardRoadmap();
  const open = useBoardPosts({ status: 'under_review', sort });
  const declined = useBoardPosts({ status: 'declined', sort });

  const lanes = useMemo(() => {
    const middle = (roadmap.data ?? []).map((g) => {
      const label = STATUS_BY_KEY[g.status.key] ?? g.status.label;
      return {
        name: label,
        status: (STATUS_BY_KEY[g.status.key] ?? 'Planned') as SuggestionStatus | 'Open',
        dot: STATUS_STYLE[label as SuggestionStatus]?.dot ?? g.status.color,
        posts: g.posts,
      };
    });
    return [
      {
        name: 'Open',
        status: 'Open' as SuggestionStatus | 'Open',
        dot: STATUS_STYLE['Under review'].dot,
        posts: open.data ?? [],
      },
      ...middle,
      {
        name: 'Declined',
        status: 'Declined' as SuggestionStatus | 'Open',
        dot: STATUS_STYLE.Declined.dot,
        posts: declined.data ?? [],
      },
    ];
  }, [roadmap.data, open.data, declined.data]);

  const combined = {
    isLoading: roadmap.isLoading || open.isLoading || declined.isLoading,
    isError: roadmap.isError || open.isError || declined.isError,
    error: roadmap.error ?? open.error ?? declined.error,
    refetch: () => {
      void roadmap.refetch();
      void open.refetch();
      void declined.refetch();
    },
  };

  const total = lanes.reduce((n, l) => n + l.posts.length, 0);

  return (
    <AsyncSection
      query={combined}
      loadingLabel="Loading the board…"
      empty={{
        when: total === 0,
        node: <EmptyState query="" />,
      }}
    >
      <div className="aq-scroll" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', overflowX: 'auto' }}>
        {lanes.map((lane) => (
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
                {lane.posts.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lane.posts.map((c: BoardPostDto) => {
                const type = TYPE_BY_KEY[c.category] ?? 'Feature';
                return (
                  <Card
                    key={c.ref}
                    padding="12px 13px"
                    hoverable
                    onClick={() => onOpen(c.ref)}
                    style={{
                      cursor: 'pointer',
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
                        <Icon name={TYPE_ICON[type]} size={13} />
                        {type}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Icon name={lane.status === 'Shipped' ? 'check' : 'keyboard_arrow_up'} size={14} />
                        {c.upvotes}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AsyncSection>
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
  value: SortKey;
  onChange: (v: SortKey) => void;
}) {
  const OPTIONS = [
    { id: 'top' as const, icon: 'trending_up', title: 'Most voted', sub: 'What the community wants most' },
    { id: 'new' as const, icon: 'schedule', title: 'Newest', sub: 'Fresh ideas first' },
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

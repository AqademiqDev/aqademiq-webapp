import type { CSSProperties } from 'react';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import type { BoardPostDto } from '../../lib/api';
import { relativeLabel } from '../../lib/format';
import {
  STATUS_BY_KEY,
  STATUS_STYLE,
  TYPE_BY_KEY,
  TYPE_ICON,
  type Suggestion,
  type SuggestionStatus,
} from '../../data/suggestions';

/* Feedback row pieces (README §2.14) — frames 06b.1 and 06b.4. */

/** First letter of a board author's display name, for the avatar circles. */
export function initialOf(name: string | null | undefined): string {
  const c = (name ?? '').trim()[0];
  return c ? c.toUpperCase() : '?';
}

/** `BoardPostDto` → the view-model the frames draw. */
export function toSuggestion(post: BoardPostDto): Suggestion {
  return {
    id: String(post.ref),
    number: post.ref,
    title: post.title,
    body: post.body,
    votes: post.upvotes,
    voted: post.you_voted,
    comments: post.comment_count,
    type: TYPE_BY_KEY[post.category] ?? 'Feature',
    status: STATUS_BY_KEY[post.status] ?? 'Under review',
    author: post.author?.name ?? undefined,
    authorInitial: initialOf(post.author?.name),
    age: relativeLabel(post.created_at),
  };
}

export function VotePill({
  votes,
  voted,
  onVote,
  disabled = false,
  minWidth = 48,
  padding = '6px 0',
  radius = 11,
  countSize = 13,
}: {
  votes: number;
  voted: boolean;
  onVote: () => void;
  disabled?: boolean;
  minWidth?: number;
  padding?: string;
  radius?: number;
  countSize?: number;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onVote();
      }}
      aria-pressed={voted}
      aria-label={voted ? 'Remove your vote' : 'Upvote'}
      className="aq-press focus-ring"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth,
        padding,
        borderRadius: radius,
        flexShrink: 0,
        ...(voted
          ? { background: 'var(--accent)', color: '#fff' }
          : {
              border: '1.5px solid var(--border-hairline)',
              background: 'var(--surface-page)',
              color: 'var(--text-primary)',
            }),
      }}
    >
      <Icon name="keyboard_arrow_up" size={18} color={voted ? '#fff' : 'var(--accent)'} />
      <span style={{ font: `800 ${countSize}px var(--font-sans)` }}>{votes}</span>
    </button>
  );
}

export function StatusChip({
  status,
  label,
  style,
}: {
  status: SuggestionStatus;
  label?: string;
  style?: CSSProperties;
}) {
  const s = STATUS_STYLE[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 100,
        background: `${s.dot}18`,
        color: s.text,
        font: '800 10.5px var(--font-sans)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {label ?? status}
    </span>
  );
}

export function SuggestionRow({
  suggestion,
  onVote,
  onOpen,
  voteDisabled = false,
}: {
  suggestion: Suggestion;
  onVote: () => void;
  onOpen: () => void;
  /** Vote toggles are optimistic; the pill only locks while a call is in flight. */
  voteDisabled?: boolean;
}) {
  return (
    <Card
      padding="11px 15px"
      hoverable
      onClick={onOpen}
      style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
    >
      <VotePill
        votes={suggestion.votes}
        voted={!!suggestion.voted}
        onVote={onVote}
        disabled={voteDisabled}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '800 13.5px var(--font-sans)', marginBottom: 3 }}>{suggestion.title}</div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            font: '600 10.5px var(--font-sans)',
            color: 'var(--text-dim)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Icon name={TYPE_ICON[suggestion.type]} size={13} />
            {suggestion.type}
          </span>
          <span>·</span>
          <span>
            {suggestion.comments} {suggestion.comments === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>

      <StatusChip status={suggestion.status} />
    </Card>
  );
}

/** Inline failure line for a mutation next to the control that triggered it. */
export function InlineError({ message, style }: { message: string; style?: CSSProperties }) {
  return (
    <div
      role="alert"
      style={{
        font: '700 11px/1.5 var(--font-sans)',
        color: 'var(--aq-danger)',
        marginTop: 8,
        ...style,
      }}
    >
      {message}
    </div>
  );
}

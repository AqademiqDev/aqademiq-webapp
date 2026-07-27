import type { CSSProperties } from 'react';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import { STATUS_STYLE, TYPE_ICON, type Suggestion, type SuggestionStatus } from '../../data/suggestions';

/* Feedback row pieces (README §2.14) — frames 06b.1 and 06b.4. */

export function VotePill({
  votes,
  voted,
  onVote,
  minWidth = 48,
  padding = '6px 0',
  radius = 11,
  countSize = 13,
}: {
  votes: number;
  voted: boolean;
  onVote: () => void;
  minWidth?: number;
  padding?: string;
  radius?: number;
  countSize?: number;
}) {
  return (
    <button
      type="button"
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
  voted,
  onVote,
  onOpen,
}: {
  suggestion: Suggestion;
  voted: boolean;
  onVote: () => void;
  onOpen: () => void;
}) {
  const votes = suggestion.votes + (voted && !suggestion.voted ? 1 : !voted && suggestion.voted ? -1 : 0);

  return (
    <Card
      padding="11px 15px"
      hoverable
      onClick={onOpen}
      style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
    >
      <VotePill votes={votes} voted={voted} onVote={onVote} />

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
          <span>{suggestion.comments} comments</span>
        </div>
      </div>

      <StatusChip status={suggestion.status} />
    </Card>
  );
}

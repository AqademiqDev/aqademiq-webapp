import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import { EyebrowLabel } from '../../components/core/Misc';
import { StatusChip, VotePill } from './parts';
import { SUGGESTIONS, TYPE_ICON, suggestionById } from '../../data/suggestions';
import { useAppState } from '../../hooks/useAppState';

/* Frame 06b.4 — Suggestion detail. Centred, max-width 720. */

export default function SuggestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { name } = useAppState();

  const suggestion = suggestionById(id) ?? SUGGESTIONS[0];
  const [voted, setVoted] = useState(!!suggestion.voted);
  const [comments, setComments] = useState(suggestion.thread ?? []);
  const [draft, setDraft] = useState('');

  const votes = suggestion.votes + (voted && !suggestion.voted ? 1 : !voted && suggestion.voted ? -1 : 0);
  const index = SUGGESTIONS.findIndex((s) => s.id === suggestion.id);

  function addComment() {
    const body = draft.trim();
    if (!body) return;
    setComments((c) => [
      ...c,
      { author: name, initial: (name.trim()[0] || 'R').toUpperCase(), when: 'just now', body },
    ]);
    setDraft('');
  }

  return (
    <Content padding="24px 26px" style={{ alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => navigate('/feedback')}
            aria-label="Back to feedback"
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
          <div style={{ font: '800 22px var(--font-sans)', letterSpacing: '-.4px' }}>
            Suggestion #{suggestion.number ?? index + 1}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <StatusChip status={suggestion.status} label={suggestion.statusLabel} style={{ font: '800 11px var(--font-sans)' }} />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 100,
                background: 'var(--accent-soft)',
                color: 'var(--accent)',
                font: '800 11px var(--font-sans)',
              }}
            >
              <Icon name={TYPE_ICON[suggestion.type]} size={14} />
              {suggestion.type}
            </span>
            {suggestion.age && (
              <span style={{ marginLeft: 'auto', font: '600 11px var(--font-sans)', color: 'var(--text-dim)' }}>
                {suggestion.age}
              </span>
            )}
          </div>

          <div style={{ font: '800 24px var(--font-sans)', letterSpacing: '-.4px', marginBottom: 10 }}>
            {suggestion.title}
          </div>
          <div
            style={{
              font: '600 13.5px/1.6 var(--font-sans)',
              color: 'var(--text-secondary)',
              marginBottom: 18,
            }}
          >
            {suggestion.body}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              paddingBottom: 20,
              borderBottom: '1px solid var(--border-hairline)',
              marginBottom: 20,
            }}
          >
            <VotePill
              votes={votes}
              voted={voted}
              onVote={() => setVoted((v) => !v)}
              minWidth={52}
              padding="8px 0"
              radius={12}
              countSize={14}
            />
            <div style={{ font: '700 13px var(--font-sans)', color: 'var(--text-secondary)' }}>
              {votes} {votes === 1 ? 'vote' : 'votes'}
            </div>
            {suggestion.author && (
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--surface-page)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    font: '800 11px var(--font-sans)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {suggestion.authorInitial}
                </span>
                <span style={{ font: '600 12px var(--font-sans)', color: 'var(--text-dim)' }}>
                  by {suggestion.author}
                </span>
              </div>
            )}
          </div>

          <EyebrowLabel style={{ marginBottom: 12 }}>COMMENTS ({comments.length})</EyebrowLabel>

          <div className="aq-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
            {comments.map((c, i) => (
              <Card key={i} padding="14px 16px">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        font: '800 11px var(--font-sans)',
                      }}
                    >
                      {c.initial}
                    </span>
                    <span style={{ font: '800 13px var(--font-sans)' }}>{c.author}</span>
                  </span>
                  <span style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-dim)' }}>{c.when}</span>
                </div>
                <div style={{ font: '600 13px/1.5 var(--font-sans)', paddingLeft: 35 }}>{c.body}</div>
              </Card>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface-card)',
              boxShadow: 'var(--shadow-card)',
              borderRadius: 100,
              padding: '8px 8px 8px 18px',
              marginTop: 14,
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addComment()}
              placeholder="Add a comment…"
              aria-label="Add a comment"
              style={{
                flex: 1,
                minWidth: 0,
                border: 0,
                outline: 'none',
                background: 'transparent',
                font: '600 13px var(--font-sans)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={addComment}
              aria-label="Post comment"
              className="aq-press aq-darken focus-ring"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'var(--surface-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon name="arrow_upward" size={19} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </Content>
  );
}

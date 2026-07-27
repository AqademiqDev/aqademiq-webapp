import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Content } from '../../layouts/AppShell';
import Button from '../../components/core/Button';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import { EyebrowLabel } from '../../components/core/Misc';
import { EmptyState, ErrorState, Loading, errorMessage } from '../../components/core/Async';
import { InlineError, StatusChip, VotePill, initialOf, toSuggestion } from './parts';
import { useBoardCanParticipate, useBoardPost, useCommentOnPost, useToggleBoardVote } from '../../hooks/data';
import { ApiError } from '../../lib/api';
import { relativeLabel } from '../../lib/format';
import { TYPE_ICON, type SuggestionComment } from '../../data/suggestions';

/* Frame 06b.4 — Suggestion detail. Centred, max-width 720.
   `:id` in the route is the post's public `ref` number. */

export default function SuggestionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const ref = Number(id);
  const post = useBoardPost(id);
  const vote = useToggleBoardVote();
  const comment = useCommentOnPost();
  const [draft, setDraft] = useState('');
  // Guests can read the board but not write to it — the server answers 403
  // "Create an account to …" on vote, comment and subscribe. Say so up front
  // rather than letting the request fail after they've typed.
  const canParticipate = useBoardCanParticipate();

  const data = post.data;
  const view = useMemo(() => (data ? toSuggestion(data) : null), [data]);

  const comments = useMemo<SuggestionComment[]>(
    () =>
      (data?.comments ?? []).map((c) => ({
        author: c.author?.name ?? 'Someone',
        initial: initialOf(c.author?.name),
        when: relativeLabel(c.created_at),
        body: c.body,
      })),
    [data],
  );

  const notFound = post.error instanceof ApiError && post.error.status === 404;

  function addComment() {
    if (!canParticipate) return navigate('/signup');
    const body = draft.trim();
    if (!body || comment.isPending || !Number.isInteger(ref)) return;
    comment.mutate({ ref, body }, { onSuccess: () => setDraft('') });
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
            Suggestion #{data?.ref ?? id}
          </div>
        </div>

        {post.isLoading && <Loading label="Loading suggestion…" />}

        {!post.isLoading && post.isError && (
          notFound ? (
            <EmptyState
              icon="search_off"
              title="We couldn’t find that suggestion"
              caption="It may have been merged or removed. Everything else is still on the board."
              action={
                <Button variant="soft" icon="arrow_back" onClick={() => navigate('/feedback')}>
                  Back to feedback
                </Button>
              }
            />
          ) : (
            <ErrorState error={post.error} onRetry={post.refetch} />
          )
        )}

        {view && data && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <StatusChip
                status={view.status}
                label={view.status === 'Under review' ? 'Open' : undefined}
                style={{ font: '800 11px var(--font-sans)' }}
              />
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
                <Icon name={TYPE_ICON[view.type]} size={14} />
                {view.type}
              </span>
              {view.age && (
                <span style={{ marginLeft: 'auto', font: '600 11px var(--font-sans)', color: 'var(--text-dim)' }}>
                  {view.age}
                </span>
              )}
            </div>

            <div style={{ font: '800 24px var(--font-sans)', letterSpacing: '-.4px', marginBottom: 10 }}>
              {view.title}
            </div>
            <div
              style={{
                font: '600 13.5px/1.6 var(--font-sans)',
                color: 'var(--text-secondary)',
                marginBottom: 18,
              }}
            >
              {view.body}
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
                votes={view.votes}
                voted={!!view.voted}
                disabled={vote.isPending}
                onVote={() =>
                  canParticipate
                    ? vote.mutate({ ref: data.ref, voted: data.you_voted })
                    : navigate('/signup')
                }
                minWidth={52}
                padding="8px 0"
                radius={12}
                countSize={14}
              />
              <div style={{ font: '700 13px var(--font-sans)', color: 'var(--text-secondary)' }}>
                {view.votes} {view.votes === 1 ? 'vote' : 'votes'}
              </div>
              {view.author && (
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
                    {view.authorInitial}
                  </span>
                  <span style={{ font: '600 12px var(--font-sans)', color: 'var(--text-dim)' }}>
                    by {view.author}
                  </span>
                </div>
              )}
            </div>

            {vote.isError && <InlineError message={errorMessage(vote.error)} style={{ marginTop: 0, marginBottom: 12 }} />}

            <EyebrowLabel style={{ marginBottom: 12 }}>COMMENTS ({comments.length})</EyebrowLabel>

            <div className="aq-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'auto' }}>
              {comments.length === 0 ? (
                <EmptyState
                  icon="chat_bubble_outline"
                  title="No comments yet"
                  caption="Be the first to add to this thread."
                />
              ) : (
                comments.map((c, i) => (
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
                ))
              )}
            </div>

            {comment.isError && <InlineError message={errorMessage(comment.error)} />}

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
                disabled={comment.isPending || data.locked || !canParticipate}
                placeholder={
                  data.locked
                    ? 'This thread is locked'
                    : canParticipate
                      ? 'Add a comment…'
                      : 'Create an account to comment'
                }
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
                disabled={comment.isPending || data.locked}
                aria-label={canParticipate ? 'Post comment' : 'Create an account to comment'}
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
        )}
      </div>
    </Content>
  );
}

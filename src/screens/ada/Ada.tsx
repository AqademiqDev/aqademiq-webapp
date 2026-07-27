import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AdaCube from '../../components/brand/AdaCube';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import TaskCard from '../../components/content/TaskCard';
import type { TaskCardProps } from '../../components/content/TaskCard';
import { AsyncSection, EmptyState, errorMessage } from '../../components/core/Async';
import GuestLocked from './GuestLocked';
import { ADA_PROMPTS, type ChatMessage } from '../../data/chats';
import {
  useApplyPlan,
  useArchiveConversation,
  useClearChats,
  useConversations,
  useCreateConversation,
  useMessages,
  useSendMessage,
  useSubjects,
} from '../../hooks/data';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../lib/api';
import type { AdaMessageDto, SubjectDto } from '../../lib/api';
import { agendaLabel, durationLabel, formatClock, formatHhMm, relativeLabel } from '../../lib/format';
import { buildSubjectLookup, subjectLabel } from '../../lib/mappers';

/* ─────────────────────────────────────────────────────────────────────────
   Section 05 — Ada AI (frames 05.1–05.3), wired to `/v1/ada/*`.

   05.1 intro · 05.2 active chat · 05.3 the two-pane history view. The history
   sidebar is toggled by the header's view_sidebar / menu_open buttons and by
   the /ada/:chatId route.

   Ada only *proposes* plans: a reply may carry a `plan`, and nothing reaches
   the planner until the user presses "Add to plan" and the server re-validates
   every field through apply-plan (§4.3 safety gate).
   ───────────────────────────────────────────────────────────────────────── */

interface PlanDay {
  date: string;
  label: string;
  tasks: TaskCardProps[];
}

/** A rendered turn — the drawn `ChatMessage` plus the plan grouped by day. */
type AdaTurn = ChatMessage & { planDays?: PlanDay[] };

interface ApplyFailure {
  id: string;
  message: string;
  details: string[];
}

/** The line under the composer pill — a send failure, or a plain explanation. */
interface ComposerNote {
  text: string;
  tone: 'error' | 'info';
}

/** A proposed task's `scheduled_at` is either `HH:MM` or a full naive ISO. */
function planClock(scheduledAt: string | null | undefined): string | undefined {
  if (!scheduledAt) return undefined;
  const hhmm = /^(\d{1,2}):(\d{2})/.exec(scheduledAt.trim());
  if (hhmm) return formatHhMm(`${hhmm[1]}:${hhmm[2]}`);
  return formatClock(scheduledAt);
}

/** `AdaMessageDto[]` → the bubble shape, with plan days resolved to TaskCards. */
function toTurns(messages: AdaMessageDto[], subjects: SubjectDto[]): AdaTurn[] {
  const lookup = buildSubjectLookup(subjects);
  return messages.map((m) => {
    const planDays: PlanDay[] = (m.plan ?? [])
      .map((day) => ({
        date: day.date,
        label: agendaLabel(day.date),
        tasks: day.tasks.map((t): TaskCardProps => {
          const subject = t.subject_id ? lookup.byId.get(t.subject_id) : undefined;
          const time = planClock(t.scheduled_at);
          return {
            title: t.title,
            time,
            bar: Boolean(time),
            tag: subjectLabel(subject),
            color: subject?.color_hex || undefined,
            dur: t.duration_seconds ? durationLabel(t.duration_seconds) : undefined,
          };
        }),
      }))
      .filter((day) => day.tasks.length > 0);

    return {
      id: m.id,
      from: m.is_user ? 'user' : 'ada',
      text: m.text ?? '',
      planFooter: m.plan_footer ?? undefined,
      hasPlan: planDays.length > 0,
      planDays: planDays.length ? planDays : undefined,
    };
  });
}

export default function Ada({ historyOpen = false }: { historyOpen?: boolean }) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { isGuest } = useAuth();

  const [showHistory, setShowHistory] = useState(historyOpen);
  const [activeId, setActiveId] = useState<string | undefined>(chatId);
  const [draft, setDraft] = useState('');
  /** The turn in flight — the POST returns both turns, so the user's own bubble
      is drawn optimistically until it comes back. */
  const [pendingText, setPendingText] = useState<string | null>(null);
  const [composerNote, setComposerNote] = useState<ComposerNote | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [applied, setApplied] = useState<Record<string, number>>({});
  const [applyError, setApplyError] = useState<ApplyFailure | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const conversations = useConversations();
  const messagesQuery = useMessages(activeId);
  const subjects = useSubjects();

  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const applyPlan = useApplyPlan();
  const archiveConversation = useArchiveConversation();
  const clearChats = useClearChats();

  const rows = useMemo(() => (conversations.data ?? []).filter((c) => c.is_active), [conversations.data]);
  const active = (conversations.data ?? []).find((c) => c.id === activeId);
  const thread = useMemo(
    () => toTurns(messagesQuery.data ?? [], subjects.data ?? []),
    [messagesQuery.data, subjects.data],
  );

  const sending = createConversation.isPending || sendMessage.isPending;

  useEffect(() => {
    setShowHistory(historyOpen);
  }, [historyOpen]);

  useEffect(() => {
    if (chatId) setActiveId(chatId);
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.length, pendingText, sending]);

  if (isGuest) return <GuestLocked />;

  /** Creates the conversation on the first turn, then posts. */
  async function send(text: string) {
    const body = text.trim();
    if (!body || sending) return;
    setComposerNote(null);
    setDraft('');
    setPendingText(body);
    try {
      let id = activeId;
      if (!id) id = (await createConversation.mutateAsync(body.slice(0, 60))).id;
      // The POST writes both turns into the message cache on success, so the
      // id is only adopted afterwards — the thread is populated the moment it
      // becomes the active conversation.
      await sendMessage.mutateAsync({ conversationId: id, text: body });
      if (id !== activeId) {
        setActiveId(id);
        if (showHistory) navigate(`/ada/${id}`, { replace: true });
      }
    } catch (err) {
      setComposerNote({ text: errorMessage(err), tone: 'error' });
      setDraft(body);
    } finally {
      setPendingText(null);
    }
  }

  function openChat(id: string) {
    setActiveId(id);
    setPendingText(null);
    setComposerNote(null);
    setApplyError(null);
    navigate(`/ada/${id}`, { replace: true });
  }

  function newChat() {
    setActiveId(undefined);
    setPendingText(null);
    setComposerNote(null);
    setApplyError(null);
    setDraft('');
    navigate('/ada');
  }

  async function runApplyPlan(messageId: string) {
    if (!activeId) return;
    setApplyError(null);
    try {
      const res = await applyPlan.mutateAsync({ conversationId: activeId, messageId });
      setApplied((prev) => ({ ...prev, [messageId]: res.applied }));
    } catch (err) {
      setApplyError({
        id: messageId,
        message: errorMessage(err),
        // 422 answers with one validation line per rejected task.
        details: err instanceof ApiError ? err.details : [],
      });
    }
  }

  async function runArchive() {
    if (!activeId) return;
    const next = rows.find((c) => c.id !== activeId);
    try {
      await archiveConversation.mutateAsync(activeId);
      if (next) openChat(next.id);
      else newChat();
    } catch {
      /* surfaced inline beside the title */
    }
  }

  async function runClear() {
    try {
      await clearChats.mutateAsync();
      setConfirmClear(false);
      newChat();
    } catch {
      /* surfaced inline in the confirm row */
    }
  }

  const renderBubble = (m: AdaTurn) => (
    <Bubble
      key={m.id}
      message={m}
      applying={applyPlan.isPending && applyPlan.variables?.messageId === m.id}
      applyDisabled={applyPlan.isPending}
      appliedCount={applied[m.id]}
      failure={applyError?.id === m.id ? applyError : undefined}
      onApply={() => void runApplyPlan(m.id)}
    />
  );

  const threadView = (
    <>
      <AsyncSection
        query={messagesQuery}
        loadingLabel="Loading chat…"
        empty={{
          when: thread.length === 0 && pendingText === null && !sending,
          node: (
            <EmptyState
              icon="forum"
              title={activeId ? 'No messages yet' : 'No chat open'}
              caption={
                activeId
                  ? 'Tell Ada what is on your plate and she will shape it into a plan.'
                  : 'Pick a chat on the left, or start a new one.'
              }
            />
          ),
        }}
      >
        {thread.map(renderBubble)}
        {pendingText !== null && <Bubble message={{ id: '__pending', from: 'user', text: pendingText }} />}
        {sending && <Thinking />}
      </AsyncSection>
      <div ref={endRef} />
    </>
  );

  /* ── 05.3 Two-pane with the history sidebar ────────────────────── */
  if (showHistory) {
    return (
      <div className="aq-screen" style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside
          className="aq-scroll aq-ada-rail"
          style={{
            width: 300,
            flexShrink: 0,
            borderRight: '1px solid var(--border-hairline)',
            padding: '20px 16px',
            background: 'var(--surface-card)',
            overflow: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <button
                type="button"
                onClick={() => {
                  setShowHistory(false);
                  navigate('/ada');
                }}
                aria-label="Hide chat history"
                title="Hide chat history"
                className="aq-press aq-darken focus-ring"
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'var(--surface-page)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="menu_open" size={18} color="var(--text-secondary)" />
              </button>
              <span style={{ font: '800 13px var(--font-sans)' }}>Chats</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => setConfirmClear((c) => !c)}
                aria-label="Clear all chats"
                title="Clear all chats"
                disabled={rows.length === 0 || clearChats.isPending}
                className="aq-press focus-ring"
                style={{ display: 'flex', borderRadius: 6, opacity: rows.length === 0 ? 0.45 : 1 }}
              >
                <Icon name="delete_sweep" size={20} color="var(--text-secondary)" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowHistory(false);
                  newChat();
                }}
                aria-label="New chat"
                className="aq-press focus-ring"
                style={{ display: 'flex', borderRadius: 6 }}
              >
                <Icon name="edit_square" size={20} color="var(--accent)" />
              </button>
            </div>
          </div>

          {confirmClear && (
            <div
              style={{
                marginBottom: 12,
                padding: '11px 13px',
                borderRadius: 12,
                background: 'var(--surface-page)',
              }}
            >
              <div
                style={{
                  font: '600 11px/1.5 var(--font-sans)',
                  color: 'var(--text-secondary)',
                  marginBottom: 9,
                }}
              >
                Clear every chat? Your plan stays exactly as it is — only the conversations go.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button variant="smallInk" loading={clearChats.isPending} onClick={() => void runClear()}>
                  Clear
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="focus-ring"
                  style={{ font: '800 11px var(--font-sans)', color: 'var(--text-secondary)', borderRadius: 4 }}
                >
                  Cancel
                </button>
              </div>
              {clearChats.isError && (
                <div
                  role="alert"
                  style={{ font: '700 10.5px/1.45 var(--font-sans)', color: 'var(--aq-danger)', marginTop: 8 }}
                >
                  {errorMessage(clearChats.error)}
                </div>
              )}
            </div>
          )}

          <AsyncSection
            query={conversations}
            loadingLabel="Loading chats…"
            empty={{
              when: rows.length === 0,
              node: (
                <EmptyState
                  icon="forum"
                  title="No chats yet"
                  caption="Start one and it will show up here."
                  padding={20}
                />
              ),
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rows.map((c) => {
                const on = c.id === activeId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openChat(c.id)}
                    aria-current={on ? 'true' : undefined}
                    className="focus-ring"
                    style={{
                      padding: '11px 13px',
                      borderRadius: 12,
                      background: on ? 'var(--accent-soft)' : 'transparent',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div style={{ font: '800 12px var(--font-sans)', color: on ? 'var(--accent)' : undefined }}>
                      {c.title?.trim() || 'New chat'}
                    </div>
                    <div
                      style={{
                        font: '600 10px var(--font-sans)',
                        color: on ? 'var(--text-secondary)' : 'var(--text-dim)',
                        marginTop: 2,
                      }}
                    >
                      {relativeLabel(c.last_message_at) || 'Just started'}
                    </div>
                  </button>
                );
              })}
            </div>
          </AsyncSection>
        </aside>

        <main style={{ flex: 1, padding: '24px 26px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                font: '800 15px var(--font-sans)',
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {active?.title?.trim() || 'New chat'}
            </div>
            {archiveConversation.isError && (
              <span role="alert" style={{ font: '700 10.5px var(--font-sans)', color: 'var(--aq-danger)' }}>
                {errorMessage(archiveConversation.error)}
              </span>
            )}
            <button
              type="button"
              onClick={() => void runArchive()}
              aria-label="Archive this chat"
              title="Archive this chat"
              disabled={!activeId || archiveConversation.isPending}
              className="aq-press aq-darken focus-ring"
              style={{
                display: 'flex',
                borderRadius: 6,
                opacity: !activeId || archiveConversation.isPending ? 0.45 : 1,
              }}
            >
              <Icon name="archive" size={19} color="var(--text-secondary)" />
            </button>
          </div>
          <div
            className="aq-scroll"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}
          >
            {threadView}
          </div>
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => void send(draft)}
            onAttach={() => setComposerNote(ATTACH_NOTE)}
            placeholder="Reply…"
            sunken
            sendSize={38}
            disabled={sending}
            note={composerNote}
          />
        </main>
      </div>
    );
  }

  /* ── 05.1 intro / 05.2 active chat ─────────────────────────────── */
  const empty = thread.length === 0 && pendingText === null && !sending;

  /* 05.1 puts the header row at the full body width; 05.2 nests it inside the
     680px column with the chat title between the two buttons. */
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, width: '100%' }}>
      <HeaderButton
        icon="view_sidebar"
        label="Show chat history"
        onClick={() => {
          setShowHistory(true);
          if (activeId) navigate(`/ada/${activeId}`);
        }}
      />
      {empty ? (
        <div style={{ flex: 1 }} />
      ) : (
        <div
          style={{
            flex: 1,
            minWidth: 0,
            font: '800 15px var(--font-sans)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {active?.title?.trim() || 'New chat'}
        </div>
      )}
      <HeaderButton icon="edit_note" label="New chat" onClick={newChat} />
    </div>
  );

  return (
    <main
      className="aq-screen"
      style={{
        flex: 1,
        overflow: 'hidden',
        padding: '24px 26px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {empty && header}

      <div style={{ width: '100%', maxWidth: 680, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {!empty && header}

        {empty ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
            }}
          >
            <AdaCube size={96} expr="happy" cheeks />
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontWeight: 800,
                letterSpacing: '-.5px',
                fontSize: 26,
                lineHeight: 1.25,
                margin: '20px 0 26px',
              }}
            >
              Drop your thoughts.
              <br />
              I&apos;ll turn them into a plan.
            </div>

            <div
              style={{
                display: 'flex',
                gap: 9,
                flexWrap: 'wrap',
                justifyContent: 'center',
                maxWidth: 520,
                marginBottom: 26,
              }}
            >
              {ADA_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void send(p)}
                  disabled={sending}
                  className="aq-press focus-ring"
                  style={{
                    padding: '9px 16px',
                    borderRadius: 100,
                    border: '1.5px solid rgba(107,92,240,.3)',
                    font: '700 12px var(--font-sans)',
                    color: 'var(--accent)',
                    opacity: sending ? 0.45 : 1,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => void send(draft)}
              onAttach={() => setComposerNote(ATTACH_NOTE)}
              placeholder="What's on your mind?"
              disabled={sending}
              note={composerNote}
              style={{ maxWidth: 560 }}
            />
          </div>
        ) : (
          <>
            <div
              className="aq-scroll"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}
            >
              {threadView}
            </div>
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => void send(draft)}
              onAttach={() => setComposerNote(ATTACH_NOTE)}
              placeholder="Ask Ada to plan, break down, or reschedule…"
              disabled={sending}
              note={composerNote}
              style={{ marginTop: 14 }}
            />
          </>
        )}
      </div>
    </main>
  );
}

/* no endpoint: `/ada/uploads` presigns attachment keys but src/lib/api exposes
   no client for it, so the paperclip cannot produce the `key` sendMessage
   needs. It answers inline rather than silently doing nothing. */
const ATTACH_NOTE: ComposerNote = {
  text: 'Attachments are not available yet — paste the details into your message for now.',
  tone: 'info',
};

function Bubble({
  message,
  onApply,
  applying = false,
  applyDisabled = false,
  appliedCount,
  failure,
}: {
  message: AdaTurn;
  onApply?: () => void;
  applying?: boolean;
  applyDisabled?: boolean;
  appliedCount?: number;
  failure?: ApplyFailure;
}) {
  const isAda = message.from === 'ada';
  const days = message.planDays ?? [];
  const hasPlan = days.length > 0;
  // An assistant turn may carry a plan and no prose — draw the card alone.
  const hasText = message.text.trim().length > 0;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
        flexDirection: isAda ? 'row' : 'row-reverse',
      }}
    >
      {isAda && <AdaCube size={28} expr={message.expr ?? 'happy'} />}
      <div
        style={{
          maxWidth: hasPlan ? '80%' : '74%',
          background: isAda ? 'var(--surface-card)' : 'var(--surface-ink)',
          boxShadow: isAda ? 'var(--shadow-card)' : undefined,
          color: isAda ? undefined : '#fff',
          borderRadius: 16,
          ...(isAda ? { borderBottomLeftRadius: 5 } : { borderBottomRightRadius: 5 }),
          padding: hasPlan ? '14px 16px' : '12px 15px',
          textAlign: 'left',
        }}
      >
        {hasText && (
          <div style={{ font: '600 13px/1.5 var(--font-sans)', marginBottom: hasPlan ? 10 : undefined }}>
            {message.text}
          </div>
        )}

        {hasPlan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {days.map((day) => (
              <div key={day.date} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {days.length > 1 && (
                  <div
                    style={{
                      font: '800 9.5px var(--font-sans)',
                      letterSpacing: '.6px',
                      color: 'var(--text-dim)',
                    }}
                  >
                    {day.label}
                  </div>
                )}
                {day.tasks.map((t, i) => (
                  <TaskCard key={`${day.date}-${i}-${t.title}`} {...t} />
                ))}
              </div>
            ))}
          </div>
        )}

        {hasPlan && (
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {message.planFooter && (
              <div style={{ font: '600 11.5px/1.5 var(--font-sans)', color: 'var(--text-secondary)' }}>
                {message.planFooter}
              </div>
            )}

            {appliedCount === undefined ? (
              <Button
                variant="smallInk"
                icon="event_available"
                loading={applying}
                disabled={applyDisabled}
                onClick={onApply}
                style={{ alignSelf: 'flex-start' }}
              >
                Add to plan
              </Button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  font: '800 11.5px var(--font-sans)',
                  color: 'var(--accent)',
                }}
              >
                <Icon name="check_circle" size={15} color="var(--accent)" />
                Added {appliedCount} {appliedCount === 1 ? 'task' : 'tasks'} to your plan
              </div>
            )}

            {failure && (
              <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ font: '700 11px/1.5 var(--font-sans)', color: 'var(--aq-danger)' }}>
                  {failure.message}
                </span>
                {failure.details.map((line) => (
                  <span key={line} style={{ font: '600 10.5px/1.5 var(--font-sans)', color: 'var(--aq-danger)' }}>
                    {line}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** The turn Ada is composing — the POST blocks until the whole reply is ready. */
function Thinking() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <AdaCube size={28} expr="focused" />
      <div
        role="status"
        aria-label="Ada is thinking"
        style={{
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-card)',
          borderRadius: 16,
          borderBottomLeftRadius: 5,
          padding: '15px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--text-dim)',
              animation: `aqShimmer 1.1s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function HeaderButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
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
      <Icon name={icon} size={19} color="var(--text-secondary)" />
    </button>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  onAttach,
  placeholder,
  sunken = false,
  sendSize = 40,
  disabled = false,
  note,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onAttach: () => void;
  placeholder: string;
  sunken?: boolean;
  sendSize?: number;
  disabled?: boolean;
  /** Inline failure / explanation drawn under the pill. */
  note?: ComposerNote | null;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ width: '100%', ...style }}>
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: sunken ? 'var(--surface-page)' : 'var(--surface-card)',
          boxShadow: sunken ? undefined : 'var(--shadow-card)',
          borderRadius: 100,
          padding: '8px 8px 8px 18px',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={disabled}
          placeholder={disabled ? 'Ada is thinking…' : placeholder}
          aria-label="Message Ada"
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
          onClick={onAttach}
          aria-label="Attach a file"
          className="aq-press focus-ring"
          style={{ display: 'flex', borderRadius: 6 }}
        >
          <Icon name="attach_file" size={20} color="var(--text-secondary)" />
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          aria-label="Send"
          className="aq-press aq-darken focus-ring"
          style={{
            width: sendSize,
            height: sendSize,
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
      {note && (
        <div
          role={note.tone === 'error' ? 'alert' : 'status'}
          style={{
            font: '700 11px/1.45 var(--font-sans)',
            color: note.tone === 'error' ? 'var(--aq-danger)' : 'var(--text-secondary)',
            margin: '8px 0 0 18px',
            textAlign: 'left',
          }}
        >
          {note.text}
        </div>
      )}
    </div>
  );
}

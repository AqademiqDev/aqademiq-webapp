import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import AdaCube from '../../components/brand/AdaCube';
import Icon from '../../components/core/Icon';
import TaskCard from '../../components/content/TaskCard';
import GuestLocked from './GuestLocked';
import { ADA_PROMPTS, ADA_REPLIES, CHATS, DEFAULT_CHAT_ID, chatById, type ChatMessage } from '../../data/chats';
import { useAppState } from '../../hooks/useAppState';

/* ─────────────────────────────────────────────────────────────────────────
   Section 05 — Ada AI (frames 05.1–05.3).

   05.1 intro · 05.2 active chat · 05.3 the two-pane history view. The history
   sidebar is toggled by the header's view_sidebar / menu_open buttons and by
   the /ada/:chatId route.
   ───────────────────────────────────────────────────────────────────────── */

export default function Ada({ historyOpen = false }: { historyOpen?: boolean }) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { guest } = useAppState();

  const [showHistory, setShowHistory] = useState(historyOpen);
  const [activeId, setActiveId] = useState(chatId ?? DEFAULT_CHAT_ID);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [replyCount, setReplyCount] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);

  const chat = chatById(activeId);
  // The intro screen shows until the first message is sent in a fresh chat.
  const thread = showHistory || messages.length ? (showHistory ? chat?.messages ?? [] : messages) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [thread.length]);

  if (guest) return <GuestLocked />;

  function send(text: string) {
    const body = text.trim();
    if (!body) return;
    setDraft('');
    setMessages((m) => [...m, { id: `u${m.length}`, from: 'user', text: body }]);
    // Ada's reply lands after a short delay, as the prototype does (README §6).
    window.setTimeout(() => {
      const reply = ADA_REPLIES[replyCount % ADA_REPLIES.length];
      setReplyCount((c) => c + 1);
      setMessages((m) => [...m, { ...reply, id: `a${m.length}` }]);
    }, 650);
  }

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
            <button
              type="button"
              onClick={() => {
                setShowHistory(false);
                setMessages([]);
                navigate('/ada');
              }}
              aria-label="New chat"
              className="aq-press focus-ring"
              style={{ display: 'flex', borderRadius: 6 }}
            >
              <Icon name="edit_square" size={20} color="var(--accent)" />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {CHATS.map((c) => {
              const on = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveId(c.id);
                    navigate(`/ada/${c.id}`, { replace: true });
                  }}
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
                    {c.title}
                  </div>
                  <div
                    style={{
                      font: '600 10px var(--font-sans)',
                      color: on ? 'var(--text-secondary)' : 'var(--text-dim)',
                      marginTop: 2,
                    }}
                  >
                    {c.meta}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main style={{ flex: 1, padding: '24px 26px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ font: '800 15px var(--font-sans)', marginBottom: 16 }}>{chat?.title}</div>
          <div className="aq-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}>
            {thread.map((m) => (
              <Bubble key={m.id} message={m} />
            ))}
            <div ref={endRef} />
          </div>
          <Composer
            value={draft}
            onChange={setDraft}
            onSend={() => send(draft)}
            placeholder="Reply…"
            sunken
            sendSize={38}
          />
        </main>
      </div>
    );
  }

  /* ── 05.1 intro / 05.2 active chat ─────────────────────────────── */
  const empty = thread.length === 0;

  /* 05.1 puts the header row at the full body width; 05.2 nests it inside the
     680px column with the chat title between the two buttons. */
  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, width: '100%' }}>
      <HeaderButton
        icon="view_sidebar"
        label="Show chat history"
        onClick={() => {
          setShowHistory(true);
          navigate(`/ada/${activeId}`);
        }}
      />
      {empty ? <div style={{ flex: 1 }} /> : <div style={{ flex: 1, font: '800 15px var(--font-sans)' }}>{chat?.title}</div>}
      <HeaderButton icon="edit_note" label="New chat" onClick={() => setMessages([])} />
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
                  onClick={() => send(p)}
                  className="aq-press focus-ring"
                  style={{
                    padding: '9px 16px',
                    borderRadius: 100,
                    border: '1.5px solid rgba(107,92,240,.3)',
                    font: '700 12px var(--font-sans)',
                    color: 'var(--accent)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => send(draft)}
              placeholder="What's on your mind?"
              style={{ maxWidth: 560 }}
            />
          </div>
        ) : (
          <>
            <div
              className="aq-scroll"
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto' }}
            >
              {thread.map((m) => (
                <Bubble key={m.id} message={m} />
              ))}
              <div ref={endRef} />
            </div>
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => send(draft)}
              placeholder="Ask Ada to plan, break down, or reschedule…"
              style={{ marginTop: 14 }}
            />
          </>
        )}
      </div>
    </main>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isAda = message.from === 'ada';
  const hasTasks = !!message.tasks?.length;

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
          maxWidth: hasTasks ? '80%' : '74%',
          background: isAda ? 'var(--surface-card)' : 'var(--surface-ink)',
          boxShadow: isAda ? 'var(--shadow-card)' : undefined,
          color: isAda ? undefined : '#fff',
          borderRadius: 16,
          ...(isAda ? { borderBottomLeftRadius: 5 } : { borderBottomRightRadius: 5 }),
          padding: hasTasks ? '14px 16px' : '12px 15px',
          textAlign: 'left',
        }}
      >
        <div style={{ font: '600 13px/1.5 var(--font-sans)', marginBottom: hasTasks ? 10 : undefined }}>
          {message.text}
        </div>
        {hasTasks && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {message.tasks!.map((t) => (
              <TaskCard key={t.title} {...t} />
            ))}
          </div>
        )}
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
  placeholder,
  sunken = false,
  sendSize = 40,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  sunken?: boolean;
  sendSize?: number;
  style?: React.CSSProperties;
}) {
  return (
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
        ...style,
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
        placeholder={placeholder}
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
      <button type="button" aria-label="Attach a file" className="aq-press focus-ring" style={{ display: 'flex', borderRadius: 6 }}>
        <Icon name="attach_file" size={20} color="var(--text-secondary)" />
      </button>
      <button
        type="button"
        onClick={onSend}
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
  );
}

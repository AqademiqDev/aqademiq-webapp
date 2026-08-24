import { useState } from 'react';

import Button from '../../../components/core/Button';
import Icon from '../../../components/core/Icon';
import Modal from '../../../components/overlay/Modal';
import { EyebrowLabel } from '../../../components/core/Misc';
import { EmptyState, ErrorState, Loading, errorMessage } from '../../../components/core/Async';
import { PanelHead } from '../Settings';
import { useAdaMemories, useClearAdaMemories, useDeleteAdaMemory } from '../../../hooks/data';
import type { AdaMemoryDto, AdaMemoryKind } from '../../../lib/api';

/* Settings → What Ada remembers.

   Ada can already recall and forget these on its own, but that is not enough:
   things held about a person should be inspectable and removable by them
   directly, not only by asking the assistant that wrote them. That matters most
   for the ones Ada *inferred*, which the user never explicitly agreed to — so
   every row says which kind it is.

   Read and delete only; the agent writes them while it works. */

/** Ordered so sections keep a stable position as memories come and go. */
const KINDS: { kind: AdaMemoryKind; heading: string }[] = [
  { kind: 'preference', heading: 'How you like to work' },
  { kind: 'constraint', heading: 'Your commitments' },
  { kind: 'pattern', heading: 'Patterns Ada has noticed' },
  { kind: 'goal', heading: "What you're working toward" },
  { kind: 'fact', heading: 'Other things Ada knows' },
];

const ORIGIN_LABEL: Record<string, string> = {
  user: 'You told Ada this',
  ada: 'Ada worked this out',
};

export default function Memories() {
  const memories = useAdaMemories();
  const remove = useDeleteAdaMemory();
  const clear = useClearAdaMemories();
  const [confirmClear, setConfirmClear] = useState(false);

  const rows = memories.data ?? [];
  const busy = remove.isPending || clear.isPending;

  async function runClear() {
    try {
      await clear.mutateAsync();
      setConfirmClear(false);
    } catch {
      /* surfaced inline in the sheet */
    }
  }

  return (
    <>
      <PanelHead
        title="What Ada remembers"
        sub="Carried between conversations so you don't repeat yourself."
        gap={16}
      />

      <div
        style={{
          font: '600 12px/1.6 var(--font-sans)',
          color: 'var(--text-secondary)',
          marginTop: -6,
          marginBottom: 22,
          maxWidth: 560,
        }}
      >
        Some of these you told Ada; some it worked out from how you study. Remove anything
        you&apos;d rather it forgot.
      </div>

      {memories.isLoading && <Loading label="Loading memories…" padding="10px 0" />}
      {memories.isError && (
        <ErrorState error={memories.error} onRetry={memories.refetch} padding="10px 0" />
      )}

      {!memories.isLoading && !memories.isError && rows.length === 0 && (
        <EmptyState
          icon="auto_awesome"
          title="Ada hasn't remembered anything yet"
          caption="As you plan together, the things worth keeping in mind will show up here."
          padding="10px 0"
        />
      )}

      {rows.length > 0 && (
        <div style={{ maxWidth: 560 }}>
          {KINDS.map(({ kind, heading }) => {
            const group = rows.filter((m) => m.kind === kind);
            if (!group.length) return null;
            return (
              <div key={kind} style={{ marginBottom: 22 }}>
                <EyebrowLabel style={{ marginBottom: 8 }}>{heading}</EyebrowLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.map((m) => (
                    <MemoryRow
                      key={m.id}
                      memory={m}
                      busy={remove.isPending && remove.variables === m.id}
                      disabled={busy}
                      onForget={() => remove.mutate(m.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {remove.isError && (
            <div
              role="alert"
              style={{ font: '700 11px var(--font-sans)', color: 'var(--aq-danger)', marginBottom: 12 }}
            >
              {errorMessage(remove.error)}
            </div>
          )}

          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={busy}
            className="focus-ring"
            style={{
              font: '700 12.5px var(--font-sans)',
              color: 'var(--aq-danger)',
              borderRadius: 4,
              opacity: busy ? 0.45 : 1,
            }}
          >
            Forget everything
          </button>
        </div>
      )}

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Forget everything?"
        maxWidth={420}
        panelStyle={{ padding: '24px 26px' }}
      >
        {/* Says what actually happens rather than only warning. A confirm that
            only threatens makes people hesitate over something they are
            entitled to do. */}
        <div
          style={{
            font: '600 12.5px/1.6 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginTop: -6,
            marginBottom: 20,
          }}
        >
          Ada will forget all {rows.length} thing{rows.length === 1 ? '' : 's'} it knows about how
          you work. It&apos;ll still help you plan — it just won&apos;t remember any of this next
          time.
        </div>

        {clear.isError && (
          <div
            role="alert"
            style={{ font: '600 11px/1.5 var(--font-sans)', color: 'var(--aq-danger)', marginBottom: 14 }}
          >
            {errorMessage(clear.error)}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            variant="ghost"
            onClick={() => setConfirmClear(false)}
            disabled={clear.isPending}
            style={{ padding: '0 22px' }}
          >
            Keep them
          </Button>
          <Button onClick={() => void runClear()} loading={clear.isPending} style={{ flex: 1 }}>
            Forget everything
          </Button>
        </div>
      </Modal>
    </>
  );
}

function MemoryRow({
  memory,
  busy,
  disabled,
  onForget,
}: {
  memory: AdaMemoryDto;
  busy: boolean;
  disabled: boolean;
  onForget: () => void;
}) {
  const inferred = memory.source === 'ada';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: 'var(--surface-page)',
        borderRadius: 12,
        padding: '12px 14px',
        opacity: busy ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ font: '600 12.5px/1.5 var(--font-sans)', marginBottom: 4 }}>
          {memory.content}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            font: '600 10px var(--font-sans)',
            color: inferred ? 'var(--accent)' : 'var(--text-dim)',
          }}
        >
          {inferred && <Icon name="auto_awesome" size={12} color="var(--accent)" />}
          {ORIGIN_LABEL[memory.source] ?? ORIGIN_LABEL.ada}
        </div>
      </div>

      <button
        type="button"
        onClick={onForget}
        disabled={disabled}
        aria-label={`Forget: ${memory.content}`}
        title="Forget this"
        className="aq-press focus-ring"
        style={{ display: 'flex', borderRadius: '50%', flexShrink: 0, marginTop: 2 }}
      >
        <Icon name="delete_outline" size={17} color="var(--text-dim)" />
      </button>
    </div>
  );
}

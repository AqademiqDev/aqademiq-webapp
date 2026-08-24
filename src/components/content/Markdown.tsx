import { Fragment, type ReactNode } from 'react';

/* A small Markdown subset for Ada's replies.

   The model answers in Markdown — bold labels, dashed lists, the occasional
   heading — and the chat rendered `message.text` straight into a div, so people
   read literal `- **Plan & Schedule Tasks**:` with every newline collapsed.

   Deliberately hand-rolled rather than pulling in a parser: this needs six
   constructs, and the alternative is shipping a Markdown library plus a
   sanitiser to the browser for them.

   Everything here builds React elements. Nothing reaches
   `dangerouslySetInnerHTML`, so a reply containing HTML — or a prompt that
   talked the model into emitting some — is shown as text and cannot execute. */

interface Block {
  kind: 'p' | 'ul' | 'ol' | 'h';
  lines: string[];
  level?: number;
}

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*(#{1,4})\s+(.*)$/;

function toBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  // The model often writes a whole list on one line — split those out so a
  // reply that never wrapped still reads as a list.
  const normalised = src
    .replace(/\r\n?/g, '\n')
    .replace(/\s+-\s+\*\*/g, '\n- **')
    .split('\n');

  for (const raw of normalised) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      blocks.push({ kind: 'p', lines: [] });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: 'h', lines: [heading[2]], level: heading[1].length });
      continue;
    }
    const bullet = BULLET.exec(line);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'ul') last.lines.push(bullet[1]);
      else blocks.push({ kind: 'ul', lines: [bullet[1]] });
      continue;
    }
    const numbered = NUMBERED.exec(line);
    if (numbered) {
      const last = blocks[blocks.length - 1];
      if (last?.kind === 'ol') last.lines.push(numbered[1]);
      else blocks.push({ kind: 'ol', lines: [numbered[1]] });
      continue;
    }
    const last = blocks[blocks.length - 1];
    if (last?.kind === 'p' && last.lines.length) last.lines.push(line);
    else blocks.push({ kind: 'p', lines: [line] });
  }
  return blocks.filter((b) => b.lines.length);
}

/** `**bold**`, `*italic*`, `_italic_` and `` `code` `` — nested one level deep. */
function inline(text: string, keyPrefix = ''): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|(?<![*\w])[*_][^*_\n]+[*_](?![*\w]))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith('**')) {
      out.push(
        <strong key={key} style={{ fontWeight: 800 }}>
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      out.push(
        <code
          key={key}
          style={{
            font: '600 12px var(--font-mono)',
            background: 'var(--surface-page)',
            borderRadius: 5,
            padding: '1px 5px',
          }}
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      out.push(<em key={key}>{token.slice(1, -1)}</em>);
    }
    last = m.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text }: { text: string }) {
  const blocks = toBlocks(text);

  return (
    <>
      {blocks.map((b, i) => {
        const key = `b${i}`;
        if (b.kind === 'h') {
          return (
            <div
              key={key}
              style={{
                font: `800 ${b.level === 1 ? 15 : 13.5}px var(--font-sans)`,
                margin: i ? '10px 0 4px' : '0 0 4px',
              }}
            >
              {inline(b.lines[0], key)}
            </div>
          );
        }
        if (b.kind === 'ul' || b.kind === 'ol') {
          return (
            <ul
              key={key}
              style={{
                listStyle: 'none',
                margin: i ? '6px 0' : '0 0 6px',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 5,
              }}
            >
              {b.lines.map((line, n) => (
                <li key={`${key}-${n}`} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ opacity: 0.55, flexShrink: 0 }}>
                    {b.kind === 'ol' ? `${n + 1}.` : '•'}
                  </span>
                  <span>{inline(line, `${key}-${n}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={key} style={{ margin: i ? '6px 0 0' : 0 }}>
            {b.lines.map((line, n) => (
              <Fragment key={`${key}-${n}`}>
                {n > 0 && <br />}
                {inline(line, `${key}-${n}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

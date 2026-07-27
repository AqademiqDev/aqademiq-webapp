import { useNavigate, useParams } from 'react-router-dom';
import { Content } from '../../layouts/AppShell';
import AdaCube from '../../components/brand/AdaCube';
import Card from '../../components/core/Card';
import { EyebrowLabel } from '../../components/core/Misc';
import { MICROTASKS } from '../../data/tasks';

/* Frame 02.5 — Task → microtasks (Ada). Centred, max-width 640. */

export default function Microtasks() {
  const { id } = useParams();
  const navigate = useNavigate();
  const detail = MICROTASKS[id ?? ''] ?? MICROTASKS.t4;

  return (
    <Content padding="24px 26px" style={{ alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ font: '800 20px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 16 }}>
          {detail.title}
        </div>

        <Card padding="16px 18px" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <AdaCube size={30} expr="focused" />
            <span style={{ flex: 1, font: '600 12px/1.5 var(--font-sans)' }}>{detail.note}</span>
          </div>
        </Card>

        <EyebrowLabel style={{ marginBottom: 10 }}>MICROTASKS · {detail.subject}</EyebrowLabel>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {detail.steps.map((s) => {
            const isDone = s.state === 'done';
            const isCurrent = s.state === 'current';
            return (
              <Card
                key={s.title}
                padding="13px 15px"
                hoverable
                onClick={isCurrent ? () => navigate('/focus') : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: isCurrent ? '1.5px solid var(--accent)' : undefined,
                  cursor: isCurrent ? 'pointer' : undefined,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: `2px solid ${isDone || isCurrent ? 'var(--accent)' : '#d6d3ce'}`,
                    background: isDone ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {isDone && '✓'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      font: '800 13px var(--font-sans)',
                      ...(isDone ? { textDecoration: 'line-through', color: 'var(--text-dim)' } : null),
                    }}
                  >
                    {s.title}
                  </div>
                  {s.sub && (
                    <div style={{ font: '600 9.5px var(--font-sans)', color: 'var(--accent)' }}>{s.sub}</div>
                  )}
                </div>
                <span style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-dim)' }}>{s.dur}</span>
              </Card>
            );
          })}
        </div>
      </div>
    </Content>
  );
}

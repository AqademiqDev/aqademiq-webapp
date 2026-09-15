import Icon from '../../../components/core/Icon';
import Toggle from '../../../components/core/Toggle';
import { useWeeklyReportEnabled } from '../../../hooks/useWeeklyReportEnabled';
import { ReportCopy } from '../../report/reportCopy';

/* Settings → Weekly report. Port of the mobile app's `report_settings_screen.dart`.

   The toggle is the point of the panel. A weekly report you cannot decline is
   one that can reach you every seven days forever, so this is one click, honoured
   immediately — no confirmation, no win-back, no re-prompt later.

   The list under it is not marketing. Each row is a commitment enforced in code,
   and stating them where they can be read is what makes them worth anything:

   * Notify you — nothing in this feature schedules a notification. Pushing on
     good weeks and staying quiet on bad ones turns the missing one into a verdict.
   * Open on a past week — the report's data hook takes no week, so no screen can
     name an older one.
   * Show what you wrote — reflections are never rendered, exported or read into
     the report. The app cannot tell "tired today" from something much worse, so
     it must not amplify, quote or interpret any of it. */

const NEVER: { icon: string; title: string; sub: string }[] = [
  { icon: 'notifications_off', title: ReportCopy.neverNotify, sub: ReportCopy.neverNotifySub },
  { icon: 'history_toggle_off', title: ReportCopy.neverBackBrowse, sub: ReportCopy.neverBackBrowseSub },
  { icon: 'visibility_off', title: ReportCopy.neverShowWriting, sub: ReportCopy.neverShowWritingSub },
];

export default function WeeklyReportPanel() {
  const [enabled, setEnabled] = useWeeklyReportEnabled();

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ font: '800 17px var(--font-sans)', marginBottom: 22 }}>{ReportCopy.settingsTitle}</div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 14px 14px 16px',
          background: 'var(--surface-card)',
          borderRadius: 18,
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ flex: 1, font: '700 15px var(--font-sans)', color: 'var(--text-primary)' }}>
          {ReportCopy.settingsToggle}
        </div>
        <Toggle checked={enabled} onChange={setEnabled} aria-label={ReportCopy.settingsToggle} />
      </div>

      <div
        style={{
          marginTop: 12,
          font: '400 12.5px/1.45 var(--font-sans)',
          color: 'var(--text-secondary)',
        }}
      >
        {ReportCopy.settingsToggleNote}
      </div>

      <div
        style={{
          marginTop: 26,
          marginBottom: 12,
          font: '800 15px var(--font-sans)',
          color: 'var(--text-primary)',
        }}
      >
        {ReportCopy.neverDoesTitle}
      </div>

      <div style={{ background: 'var(--surface-card)', borderRadius: 18, boxShadow: 'var(--shadow-card)' }}>
        {NEVER.map((row, i) => (
          <div key={row.title}>
            {i > 0 && <div style={{ height: 1, marginLeft: 54, background: 'var(--border-hairline)' }} />}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: `15px 16px ${i === NEVER.length - 1 ? 16 : 15}px`,
              }}
            >
              <Icon name={row.icon} size={20} color="var(--text-primary)" style={{ marginTop: 2 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: '800 14.5px var(--font-sans)', color: 'var(--text-primary)' }}>{row.title}</div>
                <div
                  style={{
                    marginTop: 3,
                    font: '400 12px/1.35 var(--font-sans)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {row.sub}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

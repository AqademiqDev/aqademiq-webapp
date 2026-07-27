import { useNavigate } from 'react-router-dom';
import Button from '../../components/core/Button';
import Icon from '../../components/core/Icon';
import Modal from '../../components/overlay/Modal';

/* Frame 00b.5 — After session → save prompt. Bottom-anchored card over the
   blurred Session-done screen, max-width 460. */

export default function GuestSavePrompt({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideClose
      align="bottom"
      maxWidth={460}
      padding="24px 26px"
      panelStyle={{ textAlign: 'center' }}
      scrimStyle={{ backdropFilter: 'blur(3px)' }}
      aria-label="Save this session"
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--accent-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
        }}
      >
        <Icon name="bookmark_added" size={26} color="var(--accent)" />
      </div>

      <div style={{ font: '800 19px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 6 }}>
        Don&apos;t lose this session
      </div>
      <div
        style={{
          font: '600 12.5px/1.6 var(--font-sans)',
          color: 'var(--text-secondary)',
          marginBottom: 20,
        }}
      >
        You&apos;re in guest mode, so this won&apos;t be saved. Create an account to keep your streak &amp; history.
      </div>

      <Button
        onClick={() => navigate('/signup')}
        style={{ maxWidth: 340, width: '100%', margin: '0 auto 10px' }}
      >
        Create account &amp; save →
      </Button>
      <button
        type="button"
        onClick={onClose}
        className="focus-ring"
        style={{ font: '600 11.5px var(--font-sans)', color: 'var(--text-secondary)', borderRadius: 4 }}
      >
        Not now
      </button>
    </Modal>
  );
}

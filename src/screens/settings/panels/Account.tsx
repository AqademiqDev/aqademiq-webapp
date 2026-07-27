import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AdaCube, { type CubeExpr } from '../../../components/brand/AdaCube';
import Button from '../../../components/core/Button';
import Icon from '../../../components/core/Icon';
import Input from '../../../components/core/Input';
import Modal from '../../../components/overlay/Modal';
import { ErrorState, Loading, errorMessage } from '../../../components/core/Async';
import { EyebrowLabel } from '../../../components/core/Misc';
import { InlineError, PanelHead, ValueRow } from '../Settings';
import { useAuth } from '../../../hooks/useAuth';
import { useDeleteAccount, useExportData, useProfile, useUpdateProfile } from '../../../hooks/data';
import { isEmail, isPassword, MIN_PASSWORD } from '../../../lib/validate';

/* Frames 13.4 (Profile & Account) + 13.6 / 13.7 / 13.8 / 13.9 sheets. */

type Sheet = null | 'name' | 'email' | 'password' | 'delete';

/** The avatar the frames draw is index 0; the rest cycle the cube's faces. */
const AVATARS: CubeExpr[] = ['happy', 'smile', 'focused', 'neutral', 'meh'];

/** 13.4 draws AGE, which the API stores as a date of birth. */
function ageLabel(dob: string | null | undefined): string {
  if (!dob) return '—';
  const born = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(born.getTime())) return '—';
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const months = now.getMonth() - born.getMonth();
  if (months < 0 || (months === 0 && now.getDate() < born.getDate())) years -= 1;
  return years >= 0 && years < 130 ? String(years) : '—';
}

export default function Account() {
  const navigate = useNavigate();
  const { isGuest, busy, linkGuestAccount, signOut } = useAuth();

  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const exportData = useExportData();

  const [sheet, setSheet] = useState<Sheet>(null);
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [leaving, setLeaving] = useState(false);

  const name = profile.data?.name ?? '';
  const email = profile.data?.email ?? '';
  const avatarIndex = Math.abs(profile.data?.avatar_index ?? 0) % AVATARS.length;

  const close = () => setSheet(null);

  function openName() {
    setFullName(name);
    setDisplayName(name.split(' ')[0] ?? '');
    setNameError('');
    setSheet('name');
  }

  async function saveName() {
    if (!fullName.trim()) {
      setNameError('Your name can’t be empty.');
      return;
    }
    try {
      // no endpoint: the profile has no separate display name — DISPLAY NAME
      // stays a local convenience derived from the full name.
      await updateProfile.mutateAsync({ name: fullName.trim() });
      close();
    } catch (e) {
      setNameError(errorMessage(e));
    }
  }

  /** Guests upgrade in place: the same auth user gains an email identity. */
  async function linkAccount() {
    if (!isEmail(newEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    if (!isPassword(linkPassword)) {
      setEmailError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }
    try {
      await linkGuestAccount(newEmail.trim(), linkPassword);
      close();
      navigate('/verify', { state: { email: newEmail.trim(), mode: 'link' } });
    } catch (e) {
      setEmailError(errorMessage(e));
    }
  }

  async function leave() {
    setLeaving(true);
    try {
      await signOut();
      navigate('/welcome');
    } finally {
      setLeaving(false);
    }
  }

  async function removeAccount() {
    try {
      await deleteAccount.mutateAsync();
      await signOut();
      navigate('/welcome');
    } catch {
      /* the failure renders under the button */
    }
  }

  return (
    <>
      <PanelHead
        title="Profile & Account"
        sub="How you show up in Aqademiq, and your sign-in details."
        gap={20}
      />

      {profile.isLoading && <Loading label="Loading your account…" padding="10px 0" />}
      {profile.isError && <ErrorState error={profile.error} onRetry={profile.refetch} padding="10px 0" />}

      {profile.data && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AdaCube size={44} expr={AVATARS[avatarIndex]} cheeks />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {/* no endpoint: there is no avatar upload — the profile stores an
                  avatar index, so this steps through the drawn cube faces. */}
              <button
                type="button"
                onClick={() => updateProfile.mutate({ avatar_index: (avatarIndex + 1) % AVATARS.length })}
                disabled={updateProfile.isPending}
                className="aq-press aq-darken focus-ring"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'var(--surface-page)',
                  borderRadius: 100,
                  padding: '8px 14px',
                  font: '800 11.5px var(--font-sans)',
                  opacity: updateProfile.isPending ? 0.45 : undefined,
                }}
              >
                <Icon name="photo_camera" size={15} />
                Change avatar
              </button>
              <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-dim)' }}>
                PNG or JPG, up to 4 MB
              </div>
            </div>
          </div>

          <EyebrowLabel style={{ marginBottom: 4 }}>PROFILE</EyebrowLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 18, maxWidth: 560 }}>
            <ValueRow label="FULL NAME" value={name || '—'} action="Edit" onAction={openName} />
            <ValueRow
              label="DISPLAY NAME"
              value={name.split(' ')[0] || '—'}
              action="Edit"
              onAction={openName}
            />
            {/* no drawn editor: 13.6 has no date-of-birth field, so AGE reads
                from the profile and its action opens the same profile sheet. */}
            <ValueRow
              label="AGE"
              value={ageLabel(profile.data.date_of_birth)}
              action="Edit"
              onAction={openName}
              last
            />
          </div>

          <EyebrowLabel style={{ marginBottom: 4 }}>ACCOUNT</EyebrowLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22, maxWidth: 560 }}>
            {/* A guest changes their email by *claiming* the account, which is a
                real endpoint. For a signed-in user the only path would be
                `linkGuestAccount`, which also overwrites the password — so the
                row is read-only rather than pretending to work. */}
            <ValueRow
              label="EMAIL"
              value={email || (isGuest ? 'Guest — not saved yet' : '—')}
              action={isGuest ? 'Change' : undefined}
              onAction={
                isGuest
                  ? () => {
                      setNewEmail('');
                      setLinkPassword('');
                      setEmailError('');
                      setSheet('email');
                    }
                  : undefined
              }
            />
            <ValueRow
              label="PASSWORD"
              value="••••••••••"
              action="Change"
              onAction={() => setSheet('password')}
            />
            {/* The export endpoint has no drawn row; it reuses this pattern. */}
            <ValueRow
              label="YOUR DATA"
              value="Everything you've saved"
              action={exportData.isPending ? 'Exporting…' : 'Export'}
              onAction={() => exportData.mutate()}
              disabled={exportData.isPending}
              last
            />
          </div>

          <InlineError error={updateProfile.error ?? exportData.error} style={{ maxWidth: 560, marginBottom: 10 }} />
        </>
      )}

      <div style={{ display: 'flex', gap: 12, maxWidth: 420 }}>
        <Button
          variant="ghost"
          icon="logout"
          iconSize={17}
          onClick={leave}
          loading={leaving}
          style={{ flex: 1, color: '#e85476' }}
        >
          Sign out
        </Button>
        <Button
          variant="ghost"
          icon="delete_outline"
          iconSize={17}
          onClick={() => setSheet('delete')}
          style={{ flex: 1, color: 'var(--text-dim)' }}
        >
          Delete account
        </Button>
      </div>

      {/* ── 13.6 Edit name ─────────────────────────────────────────── */}
      <Modal open={sheet === 'name'} onClose={close} title="Edit name" maxWidth={460} panelStyle={{ padding: '24px 26px' }}>
        <Input
          label="FULL NAME"
          value={fullName}
          focusedStyle
          error={nameError}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameError('');
          }}
          wrapperStyle={{ marginBottom: 16 }}
        />
        <Input
          label="DISPLAY NAME"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          wrapperStyle={{ marginBottom: 22 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={close} style={{ padding: '0 22px' }}>
            Cancel
          </Button>
          <Button onClick={saveName} loading={updateProfile.isPending} style={{ flex: 1 }}>
            Save changes
          </Button>
        </div>
      </Modal>

      {/* ── 13.8 Change email — the guest "claim this account" path ─── */}
      <Modal open={sheet === 'email'} onClose={close} title="Change email" maxWidth={460} panelStyle={{ padding: '24px 26px' }}>
        <div
          style={{
            font: '600 12px/1.5 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginTop: -6,
            marginBottom: 18,
          }}
        >
          We&apos;ll send a confirmation link to the new address before it&apos;s used to sign in.
        </div>
        <Input
          label="CURRENT"
          value={email || 'Guest'}
          readOnly
          style={{ color: 'var(--text-dim)' }}
          wrapperStyle={{ marginBottom: 14 }}
        />
        <Input
          label="NEW EMAIL"
          type="email"
          value={newEmail}
          focusedStyle
          onChange={(e) => {
            setNewEmail(e.target.value);
            setEmailError('');
          }}
          wrapperStyle={{ marginBottom: 14 }}
        />
        {/* Linking sets the password for the account being claimed, so the
            drawn sheet carries one field more in this state. */}
        <Input
          label="PASSWORD"
          type="password"
          placeholder={`At least ${MIN_PASSWORD} characters`}
          value={linkPassword}
          error={emailError}
          onChange={(e) => {
            setLinkPassword(e.target.value);
            setEmailError('');
          }}
          wrapperStyle={{ marginBottom: 22 }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" onClick={close} style={{ padding: '0 22px' }}>
            Cancel
          </Button>
          <Button onClick={linkAccount} loading={busy} style={{ flex: 1 }}>
            Send confirmation
          </Button>
        </div>
      </Modal>

      {/* ── 13.9 Change password ───────────────────────────────────── */}
      <ChangePassword open={sheet === 'password'} onClose={close} />

      {/* ── 13.7 Delete account ────────────────────────────────────── */}
      <Modal
        open={sheet === 'delete'}
        onClose={close}
        hideClose
        maxWidth={400}
        padding="24px 26px"
        panelStyle={{ textAlign: 'center' }}
        aria-label="Delete account"
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#e8547618',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
          }}
        >
          <Icon name="delete_outline" size={26} color="#e85476" />
        </div>
        <div style={{ font: '800 19px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 8 }}>
          Delete account?
        </div>
        <div
          style={{
            font: '600 12.5px/1.6 var(--font-sans)',
            color: 'var(--text-secondary)',
            marginBottom: 22,
          }}
        >
          This permanently erases your subjects, plans, focus history and streak. This can&apos;t be undone.
        </div>
        <Button
          variant="destructive"
          full
          onClick={removeAccount}
          loading={deleteAccount.isPending}
          style={{ marginBottom: 10 }}
        >
          Delete my account
        </Button>
        <InlineError error={deleteAccount.error} style={{ marginBottom: 10, textAlign: 'center' }} />
        <Button variant="ghost" full onClick={close}>
          Cancel
        </Button>
      </Modal>
    </>
  );
}

/* Frame 13.9 — Change password, with the drawn 4-segment strength meter. */
function ChangePassword({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { changePassword, busy } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [currentError, setCurrentError] = useState('');
  const [error, setError] = useState('');

  const score = Math.min(4, Math.floor(next.length / 3));
  const LABEL = ['', 'Weak', 'Fair', 'Strong', 'Very strong'][score];

  async function submit() {
    // no endpoint: Supabase updates the password on the live session, so there
    // is no old-password check — the drawn field is only a local confirmation.
    if (!current) {
      setCurrentError('Enter your current password.');
      return;
    }
    if (!isPassword(next)) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (next !== confirm) {
      setError('The two passwords don’t match.');
      return;
    }
    try {
      await changePassword(next);
      setCurrent('');
      setNext('');
      setConfirm('');
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Change password" maxWidth={460} panelStyle={{ padding: '24px 26px' }}>
      <Input
        label="CURRENT PASSWORD"
        type="password"
        placeholder="••••••••"
        value={current}
        error={currentError}
        onChange={(e) => {
          setCurrent(e.target.value);
          setCurrentError('');
        }}
        wrapperStyle={{ marginBottom: 13 }}
      />

      <Input
        label="NEW PASSWORD"
        type="password"
        value={next}
        focusedStyle={next.length > 0}
        onChange={(e) => {
          setNext(e.target.value);
          setError('');
        }}
        style={{ fontSize: 13, fontWeight: 600 }}
        wrapperStyle={{ marginBottom: 8 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
        <div
          style={{
            flex: 1,
            height: 5,
            borderRadius: 100,
            background: 'var(--surface-page)',
            display: 'flex',
            gap: 3,
            overflow: 'hidden',
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, background: i < score ? 'var(--accent)' : 'var(--border-hairline)' }} />
          ))}
        </div>
        <span style={{ font: '700 10px var(--font-sans)', color: 'var(--accent)', minWidth: 44 }}>{LABEL}</span>
      </div>

      <Input
        label="CONFIRM NEW PASSWORD"
        type="password"
        placeholder="Re-enter new password"
        value={confirm}
        error={error}
        onChange={(e) => {
          setConfirm(e.target.value);
          setError('');
        }}
        wrapperStyle={{ marginBottom: 22 }}
      />

      <Button full onClick={submit} loading={busy}>
        Update password
      </Button>
    </Modal>
  );
}

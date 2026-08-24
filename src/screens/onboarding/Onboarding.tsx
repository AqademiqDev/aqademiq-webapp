import { useEffect, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import AdaCube from '../../components/brand/AdaCube';
import Button, { Spinner } from '../../components/core/Button';
import Card from '../../components/core/Card';
import Icon from '../../components/core/Icon';
import Input from '../../components/core/Input';
import CodeInput from '../../components/core/CodeInput';
import { EyebrowLabel, ProgressBar, Slider, Stepper } from '../../components/core/Misc';
import MoodScale from '../../components/content/MoodScale';
import PrismRow from '../../components/content/PrismRow';
import { PRISM_MODES, type PrismModeId } from '../../components/brand/PrismGlyph';
import Modal from '../../components/overlay/Modal';
import { Dropzone, SwatchRow } from '../../components/content/FormBits';
import { EmptyState, errorMessage } from '../../components/core/Async';
import { SUBJECT_SWATCHES } from '../../data/subjects';
import {
  useCompleteOnboarding,
  usePrismModes,
  useUpdatePrismPreferences,
  useUploadStagedSyllabus,
  useValidateReferral,
} from '../../hooks/data';
import { useAppState } from '../../hooks/useAppState';
import { ApiError, type OnboardingInput } from '../../lib/api';
import { sizeLabel } from '../../lib/format';
import { LINKS } from '../../lib/links';

/* ─────────────────────────────────────────────────────────────────────────
   Section 01 — Onboarding (frames 01.1–01.11).

   One screen, step in local state (README §4.2). Every step is a centred
   column (max-width 500–520px): a progress row, a card, then a footer of
   ghost Back/Skip + primary Continue.

   Every answer stays local until the last step: `POST /onboarding/complete`
   is atomic and idempotent, so the whole wizard ships in one call rather than
   half-provisioning an account as the user walks through it.
   ───────────────────────────────────────────────────────────────────────── */

type StepId =
  | 'referral'
  | 'consent'
  | 'name'
  | 'age'
  | 'subjects'
  | 'feelings'
  | 'syllabus'
  | 'peak'
  | 'prism'
  | 'building';

const STEPS: { id: StepId; eyebrow: string; progress: number; maxWidth: number }[] = [
  { id: 'referral', eyebrow: 'GETTING STARTED', progress: 0.08, maxWidth: 500 },
  { id: 'consent', eyebrow: 'GETTING STARTED', progress: 0.08, maxWidth: 500 },
  { id: 'name', eyebrow: 'STEP 1 OF 7', progress: 0.14, maxWidth: 500 },
  { id: 'age', eyebrow: 'STEP 2 OF 7', progress: 0.28, maxWidth: 500 },
  { id: 'subjects', eyebrow: 'STEP 3 OF 7', progress: 0.42, maxWidth: 520 },
  { id: 'feelings', eyebrow: 'STEP 4 OF 7', progress: 0.56, maxWidth: 520 },
  { id: 'syllabus', eyebrow: 'STEP 5 OF 7', progress: 0.7, maxWidth: 520 },
  { id: 'peak', eyebrow: 'STEP 6 OF 7', progress: 0.84, maxWidth: 520 },
  { id: 'prism', eyebrow: 'STEP 7 OF 7', progress: 1, maxWidth: 520 },
  { id: 'building', eyebrow: '', progress: 1, maxWidth: 440 },
];

const PEAK_TIMES = [
  { id: 'morning', label: 'Morning', icon: 'wb_sunny' },
  { id: 'afternoon', label: 'Afternoon', icon: 'light_mode' },
  { id: 'evening', label: 'Evening', icon: 'wb_twilight' },
];

const REFERRAL_LENGTH = 5;
/** The dropzone advertises 20 MB — reject earlier than the signed PUT would. */
const MAX_SYLLABUS_BYTES = 20 * 1024 * 1024;

interface WizardSubject {
  id: string;
  code: string;
  name: string;
  credits: number;
  color: string;
}

interface StagedSyllabus {
  name: string;
  size: number;
  mimeType: string;
  /** Null until `uploads/staging/init` + PUT succeed (or if storage is off). */
  key: string | null;
}

const EMPTY_SUBJECT = { name: '', code: '', credits: '', professor: '', color: SUBJECT_SWATCHES[0] };

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `s${Date.now()}${Math.random()}`;

/* `consent_given` and `age` are required by the router even though the written
   contract lists them as optional — the deployed code wins (see routers/
   onboarding.ts), so they ride along with the documented fields. */
type OnboardingPayload = OnboardingInput & { consent_given: boolean; age: number };

export default function Onboarding() {
  const navigate = useNavigate();
  const { name: savedName } = useAppState();

  const validateReferral = useValidateReferral();
  const uploadSyllabus = useUploadStagedSyllabus();
  const complete = useCompleteOnboarding();
  const prismModes = usePrismModes();
  const updatePrism = useUpdatePrismPreferences();

  const [index, setIndex] = useState(0);
  const step = STEPS[index];

  const [referral, setReferral] = useState<string[]>(Array(REFERRAL_LENGTH).fill(''));
  const [referralError, setReferralError] = useState<string | null>(null);
  const [consent, setConsent] = useState<'yes' | 'no'>('yes');
  const [consentError, setConsentError] = useState<string | null>(null);
  const [name, setName] = useState(savedName);
  const [age, setAge] = useState(19);
  const [addOpen, setAddOpen] = useState(false);
  const [newSubject, setNewSubject] = useState(EMPTY_SUBJECT);
  const [subjects, setSubjects] = useState<WizardSubject[]>([]);
  const [feelingIndex, setFeelingIndex] = useState(0);
  const [feelings, setFeelings] = useState<Record<string, number>>({});
  const [syllabus, setSyllabus] = useState<StagedSyllabus | null>(null);
  const [syllabusError, setSyllabusError] = useState<string | null>(null);
  const [peak, setPeak] = useState('evening');
  const [goal, setGoal] = useState(14);
  const [prism, setPrism] = useState<PrismModeId>('deep');

  const next = () => setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  // The profile answers late for a reload mid-wizard; adopt its name only while
  // the field is still untouched.
  useEffect(() => {
    if (savedName) setName((n) => n || savedName);
  }, [savedName]);

  // The final step is a timed hand-off into the app (README §4.3). `onboarded`
  // is derived from the profile the mutation already invalidated — nothing to
  // set locally.
  useEffect(() => {
    if (step.id !== 'building') return;
    const t = window.setTimeout(() => navigate('/plan'), 2400);
    return () => window.clearTimeout(t);
  }, [step.id, navigate]);

  const referralCode = referral.join('').trim();
  const currentSubject = subjects[Math.min(feelingIndex, Math.max(subjects.length - 1, 0))];

  /* ── Step handlers ───────────────────────────────────────────────── */

  async function submitReferral() {
    if (!referralCode) {
      setReferralError(null);
      next();
      return;
    }
    if (referralCode.length < REFERRAL_LENGTH) {
      setReferralError(`Enter all ${REFERRAL_LENGTH} characters, or skip.`);
      return;
    }
    try {
      await validateReferral.mutateAsync(referralCode);
      setReferralError(null);
      next();
    } catch (err) {
      // 422 "Invalid referral code" / 400 own-code — catch the typo here rather
      // than losing the whole wizard to it at the final submit.
      setReferralError(errorMessage(err));
    }
  }

  function skipReferral() {
    setReferral(Array(REFERRAL_LENGTH).fill(''));
    setReferralError(null);
    next();
  }

  function submitConsent() {
    if (consent !== 'yes') {
      setConsentError('Consent is required to complete onboarding.');
      return;
    }
    setConsentError(null);
    next();
  }

  async function stageSyllabus(file: File | undefined) {
    if (!file) return;
    setSyllabusError(null);
    if (file.size > MAX_SYLLABUS_BYTES) {
      setSyllabusError('That file is larger than 20 MB.');
      return;
    }
    const mimeType = file.type || 'application/octet-stream';
    setSyllabus({ name: file.name, size: file.size, mimeType, key: null });
    try {
      const staged = await uploadSyllabus.mutateAsync(file);
      setSyllabus({ name: staged.name || file.name, size: file.size, mimeType: staged.mime_type || mimeType, key: staged.key });
    } catch (err) {
      // Storage unconfigured (501) — keep the file on screen and finish without
      // a staging key rather than blocking the wizard.
      if (!(err instanceof ApiError && err.notImplemented)) setSyllabusError(errorMessage(err));
    }
  }

  function onDropSyllabus(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    void stageSyllabus(e.dataTransfer.files?.[0]);
  }

  function buildPayload(): OnboardingPayload {
    return {
      consent_given: consent === 'yes',
      age,
      referral_code: referralCode || undefined,
      name: name.trim() || undefined,
      // The wizard never asks for term dates — the server defaults the first
      // semester to "My Semester", today → +6 months when `semester` is absent.
      subjects: subjects.map((s, i) => ({
        name: s.name,
        color_hex: s.color,
        mood: feelings[s.id],
        // One dropzone, one syllabus (frame 01.8) — it lands on the first
        // subject, the only one the frame gives it a home on.
        ...(i === 0 && syllabus?.key
          ? {
              syllabus_staging_key: syllabus.key,
              syllabus_file_name: syllabus.name,
              syllabus_mime_type: syllabus.mimeType,
            }
          : null),
      })),
      // The frame collects a *weekly* goal in hours; the server stores a daily
      // minute budget.
      daily_focus_goal_min: Math.max(1, Math.round((goal * 60) / 7)),
      work_best_times: { peak },
    };
  }

  async function finish() {
    try {
      await complete.mutateAsync(buildPayload());
      // The design's Prism modes are work-type presets (deep/flow/review/wind);
      // the server catalog is soundscape keys (rain/forest/cafe/whitenoise) and
      // `/onboarding/complete` takes no Prism field. Persist the default only
      // when the chosen id is one the server actually knows — otherwise it would
      // resolve to null and silently store "no sound".
      if ((prismModes.data ?? []).some((m) => m.key === prism)) {
        updatePrism.mutate({ default_mode: prism });
      }
      next();
    } catch {
      /* surfaced under the button from `complete.error` */
    }
  }

  return (
    <div
      className="aq-screen aq-scroll"
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: step.maxWidth,
          padding: 20,
          ...(step.id === 'building' ? { textAlign: 'center' } : null),
          ...(addOpen ? { filter: 'blur(1px)', opacity: 0.7 } : null),
        }}
      >
        {step.id !== 'building' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <EyebrowLabel>{step.eyebrow}</EyebrowLabel>
            <ProgressBar value={step.progress} />
          </div>
        )}

        {/* ── 01.1 Referral code ────────────────────────────────────── */}
        {step.id === 'referral' && (
          <Card padding="34px 32px" style={{ textAlign: 'center' }}>
            <TileIcon icon="redeem" />
            <StepTitle>Got a referral code?</StepTitle>
            <StepBody>Enter a friend&apos;s code — it helps us grow. You can skip this.</StepBody>
            <EyebrowLabel style={{ textAlign: 'left', marginBottom: 7 }}>REFERRAL CODE</EyebrowLabel>
            <CodeInput
              value={referral}
              onChange={(v) => {
                setReferral(v);
                setReferralError(null);
              }}
              ghost="A"
              boxWidth={48}
              boxHeight={56}
              radius={12}
              fontSize={22}
              gap={8}
              mono
              uppercase
              error={!!referralError}
              label="Referral character"
              style={{ marginBottom: referralError ? 10 : 24 }}
            />
            {referralError && <ErrorLine style={{ marginBottom: 16 }}>{referralError}</ErrorLine>}
            <Footer
              onBack={skipReferral}
              backLabel="Skip"
              onNext={() => void submitReferral()}
              nextLabel="Continue"
              nextLoading={validateReferral.isPending}
            />
          </Card>
        )}

        {/* ── 01.2 Consent ──────────────────────────────────────────── */}
        {step.id === 'consent' && (
          <Card padding="34px 32px" style={{ textAlign: 'center' }}>
            <TileIcon icon="verified_user" />
            <StepTitle>Do we have your consent?</StepTitle>
            <StepBody style={{ marginBottom: 20 }}>
              To work at its best, Aqademiq collects the info you share — study details, mood check-ins and focus
              patterns.
            </StepBody>

            <div
              role="radiogroup"
              aria-label="Data consent"
              style={{ display: 'flex', flexDirection: 'column', gap: 9, textAlign: 'left', marginBottom: 18 }}
            >
              <RadioRow
                selected={consent === 'yes'}
                onSelect={() => {
                  setConsent('yes');
                  setConsentError(null);
                }}
                title="Yes, I consent"
                sub="Aqademiq can collect and use my info"
              />
              <RadioRow
                selected={consent === 'no'}
                onSelect={() => setConsent('no')}
                title="No, I don't consent"
                sub="Some features may not work fully"
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                textAlign: 'left',
                background: 'var(--accent-soft)',
                borderRadius: 14,
                padding: '12px 14px',
                marginBottom: 20,
              }}
            >
              <AdaCube size={28} expr="happy" />
              <span style={{ font: '600 11px/1.6 var(--font-sans)' }}>
                Your data stays yours — never sold, never shared. Withdraw consent anytime in Settings.
              </span>
            </div>

            <Button full onClick={submitConsent}>
              Continue →
            </Button>
            {consentError && <ErrorLine style={{ marginTop: 10 }}>{consentError}</ErrorLine>}
            <div style={{ font: '600 10.5px/1.6 var(--font-sans)', color: 'var(--text-dim)', marginTop: 12 }}>
              By continuing you agree to our{' '}
              <a
                href={LINKS.terms}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring"
                style={{ color: 'var(--accent)', textDecoration: 'underline', borderRadius: 3 }}
              >
                Terms of Use
              </a>{' '}
              &amp;{' '}
              <a
                href={LINKS.privacy}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-ring"
                style={{ color: 'var(--accent)', textDecoration: 'underline', borderRadius: 3 }}
              >
                Privacy Policy
              </a>
              .
            </div>
          </Card>
        )}

        {/* ── 01.3 Your name ────────────────────────────────────────── */}
        {step.id === 'name' && (
          <Card padding="34px 32px" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <AdaCube size={68} expr="happy" cheeks />
            </div>
            <div style={{ font: '800 24px var(--font-sans)', letterSpacing: '-.4px', marginBottom: 8 }}>
              Hi, I&apos;m Ada.
            </div>
            <div style={{ font: '600 13px var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 24 }}>
              What should I call you?
            </div>
            <Input
              label="YOUR NAME"
              value={name}
              focusedStyle
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
              wrapperStyle={{ textAlign: 'left', marginBottom: 24 }}
            />
            <Button full onClick={next} disabled={!name.trim()}>
              Continue
            </Button>
          </Card>
        )}

        {/* ── 01.4 Age ──────────────────────────────────────────────── */}
        {step.id === 'age' && (
          <Card padding="34px 32px" style={{ textAlign: 'center' }}>
            <div style={{ font: '800 24px var(--font-sans)', letterSpacing: '-.4px', marginBottom: 8 }}>
              How old are you?
            </div>
            <div style={{ font: '600 13px var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 26 }}>
              Ada tunes pacing and check-ins to your age.
            </div>
            <Stepper
              value={age}
              min={10}
              max={99}
              onChange={setAge}
              aria-label="Your age"
              boxStyle={{
                width: 120,
                border: '2px solid var(--accent)',
                borderRadius: 14,
                padding: '12px 0',
                textAlign: 'center',
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 30,
              }}
            >
              {age}
            </Stepper>
            <div style={{ font: '600 11px var(--font-sans)', color: 'var(--text-dim)', margin: '10px 0 26px' }}>
              Only used to tailor your experience
            </div>
            <Footer onBack={back} onNext={next} nextLabel="Continue →" />
          </Card>
        )}

        {/* ── 01.5 What you study ───────────────────────────────────── */}
        {step.id === 'subjects' && (
          <Card padding={32}>
            <CenterTitle>What are you studying?</CenterTitle>
            <CenterBody>Add your subjects — I&apos;ll keep files, deadlines &amp; grades together.</CenterBody>

            {subjects.length === 0 ? (
              <EmptyState
                icon="school"
                title="No subjects yet"
                caption="Add the subjects you're taking this semester — Ada builds your week around them."
                padding="10px 0 18px"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 12 }}>
                {subjects.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      background: 'var(--surface-page)',
                      borderRadius: 14,
                      padding: '12px 14px',
                    }}
                  >
                    <span style={{ width: 5, height: 30, borderRadius: 5, background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '800 8.5px var(--font-sans)', color: s.color }}>
                        {s.code} · {s.credits} cr
                      </div>
                      <div style={{ font: '800 13px var(--font-sans)' }}>{s.name}</div>
                    </div>
                    <Icon name="check_circle" size={18} color="var(--accent)" />
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="dashed"
              icon="add"
              iconSize={18}
              full
              onClick={() => setAddOpen(true)}
              style={{ borderRadius: 14, padding: 12, marginBottom: 22 }}
            >
              Add a subject
            </Button>

            <Footer onBack={back} onNext={next} nextLabel="Continue" nextDisabled={subjects.length === 0} />
          </Card>
        )}

        {/* ── 01.7 Feelings per subject ─────────────────────────────── */}
        {step.id === 'feelings' && (
          <Card padding={32} style={{ textAlign: 'center' }}>
            <StepTitle>How do you feel about each?</StepTitle>
            <div style={{ font: '600 12.5px/1.5 var(--font-sans)', color: 'var(--text-secondary)', marginBottom: 8 }}>
              This helps me pace the hard ones. Rate <b>{currentSubject?.name}</b>.
            </div>
            <MoodScale
              value={currentSubject ? feelings[currentSubject.id] ?? null : null}
              onChange={(r) => {
                if (!currentSubject) return;
                setFeelings((prev) => ({ ...prev, [currentSubject.id]: r }));
                if (feelingIndex < subjects.length - 1) {
                  window.setTimeout(() => setFeelingIndex((i) => i + 1), 260);
                }
              }}
              style={{ marginTop: 16, marginBottom: 22 }}
            />
            <Footer
              onBack={feelingIndex > 0 ? () => setFeelingIndex((i) => i - 1) : back}
              onNext={next}
              nextLabel="Continue"
            />
          </Card>
        )}

        {/* ── 01.8 Upload syllabus ──────────────────────────────────── */}
        {step.id === 'syllabus' && (
          <Card padding={32} style={{ textAlign: 'center' }}>
            <StepTitle>Add your syllabus</StepTitle>
            <StepBody>Drop a PDF and Ada reads deadlines &amp; topics automatically.</StepBody>

            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDropSyllabus}
              style={{ display: 'block', cursor: 'pointer' }}
            >
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,application/pdf"
                onChange={(e) => {
                  void stageSyllabus(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
              <Dropzone hint="PDF, DOCX up to 20 MB" style={{ padding: '36px 20px', marginBottom: 16 }} />
            </label>

            {syllabus && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'var(--surface-page)',
                  borderRadius: 12,
                  padding: '10px 13px',
                  marginBottom: syllabusError ? 10 : 22,
                }}
              >
                <Icon name="picture_as_pdf" size={19} color="var(--accent)" />
                <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                  <div style={{ font: '800 11.5px var(--font-sans)' }}>{syllabus.name}</div>
                  <div style={{ font: '600 9.5px var(--font-sans)', color: 'var(--text-dim)' }}>
                    {uploadSyllabus.isPending ? 'Uploading…' : sizeLabel(syllabus.size) || 'Ready'}
                  </div>
                </div>
                {uploadSyllabus.isPending ? (
                  <Spinner size={18} />
                ) : (
                  syllabus.key && <Icon name="check_circle" size={18} color="var(--accent)" />
                )}
              </div>
            )}
            {syllabusError && <ErrorLine style={{ marginBottom: 22 }}>{syllabusError}</ErrorLine>}

            <Footer
              onBack={() => {
                setSyllabus(null);
                setSyllabusError(null);
                next();
              }}
              backLabel="Skip"
              onNext={next}
              nextLabel="Continue"
              nextDisabled={uploadSyllabus.isPending}
            />
          </Card>
        )}

        {/* ── 01.9 Peak time + goal ─────────────────────────────────── */}
        {step.id === 'peak' && (
          <Card padding={32}>
            <CenterTitle>When do you focus best?</CenterTitle>
            <CenterBody style={{ lineHeight: 1.5 }}>Ada schedules your hardest work then.</CenterBody>

            <div role="radiogroup" aria-label="Peak focus time" style={{ display: 'flex', gap: 9, marginBottom: 24 }}>
              {PEAK_TIMES.map((p) => {
                const on = peak === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPeak(p.id)}
                    className="aq-press focus-ring"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      borderRadius: 14,
                      border: `1.5px solid ${on ? 'var(--accent)' : 'var(--border-hairline)'}`,
                      background: on ? 'var(--accent-soft)' : 'transparent',
                      padding: '14px 0',
                      font: '800 12px var(--font-sans)',
                      color: on ? 'var(--accent)' : 'var(--text-secondary)',
                    }}
                  >
                    <Icon name={p.icon} size={22} style={{ display: 'block', margin: '0 auto 5px' }} />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <EyebrowLabel style={{ marginBottom: 10 }}>WEEKLY FOCUS GOAL</EyebrowLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <span className="h-num" style={{ fontSize: 34 }}>
                {goal}
                <span style={{ fontSize: 18 }}>h</span>
              </span>
              <Slider
                value={goal}
                min={1}
                max={24}
                step={1}
                onChange={setGoal}
                aria-label="Weekly focus goal in hours"
              />
            </div>

            <Footer onBack={back} onNext={next} nextLabel="Continue" />
          </Card>
        )}

        {/* ── 01.10 Meet Prism ──────────────────────────────────────── */}
        {step.id === 'prism' && (
          <Card padding={32}>
            <CenterTitle>Meet Prism</CenterTitle>
            <CenterBody>Focus soundscapes tuned to the kind of work you&apos;re doing.</CenterBody>

            <div
              role="radiogroup"
              aria-label="Prism mode"
              style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}
            >
              {PRISM_MODES.filter((m) => m.id !== 'none').map((m) => (
                <PrismRow key={m.id} mode={m} selected={prism === m.id} onSelect={() => setPrism(m.id)} />
              ))}
            </div>

            <Button full onClick={() => void finish()} loading={complete.isPending}>
              Build my week →
            </Button>
            {complete.isError && <ErrorLine style={{ marginTop: 10 }}>{errorMessage(complete.error)}</ErrorLine>}
          </Card>
        )}

        {/* ── 01.11 Building your week ──────────────────────────────── */}
        {step.id === 'building' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <AdaCube size={92} expr="focused" sparkles />
            </div>
            <div style={{ font: '800 22px var(--font-sans)', letterSpacing: '-.3px', margin: '20px 0 22px' }}>
              Building your week…
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                textAlign: 'left',
                maxWidth: 320,
                margin: '0 auto',
              }}
            >
              <BuildRow done label="Reading your materials" />
              <BuildRow done label="Mapping your deadlines" />
              <BuildRow label="Building your week" />
            </div>
          </>
        )}
      </div>

      {/* ── 01.6 Add subject (modal over step 3) ───────────────────── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add subject"
        maxWidth={460}
        fullBleed
        panelStyle={{ padding: '24px 26px' }}
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input
            label="NAME"
            focusedStyle
            placeholder="Compiler Construction"
            maxLength={120}
            value={newSubject.name}
            onChange={(e) => setNewSubject((s) => ({ ...s, name: e.target.value }))}
            wrapperStyle={{ flex: 2 }}
          />
          <Input
            label="CODE"
            placeholder="CC 401"
            value={newSubject.code}
            onChange={(e) => setNewSubject((s) => ({ ...s, code: e.target.value }))}
            wrapperStyle={{ flex: 1 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Input
            label="CREDITS"
            inputMode="numeric"
            placeholder="4"
            value={newSubject.credits}
            onChange={(e) => setNewSubject((s) => ({ ...s, credits: e.target.value }))}
            wrapperStyle={{ flex: 1 }}
          />
          <Input
            label="PROFESSOR"
            placeholder="Optional"
            value={newSubject.professor}
            onChange={(e) => setNewSubject((s) => ({ ...s, professor: e.target.value }))}
            wrapperStyle={{ flex: 2 }}
          />
        </div>

        <EyebrowLabel style={{ marginBottom: 9 }}>COLOR</EyebrowLabel>
        <SwatchRow
          value={newSubject.color}
          onChange={(c) => setNewSubject((s) => ({ ...s, color: c }))}
          style={{ marginBottom: 22 }}
        />

        {/* `code`, `credits` and `professor` are collected for the wizard's own
            list — /onboarding/complete only carries name, colour and mood, so
            they are not sent. no endpoint: the atomic create takes no such fields. */}
        <Button
          full
          disabled={!newSubject.name.trim() || !newSubject.code.trim()}
          onClick={() => {
            setSubjects((prev) => [
              ...prev,
              {
                id: newId(),
                code: newSubject.code.trim(),
                name: newSubject.name.trim(),
                credits: Number(newSubject.credits) || 0,
                color: newSubject.color,
              },
            ]);
            setNewSubject(EMPTY_SUBJECT);
            setAddOpen(false);
          }}
        >
          Add subject
        </Button>
      </Modal>
    </div>
  );
}

/* ── Local building blocks ─────────────────────────────────────────── */

function StepTitle({ children }: { children: ReactNode }) {
  return <div style={{ font: '800 22px var(--font-sans)', letterSpacing: '-.3px', marginBottom: 6 }}>{children}</div>;
}

function StepBody({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        font: '600 12.5px/1.6 var(--font-sans)',
        color: 'var(--text-secondary)',
        marginBottom: 22,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CenterTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        textAlign: 'center',
        font: '800 22px var(--font-sans)',
        letterSpacing: '-.3px',
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function CenterBody({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        textAlign: 'center',
        font: '600 12.5px/1.5 var(--font-sans)',
        color: 'var(--text-secondary)',
        marginBottom: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** The same helper line the Input component draws under a failed field. */
function ErrorLine({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      role="alert"
      style={{ font: '600 10.5px/1.5 var(--font-sans)', color: 'var(--aq-danger)', ...style }}
    >
      {children}
    </div>
  );
}

function TileIcon({ icon }: { icon: string }) {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: 16,
        background: 'var(--accent-soft)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 18px',
      }}
    >
      <Icon name={icon} size={28} color="var(--accent)" />
    </div>
  );
}

function Footer({
  onBack,
  backLabel = 'Back',
  onNext,
  nextLabel,
  nextLoading = false,
  nextDisabled = false,
}: {
  onBack: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel: string;
  nextLoading?: boolean;
  nextDisabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Button variant="ghost" onClick={onBack} style={{ padding: '0 22px' }}>
        {backLabel}
      </Button>
      <Button onClick={onNext} loading={nextLoading} disabled={nextDisabled} style={{ flex: 1 }}>
        {nextLabel}
      </Button>
    </div>
  );
}

function RadioRow({
  selected,
  onSelect,
  title,
  sub,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="aq-press focus-ring"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: selected ? 'var(--accent-soft)' : 'var(--surface-page)',
        border: `2px solid ${selected ? 'var(--accent)' : 'transparent'}`,
        borderRadius: 14,
        padding: '13px 15px',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: selected ? 'var(--accent)' : 'transparent',
          border: selected ? undefined : '2px solid var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {selected && <Icon name="check" size={13} color="#fff" />}
      </span>
      <div>
        <div style={{ font: '800 13px var(--font-sans)' }}>{title}</div>
        <div style={{ font: '600 10.5px var(--font-sans)', color: 'var(--text-secondary)', marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  );
}

function BuildRow({ label, done = false }: { label: string; done?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      {done ? <Icon name="check_circle" size={20} color="var(--accent)" /> : <Spinner size={20} />}
      <span style={{ font: '700 12.5px var(--font-sans)' }}>{label}</span>
    </div>
  );
}

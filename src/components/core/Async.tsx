import type { CSSProperties, ReactNode } from 'react';

import { Spinner } from './Button';
import Icon from './Icon';
import { ApiError } from '../../lib/api';

/* Shared loading / error / empty states.

   Pre-resolved decision 8 in the build brief says every async surface reuses the
   guest-empty pattern and the frame 01.11 spinner, so these three wrap exactly
   those rather than introducing new visuals. */

export function Loading({
  label = 'Loading…',
  padding = 40,
  style,
}: {
  label?: string;
  padding?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding,
        ...style,
      }}
    >
      <Spinner size={22} />
      <span style={{ font: '700 11.5px var(--font-sans)', color: 'var(--text-dim)' }}>{label}</span>
    </div>
  );
}

/** Human-readable text for anything a query or mutation can reject with. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

export function ErrorState({
  error,
  onRetry,
  padding = 32,
  style,
}: {
  error: unknown;
  onRetry?: () => void;
  padding?: number | string;
  style?: CSSProperties;
}) {
  const notReady = error instanceof ApiError && error.notImplemented;
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding,
        textAlign: 'center',
        ...style,
      }}
    >
      <Icon
        name={notReady ? 'schedule' : 'cloud_off'}
        size={22}
        color={notReady ? 'var(--text-dim)' : 'var(--aq-danger)'}
      />
      <span
        style={{
          font: '700 12px/1.5 var(--font-sans)',
          color: notReady ? 'var(--text-secondary)' : 'var(--aq-danger)',
          maxWidth: 320,
        }}
      >
        {errorMessage(error)}
      </span>
      {onRetry && !notReady && (
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring aq-press"
          style={{ font: '800 11px var(--font-sans)', color: 'var(--accent)', borderRadius: 4 }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon = 'inbox',
  title,
  caption,
  action,
  padding = 34,
  style,
}: {
  icon?: string;
  title: string;
  caption?: string;
  action?: ReactNode;
  padding?: number | string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding,
        textAlign: 'center',
        ...style,
      }}
    >
      <Icon name={icon} size={24} color="var(--text-dim)" />
      <div style={{ font: '800 13px var(--font-sans)' }}>{title}</div>
      {caption && (
        <div
          style={{
            font: '600 11.5px/1.55 var(--font-sans)',
            color: 'var(--text-secondary)',
            maxWidth: 300,
          }}
        >
          {caption}
        </div>
      )}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

/**
 * One-line async switch for a region: spinner while loading, error card on
 * failure, empty state when the list came back empty, otherwise the children.
 */
export function AsyncSection({
  query,
  empty,
  children,
  loadingLabel,
}: {
  query: { isLoading: boolean; isError: boolean; error: unknown; refetch?: () => void };
  /** Rendered instead of `children` when the loaded data is empty. */
  empty?: { when: boolean; node: ReactNode };
  children: ReactNode;
  loadingLabel?: string;
}) {
  if (query.isLoading) return <Loading label={loadingLabel} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
  if (empty?.when) return <>{empty.node}</>;
  return <>{children}</>;
}

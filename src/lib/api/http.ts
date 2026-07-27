import { env } from '../env';
import { getAccessToken, supabase } from '../supabase';

/* Thin fetch wrapper for the Edge Function REST API.

   Wire contract (docs/backend_contract/FRONTEND_INTEGRATION_CONTRACT.md §2, §6):
   - snake_case in both directions; no case transform anywhere.
   - `Authorization: Bearer <supabase access token>` on every call.
   - Unknown body fields are rejected with a 400, so request builders must send
     only documented keys — `stripUndefined` below drops `undefined` rather than
     serialising it to null.
   - Errors share one shape: { status_code, error, message, errors?, path, timestamp }
     where `message` is a string OR an array of validation strings. */

export interface ApiErrorBody {
  status_code?: number;
  error?: string;
  message?: string | string[];
  errors?: string[];
  path?: string;
  timestamp?: string;
  /** The rate-limit middleware answers camelCase — tolerate both (§5). */
  statusCode?: number;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: string[];
  readonly retryAfter: number | null;

  constructor(status: number, message: string, code: string, details: string[], retryAfter: number | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter;
  }

  /** 501 / "not configured" — the feature exists but its provider is unset. */
  get notImplemented(): boolean {
    return this.status === 501;
  }

  get unauthorized(): boolean {
    return this.status === 401;
  }
}

function messageOf(body: ApiErrorBody | null, status: number): { message: string; details: string[] } {
  const raw = body?.message;
  const details = Array.isArray(raw) ? raw : body?.errors ?? [];
  const message = Array.isArray(raw)
    ? raw[0] ?? 'Request failed'
    : raw ?? DEFAULT_MESSAGE[status] ?? 'Something went wrong';
  return { message, details };
}

const DEFAULT_MESSAGE: Record<number, string> = {
  400: 'That request was not valid.',
  401: 'Your session expired — sign in again.',
  403: 'You do not have access to that.',
  404: 'Not found.',
  409: 'That already exists.',
  422: 'That could not be processed.',
  429: 'Too many requests — give it a moment.',
  500: 'The server had a problem.',
  501: 'That is not available yet.',
  503: 'The service is unavailable right now.',
};

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  /** Serialised as JSON. `undefined` values are dropped (see above). */
  body?: unknown;
  /** Values that are `undefined`/`null`/`''` are omitted. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Sends an `Idempotency-Key` so a retry cannot duplicate a create (§4). */
  idempotent?: boolean;
  signal?: AbortSignal;
}

/** Drops `undefined` keys so `forbidNonWhitelisted` never sees a stray null. */
export function stripUndefined<T extends object>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out as Partial<T>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    params.append(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

const newIdempotencyKey = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** One request attempt. Separated so a 401 can be retried after a token refresh. */
async function attempt(path: string, opts: RequestOptions, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  // Supabase's function gateway is happy with either; sending the publishable
  // key keeps parity with the mobile client and with `supabase functions serve`.
  if (env.supabaseAnonKey) headers.apikey = env.supabaseAnonKey;

  let payload: string | undefined;
  if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(opts.body);
  }
  if (opts.idempotent) headers['Idempotency-Key'] = newIdempotencyKey();

  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers,
    body: payload,
    signal: opts.signal,
  });
}

/**
 * Perform an API call and return the parsed body.
 *
 * Throws `ApiError` on any non-2xx. A 401 is retried once after forcing a
 * Supabase token refresh, which covers the common "tab was asleep and the
 * access token aged out" case; a second 401 propagates so the caller can route
 * to sign-in.
 */
export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!env.configured) {
    throw new ApiError(0, 'The app is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.', 'NOT_CONFIGURED', [], null);
  }

  let res: Response;
  try {
    res = await attempt(path, opts, await getAccessToken());
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw e;
    throw new ApiError(0, 'Could not reach Aqademiq. Check your connection.', 'NETWORK', [], null);
  }

  if (res.status === 401) {
    const { data } = await supabase.auth.refreshSession();
    if (data.session?.access_token) {
      try {
        res = await attempt(path, opts, data.session.access_token);
      } catch {
        throw new ApiError(0, 'Could not reach Aqademiq. Check your connection.', 'NETWORK', [], null);
      }
    }
  }

  const body = await parseBody(res);

  if (!res.ok) {
    const errBody = (body && typeof body === 'object' ? body : null) as ApiErrorBody | null;
    const status = errBody?.status_code ?? errBody?.statusCode ?? res.status;
    const { message, details } = messageOf(errBody, status);
    const retryAfterHeader = res.headers.get('Retry-After');
    throw new ApiError(
      status,
      message,
      errBody?.error ?? String(status),
      details,
      retryAfterHeader ? Number(retryAfterHeader) : null,
    );
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body: body ?? {} }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body: body ?? {} }),
  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body: body ?? {} }),
  del: <T>(path: string, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
};

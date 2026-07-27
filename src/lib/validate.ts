/* Light client-side validation only (build brief, pre-resolved item 3):
   email format, required fields, and the email confirmation code. Errors render
   in --aq-danger with a helper line under the field.

   The code is **6 digits** — Supabase Auth's `{{ .Token }}` is a 6-digit OTP.
   (The frames drew five boxes; the real code decides the length.) */

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const isRequired = (v: string) => v.trim().length > 0;

export const OTP_LENGTH = 6;

export const isOtp = (v: string) => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(v);

/** Supabase rejects anything shorter than 8 characters. */
export const MIN_PASSWORD = 8;

export const isPassword = (v: string) => v.length >= MIN_PASSWORD;

/* Light client-side validation only (build brief, pre-resolved item 3):
   email format, required fields, OTP is 5 digits. Errors render in
   --aq-danger with a helper line under the field. */

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

export const isRequired = (v: string) => v.trim().length > 0;

export const OTP_LENGTH = 5;

export const isOtp = (v: string) => new RegExp(`^\\d{${OTP_LENGTH}}$`).test(v);

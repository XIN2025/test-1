import { otpTemplate } from './otp-template';
import type { OtpTemplateContext } from './otp-template';
import { verifyEmailTemplate } from './verify-email-template';
import type { VerifyEmailTemplateContext } from './verify-email-template';

export const templates = {
  OTP: otpTemplate,
  VERIFY_EMAIL: verifyEmailTemplate,
} as const;

export type Template = keyof typeof templates;

export type TemplateContextMap = {
  OTP: OtpTemplateContext;
  VERIFY_EMAIL: VerifyEmailTemplateContext;
};

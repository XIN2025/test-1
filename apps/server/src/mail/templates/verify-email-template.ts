export const verifyEmailTemplate = `
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <tr>
    <td style="padding: 40px 20px; text-align: center; background-color: #f8f9fa;">
      <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px;">Verify Your Email Address</h1>
      <p style="color: #666666; font-size: 16px; margin-bottom: 30px;">
        Thanks for signing up! Click the button below to verify your email address.
      </p>
      <a href="{{verificationLink}}" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
         Verify Email
      </a>
      <p style="color: #666666; font-size: 14px; margin-top: 30px;">
        If the button doesn’t work, copy and paste this link into your browser:
      </p>
      <p style="font-size: 12px; color: #999999;">{{verificationLink}}</p>
    </td>
  </tr>
  <tr>
    <td style="padding: 20px; text-align: center; background-color: #f8f9fa;">
      <p style="color: #999999; font-size: 12px;">If you didn’t create this account, you can safely ignore this email.</p>
    </td>
  </tr>
</table>
`;

export type VerifyEmailTemplateContext = {
  verificationLink: string;
};

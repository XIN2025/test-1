export type EmailVerifyEmailTemplatePayload = {
  verificationLink: string;
};

export const emailVerifyEmailTemplate = ({ verificationLink }: EmailVerifyEmailTemplatePayload) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); overflow: hidden;">
    
    <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 30px 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">
        Verify Your Email
      </h1>
    </div>

    <div style="padding: 40px; line-height: 1.6;">
      <p style="margin: 0 0 24px 0; font-size: 16px; color: #2c3e50;">
        Thanks for signing up for <strong>Karmi</strong>! Please verify your email by clicking the button below:
      </p>
      
      <a href="${verificationLink}" 
         style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">
         Verify Email
      </a>

      <p style="color: #6c757d; font-size: 14px; margin-top: 30px;">
        If the button doesn’t work, copy and paste this link into your browser:
      </p>

      <p style="font-size: 13px; color: #0c4a6e; word-break: break-all;">
        ${verificationLink}
      </p>
    </div>

    <div style="background-color: #f8f9fa; padding: 20px 40px; text-align: center; border-top: 1px solid #e9ecef;">
      <p style="margin: 0; font-size: 12px; color: #6c757d;">
        This is an automated message from the Karmi platform.
      </p>
    </div>
  </div>
</body>
</html>
`;

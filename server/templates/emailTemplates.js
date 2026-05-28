/**
 * Professional HTML email templates for InternHub.
 * Each template returns a complete HTML email string.
 * Uses inline CSS for maximum email client compatibility.
 */

const brandColor = '#6366F1';
const brandDark = '#0F172A';
const grayText = '#64748B';
const bgLight = '#F8FAFC';

/**
 * Base email wrapper with consistent branding.
 */
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${bgLight};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:12px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,${brandColor},${brandDark});padding:32px 40px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">InternHub</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Internship Management Platform</p>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:40px;">
        ${content}
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color:${bgLight};padding:24px 40px;text-align:center;border-top:1px solid #E2E8F0;">
        <p style="color:${grayText};font-size:12px;margin:0;">© ${new Date().getFullYear()} InternHub. All rights reserved.</p>
        <p style="color:${grayText};font-size:12px;margin:8px 0 0;">This is an automated email. Please do not reply.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Action button component.
 */
const actionButton = (text, url) => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto;">
  <tr>
    <td style="border-radius:8px;background:${brandColor};">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;border-radius:8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;

const greeting = (name) =>
  `<p style="color:${brandDark};font-size:18px;font-weight:600;margin:0 0 16px;">Hi ${name},</p>`;

const paragraph = (text) =>
  `<p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px;">${text}</p>`;

// ==================== TEMPLATES ====================

const registrationTemplate = (name) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph('Welcome to <strong>InternHub</strong>! 🎉 Your account has been created successfully.')}
    ${paragraph('You can now browse internships, apply to exciting opportunities, and track your applications — all from your dashboard.')}
    ${actionButton('Go to Dashboard', process.env.CLIENT_URL + '/dashboard')}
    ${paragraph('If you have any questions, feel free to reach out to our support team.')}
  `);

const emailVerificationTemplate = (name, verifyUrl) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph('Thank you for signing up! Please verify your email address to activate your account.')}
    ${actionButton('Verify My Email', verifyUrl)}
    ${paragraph('This link will expire in <strong>24 hours</strong>. If you didn\'t create an account, please ignore this email.')}
    ${paragraph(`<span style="color:${grayText};font-size:13px;">If the button doesn't work, copy this link: <br><a href="${verifyUrl}" style="color:${brandColor};word-break:break-all;">${verifyUrl}</a></span>`)}
  `);

const applicationSubmittedTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`Your application for <strong>${internshipTitle}</strong> has been submitted successfully! ✅`)}
    ${paragraph('Our team will review your application and get back to you shortly. You can track your application status from your dashboard.')}
    ${actionButton('View My Applications', process.env.CLIENT_URL + '/dashboard/applications')}
    ${paragraph('Thank you for your interest. We appreciate your time!')}
  `);

const applicationApprovedTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`Congratulations! 🎉 Your application for <strong>${internshipTitle}</strong> has been <span style="color:#10B981;font-weight:600;">approved</span>!`)}
    ${paragraph('Please check your dashboard for next steps, including payment details if applicable.')}
    ${actionButton('View Dashboard', process.env.CLIENT_URL + '/dashboard')}
    ${paragraph('We\'re excited to have you on board!')}
  `);

const applicationRejectedTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`Thank you for applying to <strong>${internshipTitle}</strong>. After careful review, we regret to inform you that your application was not selected this time.`)}
    ${paragraph('Don\'t be discouraged — there are many other opportunities available. We encourage you to explore and apply to other internships.')}
    ${actionButton('Browse Internships', process.env.CLIENT_URL + '/internships')}
    ${paragraph('We wish you the best in your future endeavors!')}
  `);

const paymentRequestTemplate = (name, internshipTitle, amount, paymentUrl) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`Your application for <strong>${internshipTitle}</strong> has been approved! To complete your enrollment, please make the following payment:`)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:${bgLight};border-radius:8px;border:1px solid #E2E8F0;">
      <tr>
        <td style="padding:20px;">
          <p style="color:${grayText};font-size:13px;margin:0;">Amount Due</p>
          <p style="color:${brandDark};font-size:28px;font-weight:700;margin:4px 0 0;">₹${amount.toLocaleString('en-IN')}</p>
        </td>
      </tr>
    </table>
    ${actionButton('Pay Now', paymentUrl)}
    ${paragraph('Payment supports UPI, Google Pay, Cards, and Net Banking.')}
  `);

const paymentSuccessTemplate = (name, internshipTitle, amount) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`Your payment of <strong>₹${amount.toLocaleString('en-IN')}</strong> for <strong>${internshipTitle}</strong> has been received successfully! ✅`)}
    ${paragraph('Your enrollment is now confirmed. You can download your receipt from your dashboard.')}
    ${actionButton('View Receipt', process.env.CLIENT_URL + '/dashboard/applications')}
    ${paragraph('Welcome aboard! We look forward to working with you.')}
  `);

const joiningConfirmationTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`You have officially joined <strong>${internshipTitle}</strong>! 🚀`)}
    ${paragraph('Your internship journey begins now. Please check your dashboard for important information, schedules, and resources.')}
    ${actionButton('Go to Dashboard', process.env.CLIENT_URL + '/dashboard')}
    ${paragraph('We\'re thrilled to have you on the team. Let\'s build something amazing together!')}
  `);

const passwordResetTemplate = (name, resetUrl) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph('We received a request to reset your password. Click the button below to set a new password:')}
    ${actionButton('Reset Password', resetUrl)}
    ${paragraph('This link will expire in <strong>30 minutes</strong>. If you didn\'t request a password reset, please ignore this email — your password will remain unchanged.')}
    ${paragraph(`<span style="color:${grayText};font-size:13px;">If the button doesn't work, copy this link: <br><a href="${resetUrl}" style="color:${brandColor};word-break:break-all;">${resetUrl}</a></span>`)}
  `);

const reminderTemplate = (name, reminderTitle, reminderDescription) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`This is an automated reminder from InternHub for your upcoming deliverable/alert:`)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:${bgLight};border-radius:8px;border:1px solid #E2E8F0;">
      <tr>
        <td style="padding:20px;">
          <p style="color:${brandColor};font-size:14px;font-weight:700;margin:0 0 8px;text-transform:uppercase;">${reminderTitle}</p>
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0;">${reminderDescription || 'No additional description provided.'}</p>
        </td>
      </tr>
    </table>
    ${actionButton('Open Workspace Dashboard', process.env.CLIENT_URL + '/dashboard')}
    ${paragraph('Please review and complete any associated tasks in a timely manner. Thank you!')}
  `);

module.exports = {
  registrationTemplate,
  emailVerificationTemplate,
  applicationSubmittedTemplate,
  applicationApprovedTemplate,
  applicationRejectedTemplate,
  paymentRequestTemplate,
  paymentSuccessTemplate,
  joiningConfirmationTemplate,
  passwordResetTemplate,
  reminderTemplate,
};

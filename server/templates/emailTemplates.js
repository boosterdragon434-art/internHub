/**
 * Professional HTML email templates for FWT iZON.
 * Each template returns a complete HTML email string.
 * Uses inline CSS for maximum email client compatibility.
 * All templates are responsive (max-width 600px, centered).
 */

const brandColor = '#1a1a2e';
const brandAccent = '#6366F1';
const brandDark = '#0f0f1a';
const grayText = '#64748B';
const bgLight = '#F8FAFC';
const logoUrl = process.env.BRAND_LOGO_URL || '';

/**
 * Base email wrapper with consistent FWT iZON branding.
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
        ${logoUrl ? `<img src="${logoUrl}" alt="FWT internHub" style="max-height:40px;margin-bottom:12px;" />` : ''}
        <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">FWT internHub</h1>
        <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:13px;letter-spacing:0.5px;">Internship Management Platform</p>
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
        <p style="color:${grayText};font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} FWT internHub. All rights reserved.</p>
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

/**
 * Styled info card used inside email templates.
 */
const infoCard = (label, value) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0;background:${bgLight};border-radius:8px;border:1px solid #E2E8F0;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="color:${grayText};font-size:11px;margin:0;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">${label}</p>
      <p style="color:${brandDark};font-size:16px;font-weight:700;margin:4px 0 0;">${value}</p>
    </td>
  </tr>
</table>`;

// ==================== EXISTING TEMPLATES ====================

const registrationTemplate = (name) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph('Welcome to <strong>FWT internHub</strong>! 🎉 Your account has been created successfully.')}
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
    ${paragraph(`<span style="color:${grayText};font-size:13px;">If the button doesn't work, copy this link: <br><a href="${verifyUrl}" style="color:${brandAccent};word-break:break-all;">${verifyUrl}</a></span>`)}
  `);

const applicationSubmittedTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`Your application for <strong>${internshipTitle}</strong> has been submitted successfully! ✅`)}
    ${paragraph('Our team will review your application and get back to you shortly. You can track your application status from your dashboard.')}
    ${actionButton('View My Applications', process.env.CLIENT_URL + '/student/applications')}
    ${paragraph('Thank you for your interest. We appreciate your time!')}
  `);

const applicationApprovedTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`Congratulations! 🎉 Your application for <strong>${internshipTitle}</strong> has been <span style="color:#10B981;font-weight:600;">approved</span>!`)}
    ${paragraph('Please check your dashboard for next steps, including payment details if applicable.')}
    ${actionButton('View Dashboard', process.env.CLIENT_URL + '/student/dashboard')}
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
    ${actionButton('View Receipt', process.env.CLIENT_URL + '/student/applications')}
    ${paragraph('Welcome aboard! We look forward to working with you.')}
  `);

const joiningConfirmationTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`You have officially joined <strong>${internshipTitle}</strong>! 🚀`)}
    ${paragraph('Your internship journey begins now. Please check your dashboard for important information, schedules, and resources.')}
    ${actionButton('Go to Dashboard', process.env.CLIENT_URL + '/student/dashboard')}
    ${paragraph('We\'re thrilled to have you on the team. Let\'s build something amazing together!')}
  `);

const passwordResetTemplate = (name, resetUrl) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph('We received a request to reset your password. Click the button below to set a new password:')}
    ${actionButton('Reset Password', resetUrl)}
    ${paragraph('This link will expire in <strong>30 minutes</strong>. If you didn\'t request a password reset, please ignore this email — your password will remain unchanged.')}
    ${paragraph(`<span style="color:${grayText};font-size:13px;">If the button doesn't work, copy this link: <br><a href="${resetUrl}" style="color:${brandAccent};word-break:break-all;">${resetUrl}</a></span>`)}
  `);

const reminderTemplate = (name, reminderTitle, reminderDescription) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`This is an automated reminder from FWT internHub for your upcoming deliverable/alert:`)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:${bgLight};border-radius:8px;border:1px solid #E2E8F0;">
      <tr>
        <td style="padding:20px;">
          <p style="color:${brandAccent};font-size:14px;font-weight:700;margin:0 0 8px;text-transform:uppercase;">${reminderTitle}</p>
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0;">${reminderDescription || 'No additional description provided.'}</p>
        </td>
      </tr>
    </table>
    ${actionButton('Open Workspace Dashboard', process.env.CLIENT_URL + '/student/dashboard')}
    ${paragraph('Please review and complete any associated tasks in a timely manner. Thank you!')}
  `);

// ==================== NEW INTERNSHIP LIFECYCLE TEMPLATES ====================

/**
 * Template A — Internship Application Confirmation
 * Triggered on POST /apply
 */
const internshipApplicationConfirmationTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`We've received your application for the <strong>${internshipTitle}</strong> internship at FWT internHub. ✅`)}
    ${infoCard('Applied For', internshipTitle)}
    ${paragraph('Here\'s what happens next:')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:12px 0 24px;">
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:28px;height:28px;border-radius:50%;background:${brandColor};color:#fff;text-align:center;font-size:12px;font-weight:700;line-height:28px;">1</td>
              <td style="padding-left:12px;color:#334155;font-size:14px;">Our team reviews your application (1-3 business days)</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:28px;height:28px;border-radius:50%;background:${brandColor};color:#fff;text-align:center;font-size:12px;font-weight:700;line-height:28px;">2</td>
              <td style="padding-left:12px;color:#334155;font-size:14px;">You'll receive an email with the decision</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <table role="presentation" cellspacing="0" cellpadding="0">
            <tr>
              <td style="width:28px;height:28px;border-radius:50%;background:${brandColor};color:#fff;text-align:center;font-size:12px;font-weight:700;line-height:28px;">3</td>
              <td style="padding-left:12px;color:#334155;font-size:14px;">If approved, complete onboarding from your dashboard</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    ${actionButton('Track Your Application', process.env.CLIENT_URL + '/student/applications')}
    ${paragraph('Thank you for choosing FWT internHub. We\'re excited about your interest!')}
  `);

/**
 * Template B — Internship Approval Notification
 * Triggered on PATCH /approve
 */
const internshipApprovalTemplate = (name, internshipTitle, startDate) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`<span style="font-size:20px;">🎉</span> Great news! Your application for <strong>${internshipTitle}</strong> has been <span style="color:#10B981;font-weight:700;">approved</span>!`)}
    ${infoCard('Role', internshipTitle)}
    ${startDate ? infoCard('Start Date', new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })) : ''}
    ${paragraph('Welcome to the FWT internHub team! Here\'s what to do next:')}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:12px 0 24px;">
      <tr>
        <td style="padding:6px 0;color:#334155;font-size:14px;line-height:1.6;">✓ &nbsp;Check your dashboard for onboarding materials</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#334155;font-size:14px;line-height:1.6;">✓ &nbsp;Complete any pending payment if applicable</td>
      </tr>
      <tr>
        <td style="padding:6px 0;color:#334155;font-size:14px;line-height:1.6;">✓ &nbsp;Prepare for your first day — we'll send further details soon</td>
      </tr>
    </table>
    ${actionButton('View Your Dashboard', process.env.CLIENT_URL + '/student/dashboard')}
    ${paragraph('We\'re thrilled to have you on board. Let\'s build something remarkable together!')}
  `);

/**
 * Template C — Certificate Delivery
 * Triggered on PATCH /complete
 * PDF certificate is attached via nodemailer attachments
 */
const certificateDeliveryTemplate = (name, internshipTitle, certificateId) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`<span style="font-size:20px;">🎓</span> Congratulations on completing the <strong>${internshipTitle}</strong> internship at FWT internHub!`)}
    ${paragraph('Your internship certificate has been generated and is attached to this email. You can also download it from your dashboard.')}
    ${infoCard('Certificate ID', certificateId)}
    ${infoCard('Internship', internshipTitle)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:linear-gradient(135deg,${brandColor},${brandDark});border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:28px 24px;text-align:center;">
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;letter-spacing:0.5px;">YOUR CERTIFICATE IS READY</p>
          <p style="color:#ffffff;font-size:22px;font-weight:700;margin:8px 0 0;">Download from your dashboard</p>
        </td>
      </tr>
    </table>
    ${actionButton('Download Certificate', process.env.CLIENT_URL + '/student/certificates')}
    ${paragraph('Your certificate includes a QR code for secure verification. Share it confidently with employers and institutions.')}
    ${paragraph('Thank you for your dedication and hard work. We wish you the very best in your career! 🚀')}
  `);

/**
 * Template D — Offer Letter Delivery
 * Triggered by admin action
 * PDF offer letter is attached via nodemailer attachments
 */
const offerLetterDeliveryTemplate = (name, internshipTitle) =>
  baseTemplate(`
    ${greeting(name)}
    ${paragraph(`<span style="font-size:20px;">🎉</span> We are thrilled to offer you a position for the <strong>${internshipTitle}</strong> internship at FWT internHub!`)}
    ${paragraph('Your official Offer Letter is attached to this email. Please review it carefully. It contains important details regarding your internship.')}
    ${infoCard('Internship', internshipTitle)}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0;background:linear-gradient(135deg,${brandColor},${brandDark});border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:28px 24px;text-align:center;">
          <p style="color:rgba(255,255,255,0.8);font-size:13px;margin:0;letter-spacing:0.5px;">OFFER LETTER ATTACHED</p>
          <p style="color:#ffffff;font-size:22px;font-weight:700;margin:8px 0 0;">Please review the attached PDF</p>
        </td>
      </tr>
    </table>
    ${actionButton('Go to Dashboard', process.env.CLIENT_URL + '/student/dashboard')}
    ${paragraph('We are excited to welcome you to the team. If you have any questions, please do not hesitate to contact us. 🚀')}
  `);

// ==================== PLAIN TEXT GENERATORS ====================

/**
 * Generate plain-text fallback for any template.
 * Strips HTML and provides a clean text version.
 * @param {string} subject - Email subject
 * @param {string} name - Recipient name
 * @param {string} body - Plain text body
 * @returns {string}
 */
const plainText = (subject, name, body) =>
  `FWT internHub — ${subject}\n\nHi ${name},\n\n${body}\n\n---\n© ${new Date().getFullYear()} FWT internHub. All rights reserved.\nThis is an automated email. Please do not reply.`;

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
  // New internship lifecycle templates
  internshipApplicationConfirmationTemplate,
  internshipApprovalTemplate,
  certificateDeliveryTemplate,
  offerLetterDeliveryTemplate,
  plainText,
};

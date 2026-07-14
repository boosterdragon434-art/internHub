/**
 * Premium Professional HTML email templates for FrontierWox.
 * Each template returns a complete HTML email string.
 * Uses inline CSS for maximum email client compatibility.
 * All templates are responsive (max-width 600px, centered).
 */

// Brand Colors (Derived from logo and professional IT palette)
const brandColor = '#1a1a2e';       // Deep professional navy
const brandAccent = '#48abe5';      // FrontierWox Logo Blue
const brandAccentDark = '#3a8bc0';  // Darker shade of logo blue for hover states
const brandDark = '#0f0f1a';
const grayText = '#64748B';
const textMain = '#334155';
const bgLight = '#F8FAFC';
const borderLight = '#E2E8F0';

// Asset URLs
const websiteUrl = 'https://frontierwox.in';
const companyLogoUrl = `${process.env.CLIENT_URL || 'https://frontierwox.in'}/companylogo.jpeg`;
const normalLogoUrl = `${process.env.CLIENT_URL || 'https://frontierwox.in'}/logo1.png`;

/**
 * Base email wrapper with ultra-premium FrontierWox branding.
 */
const baseTemplate = (content) => `
  < !DOCTYPE html >
    <html lang="en">
      <head>
        <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <!--[if mso]>
            <style>
              table, td, div, p {font - family: Arial, sans-serif !important;}
            </style>
            <![endif]-->
          </head>
          <body style="margin:0;padding:0;background-color:${bgLight};font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';-webkit-font-smoothing:antialiased;word-break:break-word;">
            <!-- Preheader text for email clients -->
            <div style="display:none;font-size:1px;color:${bgLight};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
              FrontierWox Internship Management Platform Update
            </div>

            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${bgLight};width:100%;table-layout:fixed;">
              <tr>
                <td align="center" style="padding:40px 20px;">
                  <!-- Main Email Container -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01);">

                    <!-- Header -->
                    <tr>
                      <td style="background:linear-gradient(135deg, ${brandColor} 0%, ${brandDark} 100%);padding:40px 32px;text-align:center;border-bottom:4px solid ${brandAccent};">
                        <a href="${websiteUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
                          <img src="${companyLogoUrl}" alt="FrontierWox" style="max-height:56px;max-width:200px;height:auto;border-radius:4px;display:inline-block;border:2px solid rgba(255,255,255,0.1);" />
                        </a>
                        <h1 style="color:#ffffff;margin:24px 0 0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">FrontierWox internHub</h1>
                        <p style="color:${brandAccent};margin:6px 0 0;font-size:14px;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;">Internship Management Platform</p>
                      </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                      <td style="padding:48px 40px;">
                        ${content}
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color:#F1F5F9;padding:32px 40px;text-align:center;border-top:1px solid ${borderLight};">
                        <a href="${websiteUrl}" target="_blank" style="text-decoration:none;display:inline-block;margin-bottom:16px;">
                          <img src="${normalLogoUrl}" alt="FrontierWox Icon" style="max-height:32px;display:inline-block;" />
                        </a>
                        <p style="color:${grayText};font-size:13px;margin:0 0 8px;font-weight:500;">
                          <a href="${websiteUrl}" style="color:${brandAccent};text-decoration:none;">frontierwox.in</a>
                        </p>
                        <p style="color:#94A3B8;font-size:12px;margin:0 0 12px;line-height:1.5;">
                          &copy; ${new Date().getFullYear()} FrontierWox. All rights reserved.<br />
                          This is an automated email sent from the internHub platform. Please do not reply directly to this message.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Optional external footer links space -->
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
                    <tr>
                      <td align="center" style="padding:20px 0;">
                        <p style="color:#94A3B8;font-size:11px;margin:0;">
                          Secured by FrontierWox Technologies
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>`;

/**
 * Action button component.
 */
const actionButton = (text, url) => `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:32px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:${brandAccent};box-shadow:0 4px 14px 0 rgba(72,171,229,0.39);">
                    <a href="${url}" target="_blank" style="font-size:16px;font-weight:600;font-family:system-ui, -apple-system, sans-serif;color:#ffffff;text-decoration:none;border-radius:8px;padding:14px 36px;border:1px solid ${brandAccent};display:inline-block;">
                      ${text}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;

const greeting = (name) =>
  `<p style="color:${brandColor};font-size:20px;font-weight:700;margin:0 0 20px;line-height:1.4;">Hello ${name},</p>`;

const paragraph = (text) =>
  `<p style="color:${textMain};font-size:16px;line-height:1.625;margin:0 0 20px;">${text}</p>`;

/**
 * Styled info card used inside email templates.
 */
const infoCard = (label, value) => `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:12px 0;background-color:${bgLight};border-radius:12px;border:1px solid ${borderLight};">
          <tr>
            <td style="padding:20px 24px;border-left:4px solid ${brandAccent};border-radius:12px 0 0 12px;">
              <p style="color:${grayText};font-size:12px;margin:0;text-transform:uppercase;letter-spacing:0.8px;font-weight:700;">${label}</p>
              <p style="color:${brandColor};font-size:17px;font-weight:700;margin:6px 0 0;line-height:1.4;">${value}</p>
            </td>
          </tr>
        </table>`;

// ==================== EXISTING TEMPLATES ====================

const registrationTemplate = (name) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`Welcome to <strong>FrontierWox internHub</strong>! 🎉 We're thrilled to have you.`)}
        ${paragraph(`Your account has been created successfully. You can now browse internships, apply to exciting opportunities, and track your applications — all from your personalized dashboard.`)}
        ${actionButton('Access Your Dashboard', process.env.CLIENT_URL + '/dashboard')}
        ${paragraph(`If you have any questions or need assistance, our support team is always here to help.`)}
        `);

const emailVerificationTemplate = (name, verifyUrl) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`Thank you for signing up with FrontierWox! To ensure the security of your account, please verify your email address.`)}
        ${actionButton('Verify My Email', verifyUrl)}
        ${paragraph(`This secure link will expire in <strong>24 hours</strong>. If you didn't create an account, please disregard this email.`)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;">
          <tr>
            <td style="background-color:#F8FAFC;padding:16px;border-radius:8px;border:1px dashed #CBD5E1;">
              <p style="color:${grayText};font-size:13px;margin:0;word-break:break-all;line-height:1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${verifyUrl}" style="color:${brandAccent};text-decoration:none;">${verifyUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        `);

const applicationSubmittedTemplate = (name, internshipTitle) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`Your application for the <strong>${internshipTitle}</strong> internship has been submitted successfully! ✅`)}
        ${paragraph(`Our recruitment team will carefully review your profile and application details. You can track your real-time application status directly from your dashboard.`)}
        ${actionButton('View My Applications', process.env.CLIENT_URL + '/student/applications')}
        ${paragraph(`Thank you for your interest in joining FrontierWox. We appreciate the time you took to apply!`)}
        `);

const applicationApprovedTemplate = (name, internshipTitle) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`Congratulations! 🎉 We are excited to inform you that your application for the <strong>${internshipTitle}</strong> internship has been <span style="color:#10B981;font-weight:700;">approved</span>.`)}
        ${paragraph(`Please log in to your dashboard to view your next steps, which may include onboarding details and payment instructions.`)}
        ${actionButton('View Next Steps', process.env.CLIENT_URL + '/student/dashboard')}
        ${paragraph(`We're incredibly excited to have you on board!`)}
        `);

const applicationRejectedTemplate = (name, internshipTitle) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`Thank you for applying to the <strong>${internshipTitle}</strong> internship at FrontierWox. After careful consideration, we regret to inform you that your application was not selected at this time.`)}
        ${paragraph(`The competition was strong, and this decision does not reflect your potential. We strongly encourage you to keep exploring and apply to other open roles.`)}
        ${actionButton('Explore Other Internships', process.env.CLIENT_URL + '/internships')}
        ${paragraph(`We wish you the very best in your academic and professional journey.`)}
        `);

const paymentRequestTemplate = (name, internshipTitle, amount, paymentUrl) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`Your application for <strong>${internshipTitle}</strong> is approved! To finalize your enrollment and secure your spot, please complete the onboarding payment.`)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background-color:${bgLight};border-radius:12px;border:1px solid ${borderLight};">
          <tr>
            <td align="center" style="padding:32px 24px;">
              <p style="color:${grayText};font-size:14px;margin:0;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Amount Due</p>
              <p style="color:${brandColor};font-size:36px;font-weight:800;margin:8px 0 0;letter-spacing:-1px;">₹${amount.toLocaleString('en-IN')}</p>
            </td>
          </tr>
        </table>
        ${actionButton('Complete Payment Securely', paymentUrl)}
        ${paragraph(`We support all major payment methods including UPI, Google Pay, Credit/Debit Cards, and Net Banking.`)}
        `);

const paymentSuccessTemplate = (name, internshipTitle, amount) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`We have successfully received your payment of <strong>₹${amount.toLocaleString('en-IN')}</strong> for the <strong>${internshipTitle}</strong> program! ✅`)}
        ${paragraph(`Your enrollment is officially confirmed. You can download your detailed payment receipt from your dashboard at any time.`)}
        ${actionButton('View My Receipt', process.env.CLIENT_URL + '/student/applications')}
        ${paragraph(`Welcome aboard! We are looking forward to a great journey together.`)}
        `);

const joiningConfirmationTemplate = (name, internshipTitle) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`You have officially joined the <strong>${internshipTitle}</strong> team at FrontierWox! 🚀`)}
        ${paragraph(`Your internship journey begins now. Please head over to your dashboard to access important onboarding information, schedules, and exclusive resources.`)}
        ${actionButton('Access Workspace Dashboard', process.env.CLIENT_URL + '/student/dashboard')}
        ${paragraph(`We are thrilled to welcome you. Let's innovate and build something amazing together!`)}
        `);

const passwordResetTemplate = (name, resetUrl) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`We received a secure request to reset the password for your FrontierWox internHub account.`)}
        ${actionButton('Reset My Password', resetUrl)}
        ${paragraph(`This secure link will expire in <strong>30 minutes</strong>. If you did not request a password reset, please ignore this email — your account remains secure.`)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px;">
          <tr>
            <td style="background-color:#F8FAFC;padding:16px;border-radius:8px;border:1px dashed #CBD5E1;">
              <p style="color:${grayText};font-size:13px;margin:0;word-break:break-all;line-height:1.5;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                  <a href="${resetUrl}" style="color:${brandAccent};text-decoration:none;">${resetUrl}</a>
              </p>
            </td>
          </tr>
        </table>
        `);

const reminderTemplate = (name, reminderTitle, reminderDescription) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`This is an automated priority reminder from FrontierWox internHub regarding your upcoming deliverable:`)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background-color:#FFFBEB;border-radius:12px;border:1px solid #FEF3C7;border-left:4px solid #F59E0B;">
          <tr>
            <td style="padding:24px;">
              <p style="color:#92400E;font-size:16px;font-weight:700;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">${reminderTitle}</p>
              <p style="color:#B45309;font-size:15px;line-height:1.6;margin:0;">${reminderDescription || 'No additional details provided. Please check your dashboard.'}</p>
            </td>
          </tr>
        </table>
        ${actionButton('Review Tasks in Dashboard', process.env.CLIENT_URL + '/student/dashboard')}
        ${paragraph(`Please ensure you review and complete any associated tasks in a timely manner. Thank you for your dedication.`)}
        `);

// ==================== NEW INTERNSHIP LIFECYCLE TEMPLATES ====================

const internshipApplicationConfirmationTemplate = (name, internshipTitle) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`Your application for the <strong>${internshipTitle}</strong> internship at FrontierWox has been successfully received. ✅`)}
        ${infoCard('Role Applied For', internshipTitle)}
        ${paragraph(`Here is what you can expect next:`)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 32px;">
          <tr>
            <td style="padding:10px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:32px;height:32px;border-radius:50%;background-color:${brandAccent};color:#fff;text-align:center;font-size:14px;font-weight:700;line-height:32px;">1</td>
                  <td style="padding-left:16px;color:${textMain};font-size:15px;font-weight:500;">Our recruitment team reviews your profile (1-3 business days)</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:32px;height:32px;border-radius:50%;background-color:${brandAccent};color:#fff;text-align:center;font-size:14px;font-weight:700;line-height:32px;">2</td>
                  <td style="padding-left:16px;color:${textMain};font-size:15px;font-weight:500;">You receive an update via email with the decision</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="width:32px;height:32px;border-radius:50%;background-color:${brandAccent};color:#fff;text-align:center;font-size:14px;font-weight:700;line-height:32px;">3</td>
                  <td style="padding-left:16px;color:${textMain};font-size:15px;font-weight:500;">If approved, you can complete onboarding from your dashboard</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        ${actionButton('Track Application Status', process.env.CLIENT_URL + '/student/applications')}
        ${paragraph(`Thank you for choosing FrontierWox. We appreciate your interest in building the future with us!`)}
        `);

const internshipApprovalTemplate = (name, internshipTitle, startDate) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`<span style="font-size:24px;vertical-align:middle;margin-right:8px;">🎉</span><span style="vertical-align:middle;">Excellent news! Your application for the <strong>${internshipTitle}</strong> internship has been <span style="color:#10B981;font-weight:700;">approved</span>.</span>`)}
        ${infoCard('Approved Role', internshipTitle)}
        ${startDate ? infoCard('Tentative Start Date', new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })) : ''}
        ${paragraph(`Welcome to the FrontierWox family! To ensure a smooth start, please complete the following next steps:`)}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0 32px;background-color:#F8FAFC;border-radius:12px;padding:20px;">
          <tr>
            <td style="padding:8px 0;color:${brandColor};font-size:15px;line-height:1.6;font-weight:500;"><span style="color:${brandAccent};font-weight:bold;margin-right:8px;">✓</span> Access your dashboard for onboarding materials</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:${brandColor};font-size:15px;line-height:1.6;font-weight:500;"><span style="color:${brandAccent};font-weight:bold;margin-right:8px;">✓</span> Complete any pending enrollment requirements</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:${brandColor};font-size:15px;line-height:1.6;font-weight:500;"><span style="color:${brandAccent};font-weight:bold;margin-right:8px;">✓</span> Prepare for your kickoff session — details will follow soon</td>
          </tr>
        </table>
        ${actionButton('Access Dashboard Now', process.env.CLIENT_URL + '/student/dashboard')}
        ${paragraph(`We are extremely excited to have you on board. Get ready for an incredible learning experience!`)}
        `);

const certificateDeliveryTemplate = (name, internshipTitle, certificateId) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`<span style="font-size:24px;vertical-align:middle;margin-right:8px;">🎓</span><span style="vertical-align:middle;">Huge congratulations on successfully completing your <strong>${internshipTitle}</strong> internship at FrontierWox!</span>`)}
        ${paragraph(`Your official verifiable internship certificate has been generated and is attached to this email as a PDF. You can also access and download it anytime from your dashboard.`)}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;">
          <tr>
            <td style="width:50%;padding-right:8px;">
              ${infoCard('Certificate ID', certificateId)}
            </td>
            <td style="width:50%;padding-left:8px;">
              ${infoCard('Program', internshipTitle)}
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:linear-gradient(135deg, ${brandColor} 0%, ${brandDark} 100%);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:40px 32px;text-align:center;border-left:4px solid ${brandAccent};">
              <p style="color:${brandAccent};font-size:13px;margin:0;letter-spacing:1px;font-weight:700;text-transform:uppercase;">Achievement Unlocked</p>
              <p style="color:#ffffff;font-size:24px;font-weight:800;margin:12px 0 0;letter-spacing:-0.5px;">Your Certificate is Ready</p>
            </td>
          </tr>
        </table>

        ${actionButton('View in Dashboard', process.env.CLIENT_URL + '/student/certificates')}
        ${paragraph(`Your certificate includes a secure QR code for instant employer verification. Share it proudly on LinkedIn and with future employers.`)}
        ${paragraph(`Thank you for your hard work and outstanding contributions. We wish you immense success in your future career endeavors! 🚀`)}
        `);

const offerLetterDeliveryTemplate = (name, internshipTitle) =>
  baseTemplate(`
        ${greeting(name)}
        ${paragraph(`<span style="font-size:24px;vertical-align:middle;margin-right:8px;">🎉</span><span style="vertical-align:middle;">We are incredibly pleased to formally offer you the position of <strong>${internshipTitle}</strong> intern at FrontierWox!</span>`)}
        ${paragraph(`Your official Offer Letter is attached to this email. Please review the PDF document carefully as it outlines important details, terms, and the next steps regarding your internship.`)}

        ${infoCard('Offered Role', internshipTitle)}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:linear-gradient(135deg, ${brandColor} 0%, ${brandDark} 100%);border-radius:16px;overflow:hidden;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:40px 32px;text-align:center;border-left:4px solid ${brandAccent};">
              <p style="color:${brandAccent};font-size:13px;margin:0;letter-spacing:1px;font-weight:700;text-transform:uppercase;">Action Required</p>
              <p style="color:#ffffff;font-size:24px;font-weight:800;margin:12px 0 0;letter-spacing:-0.5px;">Offer Letter Attached</p>
            </td>
          </tr>
        </table>

        ${actionButton('Go to Dashboard', process.env.CLIENT_URL + '/student/dashboard')}
        ${paragraph(`We are eager to welcome you to the team and see you grow with us. If you have any immediate questions, please do not hesitate to reach out to our team.`)}
        `);

// ==================== PLAIN TEXT GENERATORS ====================

const plainText = (subject, name, body) =>
  `FrontierWox internHub — ${subject}\n\n` +
  `Hello ${name},\n\n` +
  `${body}\n\n` +
  `---\n` +
  `© ${new Date().getFullYear()} FrontierWox. All rights reserved.\n` +
  `Visit us at: ${websiteUrl}\n` +
  `This is an automated email. Please do not reply directly to this message.`;

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
  internshipApplicationConfirmationTemplate,
  internshipApprovalTemplate,
  certificateDeliveryTemplate,
  offerLetterDeliveryTemplate,
  plainText,
};

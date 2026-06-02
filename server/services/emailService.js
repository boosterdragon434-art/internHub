const nodemailer = require('nodemailer');
const EmailLog = require('../models/EmailLog');
const logger = require('../utils/logger');
const {
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
  plainText,
} = require('../templates/emailTemplates');

/**
 * Email Service — handles all automated email sending with Nodemailer.
 * Supports HTML templates, plain-text fallbacks, and file attachments.
 */
class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Initialize the SMTP transporter (lazy init).
   */
  _getTransporter() {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return this.transporter;
  }

  /**
   * Send an email and log the result.
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML body
   * @param {string} type - Email type for logging
   * @param {Object} [options] - Optional settings
   * @param {string} [options.text] - Plain-text fallback
   * @param {Array} [options.attachments] - Nodemailer attachment objects
   */
  async _sendEmail(to, subject, html, type, options = {}) {
    try {
      const transporter = this._getTransporter();

      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'FWT iZON'}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
      };

      // Add plain-text fallback
      if (options.text) {
        mailOptions.text = options.text;
      }

      // Add attachments (e.g., PDF certificates)
      if (options.attachments && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments;
      }

      await transporter.sendMail(mailOptions);

      await EmailLog.create({ to, subject, type, status: 'sent' });
      logger.info(`Email sent: [${type}] to ${to}`);
    } catch (error) {
      await EmailLog.create({
        to,
        subject,
        type,
        status: 'failed',
        error: error.message,
      });
      logger.error(`Email failed: [${type}] to ${to}`, error);
    }
  }

  /**
   * Non-blocking email send wrapper — uses setImmediate to avoid blocking
   * the request cycle and prevent timeouts on slow SMTP connections.
   * @param {Function} sendFn - Async function to execute
   */
  _sendAsync(sendFn) {
    setImmediate(async () => {
      try {
        await sendFn();
      } catch (error) {
        logger.error('Async email send failed:', error);
      }
    });
  }

  // ==================== EXISTING METHODS ====================

  async sendRegistration(user) {
    const html = registrationTemplate(user.name);
    const text = plainText('Welcome!', user.name, 'Your FWT iZON account has been created successfully. Visit your dashboard to get started.');
    await this._sendEmail(user.email, 'Welcome to FWT iZON! 🎉', html, 'registration', { text });
  }

  async sendEmailVerification(user, token) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    const html = emailVerificationTemplate(user.name, verifyUrl);
    const text = plainText('Verify Email', user.name, `Please verify your email by visiting: ${verifyUrl}`);
    await this._sendEmail(user.email, 'Verify Your Email — FWT iZON', html, 'email_verification', { text });
  }

  async sendApplicationSubmitted(user, internshipTitle) {
    const html = applicationSubmittedTemplate(user.name, internshipTitle);
    const text = plainText('Application Submitted', user.name, `Your application for ${internshipTitle} has been submitted successfully.`);
    await this._sendEmail(
      user.email,
      `Application Submitted — ${internshipTitle}`,
      html,
      'application_submitted',
      { text }
    );
  }

  async sendApplicationApproved(user, internshipTitle) {
    const html = applicationApprovedTemplate(user.name, internshipTitle);
    const text = plainText('Application Approved', user.name, `Your application for ${internshipTitle} has been approved!`);
    await this._sendEmail(
      user.email,
      `Application Approved! — ${internshipTitle} 🎉`,
      html,
      'application_approved',
      { text }
    );
  }

  async sendApplicationRejected(user, internshipTitle) {
    const html = applicationRejectedTemplate(user.name, internshipTitle);
    const text = plainText('Application Update', user.name, `After careful review, your application for ${internshipTitle} was not selected.`);
    await this._sendEmail(
      user.email,
      `Application Update — ${internshipTitle}`,
      html,
      'application_rejected',
      { text }
    );
  }

  async sendPaymentRequest(user, internshipTitle, amount) {
    const paymentUrl = `${process.env.CLIENT_URL}/student/applications`;
    const html = paymentRequestTemplate(user.name, internshipTitle, amount, paymentUrl);
    const text = plainText('Payment Request', user.name, `Please pay ₹${amount} for ${internshipTitle}. Visit: ${paymentUrl}`);
    await this._sendEmail(
      user.email,
      `Payment Request — ${internshipTitle}`,
      html,
      'payment_request',
      { text }
    );
  }

  async sendPaymentSuccess(user, internshipTitle, amount) {
    const html = paymentSuccessTemplate(user.name, internshipTitle, amount);
    const text = plainText('Payment Successful', user.name, `Your payment of ₹${amount} for ${internshipTitle} was received.`);
    await this._sendEmail(
      user.email,
      `Payment Successful — ${internshipTitle} ✅`,
      html,
      'payment_success',
      { text }
    );
  }

  async sendJoiningConfirmation(user, internshipTitle) {
    const html = joiningConfirmationTemplate(user.name, internshipTitle);
    const text = plainText('Joining Confirmed', user.name, `You have officially joined ${internshipTitle}!`);
    await this._sendEmail(
      user.email,
      `Joining Confirmed — ${internshipTitle} 🚀`,
      html,
      'joining_confirmation',
      { text }
    );
  }

  async sendPasswordReset(user, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const html = passwordResetTemplate(user.name, resetUrl);
    const text = plainText('Password Reset', user.name, `Reset your password: ${resetUrl}`);
    await this._sendEmail(user.email, 'Password Reset — FWT iZON', html, 'password_reset', { text });
  }

  async sendReminderEmail(user, title, description) {
    const html = reminderTemplate(user.name, title, description);
    const text = plainText(`Reminder: ${title}`, user.name, description || 'You have a pending reminder.');
    await this._sendEmail(user.email, `Reminder Alert — ${title} ⏰`, html, 'reminder', { text });
  }

  // ==================== NEW INTERNSHIP LIFECYCLE METHODS ====================

  /**
   * Send internship application confirmation with branded template.
   * @param {Object} user - User object with name and email
   * @param {string} internshipTitle - Title of the internship
   */
  async sendInternshipConfirmation(user, internshipTitle) {
    const html = internshipApplicationConfirmationTemplate(user.name, internshipTitle);
    const text = plainText(
      'Application Received',
      user.name,
      `We've received your application for the ${internshipTitle} internship. Our team will review it within 1-3 business days.`
    );
    await this._sendEmail(
      user.email,
      `Application Received — ${internshipTitle}`,
      html,
      'application_submitted',
      { text }
    );
  }

  /**
   * Send internship approval notification with start date.
   * @param {Object} user - User object with name and email
   * @param {string} internshipTitle - Title of the internship
   * @param {Date} [startDate] - Optional start date
   */
  async sendInternshipApproval(user, internshipTitle, startDate) {
    const html = internshipApprovalTemplate(user.name, internshipTitle, startDate);
    const text = plainText(
      'Application Approved',
      user.name,
      `Congratulations! Your application for ${internshipTitle} has been approved. Check your dashboard for next steps.`
    );
    await this._sendEmail(
      user.email,
      `You're In! — ${internshipTitle} Approved 🎉`,
      html,
      'application_approved',
      { text }
    );
  }

  /**
   * Send certificate delivery email with PDF attachment.
   * @param {Object} user - User object with name and email
   * @param {string} internshipTitle - Title of the internship
   * @param {string} certificateId - Certificate ID (e.g., FWT-INT-2026-0001)
   * @param {string} pdfUrl - Cloudinary URL of the PDF certificate
   */
  async sendCertificateDelivery(user, internshipTitle, certificateId, pdfUrl) {
    const html = certificateDeliveryTemplate(user.name, internshipTitle, certificateId);
    const text = plainText(
      'Certificate Ready',
      user.name,
      `Congratulations on completing ${internshipTitle}! Your certificate (ID: ${certificateId}) is attached. Download it from your dashboard.`
    );

    const attachments = [];
    if (pdfUrl) {
      attachments.push({
        filename: `${certificateId}_Certificate.pdf`,
        path: pdfUrl,
      });
    }

    await this._sendEmail(
      user.email,
      `Your Certificate is Ready — ${internshipTitle} 🎓`,
      html,
      'certificate_delivery',
      { text, attachments }
    );
  }
}

module.exports = new EmailService();

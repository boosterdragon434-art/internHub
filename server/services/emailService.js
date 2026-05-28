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
} = require('../templates/emailTemplates');

/**
 * Email Service — handles all automated email sending with Nodemailer.
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
   */
  async _sendEmail(to, subject, html, type) {
    try {
      const transporter = this._getTransporter();

      await transporter.sendMail({
        from: `"${process.env.FROM_NAME || 'InternHub'}" <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html,
      });

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

  async sendRegistration(user) {
    const html = registrationTemplate(user.name);
    await this._sendEmail(user.email, 'Welcome to InternHub! 🎉', html, 'registration');
  }

  async sendEmailVerification(user, token) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    const html = emailVerificationTemplate(user.name, verifyUrl);
    await this._sendEmail(user.email, 'Verify Your Email — InternHub', html, 'email_verification');
  }

  async sendApplicationSubmitted(user, internshipTitle) {
    const html = applicationSubmittedTemplate(user.name, internshipTitle);
    await this._sendEmail(
      user.email,
      `Application Submitted — ${internshipTitle}`,
      html,
      'application_submitted'
    );
  }

  async sendApplicationApproved(user, internshipTitle) {
    const html = applicationApprovedTemplate(user.name, internshipTitle);
    await this._sendEmail(
      user.email,
      `Application Approved! — ${internshipTitle} 🎉`,
      html,
      'application_approved'
    );
  }

  async sendApplicationRejected(user, internshipTitle) {
    const html = applicationRejectedTemplate(user.name, internshipTitle);
    await this._sendEmail(
      user.email,
      `Application Update — ${internshipTitle}`,
      html,
      'application_rejected'
    );
  }

  async sendPaymentRequest(user, internshipTitle, amount) {
    const paymentUrl = `${process.env.CLIENT_URL}/student/applications`;
    const html = paymentRequestTemplate(user.name, internshipTitle, amount, paymentUrl);
    await this._sendEmail(
      user.email,
      `Payment Request — ${internshipTitle}`,
      html,
      'payment_request'
    );
  }

  async sendPaymentSuccess(user, internshipTitle, amount) {
    const html = paymentSuccessTemplate(user.name, internshipTitle, amount);
    await this._sendEmail(
      user.email,
      `Payment Successful — ${internshipTitle} ✅`,
      html,
      'payment_success'
    );
  }

  async sendJoiningConfirmation(user, internshipTitle) {
    const html = joiningConfirmationTemplate(user.name, internshipTitle);
    await this._sendEmail(
      user.email,
      `Joining Confirmed — ${internshipTitle} 🚀`,
      html,
      'joining_confirmation'
    );
  }

  async sendPasswordReset(user, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const html = passwordResetTemplate(user.name, resetUrl);
    await this._sendEmail(user.email, 'Password Reset — InternHub', html, 'password_reset');
  }

  async sendReminderEmail(user, title, description) {
    const html = reminderTemplate(user.name, title, description);
    await this._sendEmail(user.email, `Reminder Alert — ${title} ⏰`, html, 'reminder');
  }
}

module.exports = new EmailService();

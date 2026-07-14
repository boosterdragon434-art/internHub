/**
 * Application-wide constants and enumerations.
 */

const APPLICATION_STATUS = {
  APPLIED: 'Applied',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_VERIFICATION_PENDING: 'Payment Verification Pending',
  PAYMENT_COMPLETED: 'Payment Completed',
  JOINED: 'Joined',
  COMPLETED: 'Completed',
};

const PAYMENT_STATUS = {
  PENDING_VERIFICATION: 'pending_verification',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const INTERNSHIP_MODE = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  OFFLINE: 'Offline',
};

const INTERNSHIP_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  DRAFT: 'draft',
};

const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  GUIDE: 'guide',
};

const ATTENDANCE_STATUS = {
  CHECKED_IN: 'checked-in',
  ON_BREAK: 'on-break',
  CHECKED_OUT: 'checked-out',
  MISSED_CHECKOUT: 'missed-checkout',
};

const NOTIFICATION_TYPES = {
  APPLICATION: 'application',
  PAYMENT: 'payment',
  GENERAL: 'general',
  ANNOUNCEMENT: 'announcement',
  TASK: 'task',
  REMINDER: 'reminder',
  CERTIFICATE: 'certificate',
  CHAT: 'chat',
  SYSTEM: 'system',
  ATTENDANCE: 'attendance',
};

const EMAIL_TYPES = {
  REGISTRATION: 'registration',
  EMAIL_VERIFICATION: 'email_verification',
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_APPROVED: 'application_approved',
  APPLICATION_REJECTED: 'application_rejected',
  APPLICATION_COMPLETED: 'application_completed',
  CERTIFICATE_DELIVERY: 'certificate_delivery',
  PAYMENT_REQUEST: 'payment_request',
  PAYMENT_SUCCESS: 'payment_success',
  JOINING_CONFIRMATION: 'joining_confirmation',
  PASSWORD_RESET: 'password_reset',
};

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const CERTIFICATE_STATUS = {
  DRAFT: 'draft',
  ISSUED: 'issued',
  REVOKED: 'revoked',
};

const TEMPLATE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const FILE_LIMITS = {
  RESUME_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  CERTIFICATE_TEMPLATE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_RESUME_TYPES: ['application/pdf'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_TEMPLATE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  /** Maximum base64 string length (~13.3MB base64 = 10MB binary) */
  MAX_BASE64_LENGTH: 14 * 1024 * 1024,
};


/** Prefix for collision-resistant certificate IDs */
const CERTIFICATE_ID_PREFIX = 'CERT';

/** Prefix for sequential internship completion certificate IDs */
const INTERNSHIP_CERT_PREFIX = 'FWT-INT';

/** Maximum number of applications for bulk certificate generation (Phase 9: raised from 50) */
const BULK_GENERATION_LIMIT = 200;

/** Maximum number of version snapshots retained per template (Phase 10) */
const MAX_TEMPLATE_VERSIONS = 20;

module.exports = {
  APPLICATION_STATUS,
  PAYMENT_STATUS,
  INTERNSHIP_MODE,
  INTERNSHIP_STATUS,
  USER_ROLES,
  ATTENDANCE_STATUS,
  NOTIFICATION_TYPES,
  EMAIL_TYPES,
  PAGINATION,
  CERTIFICATE_STATUS,
  TEMPLATE_STATUS,
  FILE_LIMITS,
  CERTIFICATE_ID_PREFIX,
  INTERNSHIP_CERT_PREFIX,
  BULK_GENERATION_LIMIT,
  MAX_TEMPLATE_VERSIONS,
};

/**
 * Application-wide constants and enumerations.
 */

const APPLICATION_STATUS = {
  APPLIED: 'Applied',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PAYMENT_PENDING: 'Payment Pending',
  PAYMENT_COMPLETED: 'Payment Completed',
  JOINED: 'Joined',
};

const PAYMENT_STATUS = {
  CREATED: 'created',
  ATTEMPTED: 'attempted',
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

const FILE_LIMITS = {
  RESUME_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_RESUME_TYPES: ['application/pdf'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
};

const DRIVE_FOLDERS = {
  RESUMES: 'Resumes',
  CERTIFICATES: 'Certificates',
  RECEIPTS: 'Receipts',
  IMAGES: 'InternshipImages',
};

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
  FILE_LIMITS,
  DRIVE_FOLDERS,
};

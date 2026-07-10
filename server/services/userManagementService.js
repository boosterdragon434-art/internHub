const mongoose = require('mongoose');
const User = require('../models/User');
const Application = require('../models/Application');
const EnrollmentInstance = require('../models/EnrollmentInstance');
const AttendanceSession = require('../models/AttendanceSession');
const Payment = require('../models/Payment');
const PaymentRequest = require('../models/PaymentRequest');
const Certificate = require('../models/Certificate');
const Task = require('../models/Task');
const TaskComment = require('../models/TaskComment');
const TaskActivity = require('../models/TaskActivity');
const Notification = require('../models/Notification');
const Reminder = require('../models/Reminder');
const InternGroup = require('../models/InternGroup');
const AuditLog = require('../models/AuditLog');
const r2Service = require('./r2Service');
const logger = require('../utils/logger');

/**
 * User Management Service
 *
 * Handles lock/unlock, soft-delete/restore, and permanent hard-delete
 * operations for student and guide accounts. Admin accounts are protected
 * from all destructive actions.
 *
 * Every action creates an AuditLog entry for traceability.
 */

// ─── Guard ──────────────────────────────────────────────────────────
/**
 * Validates that the target user exists and is not an admin.
 * @param {string} userId - Target user ID
 * @param {object} [options] - Options
 * @param {boolean} [options.allowDeleted] - If true, also finds soft-deleted users
 * @returns {Promise<object>} The user document
 * @throws {Error} If user not found or is admin
 */
const _getTargetUser = async (userId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid user ID format.');
    err.statusCode = 400;
    throw err;
  }

  const filter = { _id: userId };
  if (!options.allowDeleted) {
    filter.isDeleted = { $ne: true };
  }

  const user = await User.findOne(filter).select(
    'name email role isActive isDeleted deletedAt resumePublicId assignedGuide assignedStudents'
  );

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'admin') {
    const err = new Error('Admin accounts cannot be modified through this action.');
    err.statusCode = 403;
    throw err;
  }

  return user;
};

// ─── Lock / Unlock ──────────────────────────────────────────────────
/**
 * Locks a user account — blocks login and dashboard access.
 * Sets isActive=false, increments tokenVersion to force-logout all sessions.
 *
 * @param {string} userId - Target user ID
 * @param {string} adminId - Admin performing the action
 * @param {string} [reason] - Optional reason for locking
 * @returns {Promise<object>} Updated user summary
 */
const lockUser = async (userId, adminId, reason = '') => {
  const user = await _getTargetUser(userId);

  if (!user.isActive) {
    const err = new Error('This account is already locked.');
    err.statusCode = 400;
    throw err;
  }

  await User.findByIdAndUpdate(userId, {
    isActive: false,
    lockedAt: new Date(),
    lockedBy: adminId,
    lockReason: reason,
    $inc: { tokenVersion: 1 }, // Invalidate all active sessions
  });

  await AuditLog.create({
    admin: adminId,
    action: 'USER_LOCKED',
    targetModel: 'User',
    targetId: userId,
    changes: {
      reason,
      userEmail: user.email,
      userRole: user.role,
    },
  });

  logger.info(`User locked: ${user.email} (${user.role}) by admin=${adminId}, reason="${reason}"`);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: false,
    lockedAt: new Date(),
  };
};

/**
 * Unlocks a previously locked user account — restores login and access.
 *
 * @param {string} userId - Target user ID
 * @param {string} adminId - Admin performing the action
 * @returns {Promise<object>} Updated user summary
 */
const unlockUser = async (userId, adminId) => {
  const user = await _getTargetUser(userId);

  if (user.isActive) {
    const err = new Error('This account is not locked.');
    err.statusCode = 400;
    throw err;
  }

  await User.findByIdAndUpdate(userId, {
    isActive: true,
    lockedAt: null,
    lockedBy: null,
    lockReason: '',
  });

  await AuditLog.create({
    admin: adminId,
    action: 'USER_UNLOCKED',
    targetModel: 'User',
    targetId: userId,
    changes: {
      userEmail: user.email,
      userRole: user.role,
    },
  });

  logger.info(`User unlocked: ${user.email} (${user.role}) by admin=${adminId}`);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: true,
  };
};

// ─── Soft Delete / Restore ──────────────────────────────────────────
/**
 * Soft-deletes a user — marks as deleted, hides from queries, blocks access.
 * Data is preserved and can be restored later.
 * Also increments tokenVersion to force-logout all sessions.
 *
 * @param {string} userId - Target user ID
 * @param {string} adminId - Admin performing the action
 * @param {string} [reason] - Optional reason for deletion
 * @returns {Promise<object>} Updated user summary
 */
const softDeleteUser = async (userId, adminId, reason = '') => {
  const user = await _getTargetUser(userId);

  if (user.isDeleted) {
    const err = new Error('This account is already soft-deleted.');
    err.statusCode = 400;
    throw err;
  }

  await User.findByIdAndUpdate(userId, {
    isDeleted: true,
    deletedAt: new Date(),
    deletedBy: adminId,
    isActive: false,
    $inc: { tokenVersion: 1 },
  });

  await AuditLog.create({
    admin: adminId,
    action: 'USER_SOFT_DELETED',
    targetModel: 'User',
    targetId: userId,
    changes: {
      reason,
      userEmail: user.email,
      userRole: user.role,
    },
  });

  logger.info(`User soft-deleted: ${user.email} (${user.role}) by admin=${adminId}, reason="${reason}"`);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isDeleted: true,
    deletedAt: new Date(),
  };
};

/**
 * Restores a soft-deleted user — makes them visible and accessible again.
 * Does NOT automatically unlock (isActive stays false — admin must unlock separately).
 *
 * @param {string} userId - Target user ID
 * @param {string} adminId - Admin performing the action
 * @returns {Promise<object>} Updated user summary
 */
const restoreUser = async (userId, adminId) => {
  const user = await _getTargetUser(userId, { allowDeleted: true });

  if (!user.isDeleted) {
    const err = new Error('This account is not soft-deleted.');
    err.statusCode = 400;
    throw err;
  }

  await User.findByIdAndUpdate(userId, {
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    isActive: true, // Restore to active state
    lockedAt: null,
    lockedBy: null,
    lockReason: '',
  });

  await AuditLog.create({
    admin: adminId,
    action: 'USER_RESTORED',
    targetModel: 'User',
    targetId: userId,
    changes: {
      userEmail: user.email,
      userRole: user.role,
    },
  });

  logger.info(`User restored from soft-delete: ${user.email} (${user.role}) by admin=${adminId}`);

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isDeleted: false,
    isActive: true,
  };
};

// ─── Hard Delete ────────────────────────────────────────────────────
/**
 * Permanently deletes a user and cascades cleanup across all related collections.
 * This action is IRREVERSIBLE. Only soft-deleted users can be hard-deleted (two-step safety).
 *
 * Cascade operations:
 * 1. Delete all Applications
 * 2. Delete all EnrollmentInstances
 * 3. Delete all AttendanceSessions
 * 4. Delete all Payments
 * 5. Delete all PaymentRequests
 * 6. Delete all Certificates (+ R2 PDFs)
 * 7. Remove from Task assignees/watchers
 * 8. Delete TaskComments authored by user
 * 9. Delete TaskActivity by user
 * 10. Delete Notifications
 * 11. Delete Reminders
 * 12. Remove from InternGroup members
 * 13. Unlink guide-student relationships
 * 14. Delete user's R2 resume
 * 15. Delete user document
 *
 * @param {string} userId - Target user ID
 * @param {string} adminId - Admin performing the action
 * @returns {Promise<object>} Summary of deleted record counts
 */
const hardDeleteUser = async (userId, adminId) => {
  const user = await _getTargetUser(userId, { allowDeleted: true });

  if (!user.isDeleted) {
    const err = new Error(
      'Only soft-deleted users can be permanently deleted. Please soft-delete first.'
    );
    err.statusCode = 400;
    throw err;
  }

  // Create audit log BEFORE deletion (so we have a record even if deletion fails partway)
  await AuditLog.create({
    admin: adminId,
    action: 'USER_HARD_DELETED',
    targetModel: 'User',
    targetId: userId,
    changes: {
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      deletedPermanentlyAt: new Date().toISOString(),
    },
  });

  const summary = {
    userId: userId.toString(),
    email: user.email,
    role: user.role,
    deletedCounts: {},
  };

  // ── 1. Clean up R2 files ──────────────────────────────────────
  // Delete resume from storage
  if (user.resumePublicId) {
    try {
      await r2Service.deleteFile(user.resumePublicId, 'auto');
      logger.info(`Deleted R2 resume for ${user.email}: ${user.resumePublicId}`);
    } catch (err) {
      logger.error(`Failed to delete R2 resume for ${user.email}:`, err);
    }
  }

  // Delete certificate PDFs from storage
  const userCerts = await Certificate.find({ student: userId }).select('pdfPublicId').lean();
  let certFilesDeleted = 0;
  for (const cert of userCerts) {
    if (cert.pdfPublicId) {
      try {
        await r2Service.deleteFile(cert.pdfPublicId, 'auto');
        certFilesDeleted++;
      } catch (err) {
        logger.error(`Failed to delete certificate PDF ${cert.pdfPublicId}:`, err);
      }
    }
  }
  if (certFilesDeleted > 0) {
    summary.deletedCounts.certificateFiles = certFilesDeleted;
  }

  // ── 2. Cascade delete related documents ───────────────────────
  const cascadeOps = [
    { model: Application, filter: { user: userId }, label: 'applications' },
    { model: EnrollmentInstance, filter: { student: userId }, label: 'enrollments' },
    { model: AttendanceSession, filter: { user: userId }, label: 'attendanceSessions' },
    { model: Payment, filter: { user: userId }, label: 'payments' },
    { model: PaymentRequest, filter: { student: userId }, label: 'paymentRequests' },
    { model: Certificate, filter: { student: userId }, label: 'certificates' },
    { model: TaskComment, filter: { author: userId }, label: 'taskComments' },
    { model: TaskActivity, filter: { user: userId }, label: 'taskActivities' },
    { model: Notification, filter: { user: userId }, label: 'notifications' },
    { model: Reminder, filter: { $or: [{ user: userId }, { createdBy: userId }] }, label: 'reminders' },
  ];

  for (const op of cascadeOps) {
    try {
      const result = await op.model.deleteMany(op.filter);
      if (result.deletedCount > 0) {
        summary.deletedCounts[op.label] = result.deletedCount;
      }
    } catch (err) {
      logger.error(`Failed cascade delete for ${op.label} (user=${userId}):`, err);
    }
  }

  // ── 3. Remove user from Task assignees and watchers ───────────
  try {
    const taskPull = await Task.updateMany(
      { $or: [{ assignees: userId }, { watchers: userId }] },
      { $pull: { assignees: userId, watchers: userId } }
    );
    if (taskPull.modifiedCount > 0) {
      summary.deletedCounts.tasksModified = taskPull.modifiedCount;
    }
  } catch (err) {
    logger.error(`Failed to remove user from tasks (user=${userId}):`, err);
  }

  // ── 4. Remove from InternGroup members ────────────────────────
  try {
    const groupPull = await InternGroup.updateMany(
      { members: userId },
      { $pull: { members: userId } }
    );
    if (groupPull.modifiedCount > 0) {
      summary.deletedCounts.teamsModified = groupPull.modifiedCount;
    }

    // If user was a guide for any team, unset the guide field
    if (user.role === 'guide') {
      const guideUnset = await InternGroup.updateMany(
        { guide: userId },
        { $set: { guide: null } }
      );
      if (guideUnset.modifiedCount > 0) {
        summary.deletedCounts.teamsGuideRemoved = guideUnset.modifiedCount;
      }
    }
  } catch (err) {
    logger.error(`Failed to remove user from intern groups (user=${userId}):`, err);
  }

  // ── 5. Unlink guide-student relationships ─────────────────────
  try {
    if (user.role === 'student' && user.assignedGuide) {
      // Remove this student from their guide's assignedStudents
      await User.findByIdAndUpdate(user.assignedGuide, {
        $pull: { assignedStudents: userId },
      });
      summary.deletedCounts.guideUnlinked = 1;
    }

    if (user.role === 'guide' && user.assignedStudents?.length > 0) {
      // Unassign this guide from all their students
      const unassignResult = await User.updateMany(
        { assignedGuide: userId },
        { $set: { assignedGuide: null } }
      );
      if (unassignResult.modifiedCount > 0) {
        summary.deletedCounts.studentsUnlinked = unassignResult.modifiedCount;
      }
    }
  } catch (err) {
    logger.error(`Failed to unlink guide-student relationships (user=${userId}):`, err);
  }

  // ── 6. Delete the user document ───────────────────────────────
  await User.deleteOne({ _id: userId });
  summary.deletedCounts.user = 1;

  logger.info(`User permanently deleted: ${user.email} (${user.role}) by admin=${adminId}`, summary.deletedCounts);

  return summary;
};

// ─── Get User Details (for admin panel) ─────────────────────────────
/**
 * Fetches a single user's management details including lock/delete status.
 *
 * @param {string} userId - Target user ID
 * @returns {Promise<object>} User details
 */
const getUserManagementDetails = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('Invalid user ID format.');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId)
    .select('name email role isActive isDeleted deletedAt deletedBy lockedAt lockedBy lockReason createdAt')
    .populate('lockedBy', 'name email')
    .populate('deletedBy', 'name email')
    .lean();

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return user;
};

module.exports = {
  lockUser,
  unlockUser,
  softDeleteUser,
  restoreUser,
  hardDeleteUser,
  getUserManagementDetails,
};

const User = require('../models/User');
const EnrollmentInstance = require('../models/EnrollmentInstance');
const logger = require('../utils/logger');

/**
 * Atomically reassigns a student from one guide to another (or to no guide).
 * Maintains bidirectional relationship integrity.
 * 
 * @param {string} studentId - The ID of the student user
 * @param {string|null} newGuideId - The ID of the new guide, or null to unassign
 * @param {object} options - Options including mongoose session
 * @returns {Promise<void>}
 */
const reassignStudentGuide = async (studentId, newGuideId, options = {}) => {
  const { session } = options;

  // 1. Read student to find current guide
  const student = await User.findById(studentId).session(session || null);
  if (!student) {
    throw new Error(`Student ${studentId} not found during guide reassignment.`);
  }

  const oldGuideId = student.assignedGuide ? student.assignedGuide.toString() : null;
  const targetGuideId = newGuideId ? newGuideId.toString() : null;

  // If there's no change needed, do nothing.
  if (oldGuideId === targetGuideId) {
    return;
  }

  // 2. Remove student from old guide's assignedStudents list
  if (oldGuideId) {
    await User.findByIdAndUpdate(
      oldGuideId,
      { $pull: { assignedStudents: studentId } },
      { session }
    );
  }

  // 3. Set student's assignedGuide
  student.assignedGuide = targetGuideId;
  await student.save({ validateBeforeSave: false, session });

  // 4. Add student to new guide's assignedStudents list
  if (targetGuideId) {
    await User.findByIdAndUpdate(
      targetGuideId,
      { $addToSet: { assignedStudents: studentId } },
      { session }
    );
  }

  // 5. Sync assignedGuide on all active EnrollmentInstances for this student
  await EnrollmentInstance.updateMany(
    { student: studentId, status: 'active' },
    { $set: { assignedGuide: targetGuideId } },
    { session }
  );

  logger.info(`Student ${student.email} guide reassigned: ${oldGuideId || 'None'} -> ${targetGuideId || 'None'}`);
};

module.exports = {
  reassignStudentGuide,
};

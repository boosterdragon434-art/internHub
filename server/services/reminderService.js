const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');
const emailService = require('./emailService');
const logger = require('../utils/logger');

/**
 * Calculates the next trigger date for recurring reminders.
 */
const calculateNextTriggerDate = (frequency, interval, currentDate) => {
  const next = new Date(currentDate);
  const addInterval = interval || 1;

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + addInterval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7 * addInterval);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + addInterval);
      break;
    default:
      break;
  }
  return next;
};

/**
 * Scans the database for due reminders, dispatches notifications, and handles recurring rescheduling.
 */
const processDueReminders = async () => {
  try {
    const now = new Date();
    const dueReminders = await Reminder.find({
      status: 'pending',
      triggerAt: { $lte: now },
    }).populate('user');

    if (dueReminders.length === 0) return;

    logger.info(`Reminder Service: Processing ${dueReminders.length} due reminders.`);

    for (const reminder of dueReminders) {
      if (!reminder.user) {
        reminder.status = 'dismissed';
        await reminder.save();
        continue;
      }

      // 1. Dispatch In-App Notification
      if (reminder.channels.includes('in_app')) {
        await Notification.create({
          user: reminder.user._id,
          title: reminder.title,
          message: reminder.description || `Deliverable Alert: "${reminder.title}".`,
          type: 'reminder',
          link: reminder.relatedTask ? '/student/tasks' : '/student/dashboard',
        }).catch((err) => logger.error(`In-App Notification failed for reminder ${reminder._id}:`, err));
      }

      // 2. Dispatch Email
      if (reminder.channels.includes('email')) {
        emailService
          .sendReminderEmail(reminder.user, reminder.title, reminder.description)
          .catch((err) => logger.error(`Email reminder failed for user ${reminder.user.email}:`, err));
      }

      // 3. Mark current reminder as sent
      reminder.status = 'sent';
      await reminder.save();

      // 4. Handle Recurrence Scheduling
      if (reminder.isRecurring && reminder.recurringConfig?.frequency) {
        const { frequency, interval, endDate } = reminder.recurringConfig;
        const nextTrigger = calculateNextTriggerDate(frequency, interval, reminder.triggerAt);

        // Check if next trigger is within expiration boundaries
        if (!endDate || nextTrigger <= new Date(endDate)) {
          await Reminder.create({
            user: reminder.user._id,
            title: reminder.title,
            description: reminder.description,
            type: reminder.type,
            triggerAt: nextTrigger,
            isRecurring: true,
            recurringConfig: reminder.recurringConfig,
            channels: reminder.channels,
            relatedTask: reminder.relatedTask,
            createdBy: reminder.createdBy,
            status: 'pending',
          });
          logger.info(`Reminder Service: Rescheduled recurring reminder "${reminder.title}" to ${nextTrigger}`);
        }
      }
    }
  } catch (error) {
    logger.error('Reminder Service Error during processing loop:', error);
  }
};

/**
 * Passive Middleware for Serverless Environments (Vercel).
 * Processes due reminders asynchronously on incoming API calls without blocking request thread.
 */
const passiveReminderCheck = (req, res, next) => {
  // Non-blocking asynchronous execution
  processDueReminders().catch((err) => logger.error('Passive reminder execution failed:', err));
  next();
};

/**
 * Active Persistent Cron Scheduler for Stateful Deployments.
 */
let schedulerInterval = null;
const startReminderScheduler = () => {
  if (schedulerInterval) return;

  logger.info('Reminder Service: Starting persistent background active scheduler (60s tick interval).');
  schedulerInterval = setInterval(async () => {
    await processDueReminders();
  }, 60 * 1000);
};

module.exports = {
  processDueReminders,
  passiveReminderCheck,
  startReminderScheduler,
};

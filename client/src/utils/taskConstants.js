/**
 * Shared constants and helpers for the Task Management module.
 * Single source of truth for kanban columns and priority visuals, plus
 * due-date/summary helpers — consumed by every task-related component and page
 * so fixes and design changes only need to happen in one place.
 */

export const TASK_COLUMNS = [
  {
    id: 'backlog',
    title: 'Backlog',
    headerClass:
      'text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800',
  },
  {
    id: 'todo',
    title: 'To Do',
    headerClass:
      'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    headerClass:
      'text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40',
  },
  {
    id: 'in_review',
    title: 'In Review',
    headerClass:
      'text-purple-600 dark:text-purple-400 bg-purple-50/70 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/40',
  },
  {
    id: 'completed',
    title: 'Completed',
    headerClass:
      'text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40',
  },
];

export const TASK_STATUS_LABELS = TASK_COLUMNS.reduce((acc, c) => {
  acc[c.id] = c.title;
  return acc;
}, {});

export const PRIORITY_META = {
  urgent: {
    label: 'Urgent',
    badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  },
  high: {
    label: 'High',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  },
  low: {
    label: 'Low',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  },
};

/** Returns true if a task's due date has passed and it isn't completed/archived. */
export const isTaskOverdue = (task) => {
  if (!task?.dueDate) return false;
  if (task.status === 'completed' || task.status === 'archived') return false;
  return new Date(task.dueDate) < new Date();
};

/** Formats a due date as a short label, e.g. "Jul 12". */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

/** Computes summary counters for a list of tasks (used by the stat cards strip). */
export const summarizeTasks = (tasks = []) => {
  const summary = { total: tasks.length, todo: 0, inProgress: 0, inReview: 0, completed: 0, overdue: 0 };
  tasks.forEach((t) => {
    if (t.status === 'todo' || t.status === 'backlog') summary.todo += 1;
    if (t.status === 'in_progress') summary.inProgress += 1;
    if (t.status === 'in_review') summary.inReview += 1;
    if (t.status === 'completed') summary.completed += 1;
    if (isTaskOverdue(t)) summary.overdue += 1;
  });
  return summary;
};

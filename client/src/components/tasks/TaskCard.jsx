import React from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheckSquare, FiCalendar, FiPaperclip, FiMessageSquare } from 'react-icons/fi';

/**
 * TaskCard Component — Displays brief information about a task.
 * Supports HTML5 drag and drop actions.
 */
const TaskCard = ({ task, onClick }) => {
  const { title, priority, status, dueDate, checklist = [], assignees = [], _id } = task;

  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', _id);
    e.dataTransfer.effectAllowed = 'move';
  };  // Styles for priorities
  const priorityStyles = {
    urgent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    high: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  };

  // Formatting date
  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'completed';
  const formattedDate = dueDate
    ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  // Checklist counts
  const totalItems = checklist.length;
  const completedItems = checklist.filter((item) => item.isCompleted).length;

  return (
    <motion.div
      layoutId={_id}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className="glass-card hover-glow p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/40 cursor-pointer bg-white/90 dark:bg-slate-900/60 backdrop-blur-md transition-all duration-300 select-none group"
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Top Section: Priority & Badges */}
      <div className="flex justify-between items-start gap-2 mb-3">
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            priorityStyles[priority] || priorityStyles.medium
          }`}
        >
          {priority}
        </span>

        {/* Action Indicators */}
        <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
          {totalItems > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-450">
              <FiCheckSquare className="w-3.5 h-3.5" />
              <span>
                {completedItems}/{totalItems}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-slate-800 dark:text-slate-100 font-semibold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
        {title}
      </h4>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-3" />

      {/* Footer Section: Date & Assignees */}
      <div className="flex justify-between items-center gap-2 mt-2">
        {/* Due Date Indicator */}
        {formattedDate ? (
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
              isOverdue
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/40'
            }`}
          >
            <FiCalendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        ) : (
          <div className="w-4" />
        )}

        {/* Avatar Stack for Assignees */}
        <div className="flex items-center">
          {assignees.slice(0, 3).map((assignee, idx) => {
            const assigneeName = assignee?.name || 'Unknown User';
            const assigneeId = assignee?._id || `assignee-${idx}`;
            return (
              <div
                key={assigneeId}
                className="relative group/avatar"
                style={{ marginLeft: idx > 0 ? '-8px' : '0' }}
              >
                {assignee?.avatar ? (
                  <img
                    src={assignee.avatar}
                    alt={assigneeName}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 object-cover bg-slate-100 dark:bg-slate-800"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-gradient-to-br from-violet-600 to-indigo-600 text-[10px] font-bold text-white flex items-center justify-center">
                    {assigneeName.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Tooltip */}
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-slate-950 text-[10px] text-slate-200 rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg border border-slate-850">
                  {assigneeName}
                </span>
              </div>
            );
          })}
          {assignees.length > 3 && (
            <div
              className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center"
              style={{ marginLeft: '-8px' }}
            >
              +{assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;

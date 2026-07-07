import React from 'react';
import { motion } from 'framer-motion';
import { FiCheckSquare, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import { PRIORITY_META, isTaskOverdue, formatShortDate } from '../../utils/taskConstants';
import TaskStatusMenu from './TaskStatusMenu';

/**
 * TaskCard — compact task summary used inside kanban columns and list rows.
 * Supports desktop HTML5 drag-and-drop *and* a tap-friendly status menu, so
 * status changes work identically on touch devices, where native drag-and-drop
 * is not available at all.
 */
const TaskCard = ({ task, onClick, onStatusChange, canDrag = true }) => {
  const { title, priority, status, dueDate, checklist = [], assignees = [], _id } = task;

  const handleDragStart = (e) => {
    if (!canDrag) return;
    e.dataTransfer.setData('taskId', _id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const priorityMeta = PRIORITY_META[priority] || PRIORITY_META.medium;
  const overdue = isTaskOverdue(task);
  const formattedDate = formatShortDate(dueDate);

  const totalItems = checklist.length;
  const completedItems = checklist.filter((item) => item.isCompleted).length;

  return (
    <motion.div
      layout
      draggable={canDrag}
      onDragStart={handleDragStart}
      onClick={onClick}
      className="glass-card hover-glow p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/40 cursor-pointer bg-white/90 dark:bg-slate-900/60 backdrop-blur-md transition-all duration-300 select-none group touch-manipulation"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Top row: priority + tap-friendly status changer */}
      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${priorityMeta.badge}`}>
          {priorityMeta.label}
        </span>

        {onStatusChange ? (
          <TaskStatusMenu status={status} onChange={(next) => onStatusChange(_id, next)} />
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {status.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-slate-800 dark:text-slate-100 font-semibold text-sm leading-snug mb-3 line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
        {title}
      </h4>

      {/* Checklist progress */}
      {totalItems > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <FiCheckSquare className="w-3.5 h-3.5 shrink-0" />
          <span>{completedItems}/{totalItems} checklist items</span>
        </div>
      )}

      <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-3" />

      {/* Footer: due date + assignees */}
      <div className="flex justify-between items-center gap-2 mt-2">
        {formattedDate ? (
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${
              overdue
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                : status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/40'
            }`}
          >
            {overdue ? <FiAlertTriangle className="w-3.5 h-3.5" /> : <FiCalendar className="w-3.5 h-3.5" />}
            <span>
              {formattedDate}
              {overdue ? ' · Overdue' : ''}
            </span>
          </div>
        ) : (
          <div className="w-4" />
        )}

        <div className="flex items-center">
          {assignees.slice(0, 3).map((assignee, idx) => {
            const assigneeName = assignee?.name || 'Unknown User';
            const assigneeId = assignee?._id || `assignee-${idx}`;
            return (
              <div key={assigneeId} className="relative group/avatar" style={{ marginLeft: idx > 0 ? '-8px' : '0' }}>
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
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 bg-slate-950 text-[10px] text-slate-200 rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg hidden sm:block">
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
          {assignees.length === 0 && (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Unassigned</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TaskCard;

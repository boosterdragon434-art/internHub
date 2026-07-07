import React from 'react';
import { FiList, FiPlay, FiEye, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { summarizeTasks } from '../../utils/taskConstants';

const STAT_DEFS = [
  { key: 'total', label: 'Total Tasks', icon: FiList, tone: 'text-slate-500 dark:text-slate-400' },
  { key: 'todo', label: 'To Do', icon: FiList, tone: 'text-blue-500 dark:text-blue-400' },
  { key: 'inProgress', label: 'In Progress', icon: FiPlay, tone: 'text-amber-500 dark:text-amber-400' },
  { key: 'inReview', label: 'In Review', icon: FiEye, tone: 'text-purple-500 dark:text-purple-400' },
  { key: 'completed', label: 'Completed', icon: FiCheckCircle, tone: 'text-emerald-500 dark:text-emerald-400' },
  { key: 'overdue', label: 'Overdue', icon: FiAlertTriangle, tone: 'text-rose-500 dark:text-rose-400' },
];

/**
 * TaskStatCards — compact KPI strip shown above every task workspace
 * (Admin / Guide / Student), driven by summarizeTasks() so the numbers here
 * always match what's rendered on the board below.
 */
const TaskStatCards = ({ tasks = [] }) => {
  const summary = summarizeTasks(tasks);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {STAT_DEFS.map(({ key, label, icon: Icon, tone }) => (
        <div
          key={key}
          className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 bg-white/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60"
        >
          <Icon className={`w-4 h-4 shrink-0 ${tone}`} />
          <div className="min-w-0">
            <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate">
              {label}
            </span>
            <span className="block text-lg font-bold text-slate-800 dark:text-slate-100">
              {summary[key]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskStatCards;

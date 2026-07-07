import React from 'react';
import { FiSearch, FiGrid, FiList } from 'react-icons/fi';

/**
 * TaskFilterBar — shared search / priority / (optional) student filter and
 * board-vs-list view toggle used across all three task workspaces.
 * Passing `students` renders the student filter dropdown (Admin/Guide only).
 */
const TaskFilterBar = ({
  searchQuery,
  onSearchChange,
  priority,
  onPriorityChange,
  viewMode,
  onViewModeChange,
  students,
  selectedStudent,
  onStudentChange,
  searchPlaceholder = 'Search tasks...',
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20">
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] md:max-w-xs">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
          />
        </div>

        {/* Student Filter (Admin/Guide only) */}
        {students && (
          <select
            value={selectedStudent}
            onChange={(e) => onStudentChange(e.target.value)}
            className="px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
          >
            <option value="all">All Students</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {/* Priority Filter */}
        <select
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 shrink-0 self-start md:self-auto">
        <button
          onClick={() => onViewModeChange('board')}
          className={`p-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition ${
            viewMode === 'board'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FiGrid className="w-4 h-4" /> Board
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={`p-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition ${
            viewMode === 'list'
              ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <FiList className="w-4 h-4" /> List
        </button>
      </div>
    </div>
  );
};

export default TaskFilterBar;

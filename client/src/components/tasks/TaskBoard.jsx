import React from 'react';
import { TASK_COLUMNS, PRIORITY_META, isTaskOverdue } from '../../utils/taskConstants';
import TaskCard from './TaskCard';
import TaskStatusMenu from './TaskStatusMenu';
import { Spinner } from '../common/Loader';

/**
 * TaskBoard — shared kanban + list renderer used by the Admin, Guide, and
 * Student task workspaces.
 *
 * Mobile behaviour: native HTML5 drag-and-drop (used for desktop column
 * dragging) never fires on touch devices, so every card also exposes a
 * tap-friendly TaskStatusMenu — that is the only way status changes work on
 * phones/tablets, and it doubles as a quick option on desktop too. Columns
 * scroll horizontally with snap points on narrow viewports instead of
 * stacking five full-height columns into one very long vertical scroll.
 */
const TaskBoard = ({
  tasks,
  loading,
  viewMode = 'board',
  onTaskClick,
  onStatusChange,
  emptyMessage = 'No tasks found.',
}) => {
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    onStatusChange(taskId, targetColumnId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
                <th className="p-4">Task Name</th>
                <th className="p-4">Status</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Assignees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
              {tasks.map((t) => {
                const priorityMeta = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                const overdue = isTaskOverdue(t);
                return (
                  <tr
                    key={t._id}
                    onClick={() => onTaskClick(t)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-200">{t.title}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <TaskStatusMenu status={t.status} onChange={(next) => onStatusChange(t._id, next)} />
                    </td>
                    <td className="p-4 text-xs font-bold uppercase tracking-wider">
                      <span className={`px-2 py-0.5 rounded-full ${priorityMeta.badge}`}>{priorityMeta.label}</span>
                    </td>
                    <td className={`p-4 ${overdue ? 'text-rose-500 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}
                      {overdue ? ' · Overdue' : ''}
                    </td>
                    <td className="p-4">
                      <div className="flex -space-x-1.5">
                        {t.assignees.map((a, idx) => (
                          <div
                            key={a?._id || `assignee-${idx}`}
                            className="w-6 h-6 rounded-full bg-violet-600 border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                            title={a?.name || 'Unknown User'}
                          >
                            {(a?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {t.assignees.length === 0 && <span className="text-[10px] text-slate-400 italic">Unassigned</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {tasks.length === 0 && (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400">{emptyMessage}</div>
          )}
        </div>
      </div>
    );
  }

  // Board (kanban) view — horizontal snap-scroll carousel on mobile, grid on md+
  return (
    <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto snap-x snap-mandatory md:snap-none pb-2 -mx-4 px-4 md:mx-0 md:px-0">
      {TASK_COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);
        return (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className="flex flex-col bg-slate-100/40 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl min-h-[420px] shrink-0 w-[85vw] sm:w-[360px] md:w-auto snap-center"
          >
            {/* Column Header */}
            <div className={`p-3.5 border-b flex justify-between items-center rounded-t-2xl ${column.headerClass}`}>
              <h3 className="font-bold text-xs uppercase tracking-wider">{column.title}</h3>
              <span className="text-xs bg-white/70 dark:bg-slate-950/40 px-2 py-0.5 rounded-full font-bold">
                {columnTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[65vh] md:max-h-[600px] custom-scrollbar">
              {columnTasks.map((task) => (
                <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} onStatusChange={onStatusChange} />
              ))}

              {columnTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-300/60 dark:border-slate-800/40 rounded-xl opacity-60">
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">
                    {tasks.length === 0 ? 'No tasks' : 'Drop here'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskBoard;

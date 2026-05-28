import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiGrid,
  FiList,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiPlay,
} from 'react-icons/fi';
import { getTasks, updateTask } from '../../api/taskApi';
import { toast } from 'react-hot-toast';
import TaskCard from '../../components/tasks/TaskCard';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'dark:border-slate-800 border-slate-200 dark:text-slate-400 text-slate-500 bg-slate-100/50 dark:bg-slate-950/20' },
  { id: 'todo', title: 'To Do', color: 'dark:border-blue-900/40 border-blue-200 dark:text-blue-400 text-blue-600 bg-blue-50/30 dark:bg-blue-950/5' },
  { id: 'in_progress', title: 'In Progress', color: 'dark:border-amber-900/40 border-amber-200 dark:text-amber-400 text-amber-600 bg-amber-50/30 dark:bg-amber-950/5' },
  { id: 'in_review', title: 'In Review', color: 'dark:border-purple-900/40 border-purple-200 dark:text-purple-400 text-purple-600 bg-purple-50/30 dark:bg-purple-950/5' },
  { id: 'completed', title: 'Completed', color: 'dark:border-emerald-900/40 border-emerald-200 dark:text-emerald-400 text-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/5' },
];

/**
 * StudentTasksPage Component — Student dashboard to check assigned tasks, subtask checklist status,
 * participate in discussions via task comments, and trigger status updates.
 */
const StudentTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // board | list

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modal
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await getTasks();
      if (response.data?.success) {
        setTasks(response.data.data);
      }
    } catch (err) {
      toast.error('Failed to load assigned tasks');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Optimistic local state update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: targetColumnId } : t))
    );

    try {
      const response = await updateTask(taskId, { status: targetColumnId });
      if (!response.data?.success) {
        throw new Error('Update failed');
      }
    } catch (err) {
      toast.error('Failed to update task status');
      setTasks(previousTasks);
    }
  };

  const handleTaskStateUpdate = (updatedTask) => {
    if (updatedTask) {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    }
  };

  // Filter tasks locally
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  // Calculate metrics
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const inReviewCount = tasks.filter((t) => t.status === 'in_review').length;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>My Tasks — InternHub</title>
      </Helmet>

      {/* Header Banner */}
      <div className="glass-card hover-glow p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1 bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            My Internship Tasks
          </h1>
          <p className="text-slate-400 text-sm">
            Keep track of deliverables assigned by your guide, update completion states, and ask clarifying questions.
          </p>
        </div>

        {/* Mini stats */}
        <div className="flex gap-4 self-stretch sm:self-auto">
          <div className="flex-1 sm:flex-initial glass-card bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <FiPlay className="text-amber-400 w-5 h-5" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">In Progress</span>
              <span className="block text-lg font-bold text-slate-200">{inProgressCount}</span>
            </div>
          </div>
          <div className="flex-1 sm:flex-initial glass-card bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <FiClock className="text-purple-400 w-5 h-5" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">In Review</span>
              <span className="block text-lg font-bold text-slate-200">{inReviewCount}</span>
            </div>
          </div>
          <div className="flex-1 sm:flex-initial glass-card bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <FiCheckCircle className="text-emerald-400 w-5 h-5" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-500 tracking-wider">Completed</span>
              <span className="block text-lg font-bold text-slate-200">
                {completedCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search my tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
            />
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* View Mode */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-900/60 rounded-xl border border-slate-250 dark:border-slate-800/80 shrink-0">
          <button
            onClick={() => setViewMode('board')}
            className={`p-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition ${
              viewMode === 'board' ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/50 dark:border-transparent' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-255'
            }`}
          >
            <FiGrid className="w-4 h-4" /> Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition ${
              viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/50 dark:border-transparent' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-255'
            }`}
          >
            <FiList className="w-4 h-4" /> List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === 'board' ? (
        /* Board Layout */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
          {COLUMNS.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.id);
            return (
              <div
                key={column.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                className="flex flex-col bg-slate-100/40 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800/80 rounded-2xl min-h-[500px]"
              >
                {/* Column Header */}
                <div className={`p-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center rounded-t-2xl bg-slate-100/80 dark:bg-slate-950/20 ${column.color}`}>
                  <h3 className="font-bold text-xs uppercase tracking-wider">{column.title}</h3>
                  <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full font-bold">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={() => setSelectedTask(task)}
                    />
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-800/40 rounded-xl opacity-40">
                      <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Drop here</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Layout */
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
                  <th className="p-4">Task Name</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
                {filteredTasks.map((t) => (
                  <tr
                    key={t._id}
                    onClick={() => setSelectedTask(t)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-200/50 dark:border-slate-800/50 transition cursor-pointer"
                  >
                    <td className="p-4 font-semibold text-slate-900 dark:text-slate-200">{t.title}</td>
                    <td className="p-4 uppercase text-xs font-semibold">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300">
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-bold uppercase tracking-wider">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          t.priority === 'urgent'
                            ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                            : t.priority === 'high'
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
                            : 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No Date'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTasks.length === 0 && (
              <div className="text-center py-20 text-slate-500">You don't have any tasks assigned yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Task Details Modal overlay */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask._id}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskStateUpdate}
        />
      )}
    </div>
  );
};

export default StudentTasksPage;

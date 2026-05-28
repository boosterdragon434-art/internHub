import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus,
  FiSearch,
  FiGrid,
  FiList,
  FiFilter,
  FiUser,
  FiActivity,
  FiX,
  FiPlusCircle,
} from 'react-icons/fi';
import { getTasks, createTask, updateTask } from '../../api/taskApi';
import { getAllUsers } from '../../api/userApi';
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
 * AdminTasksPage Component — Executive supervisor panel for viewing, auditing, creating,
 * and deleting tasks across all cohorts, guides, and student profiles.
 */
const AdminTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // board | list

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New task form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [newStatus, setNewStatus] = useState('todo');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignees, setNewAssignees] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [tasksRes, studentsRes] = await Promise.all([
        getTasks(),
        getAllUsers({ role: 'student', limit: 100 }),
      ]);
      if (tasksRes.data?.success) setTasks(tasksRes.data.data);
      // getAllUsers uses standard structure where studentsRes has student list directly under .data or .data.users
      if (studentsRes?.success) {
        setStudents(studentsRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load tasks and students list');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop
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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const response = await createTask({
        title: newTitle.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        status: newStatus,
        dueDate: newDueDate || null,
        assignees: newAssignees,
      });

      if (response.data?.success) {
        toast.success('Task created successfully');
        setTasks((prev) => [...prev, response.data.data]);
        setIsCreateModalOpen(false);
        resetForm();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewStatus('todo');
    setNewDueDate('');
    setNewAssignees([]);
  };

  const handleTaskStateUpdate = (updatedTask, deletedTaskId) => {
    if (deletedTaskId) {
      setTasks((prev) => prev.filter((t) => t._id !== deletedTaskId));
    } else if (updatedTask) {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    }
  };

  const toggleAssignee = (studentId) => {
    if (newAssignees.includes(studentId)) {
      setNewAssignees(newAssignees.filter((id) => id !== studentId));
    } else {
      setNewAssignees([...newAssignees, studentId]);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStudent =
      selectedStudent === 'all' || t.assignees.some((a) => a._id === selectedStudent);
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    return matchesSearch && matchesStudent && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Admin System Tasks — InternHub</title>
      </Helmet>

      {/* Header Banner */}
      <div className="glass-card hover-glow p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1.5 bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            System Tasks Supervisor
          </h1>
          <p className="text-slate-400 text-sm">
            Monitor and oversee task management and progress across the entire workspace.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-300 shadow-lg shadow-indigo-600/20 active:scale-95 shrink-0"
        >
          <FiPlus className="w-4.5 h-4.5" /> Create Task
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] md:max-w-xs">
            <FiSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search all tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
            />
          </div>

          {/* Student Filter */}
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
          >
            <option value="all">All Students</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Priority */}
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

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-900/60 rounded-xl border border-slate-250 dark:border-slate-800/80 shrink-0">
          <button
            onClick={() => setViewMode('board')}
            className={`p-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition ${
              viewMode === 'board' ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/50 dark:border-transparent' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
            }`}
          >
            <FiGrid className="w-4 h-4" /> Board
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition ${
              viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200/50 dark:border-transparent' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-250'
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
        /* Board view */
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

                {/* Cards Dropper container */}
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
        /* List view */
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
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
                    <td className="p-4">
                      <div className="flex -space-x-1.5">
                        {t.assignees.map((a, idx) => {
                          const assigneeName = a?.name || 'Unknown User';
                          const assigneeId = a?._id || `assignee-${idx}`;
                          return (
                            <div
                              key={assigneeId}
                              className="w-6 h-6 rounded-full bg-violet-600 border-2 border-slate-900 text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                              title={assigneeName}
                            >
                              {assigneeName.charAt(0).toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTasks.length === 0 && (
              <div className="text-center py-20 text-slate-500">No tasks in database.</div>
            )}
          </div>
        </div>
      )}

      {/* Task Creation Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.form
              onSubmit={handleCreateTask}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-850 pb-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FiPlusCircle className="text-violet-500 w-5 h-5" /> Create Workspace Task
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Setup API Authentication logic..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  rows="3"
                  placeholder="Outline task goals, deliverables, and guidelines..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none resize-none transition"
                />
              </div>

              {/* Status, Priority & Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none transition"
                  >
                    <option value="todo">To Do</option>
                    <option value="backlog">Backlog</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none transition"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none transition"
                  />
                </div>
              </div>

              {/* Assignees list */}
              {students.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Assign To Student(s)</label>
                  <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto bg-slate-50 dark:bg-slate-950/40 p-2 border border-slate-200 dark:border-slate-800 rounded-lg">
                    {students.map((student) => {
                      const isAssigned = newAssignees.includes(student._id);
                      return (
                        <button
                          key={student._id}
                          type="button"
                          onClick={() => toggleAssignee(student._id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition ${
                            isAssigned
                              ? 'bg-violet-600 border-violet-600 text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          {student.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-850">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-555 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-indigo-600/20"
                >
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details Modal overlay */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask._id}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskStateUpdate}
          allStudents={students}
        />
      )}
    </div>
  );
};

export default AdminTasksPage;

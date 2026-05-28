import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiPlus,
  FiTrash2,
  FiX,
  FiBell,
} from 'react-icons/fi';
import { getReminders, createReminder, deleteReminder, dismissReminder } from '../../api/reminderApi';
import { getTasks } from '../../api/taskApi';
import { getAssignedStudents } from '../../api/guideApi';
import { getAllUsers } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import TaskDetailModal from '../tasks/TaskDetailModal';

/**
 * CalendarView Component — Professional monthly grid scheduling interface.
 * Shows tasks (due dates) and reminders (trigger dates). Supports custom reminder planning.
 */
const CalendarView = () => {
  const { user: authUser } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Day selection details
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedReminder, setSelectedReminder] = useState(null);

  // New Reminder modal
  const [isAddReminderOpen, setIsAddReminderOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTime, setNewTime] = useState('12:00');
  const [newChannel, setNewChannel] = useState('in_app'); // in_app | email
  const [targetStudent, setTargetStudent] = useState('');
  const [creating, setCreating] = useState(false);

  const isGuideOrAdmin = authUser?.role === 'admin' || authUser?.role === 'guide';

  useEffect(() => {
    fetchPlannerData();
  }, [currentDate]);

  const fetchPlannerData = async () => {
    setLoading(true);
    try {
      const [tasksRes, remindersRes] = await Promise.all([getTasks(), getReminders()]);
      if (tasksRes.data?.success) setTasks(tasksRes.data.data);
      if (remindersRes.data?.success) setReminders(remindersRes.data.data);

      if (isGuideOrAdmin) {
        if (authUser.role === 'admin') {
          const usersRes = await getAllUsers({ role: 'student', limit: 100 });
          if (usersRes?.success) setStudents(usersRes.data || []);
        } else {
          const studentsRes = await getAssignedStudents({ limit: 100 });
          if (studentsRes.data?.success) setStudents(studentsRes.data.data);
        }
      }
    } catch (err) {
      toast.error('Failed to load calendar planning data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Helper to generate monthly dates
  const generateMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const grid = [];

    // Prepend padding days from prev month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({
        date: new Date(year, month - 1, prevTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Append current month days
    for (let i = 1; i <= totalDays; i++) {
      grid.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Append padding days for next month to complete 6-row grid (42 days)
    const remainingDays = 42 - grid.length;
    for (let i = 1; i <= remainingDays; i++) {
      grid.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return grid;
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const [hours, minutes] = newTime.split(':');
      const triggerAt = new Date(year, month, day, parseInt(hours), parseInt(minutes));

      const response = await createReminder({
        title: newTitle.trim(),
        description: newDescription.trim(),
        triggerAt,
        channels: [newChannel],
        user: targetStudent || undefined,
      });

      if (response.data?.success) {
        toast.success('Reminder scheduled successfully');
        setReminders((prev) => [...prev, response.data.data]);
        setIsAddReminderOpen(false);
        resetReminderForm();
      }
    } catch (err) {
      toast.error('Failed to schedule reminder');
    } finally {
      setCreating(false);
    }
  };

  const resetReminderForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewTime('12:00');
    setNewChannel('in_app');
    setTargetStudent('');
  };

  const handleDismissReminder = async (reminderId) => {
    try {
      const response = await dismissReminder(reminderId);
      if (response.data?.success) {
        toast.success('Reminder dismissed');
        setReminders((prev) =>
          prev.map((r) => (r._id === reminderId ? { ...r, status: 'dismissed' } : r))
        );
        setSelectedReminder(null);
      }
    } catch (err) {
      toast.error('Failed to dismiss reminder');
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      const response = await deleteReminder(reminderId);
      if (response.data?.success) {
        toast.success('Reminder deleted');
        setReminders((prev) => prev.filter((r) => r._id !== reminderId));
        setSelectedReminder(null);
      }
    } catch (err) {
      toast.error('Failed to delete reminder');
    }
  };

  const handleTaskUpdate = (updatedTask) => {
    if (updatedTask) {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    }
  };

  const gridDays = generateMonthGrid();
  const weekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter items matching a specific calendar cell date
  const getCellItems = (cellDate) => {
    const formatYMD = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
    const targetYMD = formatYMD(cellDate);

    const cellTasks = tasks.filter((t) => t.dueDate && formatYMD(new Date(t.dueDate)) === targetYMD);
    const cellReminders = reminders.filter(
      (r) => r.triggerAt && formatYMD(new Date(r.triggerAt)) === targetYMD && r.status !== 'dismissed'
    );

    return { cellTasks, cellReminders };
  };

  const activeMonthLabel = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const selectedDayItems = getCellItems(selectedDate);

  return (
    <div className="space-y-6">
      {/* Calendar Header with navigation buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/75 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <FiCalendar className="w-5 h-5 text-violet-500 dark:text-violet-400" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeMonthLabel}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg transition"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition"
          >
            <FiChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Grid View */}
        <div className="flex-1 w-full glass-card p-4 bg-white dark:bg-slate-900/20 border border-slate-200 dark:border-slate-850 rounded-2xl">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            {weekLabels.map((lbl) => (
              <div key={lbl} className="py-2">
                {lbl}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          {loading ? (
            <div className="flex justify-center items-center py-40">
              <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {gridDays.map((cell, idx) => {
                const { cellTasks, cellReminders } = getCellItems(cell.date);
                const isSelected =
                  cell.date.getDate() === selectedDate.getDate() &&
                  cell.date.getMonth() === selectedDate.getMonth() &&
                  cell.date.getFullYear() === selectedDate.getFullYear();
                const isToday =
                  cell.date.getDate() === new Date().getDate() &&
                  cell.date.getMonth() === new Date().getMonth() &&
                  cell.date.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-[100px] p-2 rounded-xl flex flex-col justify-between border cursor-pointer transition duration-250 select-none ${
                      isSelected
                        ? 'border-violet-500 bg-violet-600/10 dark:bg-violet-600/5 text-violet-600 dark:text-violet-400 shadow-md ring-1 ring-violet-500/20'
                        : isToday
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-violet-600 dark:text-violet-400 font-extrabold shadow-inner'
                        : cell.isCurrentMonth
                        ? 'border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/30 hover:border-slate-350 dark:hover:border-slate-800 text-slate-800 dark:text-slate-200'
                        : 'border-slate-100 dark:border-slate-900 bg-slate-50/40 dark:bg-slate-950/5 opacity-40 hover:opacity-70 text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {/* Day number */}
                    <span className="text-xs font-bold self-start">{cell.date.getDate()}</span>

                    {/* Micro-pills container */}
                    <div className="space-y-1 mt-1.5 flex-1 flex flex-col justify-end overflow-hidden">
                      {cellTasks.slice(0, 2).map((t) => (
                        <div
                          key={t._id}
                          className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-[10px] font-semibold flex items-center gap-1 border border-violet-200 dark:border-violet-500/15 truncate"
                          title={`Task: ${t.title}`}
                        >
                          <FiCheckSquare className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{t.title}</span>
                        </div>
                      ))}
                      {cellReminders.slice(0, 2).map((r) => (
                        <div
                          key={r._id}
                          className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-semibold flex items-center gap-1 border border-amber-200 dark:border-amber-500/15 truncate"
                          title={`Alert: ${r.title}`}
                        >
                          <FiClock className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{r.title}</span>
                        </div>
                      ))}
                      {cellTasks.length + cellReminders.length > 4 && (
                        <div className="text-[9px] text-slate-450 dark:text-slate-500 font-bold pl-1 text-left">
                          +{cellTasks.length + cellReminders.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Schedule List Panel */}
        <div className="w-full lg:w-[350px] glass-card p-5 border border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900/40 relative flex flex-col space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Selected Day</span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </h3>
            </div>
            <button
              onClick={() => setIsAddReminderOpen(true)}
              className="p-1.5 bg-violet-600/10 hover:bg-violet-600 border border-violet-500/20 hover:border-violet-500 text-violet-500 hover:text-white rounded-lg flex items-center justify-center transition"
              title="Add Alert"
            >
              <FiPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Agenda Items */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
            {/* Task Deliverables */}
            {selectedDayItems.cellTasks.map((t) => (
              <div
                key={t._id}
                onClick={() => setSelectedTask(t)}
                className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-violet-500/50 rounded-xl cursor-pointer flex justify-between items-center group transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/15 rounded-lg flex items-center justify-center text-violet-500 dark:text-violet-400 shrink-0">
                    <FiCheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-violet-500 dark:group-hover:text-violet-400 transition">
                      {t.title}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">Task Deadline</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Reminder Alerts */}
            {selectedDayItems.cellReminders.map((r) => (
              <div
                key={r._id}
                onClick={() => setSelectedReminder(r)}
                className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 hover:border-amber-500/50 rounded-xl cursor-pointer flex justify-between items-center group transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/15 rounded-lg flex items-center justify-center text-amber-500 dark:text-amber-400 shrink-0">
                    <FiClock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition">
                      {r.title}
                    </span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">
                      Alert Trigger • {new Date(r.triggerAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {selectedDayItems.cellTasks.length === 0 && selectedDayItems.cellReminders.length === 0 && (
              <div className="text-center py-20 text-slate-450 dark:text-slate-500 text-xs italic">
                No items scheduled for this day.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reminder Detail Modal Popup */}
      <AnimatePresence>
        {selectedReminder && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-card w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                  <FiBell className="w-5 h-5 animate-bounce" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Alert Details</h3>
                </div>
                <button
                  onClick={() => setSelectedReminder(null)}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{selectedReminder.title}</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                  Trigger • {new Date(selectedReminder.triggerAt).toLocaleString()}
                </span>
              </div>

              {selectedReminder.description && (
                <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-200 dark:border-slate-850 text-xs text-slate-655 dark:text-slate-400 leading-relaxed max-h-36 overflow-y-auto">
                  {selectedReminder.description}
                </div>
              )}

              <div className="flex justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleDeleteReminder(selectedReminder._id)}
                  className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-600 border border-rose-200 dark:border-rose-900/30 hover:border-rose-500 text-rose-650 dark:text-rose-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <FiTrash2 className="w-3.5 h-3.5" /> Delete
                </button>
                {selectedReminder.status === 'pending' && (
                  <button
                    onClick={() => handleDismissReminder(selectedReminder._id)}
                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Dismiss Alert
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Custom Reminder Modal Popup */}
      <AnimatePresence>
        {isAddReminderOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <form
              onSubmit={handleCreateReminder}
              className="glass-card w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Add Alert • {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddReminderOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>

              {/* Title input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Alert Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Attend Review Sync..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-850 dark:text-slate-200 outline-none transition"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Alert Context</label>
                <textarea
                  rows="2"
                  placeholder="Additional details or guidelines..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-855 dark:text-slate-200 outline-none resize-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Time picker */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Alert Time</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-855 dark:text-slate-200 outline-none transition"
                  />
                </div>

                {/* Delivery Channel */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-855 dark:text-slate-200 outline-none transition"
                  >
                    <option value="in_app">In-App Alert</option>
                    <option value="email">Email Alert</option>
                  </select>
                </div>
              </div>

              {/* Target student selection for guides/admins */}
              {isGuideOrAdmin && students.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Recipient Student</label>
                  <select
                    value={targetStudent}
                    onChange={(e) => setTargetStudent(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-855 dark:text-slate-200 outline-none transition"
                  >
                    <option value="">Schedule for Myself</option>
                    {students.map((st) => (
                      <option key={st._id} value={st._id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddReminderOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                >
                  {creating ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        )}
      </AnimatePresence>

      {/* Task Details overlay when selected */}
      {selectedTask && (
        <TaskDetailModal
          taskId={selectedTask._id}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          allStudents={students}
        />
      )}
    </div>
  );
};

export default CalendarView;

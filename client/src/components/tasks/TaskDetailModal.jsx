import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiX,
  FiUser,
  FiCalendar,
  FiAlertTriangle,
  FiClock,
  FiCheckSquare,
  FiMessageSquare,
  FiActivity,
  FiSave,
  FiTrash2,
} from 'react-icons/fi';
import { getTask, updateTask, deleteTask, getTaskActivity } from '../../api/taskApi';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import TaskChecklist from './TaskChecklist';
import TaskComments from './TaskComments';

/**
 * TaskDetailModal Component — Displays comprehensive detailed view of a task.
 * Allows guides/admins to update properties or delete the task, and students to modify completion/checklists.
 */
const TaskDetailModal = ({ taskId, onClose, onUpdate, allStudents = [] }) => {
  const { user: authUser } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('checklist'); // checklist | comments | activity
  const [activities, setActivities] = useState([]);
  const [fetchingActivity, setFetchingActivity] = useState(false);

  // Editable fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignees, setAssignees] = useState([]);

  const isGuideOrAdmin = authUser?.role === 'admin' || authUser?.role === 'guide';

  useEffect(() => {
    let active = true;
    const fetchTaskDetails = async () => {
      try {
        const response = await getTask(taskId);
        if (active && response.data && response.data.success) {
          const t = response.data.data;
          setTask(t);
          setTitle(t.title);
          setDescription(t.description || '');
          setStatus(t.status);
          setPriority(t.priority);
          setDueDate(t.dueDate ? t.dueDate.split('T')[0] : '');
          setAssignees(t.assignees.map((a) => a._id));
        }
      } catch (err) {
        toast.error('Failed to load task details');
        onClose();
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTaskDetails();
    return () => {
      active = false;
    };
  }, [taskId, onClose]);

  // Fetch Activity Log when the active tab is 'activity'
  useEffect(() => {
    if (activeTab !== 'activity') return;

    let active = true;
    const fetchActivity = async () => {
      setFetchingActivity(true);
      try {
        const response = await getTaskActivity(taskId);
        if (active && response.data && response.data.success) {
          setActivities(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch activity:', err);
      } finally {
        if (active) setFetchingActivity(false);
      }
    };
    fetchActivity();
    return () => {
      active = false;
    };
  }, [activeTab, taskId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = isGuideOrAdmin
        ? { title, description, status, priority, dueDate: dueDate || null, assignees }
        : { status }; // Students can only update status

      const response = await updateTask(taskId, data);
      if (response.data && response.data.success) {
        toast.success('Task updated successfully');
        onUpdate(response.data.data);
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const response = await deleteTask(taskId);
      if (response.data && response.data.success) {
        toast.success('Task deleted successfully');
        onUpdate(null, taskId); // trigger delete in parent state
        onClose();
      }
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const handleChecklistChange = async (newChecklist) => {
    try {
      // Direct API update for checklists to feel instant & responsive
      const response = await updateTask(taskId, { checklist: newChecklist });
      if (response.data && response.data.success) {
        setTask((prev) => ({ ...prev, checklist: response.data.data.checklist }));
        onUpdate(response.data.data);
      }
    } catch (err) {
      toast.error('Failed to update checklist');
    }
  };

  const formatActivityAction = (act) => {
    const userName = act.user?.name || 'Someone';
    switch (act.action) {
      case 'created':
        return `${userName} created this task.`;
      case 'status_changed':
        return `${userName} changed status from "${act.details?.oldStatus}" to "${act.details?.newStatus}".`;
      case 'commented':
        return `${userName} added a comment.`;
      case 'updated':
        return `${userName} updated task details.`;
      default:
        return `${userName} performed an action: ${act.action}`;
    }
  };

  const toggleAssignee = (studentId) => {
    if (assignees.includes(studentId)) {
      setAssignees(assignees.filter((id) => id !== studentId));
    } else {
      setAssignees([...assignees, studentId]);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-card w-full max-w-4xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
      >
        {/* Left Side: General Fields (Title, Description, Details Form) */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80 space-y-5">
          <div className="flex justify-between items-start gap-4">
            {isGuideOrAdmin ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-1.5 text-lg font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition"
              />
            ) : (
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition shrink-0"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Description</label>
            {isGuideOrAdmin ? (
              <textarea
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task and key deliverables..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none transition"
              />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed min-h-[100px] whitespace-pre-wrap select-text">
                {description || <span className="text-slate-455 dark:text-slate-500 italic">No description provided.</span>}
              </div>
            )}
          </div>

          {/* Settings Section (Status, Priority, Due Date) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FiClock className="w-3.5 h-3.5" /> Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-750 dark:text-slate-200 outline-none transition"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FiAlertTriangle className="w-3.5 h-3.5" /> Priority
              </label>
              <select
                value={priority}
                disabled={!isGuideOrAdmin}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-750 dark:text-slate-200 outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {isGuideOrAdmin ? (
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-750 dark:text-slate-200 outline-none transition"
                />
              </div>
            ) : (
              <div className="col-span-2 space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FiCalendar className="w-3.5 h-3.5" /> Due Date
                </span>
                <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300">
                  {dueDate ? new Date(dueDate).toLocaleDateString() : 'No due date'}
                </div>
              </div>
            )}
          </div>

          {/* Assignees (Multi-select for Admin/Guides) */}
          {isGuideOrAdmin && allStudents.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FiUser className="w-3.5 h-3.5" /> Assignees
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto bg-slate-50 dark:bg-slate-950/30 p-2 border border-slate-150 dark:border-slate-800 rounded-lg">
                {allStudents.map((student) => {
                  const isAssigned = assignees.includes(student._id);
                  return (
                    <button
                      key={student._id}
                      type="button"
                      onClick={() => toggleAssignee(student._id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition ${
                        isAssigned
                          ? 'bg-violet-600 border-violet-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {student.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer Save/Delete buttons */}
          <div className="flex justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {isGuideOrAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-600 border border-rose-200 dark:border-rose-900/50 hover:border-rose-500 text-rose-600 dark:text-rose-400 hover:text-white rounded-xl text-sm flex items-center gap-2 transition duration-200"
              >
                <FiTrash2 className="w-4 h-4" /> Delete Task
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="ml-auto px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition duration-200 shadow-lg shadow-indigo-600/20"
            >
              <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Right Side: Tab System (Checklist, Comments, Activity) */}
        <div className="w-full md:w-[380px] p-6 flex flex-col space-y-4">
          {/* Tabs header */}
          <div className="flex border-b border-slate-100 dark:border-slate-850">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 border-b-2 transition ${
                activeTab === 'checklist'
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300'
              }`}
            >
              <FiCheckSquare className="w-3.5 h-3.5" /> Checklist
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 border-b-2 transition ${
                activeTab === 'comments'
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300'
              }`}
            >
              <FiMessageSquare className="w-3.5 h-3.5" /> Comments
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 border-b-2 transition ${
                activeTab === 'activity'
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300'
              }`}
            >
              <FiActivity className="w-3.5 h-3.5" /> Activity
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-[300px]">
            {activeTab === 'checklist' && (
              <TaskChecklist
                items={task?.checklist || []}
                onChange={handleChecklistChange}
                canEdit={true}
              />
            )}

            {activeTab === 'comments' && <TaskComments taskId={taskId} />}

            {activeTab === 'activity' && (
              <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                {fetchingActivity ? (
                  <div className="flex justify-center py-6">
                    <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : activities.length > 0 ? (
                  <div className="relative border-l border-slate-150 dark:border-slate-800 pl-4 ml-2 space-y-4">
                    {activities.map((act) => (
                      <div key={act._id} className="relative">
                        <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-violet-500 ring-4 ring-white dark:ring-[#0b0f19]" />
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          {formatActivityAction(act)}
                        </div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(act.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-450 dark:text-slate-500 text-sm">
                    No activity recorded yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TaskDetailModal;

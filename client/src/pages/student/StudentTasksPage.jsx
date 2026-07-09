import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { FiCheckSquare } from 'react-icons/fi';
import { getTasks, updateTask } from '../../api/taskApi';
import TaskStatCards from '../../components/tasks/TaskStatCards';
import TaskFilterBar from '../../components/tasks/TaskFilterBar';
import TaskBoard from '../../components/tasks/TaskBoard';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import EnrollmentGate from '../../components/common/EnrollmentGate';

/**
 * StudentTasksPage — a student's personal view of deliverables assigned by
 * their guide, with status updates, checklists, and discussion threads.
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

  const fetchTasks = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = async (taskId, newStatus) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    try {
      const response = await updateTask(taskId, { status: newStatus });
      if (!response.data?.success) throw new Error('Update failed');
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

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  return (
    <EnrollmentGate featureName="Tasks">
      <div className="space-y-6">
        <Helmet>
          <title>My Tasks — InternHub</title>
        </Helmet>

        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950/20 border border-brand-200/60 dark:border-brand-800/30 text-brand-600 dark:text-brand-400 rounded-xl flex items-center justify-center">
              <FiCheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                My Internship Tasks
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Keep track of deliverables assigned by your guide, update completion states, and ask clarifying questions.
              </p>
            </div>
          </div>
        </div>

        <TaskStatCards tasks={tasks} />

        <TaskFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchPlaceholder="Search my tasks..."
        />

        <TaskBoard
          tasks={filteredTasks}
          loading={loading}
          viewMode={viewMode}
          onTaskClick={setSelectedTask}
          onStatusChange={handleStatusChange}
          emptyMessage="You don't have any tasks assigned yet."
        />

        {selectedTask && (
          <TaskDetailModal
            taskId={selectedTask._id}
            onClose={() => setSelectedTask(null)}
            onUpdate={handleTaskStateUpdate}
          />
        )}
      </div>
    </EnrollmentGate>
  );
};

export default StudentTasksPage;

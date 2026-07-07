import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'react-hot-toast';
import { getTasks, updateTask } from '../../api/taskApi';
import TaskStatCards from '../../components/tasks/TaskStatCards';
import TaskFilterBar from '../../components/tasks/TaskFilterBar';
import TaskBoard from '../../components/tasks/TaskBoard';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';

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
    <div className="space-y-6">
      <Helmet>
        <title>My Tasks — InternHub</title>
      </Helmet>

      {/* Header Banner */}
      <div className="glass-card hover-glow p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden">
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1 bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
          My Internship Tasks
        </h1>
        <p className="text-slate-400 text-sm">
          Keep track of deliverables assigned by your guide, update completion states, and ask clarifying questions.
        </p>
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
  );
};

export default StudentTasksPage;

import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { getTasks, createTask, updateTask } from '../../api/taskApi';
import { getAssignedStudents } from '../../api/guideApi';
import TaskStatCards from '../../components/tasks/TaskStatCards';
import TaskFilterBar from '../../components/tasks/TaskFilterBar';
import TaskBoard from '../../components/tasks/TaskBoard';
import TaskFormModal from '../../components/tasks/TaskFormModal';
import TaskDetailModal from '../../components/tasks/TaskDetailModal';
import Button from '../../components/common/Button';

/**
 * GuideTasksPage — task planning and tracking workspace scoped to the
 * guide's own assigned cohort of students.
 */
const GuideTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('board'); // board | list

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, studentsRes] = await Promise.all([
        getTasks(),
        getAssignedStudents({ limit: 100 }),
      ]);
      if (tasksRes.data?.success) setTasks(tasksRes.data.data);
      if (studentsRes.data?.success) setStudents(studentsRes.data.data);
    } catch (err) {
      toast.error('Failed to load tasks database');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleStatusChange = async (taskId, newStatus) => {
    const previousTasks = tasks;
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    try {
      const response = await updateTask(taskId, { status: newStatus });
      if (!response.data?.success) throw new Error('Update failed');
    } catch (err) {
      toast.error('Failed to save status transition');
      setTasks(previousTasks);
    }
  };

  const handleCreateTask = async (payload) => {
    setCreating(true);
    try {
      const response = await createTask(payload);
      if (response.data?.success) {
        toast.success('Task created successfully');
        setTasks((prev) => [...prev, response.data.data]);
        setIsCreateModalOpen(false);
        return true;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
      return false;
    } finally {
      setCreating(false);
    }
  };

  const handleTaskStateUpdate = (updatedTask, deletedTaskId) => {
    if (deletedTaskId) {
      setTasks((prev) => prev.filter((t) => t._id !== deletedTaskId));
    } else if (updatedTask) {
      setTasks((prev) => {
        const exists = prev.some((t) => t._id === updatedTask._id);
        return exists ? prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)) : [...prev, updatedTask];
      });
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStudent = selectedStudent === 'all' || t.assignees.some((a) => a._id === selectedStudent);
    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    return matchesSearch && matchesStudent && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Guide Workspace Tasks — InternHub</title>
      </Helmet>

      {/* Top Header Banner */}
      <div className="glass-card hover-glow p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1.5 bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            Task Management Hub
          </h1>
          <p className="text-slate-400 text-sm">
            Create, manage, and audit project deliverables for your assigned cohort of students.
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} icon={FiPlus} className="shrink-0 w-full sm:w-auto">
          Create Task
        </Button>
      </div>

      <TaskStatCards tasks={tasks} />

      <TaskFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        priority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        students={students}
        selectedStudent={selectedStudent}
        onStudentChange={setSelectedStudent}
        searchPlaceholder="Search tasks..."
      />

      <TaskBoard
        tasks={filteredTasks}
        loading={loading}
        viewMode={viewMode}
        onTaskClick={setSelectedTask}
        onStatusChange={handleStatusChange}
        emptyMessage="No tasks match the selected filters."
      />

      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        students={students}
        submitting={creating}
      />

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

export default GuideTasksPage;

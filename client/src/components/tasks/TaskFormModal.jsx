import React, { useState } from 'react';
import { FiPlusCircle } from 'react-icons/fi';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const emptyForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  assignees: [],
};

const STATUS_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

/**
 * TaskFormModal — shared "create task" form used by both the Admin and Guide
 * task workspaces. Keeping this in one place means fixes and design updates
 * apply to every role at once instead of drifting across duplicated copies.
 */
const TaskFormModal = ({ isOpen, onClose, onSubmit, students = [], submitting = false }) => {
  const [form, setForm] = useState(emptyForm);

  const resetAndClose = () => {
    setForm(emptyForm);
    onClose();
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleAssignee = (studentId) => {
    setForm((prev) => ({
      ...prev,
      assignees: prev.assignees.includes(studentId)
        ? prev.assignees.filter((id) => id !== studentId)
        : [...prev.assignees, studentId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    const result = await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assignees: form.assignees,
    });

    if (result !== false) {
      setForm(emptyForm);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Create Workspace Task" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Task Title"
          name="title"
          required
          placeholder="E.g. Set up API authentication logic..."
          value={form.title}
          onChange={handleChange('title')}
        />

        <Input
          label="Description"
          name="description"
          textarea
          rows={3}
          placeholder="Outline task goals, deliverables, and guidelines..."
          value={form.description}
          onChange={handleChange('description')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Status"
            name="status"
            type="select"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={handleChange('status')}
          />
          <Input
            label="Priority"
            name="priority"
            type="select"
            options={PRIORITY_OPTIONS}
            value={form.priority}
            onChange={handleChange('priority')}
          />
        </div>

        <Input label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={handleChange('dueDate')} />

        {students.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Assign To Student(s){' '}
              <span className="text-[10px] font-normal text-slate-400/80 dark:text-slate-500/85">(Optional)</span>
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto bg-slate-50 dark:bg-slate-950/40 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl">
              {students.map((student) => {
                const isAssigned = form.assignees.includes(student._id);
                return (
                  <button
                    key={student._id}
                    type="button"
                    onClick={() => toggleAssignee(student._id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      isAssigned
                        ? 'bg-violet-600 border-violet-600 text-white'
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

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="outline" onClick={resetAndClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={FiPlusCircle} loading={submitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;

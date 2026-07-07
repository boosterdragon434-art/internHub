import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiCheck } from 'react-icons/fi';

/**
 * TaskChecklist — manages the subtask checklist inside a task.
 */
const TaskChecklist = ({ items = [], onChange, canEdit = true }) => {
  const [newItemText, setNewItemText] = useState('');

  const handleToggle = (index) => {
    const updated = items.map((item, i) => (i === index ? { ...item, isCompleted: !item.isCompleted } : item));
    onChange(updated);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onChange([...items, { text: newItemText.trim(), isCompleted: false }]);
    setNewItemText('');
  };

  const handleDeleteItem = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div>
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Checklist Progress</span>
            <span>
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Item List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <div
            key={item._id || index}
            className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 border border-slate-200 dark:border-slate-800/40 group transition-all duration-200"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Custom Checkbox */}
              <button
                type="button"
                onClick={() => handleToggle(index)}
                className={`w-5 h-5 shrink-0 rounded border flex items-center justify-center transition-all duration-200 ${
                  item.isCompleted
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 hover:border-violet-500 bg-white dark:bg-slate-800'
                }`}
                aria-label={item.isCompleted ? 'Mark item incomplete' : 'Mark item complete'}
              >
                {item.isCompleted && <FiCheck className="w-3.5 h-3.5" />}
              </button>

              <span
                className={`text-sm leading-relaxed truncate select-none ${
                  item.isCompleted ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {item.text}
              </span>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => handleDeleteItem(index)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all shrink-0"
                aria-label="Delete checklist item"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {totalCount === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">No checklist items added yet.</p>
        )}
      </div>

      {/* Add Item Form */}
      {canEdit && (
        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            placeholder="Add a checklist item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200"
          />
          <button
            type="submit"
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-violet-600 border border-slate-200 dark:border-slate-700 hover:border-violet-500 text-slate-600 dark:text-slate-200 hover:text-white rounded-lg flex items-center justify-center transition-all duration-200 shrink-0"
            aria-label="Add checklist item"
          >
            <FiPlus className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};

export default TaskChecklist;

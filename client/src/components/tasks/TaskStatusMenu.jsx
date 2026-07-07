import React, { useState, useRef } from 'react';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { TASK_COLUMNS } from '../../utils/taskConstants';
import { useClickOutside } from '../../hooks/useClickOutside';

/**
 * TaskStatusMenu — tap-friendly status changer.
 *
 * HTML5 drag-and-drop (used for desktop kanban dragging) never fires on
 * touch devices, so this menu is the *only* way status changes work on
 * phones/tablets. It works identically with mouse clicks too, so it doubles
 * as a quick-access control on desktop as well.
 */
const TaskStatusMenu = ({ status, onChange, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const current = TASK_COLUMNS.find((c) => c.id === status) || TASK_COLUMNS[0];

  if (disabled) {
    return (
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${current.headerClass}`}>
        {current.title}
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition ${current.headerClass}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current.title}
        <FiChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute z-30 top-full left-0 mt-1.5 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden py-1"
          onClick={(e) => e.stopPropagation()}
          role="listbox"
        >
          {TASK_COLUMNS.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => {
                setOpen(false);
                if (col.id !== status) onChange(col.id);
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition"
              role="option"
              aria-selected={col.id === status}
            >
              {col.title}
              {col.id === status && <FiCheck className="w-3.5 h-3.5 text-violet-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskStatusMenu;

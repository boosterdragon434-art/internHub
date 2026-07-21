import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiPlus, FiX } from 'react-icons/fi';
import { getReminders, dismissReminder, createReminder } from '../../api/reminderApi';
import { toast } from 'react-hot-toast';

/**
 * ReminderWidget — Embedded dashboard component showing today's upcoming alerts.
 * Logic (fetch/dismiss/quick-create) is unchanged — only the visual layer
 * moved from `brand-*` (dull slate gray) to violet, matching the rest of
 * the redesigned Student Dashboard it sits inside.
 */
const ReminderWidget = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('12:00');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await getReminders({ status: 'pending' });
      if (response.data?.success) {
        // Sort and select top 4 closest triggered items
        const list = response.data.data
          .filter((r) => r.status === 'pending' && new Date(r.triggerAt) >= new Date())
          .slice(0, 4);
        setReminders(list);
      }
    } catch (err) {
      console.error('Failed to load dashboard reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (e, reminderId) => {
    e.stopPropagation();
    try {
      const response = await dismissReminder(reminderId);
      if (response.data?.success) {
        toast.success('Reminder dismissed');
        setReminders((prev) => prev.filter((r) => r._id !== reminderId));
      }
    } catch (err) {
      toast.error('Failed to dismiss reminder');
    }
  };

  const handleQuickReminder = async (e) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const today = new Date();
      const [hours, minutes] = time.split(':');
      const triggerAt = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        parseInt(hours),
        parseInt(minutes)
      );

      const response = await createReminder({
        title: title.trim(),
        triggerAt,
        channels: ['in_app'],
      });

      if (response.data?.success) {
        toast.success('Quick reminder scheduled');
        setReminders((prev) => [...prev, response.data.data].sort((a, b) => new Date(a.triggerAt) - new Date(b.triggerAt)).slice(0, 4));
        setTitle('');
        setIsOpen(false);
      }
    } catch (err) {
      toast.error('Failed to create quick reminder');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-800 p-5 rounded-2xl flex justify-center py-10 shadow-sm">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-ink-900 p-5 border border-slate-200 dark:border-ink-800 rounded-[2rem] flex flex-col space-y-4 shadow-sm hover:shadow-md dark:hover:border-violet-500/20 transition-all duration-300">
      {/* Widget Header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-ink-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center">
            <FiBell className="w-4 h-4 animate-pulse" />
          </div>
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-slate-50 uppercase tracking-wider">Upcoming Alerts</h3>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-1.5 hover:bg-slate-100 dark:hover:bg-ink-800 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg transition"
          title="Add Alert"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Agenda/Reminders List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px] pr-1">
        {reminders.map((r) => (
          <div
            key={r._id}
            className="p-3 bg-slate-50 dark:bg-ink-950/60 hover:bg-slate-100 dark:hover:bg-ink-800/80 border border-slate-100 dark:border-ink-800 rounded-xl flex justify-between items-center group transition"
          >
            <div className="min-w-0 pr-3">
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
                {r.title}
              </span>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold tracking-wide font-mono">
                {new Date(r.triggerAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                {new Date(r.triggerAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <button
              onClick={(e) => handleDismiss(e, r._id)}
              className="shrink-0 p-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors border border-emerald-100 dark:border-emerald-800/30"
              title="Mark Dismissed"
            >
              <FiCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {reminders.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs font-medium">
            No upcoming alerts scheduled today.
          </div>
        )}
      </div>

      {/* Quick Add Alert Popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleQuickReminder}
            className="w-full max-w-sm bg-white dark:bg-ink-900 border border-slate-200 dark:border-ink-700 rounded-2xl p-5 space-y-4 shadow-xl"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-ink-800 pb-3">
              <h4 className="text-xs font-heading font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">Quick Schedule Reminder</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-ink-800 transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</label>
              <input
                type="text"
                required
                placeholder="E.g. Code Review sync..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-ink-950/60 border border-slate-200 dark:border-ink-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none transition placeholder-slate-400 dark:placeholder-slate-500 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Trigger Time (Today)</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-ink-950/60 border border-slate-200 dark:border-ink-700 focus:border-violet-500 dark:focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-50 outline-none transition font-medium"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-ink-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-white dark:bg-ink-800 border border-slate-200 dark:border-ink-700 hover:bg-slate-50 dark:hover:bg-ink-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md shadow-violet-600/20"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReminderWidget;

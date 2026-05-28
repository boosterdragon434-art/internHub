import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiPlus, FiX } from 'react-icons/fi';
import { getReminders, dismissReminder, createReminder } from '../../api/reminderApi';
import { toast } from 'react-hot-toast';

/**
 * ReminderWidget Component — Embedded dashboard component showing today's upcoming alerts.
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
      <div className="glass-card p-5 border border-slate-800 bg-slate-900/40 rounded-2xl flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card hover-glow p-5 border border-slate-800 bg-slate-900/40 rounded-2xl flex flex-col space-y-4">
      {/* Widget Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <FiBell className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">Upcoming Alerts</h3>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
          title="Add Alert"
        >
          <FiPlus className="w-4 h-4" />
        </button>
      </div>

      {/* Agenda/Reminders List */}
      <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px]">
        {reminders.map((r) => (
          <div
            key={r._id}
            className="p-3 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850/60 rounded-xl flex justify-between items-center group transition"
          >
            <div className="min-w-0">
              <span className="block text-xs font-semibold text-slate-200 truncate group-hover:text-amber-400 transition">
                {r.title}
              </span>
              <span className="block text-[10px] text-slate-500 mt-0.5 font-medium">
                {new Date(r.triggerAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                {new Date(r.triggerAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>

            <button
              onClick={(e) => handleDismiss(e, r._id)}
              className="p-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg transition"
              title="Mark Dismissed"
            >
              <FiCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {reminders.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-xs italic">
            No upcoming alerts scheduled today.
          </div>
        )}
      </div>

      {/* Quick Add Alert Popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleQuickReminder}
            className="glass-card w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase">Quick Schedule Reminder</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Title</label>
              <input
                type="text"
                required
                placeholder="E.g. Code Review sync..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Trigger Time</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none transition"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
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

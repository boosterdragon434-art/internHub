import React from 'react';
import { Helmet } from 'react-helmet-async';
import CalendarView from '../../components/productivity/CalendarView';

/**
 * StudentCalendarPage Component — Personal schedule calendar for students.
 */
const StudentCalendarPage = () => {
  return (
    <div className="space-y-6">
      <Helmet>
        <title>My Schedule Planner — InternHub</title>
      </Helmet>

      {/* Header Banner */}
      <div className="glass-card hover-glow p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 relative overflow-hidden">
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1 bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
          Schedule & Deadline Planner
        </h1>
        <p className="text-slate-400 text-sm">
          Keep track of important project dates, upcoming sync deadlines, and custom daily planner alerts.
        </p>
      </div>

      <CalendarView />
    </div>
  );
};

export default StudentCalendarPage;

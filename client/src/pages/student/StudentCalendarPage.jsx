import React from 'react';
import { Helmet } from 'react-helmet-async';
import { FiCalendar } from 'react-icons/fi';
import CalendarView from '../../components/productivity/CalendarView';
import EnrollmentGate from '../../components/common/EnrollmentGate';

/**
 * StudentCalendarPage Component — Personal schedule calendar for students.
 * Gated behind active enrollment.
 */
const StudentCalendarPage = () => {
  return (
    <EnrollmentGate featureName="Calendar">
      <div className="space-y-6">
        <Helmet>
          <title>My Schedule Planner — InternHub</title>
        </Helmet>

        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-violet-50 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                Schedule & Deadline Planner
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Keep track of important project dates, upcoming sync deadlines, and custom daily planner alerts.
              </p>
            </div>
          </div>
        </div>

        <CalendarView />
      </div>
    </EnrollmentGate>
  );
};

export default StudentCalendarPage;

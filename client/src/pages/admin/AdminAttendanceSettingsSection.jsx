import React, { useState, useEffect } from 'react';
import { FiClock, FiSave, FiAlertCircle, FiSettings, FiCheckCircle } from 'react-icons/fi';
import { useToast } from '../../context/ToastContext';
import { getAttendanceSettings, updateAttendanceSettings } from '../../api/attendanceApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Loader';

const AdminAttendanceSettingsSection = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    expectedCheckInTime: '09:00',
    lateGraceMinutes: 15,
    maxBreakMinutes: 60,
    autoCheckoutHour: 22,
    workingDaysPerWeek: 5,
    minimumWorkHours: 6,
    overtimeThresholdHours: 8,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await getAttendanceSettings();
        const settings = res.data?.data?.settings;
        if (res.data?.success && settings) {
          setSettingsForm({
            expectedCheckInTime: settings.expectedCheckInTime || '09:00',
            lateGraceMinutes: settings.lateGraceMinutes ?? 15,
            maxBreakMinutes: settings.maxBreakMinutes ?? 60,
            autoCheckoutHour: settings.autoCheckoutHour ?? 22,
            workingDaysPerWeek: settings.workingDaysPerWeek ?? 5,
            minimumWorkHours: settings.minimumWorkHours ?? 6,
            overtimeThresholdHours: settings.overtimeThresholdHours ?? 8,
          });
        }
      } catch (err) {
        console.error('Error fetching attendance settings:', err);
        toast.error(err.response?.data?.message || 'Failed to load attendance settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validate HH:MM
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(settingsForm.expectedCheckInTime)) {
      newErrors.expectedCheckInTime = 'Time must be in HH:MM format (e.g. 09:00)';
    } else {
      const [hours, mins] = settingsForm.expectedCheckInTime.split(':').map(Number);
      if (hours < 0 || hours > 23 || mins < 0 || mins > 59) {
        newErrors.expectedCheckInTime = 'Invalid time value (Hours: 00-23, Minutes: 00-59)';
      }
    }

    if (settingsForm.lateGraceMinutes < 0 || settingsForm.lateGraceMinutes > 120) {
      newErrors.lateGraceMinutes = 'Grace period must be between 0 and 120 minutes';
    }

    if (settingsForm.maxBreakMinutes < 0 || settingsForm.maxBreakMinutes > 180) {
      newErrors.maxBreakMinutes = 'Max break allowance must be between 0 and 180 minutes';
    }

    if (settingsForm.autoCheckoutHour < 12 || settingsForm.autoCheckoutHour > 23) {
      newErrors.autoCheckoutHour = 'Auto-checkout hour must be between 12 (12 PM) and 23 (11 PM)';
    }

    if (settingsForm.workingDaysPerWeek < 1 || settingsForm.workingDaysPerWeek > 7) {
      newErrors.workingDaysPerWeek = 'Working days per week must be between 1 and 7';
    }

    if (settingsForm.minimumWorkHours < 1 || settingsForm.minimumWorkHours > 16) {
      newErrors.minimumWorkHours = 'Minimum work hours must be between 1 and 16 hours';
    }

    if (settingsForm.overtimeThresholdHours < 1 || settingsForm.overtimeThresholdHours > 16) {
      newErrors.overtimeThresholdHours = 'Overtime threshold must be between 1 and 16 hours';
    }

    if (Number(settingsForm.minimumWorkHours) > Number(settingsForm.overtimeThresholdHours)) {
      newErrors.overtimeThresholdHours = 'Overtime threshold must be greater than or equal to minimum work hours';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({
      ...prev,
      [name]: name === 'expectedCheckInTime' ? value : Number(value),
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix validation errors before saving.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateAttendanceSettings(settingsForm);
      if (res.data?.success) {
        toast.success('Attendance policies updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update attendance settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Spinner size="md" />
        <span className="mt-3 text-xs text-slate-500 dark:text-slate-400">Loading attendance rules...</span>
      </div>
    );
  }

  // Options lists for selects
  const hourOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 12,
    label: `${i + 12}:00 (${i === 0 ? '12 PM' : `${i} PM`})`,
  }));

  const dayOptions = Array.from({ length: 7 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} Day${i === 0 ? '' : 's'}`,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3.5 mb-2 border-b border-slate-100 dark:border-slate-850 pb-4">
        <div className="p-2.5 bg-accent-100 dark:bg-accent-950/30 text-accent-600 dark:text-accent-400 rounded-xl">
          <FiClock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
            Attendance Policies & Compliance Rules
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-0.5">
            Configure system-wide scheduling policies, timing thresholds, break rules, and work compliance.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scheduling Rules Section */}
          <div className="space-y-4 border-r border-transparent md:border-slate-100 dark:md:border-slate-850 md:pr-6">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-2">
              <FiSettings className="text-slate-400" /> Work Timing & Office Hours
            </h3>

            <Input
              name="expectedCheckInTime"
              label="Standard Expected Check-In Time"
              type="text"
              placeholder="e.g. 09:00"
              value={settingsForm.expectedCheckInTime}
              onChange={handleInputChange}
              error={errors.expectedCheckInTime}
              required
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-2 leading-relaxed">
              Standard start of day in 24-hour HH:MM format. Daily check-ins after this time (plus grace period) are marked as Late.
            </p>

            <Input
              name="lateGraceMinutes"
              label="Late Arrival Grace Period (Minutes)"
              type="number"
              min="0"
              max="120"
              placeholder="15"
              value={settingsForm.lateGraceMinutes}
              onChange={handleInputChange}
              error={errors.lateGraceMinutes}
              required
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-2 leading-relaxed">
              Allowed delay buffer after expected check-in time before the system flags the student as late.
            </p>

            <Input
              name="autoCheckoutHour"
              label="End-Of-Day Auto Checkout Hour"
              type="select"
              options={hourOptions}
              value={settingsForm.autoCheckoutHour}
              onChange={handleInputChange}
              error={errors.autoCheckoutHour}
              required
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-2 leading-relaxed">
              EOD deadline. If an intern fails to check out by this hour, the system registers a "Missed Checkout" state passively.
            </p>
          </div>

          {/* Compliance & Benchmarks Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 mb-2">
              <FiCheckCircle className="text-slate-400" /> Breaks & Benchmarks
            </h3>

            <Input
              name="maxBreakMinutes"
              label="Maximum Daily Break Allowance (Minutes)"
              type="number"
              min="0"
              max="180"
              placeholder="60"
              value={settingsForm.maxBreakMinutes}
              onChange={handleInputChange}
              error={errors.maxBreakMinutes}
              required
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-2 leading-relaxed">
              Maximum total break time allowed per day. Exceeding this does not block checkout, but flags compliance breaches.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <Input
                name="minimumWorkHours"
                label="Min Daily Work Hours"
                type="number"
                min="1"
                max="16"
                placeholder="6"
                value={settingsForm.minimumWorkHours}
                onChange={handleInputChange}
                error={errors.minimumWorkHours}
                required
              />

              <Input
                name="overtimeThresholdHours"
                label="Overtime Trigger Threshold"
                type="number"
                min="1"
                max="16"
                placeholder="8"
                value={settingsForm.overtimeThresholdHours}
                onChange={handleInputChange}
                error={errors.overtimeThresholdHours}
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-2 leading-relaxed">
              Configure base productivity constraints. Exceeding the overtime threshold will log hours as overtime.
            </p>

            <Input
              name="workingDaysPerWeek"
              label="Expected Working Days Per Week"
              type="select"
              options={dayOptions}
              value={settingsForm.workingDaysPerWeek}
              onChange={handleInputChange}
              error={errors.workingDaysPerWeek}
              required
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-2 leading-relaxed">
              Standard scheduled weekly count to calculate attendance percentages and compliance targets.
            </p>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="flex gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-xl p-4.5 mt-2">
          <FiAlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-850 dark:text-amber-300">Important Administrative Note</h4>
            <p className="text-[10px] text-amber-700 dark:text-amber-400/90 mt-1 leading-relaxed">
              Changes to check-in targets, grace periods, or break times will take effect starting tomorrow. They do not retroactively alter previously completed attendance records or already started sessions.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
          <Button
            type="submit"
            variant="primary"
            loading={saving}
            icon={FiSave}
          >
            Apply & Save Policies
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminAttendanceSettingsSection;

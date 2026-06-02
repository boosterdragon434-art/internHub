import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiUpload, FiArrowRight, FiArrowLeft, FiGithub, FiGlobe } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { submitApplication } from '../../api/applicationApi';

const STEPS = ['Personal Brief', 'Motivation', 'Availability', 'Review & Submit'];

/**
 * InternshipApplicationForm — 4-step inline form rendered inside the drawer.
 * Manages all state internally. On submit, posts to API and shows success state.
 */
const InternshipApplicationForm = ({ internship, onClose, onSuccess }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resume, setResume] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    college: user?.college || '',
    department: user?.department || '',
    yearOfStudy: user?.yearOfStudy || '',
    motivation: '',
    relevantExperience: '',
    portfolioUrl: '',
    availableFrom: '',
    hoursPerWeek: 20,
    preferredMode: 'Remote',
    confirmAccuracy: false,
  });

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }, []);

  const handleSlider = useCallback((e) => {
    setForm((prev) => ({ ...prev, hoursPerWeek: parseInt(e.target.value, 10) }));
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed.'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB.'); return; }
      setResume(file);
    }
  }, [toast]);

  const yearOptions = [
    '1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduated', 'Other',
  ];

  const modeOptions = ['Remote', 'Hybrid', 'On-site'];

  // ── Step Validation ──
  const validateStep = (s) => {
    if (s === 0) {
      if (!form.name || !form.email || !form.phone || !form.college || !form.department || !form.yearOfStudy) {
        toast.error('Please fill in all required fields.');
        return false;
      }
    }
    if (s === 1) {
      if (form.motivation && form.motivation.length < 100) {
        toast.error('Motivation must be at least 100 characters.');
        return false;
      }
    }
    if (s === 3) {
      if (!form.confirmAccuracy) {
        toast.error('Please confirm that all information is accurate.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep(step + 1); };
  const prevStep = () => setStep(step - 1);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('internship', internship._id);
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('college', form.college);
      formData.append('department', form.department);
      formData.append('yearOfStudy', form.yearOfStudy);
      formData.append('motivation', form.motivation);
      formData.append('relevantExperience', form.relevantExperience);
      formData.append('portfolioUrl', form.portfolioUrl);
      formData.append('preferredMode', form.preferredMode);
      formData.append('hoursPerWeek', form.hoursPerWeek);
      formData.append('confirmAccuracy', form.confirmAccuracy);
      if (form.availableFrom) formData.append('availableFrom', form.availableFrom);
      if (resume) formData.append('resume', resume);

      const skills = user?.skills || [];
      skills.forEach((s) => formData.append('skills[]', s));

      const res = await submitApplication(formData);
      if (res.success) {
        setSubmitted(true);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error(err.response?.data?.message || 'You have already applied for this internship.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Progress Bar ──
  const progress = ((step + 1) / STEPS.length) * 100;

  // ── Success State ──
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-16 px-6 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6"
        >
          <FiCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </motion.div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Application Submitted
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
          Your application for <strong>{internship.title}</strong> has been received. Watch your inbox for updates.
        </p>
        <button
          onClick={onClose}
          className="mt-8 px-6 py-2.5 text-xs font-semibold text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          Close
        </button>
      </motion.div>
    );
  }

  // ── Shared input styles ──
  const inputClass = 'w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all placeholder:text-slate-400';
  const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5';
  const readOnlyClass = 'w-full px-3 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-500 cursor-not-allowed';

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mx-4 mt-2 overflow-hidden">
        <motion.div
          className="h-full bg-brand-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step Label */}
      <div className="px-6 pt-4 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Step {step + 1} of {STEPS.length}
        </span>
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
          {STEPS[step]}
        </h3>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            {/* ── STEP 0: Personal Brief ── */}
            {step === 0 && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input name="name" value={form.name} readOnly className={readOnlyClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input name="email" value={form.email} readOnly className={readOnlyClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Current Institution *</label>
                  <input name="college" value={form.college} onChange={handleChange} placeholder="University / College name" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Department *</label>
                  <input name="department" value={form.department} onChange={handleChange} placeholder="Computer Science" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Year of Study *</label>
                  <div className="flex flex-wrap gap-1.5">
                    {yearOptions.map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, yearOfStudy: yr }))}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                          form.yearOfStudy === yr
                            ? 'bg-brand-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1: Motivation ── */}
            {step === 1 && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelClass} style={{ marginBottom: 0 }}>Why this internship?</label>
                    <span className={`text-[10px] font-medium ${form.motivation.length >= 100 ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {form.motivation.length}/100 min
                    </span>
                  </div>
                  <textarea
                    name="motivation"
                    value={form.motivation}
                    onChange={handleChange}
                    rows={4}
                    placeholder="What excites you about this opportunity? What do you hope to learn?"
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Relevant experience or projects</label>
                  <textarea
                    name="relevantExperience"
                    value={form.relevantExperience}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Describe any relevant coursework, projects, or work experience..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-1"><FiGlobe className="w-3 h-3" /> Portfolio / GitHub URL</span>
                  </label>
                  <input
                    name="portfolioUrl"
                    value={form.portfolioUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Resume (PDF only, max 5MB)</label>
                  <label
                    htmlFor="drawer-resume-upload"
                    className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-brand-500 dark:hover:border-brand-600 transition-colors"
                  >
                    <FiUpload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {resume ? (
                        <span className="text-brand-600 dark:text-brand-400 font-semibold">{resume.name}</span>
                      ) : (
                        'Click to upload'
                      )}
                    </span>
                  </label>
                  <input
                    id="drawer-resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: Availability ── */}
            {step === 2 && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className={labelClass}>Available from</label>
                  <input
                    type="date"
                    name="availableFrom"
                    value={form.availableFrom}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelClass} style={{ marginBottom: 0 }}>Hours per week</label>
                    <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{form.hoursPerWeek}h</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={form.hoursPerWeek}
                    onChange={handleSlider}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-brand-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>10h</span>
                    <span>25h</span>
                    <span>40h</span>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Preferred mode</label>
                  <div className="flex gap-2">
                    {modeOptions.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, preferredMode: m }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                          form.preferredMode === m
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review & Submit ── */}
            {step === 3 && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Name', form.name],
                    ['Email', form.email],
                    ['Phone', form.phone],
                    ['Institution', form.college],
                    ['Department', form.department],
                    ['Year', form.yearOfStudy],
                    ['Mode', form.preferredMode],
                    ['Hours/Week', `${form.hoursPerWeek}h`],
                    ['Available', form.availableFrom || 'Flexible'],
                    ['Resume', resume?.name || 'Not uploaded'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{value}</p>
                    </div>
                  ))}
                </div>
                {form.motivation && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Motivation</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-3">{form.motivation}</p>
                  </div>
                )}
                {form.portfolioUrl && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Portfolio</span>
                    <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1 truncate">{form.portfolioUrl}</p>
                  </div>
                )}
                <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="confirmAccuracy"
                    checked={form.confirmAccuracy}
                    onChange={handleChange}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    I confirm all information provided is accurate and complete.
                  </span>
                </label>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
        {step > 0 ? (
          <button
            onClick={prevStep}
            className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length - 1 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 transition-colors"
          >
            Continue <FiArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.confirmAccuracy}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-brand-600 text-white text-xs font-semibold rounded-xl hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <FiCheck className="w-3.5 h-3.5" /> Submit Application
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InternshipApplicationForm;

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCheck, FiUpload, FiArrowRight, FiArrowLeft, FiX,
  FiUser, FiMapPin, FiFileText, FiImage, FiCalendar,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { submitApplication } from '../../api/applicationApi';

const STEPS = ['Personal Info', 'Address & Dates', 'Documents', 'Review & Submit'];

const DOMAIN_OPTIONS = [
  'Web Development', 'Full Stack Development', 'UI/UX Design',
  'Java Development', 'Python Development', 'Human Resources (HR)',
  'Finance', 'AI & ML', 'Other',
];

const DEGREE_OPTIONS = [
  'B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA',
  'M.Tech', 'M.E.', 'M.Sc', 'M.Com', 'M.A.', 'MBA', 'MCA',
  'Ph.D', 'Diploma', 'Other',
];

/**
 * InternshipApplicationForm — 4-step inline form rendered inside the drawer.
 * Collects comprehensive student information, addresses, dates, and documents.
 */
const InternshipApplicationForm = ({ internship, onClose, onSuccess }) => {
  const { user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // File states
  const [resume, setResume] = useState(null);
  const [aadharCard, setAadharCard] = useState(null);
  const [passportPhoto, setPassportPhoto] = useState(null);
  const [idCard, setIdCard] = useState(null);

  const [form, setForm] = useState({
    name: (user?.name || '').toUpperCase(),
    rollNo: '',
    degree: '',
    department: user?.department || '',
    college: user?.college || '',
    email: user?.email || '',
    phone: user?.phone || '',
    currentAddress: '',
    permanentAddress: '',
    district: '',
    stateCountry: '',
    pinCode: '',
    dateOfJoining: '',
    dateOfCompletion: '',
    domain: '',
  });

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'name' ? value.toUpperCase() : value,
    }));
  }, []);

  const handleFileChange = useCallback((setter, accept) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedPdf = ['application/pdf'];
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedAll = [...allowedPdf, ...allowedImages];
    const allowed = accept === 'pdf' ? allowedPdf : accept === 'image' ? allowedImages : allowedAll;

    if (!allowed.includes(file.type)) {
      toast.error(accept === 'pdf' ? 'Only PDF files are allowed.' : accept === 'image' ? 'Only image files are allowed.' : 'Only PDF or image files are allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) { toast.error('File size must be under 10MB.'); return; }
    setter(file);
  }, [toast]);

  // ── Input styles ──
  const inputClass = 'w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20 transition-all placeholder:text-slate-400';
  const labelClass = 'block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5';
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1.25rem',
  };

  // ── Step Validation ──
  const validateStep = (s) => {
    if (s === 0) {
      if (!form.name || !form.rollNo || !form.degree || !form.department || !form.college || !form.phone) {
        toast.error('Please fill in all required fields.');
        return false;
      }
    }
    if (s === 1) {
      if (!form.currentAddress || !form.permanentAddress || !form.district || !form.stateCountry || !form.pinCode) {
        toast.error('Please fill in all address fields.');
        return false;
      }
      if (!/^\d{4,10}$/.test(form.pinCode.trim())) {
        toast.error('PIN Code must be 4-10 digits.');
        return false;
      }
      if (!form.dateOfJoining || !form.dateOfCompletion) {
        toast.error('Please select both Date of Joining and Date of Completion.');
        return false;
      }
      if (new Date(form.dateOfCompletion) <= new Date(form.dateOfJoining)) {
        toast.error('Completion date must be after Joining date.');
        return false;
      }
      if (!form.domain) {
        toast.error('Please select a Domain of Internship.');
        return false;
      }
    }
    if (s === 2) {
      if (!aadharCard || !passportPhoto || !idCard) {
        toast.error('Please upload all required documents.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep(step + 1); };
  const prevStep = () => setStep(step - 1);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateStep(2)) { setStep(2); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('internship', internship._id);
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('college', form.college);
      formData.append('department', form.department);
      formData.append('rollNo', form.rollNo);
      formData.append('degree', form.degree);
      formData.append('currentAddress', form.currentAddress);
      formData.append('permanentAddress', form.permanentAddress);
      formData.append('district', form.district);
      formData.append('stateCountry', form.stateCountry);
      formData.append('pinCode', form.pinCode);
      formData.append('dateOfJoining', form.dateOfJoining);
      formData.append('dateOfCompletion', form.dateOfCompletion);
      formData.append('domain', form.domain);
      formData.append('confirmAccuracy', 'true');

      if (resume) formData.append('resume', resume);
      if (aadharCard) formData.append('aadharCard', aadharCard);
      if (passportPhoto) formData.append('passportPhoto', passportPhoto);
      if (idCard) formData.append('idCard', idCard);

      const skills = user?.skills || [];
      skills.forEach((s) => formData.append('skills', s));

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

  /** Mini file upload widget for drawer */
  const MiniFileUpload = ({ label, file, onChange, onRemove, accept, hint }) => (
    <div>
      <label className={labelClass}>{label}</label>
      {file ? (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            {file.type.startsWith('image/') ? <FiImage className="w-3.5 h-3.5 text-emerald-600" /> : <FiFileText className="w-3.5 h-3.5 text-emerald-600" />}
          </div>
          <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 truncate flex-1">{file.name}</p>
          <button onClick={onRemove} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md p-1" type="button">
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-1.5 p-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-brand-500 dark:hover:border-brand-600 transition-colors">
          <FiUpload className="w-5 h-5 text-slate-400" />
          <span className="text-[10px] text-slate-500">Click to upload</span>
          {hint && <span className="text-[9px] text-slate-400">{hint}</span>}
          <input type="file" accept={accept} onChange={onChange} className="hidden" />
        </label>
      )}
    </div>
  );

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
            {/* ── STEP 0: Personal Info ── */}
            {step === 0 && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className={labelClass}>Name (IN CAPS) *</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="AS PER ID CARD" className={`${inputClass} uppercase`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Roll No. *</label>
                    <input name="rollNo" value={form.rollNo} onChange={handleChange} placeholder="Roll number" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Degree *</label>
                    <select name="degree" value={form.degree} onChange={handleChange} className={`${inputClass} appearance-none bg-no-repeat`} style={selectStyle}>
                      <option value="">Select</option>
                      {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Department *</label>
                  <input name="department" value={form.department} onChange={handleChange} placeholder="Computer Science" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>College Name *</label>
                  <input name="college" value={form.college} onChange={handleChange} placeholder="Your institution" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input name="email" value={form.email} readOnly className={`${inputClass} bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed`} />
                </div>
                <div>
                  <label className={labelClass}>Mobile Number *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                </div>
              </div>
            )}

            {/* ── STEP 1: Address & Dates ── */}
            {step === 1 && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className={labelClass}>Current Address *</label>
                  <textarea name="currentAddress" value={form.currentAddress} onChange={handleChange} rows={2} placeholder="Current residential address" className={`${inputClass} resize-none`} />
                </div>
                <div>
                  <label className={labelClass}>Permanent Address *</label>
                  <textarea name="permanentAddress" value={form.permanentAddress} onChange={handleChange} rows={2} placeholder="Permanent address" className={`${inputClass} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>District *</label>
                    <input name="district" value={form.district} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>State & Country *</label>
                    <input name="stateCountry" value={form.stateCountry} onChange={handleChange} placeholder="Tamil Nadu, India" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>PIN Code *</label>
                  <input name="pinCode" value={form.pinCode} onChange={handleChange} maxLength={10} placeholder="600001" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Date of Joining *</label>
                    <input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Date of Completion *</label>
                    <input type="date" name="dateOfCompletion" value={form.dateOfCompletion} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Domain of Internship *</label>
                  <select name="domain" value={form.domain} onChange={handleChange} className={`${inputClass} appearance-none bg-no-repeat`} style={selectStyle}>
                    <option value="">Select domain</option>
                    {DOMAIN_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* ── STEP 2: Documents ── */}
            {step === 2 && (
              <div className="space-y-3 pt-2">
                <MiniFileUpload
                  label="Aadhar Card *"
                  file={aadharCard}
                  onChange={handleFileChange(setAadharCard, 'all')}
                  onRemove={() => setAadharCard(null)}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  hint="PDF or image, max 10MB"
                />
                <MiniFileUpload
                  label="Passport Size Photo *"
                  file={passportPhoto}
                  onChange={handleFileChange(setPassportPhoto, 'image')}
                  onRemove={() => setPassportPhoto(null)}
                  accept=".jpg,.jpeg,.png,.webp"
                  hint="Image only, max 10MB"
                />
                <MiniFileUpload
                  label="ID Card / Bonafide Certificate *"
                  file={idCard}
                  onChange={handleFileChange(setIdCard, 'all')}
                  onRemove={() => setIdCard(null)}
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  hint="PDF or image, max 10MB"
                />
                <MiniFileUpload
                  label="Resume"
                  file={resume}
                  onChange={handleFileChange(setResume, 'pdf')}
                  onRemove={() => setResume(null)}
                  accept=".pdf"
                  hint="PDF only, max 10MB (optional)"
                />
              </div>
            )}

            {/* ── STEP 3: Review & Submit ── */}
            {step === 3 && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['Name', form.name],
                    ['Roll No', form.rollNo],
                    ['Degree', form.degree],
                    ['Department', form.department],
                    ['College', form.college],
                    ['Email', form.email],
                    ['Mobile', form.phone],
                    ['District', form.district],
                    ['State', form.stateCountry],
                    ['PIN Code', form.pinCode],
                    ['Joining', form.dateOfJoining ? new Date(form.dateOfJoining).toLocaleDateString('en-IN') : 'N/A'],
                    ['Completion', form.dateOfCompletion ? new Date(form.dateOfCompletion).toLocaleDateString('en-IN') : 'N/A'],
                    ['Domain', form.domain],
                    ['Aadhar', aadharCard?.name || 'Not uploaded'],
                    ['Photo', passportPhoto?.name || 'Not uploaded'],
                    ['ID Card', idCard?.name || 'Not uploaded'],
                    ['Resume', resume?.name || 'Not uploaded'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{value || 'N/A'}</p>
                    </div>
                  ))}
                </div>
                {form.currentAddress && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Current Address</span>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{form.currentAddress}</p>
                  </div>
                )}
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
            disabled={submitting}
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

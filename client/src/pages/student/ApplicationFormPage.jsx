import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiUpload, FiCheck, FiArrowLeft, FiArrowRight,
  FiMapPin, FiCalendar, FiFileText, FiX, FiImage,
} from 'react-icons/fi';
import { getInternshipDetail } from '../../api/internshipApi';
import { submitApplication, getMyApplications } from '../../api/applicationApi';
import { getCooldownSetting } from '../../api/settingsApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import { FullPageLoader } from '../../components/common/Loader';

/** Domain options for the internship */
const DOMAIN_OPTIONS = [
  'Web Development',
  'Full Stack Development',
  'UI/UX Design',
  'Java Development',
  'Python Development',
  'Human Resources (HR)',
  'Finance',
  'AI & ML',
  'Other',
];

/** Degree options */
const DEGREE_OPTIONS = [
  'B.Tech', 'B.E.', 'B.Sc', 'B.Com', 'B.A.', 'BBA', 'BCA',
  'M.Tech', 'M.E.', 'M.Sc', 'M.Com', 'M.A.', 'MBA', 'MCA',
  'Ph.D', 'Diploma', 'Other',
];

/** Reusable styled input */
const FormInput = ({ label, required, error, children, className = '' }) => (
  <div className={`w-full ${className}`}>
    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
      {label}{' '}
      <span className={`text-[10px] font-normal ${required ? 'text-rose-500/90' : 'text-slate-400/80 dark:text-slate-500/85'}`}>
        ({required ? 'Required' : 'Optional'})
      </span>
    </label>
    {children}
    {error && <p className="mt-1 text-[10px] text-rose-500 font-medium">{error}</p>}
  </div>
);

const inputClass = 'block w-full px-4 py-3 text-xs bg-white dark:bg-slate-900 text-slate-950 dark:text-slate-50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-accent-500/10 focus:border-accent-500 transition-all duration-300';
const selectClass = `${inputClass} appearance-none bg-no-repeat`;
const selectStyle = {
  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`,
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '1.25rem',
};

const ApplicationFormPage = () => {
  const { id: internshipId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [internship, setInternship] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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

  useEffect(() => {
    const fetchInternship = async () => {
      try {
        const res = await getInternshipDetail(internshipId);
        if (res.success) setInternship(res.data);

        const [appsRes, cooldownRes] = await Promise.all([
          getMyApplications(),
          getCooldownSetting(),
        ]);

        if (appsRes.success && cooldownRes.success) {
          const cooldownHours = parseInt(cooldownRes.data.cooldown, 10) || 0;
          const relevantApps = appsRes.data.filter(
            (app) => app.internship?._id === internshipId || app.internship === internshipId
          );

          if (relevantApps.length > 0) {
            relevantApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const latestApp = relevantApps[0];

            if (cooldownHours === 0) {
              toast.error('You have already applied for this internship.');
              navigate('/student/applications');
              return;
            } else {
              const timeElapsed = (Date.now() - new Date(latestApp.createdAt).getTime()) / (1000 * 60 * 60);
              if (timeElapsed < cooldownHours) {
                const remainingHours = Math.ceil(cooldownHours - timeElapsed);
                toast.error(`You have already applied. Please wait ${remainingHours} hour(s) before applying again.`);
                navigate('/student/applications');
                return;
              }
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load internship details.');
        navigate('/internships');
      } finally {
        setPageLoading(false);
      }
    };
    fetchInternship();
  }, [internshipId]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'name' ? value.toUpperCase() : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }, [errors]);

  const handleFileChange = useCallback((setter, fieldName, accept) => (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedPdf = ['application/pdf'];
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedAll = [...allowedPdf, ...allowedImages];

    const allowed = accept === 'pdf' ? allowedPdf : accept === 'image' ? allowedImages : allowedAll;

    if (!allowed.includes(file.type)) {
      const msg = accept === 'pdf' ? 'Only PDF files are allowed.' : accept === 'image' ? 'Only image files (JPEG, PNG, WebP) are allowed.' : 'Only PDF or image files are allowed.';
      toast.error(msg);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB.');
      return;
    }
    setter(file);
    if (errors[fieldName]) setErrors((prev) => ({ ...prev, [fieldName]: '' }));
  }, [toast, errors]);

  const removeFile = useCallback((setter) => () => setter(null), []);

  /** Step validation */
  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!form.name.trim()) errs.name = 'Name is required';
      if (!form.rollNo.trim()) errs.rollNo = 'Roll number is required';
      if (!form.degree) errs.degree = 'Degree is required';
      if (!form.department.trim()) errs.department = 'Department is required';
      if (!form.college.trim()) errs.college = 'College name is required';
      if (!form.phone.trim()) errs.phone = 'Mobile number is required';
    }
    if (s === 1) {
      if (!form.currentAddress.trim()) errs.currentAddress = 'Current address is required';
      if (!form.permanentAddress.trim()) errs.permanentAddress = 'Permanent address is required';
      if (!form.district.trim()) errs.district = 'District is required';
      if (!form.stateCountry.trim()) errs.stateCountry = 'State & Country is required';
      if (!form.pinCode.trim()) errs.pinCode = 'PIN Code is required';
      else if (!/^\d{4,10}$/.test(form.pinCode.trim())) errs.pinCode = 'PIN Code must be 4-10 digits';
      if (!form.dateOfJoining) errs.dateOfJoining = 'Date of Joining is required';
      if (!form.dateOfCompletion) errs.dateOfCompletion = 'Date of Completion is required';
      if (form.dateOfJoining && form.dateOfCompletion && new Date(form.dateOfCompletion) <= new Date(form.dateOfJoining)) {
        errs.dateOfCompletion = 'Completion date must be after joining date';
      }
      if (!form.domain) errs.domain = 'Domain of Internship is required';
    }
    if (s === 2) {
      if (!aadharCard) errs.aadharCard = 'Aadhar Card is required';
      if (!passportPhoto) errs.passportPhoto = 'Passport Size Photo is required';
      if (!idCard) errs.idCard = 'ID Card / Bonafide Certificate is required';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error('Please fill in all required fields.');
      return false;
    }
    return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep(step + 1); };
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    if (!validateStep(2)) { setStep(2); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('internship', internshipId);
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

      const res = await submitApplication(formData);
      if (res.success) {
        toast.success('Application submitted successfully!');
        navigate('/student/applications');
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('You have already submitted an application for this internship.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit application.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) return <FullPageLoader message="Loading application form..." />;

  const steps = [
    { label: 'Personal Info', icon: FiUser },
    { label: 'Address & Dates', icon: FiMapPin },
    { label: 'Documents', icon: FiFileText },
    { label: 'Review & Submit', icon: FiCheck },
  ];

  const progress = ((step + 1) / steps.length) * 100;

  /** File upload card */
  const FileUploadCard = ({ label, required, file, onFileChange, onRemove, accept, fieldName, hint }) => (
    <FormInput label={label} required={required} error={errors[fieldName]}>
      {file ? (
        <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            {file.type.startsWith('image/') ? <FiImage className="w-5 h-5 text-emerald-600" /> : <FiFileText className="w-5 h-5 text-emerald-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">{file.name}</p>
            <p className="text-[10px] text-emerald-600/70">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <button onClick={onRemove} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors" type="button">
            <FiX className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-accent-400 dark:hover:border-accent-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-accent-50 dark:group-hover:bg-accent-950/20 transition-colors">
            <FiUpload className="w-5 h-5 text-slate-400 group-hover:text-accent-500 transition-colors" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 text-center">Click to upload</span>
          {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
          <input type="file" accept={accept} onChange={onFileChange} className="hidden" />
        </label>
      )}
    </FormInput>
  );

  return (
    <>
      <Helmet><title>Apply — {internship?.title || 'Internship'} — InternHub</title></Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-accent-500 mb-6 transition-colors">
          <FiArrowLeft className="h-3 w-3" /> Back
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
            Apply for {internship?.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{internship?.category} • {internship?.mode}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {steps.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = step === idx;
              const isCompleted = step > idx;
              return (
                <React.Fragment key={s.label}>
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                      isCompleted ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' :
                      isActive ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/20 text-accent-600' :
                      'border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}>
                      {isCompleted ? <FiCheck className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <span className={`hidden sm:block text-[11px] font-semibold transition-colors ${
                      isActive ? 'text-accent-600 dark:text-accent-400' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                    }`}>{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 rounded transition-colors duration-500 ${step > idx ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-accent-500 to-accent-600 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
          >
            {/* ── Step 0: Personal Information ── */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Personal Information</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">As per your ID Card / Bonafide Certificate</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Name of Student / Candidate" required error={errors.name} className="sm:col-span-2">
                    <input name="name" value={form.name} onChange={handleChange} placeholder="IN CAPS — AS PER ID CARD" className={`${inputClass} uppercase`} />
                  </FormInput>
                  <FormInput label="Roll No." required error={errors.rollNo}>
                    <input name="rollNo" value={form.rollNo} onChange={handleChange} placeholder="Your roll number" className={inputClass} />
                  </FormInput>
                  <FormInput label="Degree Pursuing" required error={errors.degree}>
                    <select name="degree" value={form.degree} onChange={handleChange} className={selectClass} style={selectStyle}>
                      <option value="">Select degree</option>
                      {DEGREE_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormInput>
                  <FormInput label="Department" required error={errors.department}>
                    <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Computer Science" className={inputClass} />
                  </FormInput>
                  <FormInput label="College Name" required error={errors.college}>
                    <input name="college" value={form.college} onChange={handleChange} placeholder="Your college / university" className={inputClass} />
                  </FormInput>
                  <FormInput label="Personal Mail Id" required error={errors.email}>
                    <input name="email" value={form.email} readOnly className={`${inputClass} bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed`} />
                  </FormInput>
                  <FormInput label="Mobile Number" required error={errors.phone}>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputClass} />
                  </FormInput>
                </div>
              </div>
            )}

            {/* ── Step 1: Address & Dates ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Address & Internship Details</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Your address and internship date preferences</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormInput label="Current Address" required error={errors.currentAddress} className="sm:col-span-2">
                    <textarea name="currentAddress" value={form.currentAddress} onChange={handleChange} rows={2} placeholder="Your current residential address" className={`${inputClass} resize-none`} />
                  </FormInput>
                  <FormInput label="Permanent Address" required error={errors.permanentAddress} className="sm:col-span-2">
                    <textarea name="permanentAddress" value={form.permanentAddress} onChange={handleChange} rows={2} placeholder="Your permanent address" className={`${inputClass} resize-none`} />
                  </FormInput>
                  <FormInput label="District" required error={errors.district}>
                    <input name="district" value={form.district} onChange={handleChange} placeholder="Your district" className={inputClass} />
                  </FormInput>
                  <FormInput label="State & Country" required error={errors.stateCountry}>
                    <input name="stateCountry" value={form.stateCountry} onChange={handleChange} placeholder="e.g. Tamil Nadu, India" className={inputClass} />
                  </FormInput>
                  <FormInput label="PIN Code" required error={errors.pinCode}>
                    <input name="pinCode" value={form.pinCode} onChange={handleChange} placeholder="e.g. 600001" maxLength={10} className={inputClass} />
                  </FormInput>
                  <div /> {/* Spacer */}
                  <FormInput label="Date of Joining" required error={errors.dateOfJoining}>
                    <input type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} className={inputClass} />
                  </FormInput>
                  <FormInput label="Date of Completion" required error={errors.dateOfCompletion}>
                    <input type="date" name="dateOfCompletion" value={form.dateOfCompletion} onChange={handleChange} className={inputClass} />
                  </FormInput>
                  <FormInput label="Domain of Internship" required error={errors.domain} className="sm:col-span-2">
                    <select name="domain" value={form.domain} onChange={handleChange} className={selectClass} style={selectStyle}>
                      <option value="">Select domain</option>
                      {DOMAIN_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </FormInput>
                </div>
              </div>
            )}

            {/* ── Step 2: Documents Upload ── */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Upload Documents</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Upload the required documents for verification</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FileUploadCard
                    label="Aadhar Card"
                    required
                    file={aadharCard}
                    onFileChange={handleFileChange(setAadharCard, 'aadharCard', 'all')}
                    onRemove={removeFile(setAadharCard)}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    fieldName="aadharCard"
                    hint="PDF or image, max 10MB"
                  />
                  <FileUploadCard
                    label="Passport Size Photo"
                    required
                    file={passportPhoto}
                    onFileChange={handleFileChange(setPassportPhoto, 'passportPhoto', 'image')}
                    onRemove={removeFile(setPassportPhoto)}
                    accept=".jpg,.jpeg,.png,.webp"
                    fieldName="passportPhoto"
                    hint="Image only, max 10MB"
                  />
                  <FileUploadCard
                    label="ID Card / Bonafide Certificate"
                    required
                    file={idCard}
                    onFileChange={handleFileChange(setIdCard, 'idCard', 'all')}
                    onRemove={removeFile(setIdCard)}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    fieldName="idCard"
                    hint="PDF or image, max 10MB"
                  />
                  <FileUploadCard
                    label="Resume"
                    required={false}
                    file={resume}
                    onFileChange={handleFileChange(setResume, 'resume', 'pdf')}
                    onRemove={removeFile(setResume)}
                    accept=".pdf"
                    fieldName="resume"
                    hint="PDF only, max 10MB"
                  />
                </div>
              </div>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">Review Your Application</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Please verify all details before submitting</p>
                </div>

                {/* Personal Info Review */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Personal Information</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      ['Name', form.name],
                      ['Roll No', form.rollNo],
                      ['Degree', form.degree],
                      ['Department', form.department],
                      ['College', form.college],
                      ['Email', form.email],
                      ['Mobile', form.phone],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                        <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-50 mt-0.5 truncate" title={value}>{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address & Dates Review */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Address & Internship Details</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      ['Current Address', form.currentAddress],
                      ['Permanent Address', form.permanentAddress],
                      ['District', form.district],
                      ['State & Country', form.stateCountry],
                      ['PIN Code', form.pinCode],
                      ['Date of Joining', form.dateOfJoining ? new Date(form.dateOfJoining).toLocaleDateString('en-IN') : 'N/A'],
                      ['Date of Completion', form.dateOfCompletion ? new Date(form.dateOfCompletion).toLocaleDateString('en-IN') : 'N/A'],
                      ['Domain', form.domain],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3">
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                        <p className="text-[11px] font-semibold text-slate-900 dark:text-slate-50 mt-0.5 truncate" title={value}>{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Review */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Uploaded Documents</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['Aadhar Card', aadharCard],
                      ['Passport Photo', passportPhoto],
                      ['ID Card / Bonafide', idCard],
                      ['Resume', resume],
                    ].map(([label, file]) => (
                      <div key={label} className={`rounded-lg p-3 ${file ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-slate-50 dark:bg-slate-950'}`}>
                        <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                        <p className={`text-[11px] font-semibold mt-0.5 truncate ${file ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {file ? file.name : 'Not uploaded'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          {step > 0 ? (
            <Button variant="outline" onClick={prevStep} icon={FiArrowLeft}>Previous</Button>
          ) : <div />}

          {step < 3 ? (
            <Button variant="primary" onClick={nextStep} icon={FiArrowRight}>Next</Button>
          ) : (
            <Button variant="primary" onClick={handleSubmit} loading={submitting} icon={FiCheck}>Submit Application</Button>
          )}
        </div>
      </div>
    </>
  );
};

export default ApplicationFormPage;

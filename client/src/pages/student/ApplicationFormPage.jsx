import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiUser, FiUpload, FiCheck, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { getInternshipDetail } from '../../api/internshipApi';
import { submitApplication } from '../../api/applicationApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { FullPageLoader } from '../../components/common/Loader';

const ApplicationFormPage = () => {
  const { id: internshipId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [internship, setInternship] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [resume, setResume] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    college: user?.college || '', department: user?.department || '',
    yearOfStudy: user?.yearOfStudy || '', skills: user?.skills?.join(', ') || '',
    joiningDate: '',
  });

  const yearOptions = [
    { value: '1st Year', label: '1st Year' }, { value: '2nd Year', label: '2nd Year' },
    { value: '3rd Year', label: '3rd Year' }, { value: '4th Year', label: '4th Year' },
    { value: 'Graduated', label: 'Graduated' }, { value: 'Other', label: 'Other' },
  ];

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getInternshipDetail(internshipId);
        if (res.success) setInternship(res.data);
      } catch (err) {
        toast.error('Failed to load internship details.');
        navigate('/internships');
      } finally {
        setPageLoading(false);
      }
    };
    fetch();
  }, [internshipId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') { toast.error('Only PDF files are allowed.'); return; }
      if (file.size > 5 * 1024 * 1024) { toast.error('File size must be under 5MB.'); return; }
      setResume(file);
    }
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!form.name || !form.email || !form.phone || !form.college || !form.department || !form.yearOfStudy) {
        toast.error('Please fill in all required fields.'); return false;
      }
    }
    return true;
  };

  const nextStep = () => { if (validateStep(step)) setStep(step + 1); };
  const prevStep = () => setStep(step - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('internship', internshipId);
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('college', form.college);
      formData.append('department', form.department);
      formData.append('yearOfStudy', form.yearOfStudy);
      if (form.joiningDate) formData.append('joiningDate', form.joiningDate);
      const skillsArray = form.skills.split(',').map((s) => s.trim()).filter(Boolean);
      skillsArray.forEach((s) => formData.append('skills[]', s));
      if (resume) formData.append('resume', resume);

      const res = await submitApplication(formData);
      if (res.success) {
        toast.success('Application submitted successfully!');
        navigate('/student/applications');
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('You have already submitted an application for this internship. Multiple submissions are not allowed.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) return <FullPageLoader message="Loading application form..." />;

  const steps = [
    { num: 1, label: 'Personal Info', icon: FiUser },
    { num: 2, label: 'Skills & Resume', icon: FiUpload },
    { num: 3, label: 'Review & Submit', icon: FiCheck },
  ];

  return (
    <>
      <Helmet><title>Apply — {internship?.title || 'Internship'} — InternHub</title></Helmet>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-accent-500 mb-6">
          <FiArrowLeft className="h-3 w-3" /> Back
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mb-1">
          Apply for {internship?.title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{internship?.category} • {internship?.mode}</p>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 ${step >= s.num ? 'text-accent-600 dark:text-accent-400' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  step >= s.num ? 'border-accent-500 bg-accent-50 dark:bg-accent-950/20' : 'border-slate-300 dark:border-slate-700'
                }`}>
                  {step > s.num ? <FiCheck className="h-4 w-4" /> : s.num}
                </div>
                <span className="hidden sm:block text-xs font-semibold">{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${step > s.num ? 'bg-accent-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6"
        >
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="name" label="Full Name" value={form.name} onChange={handleChange} required />
                <Input name="email" label="Email" type="email" value={form.email} onChange={handleChange} required />
                <Input name="phone" label="Phone" value={form.phone} onChange={handleChange} required />
                <Input name="college" label="College" value={form.college} onChange={handleChange} required />
                <Input name="department" label="Department" value={form.department} onChange={handleChange} required />
                <Input name="yearOfStudy" label="Year of Study" type="select" options={yearOptions} placeholder="Select" value={form.yearOfStudy} onChange={handleChange} required />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4">Skills & Resume</h2>
              <Input name="skills" label="Skills (comma-separated)" placeholder="React, Node.js, Python" value={form.skills} onChange={handleChange} />
              <Input name="joiningDate" label="Preferred Joining Date" type="date" value={form.joiningDate} onChange={handleChange} />

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Resume (PDF, max 5MB){' '}
                  <span className="text-[10px] font-normal text-slate-400/80 dark:text-slate-500/85">
                    (Optional)
                  </span>
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-accent-400 transition-colors">
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="resume-upload" />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <FiUpload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {resume ? <span className="text-accent-600 dark:text-accent-400 font-semibold">{resume.name}</span> : 'Click to upload your resume'}
                    </p>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4">Review Your Application</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  ['Name', form.name], ['Email', form.email], ['Phone', form.phone],
                  ['College', form.college], ['Department', form.department], ['Year', form.yearOfStudy],
                  ['Skills', form.skills || 'None specified'], ['Joining Date', form.joiningDate || 'Flexible'],
                  ['Resume', resume?.name || 'Not uploaded'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-50 mt-0.5 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          {step > 1 ? (
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

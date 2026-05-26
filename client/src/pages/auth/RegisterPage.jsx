import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiBookOpen, FiUserPlus, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { validateEmail, validatePassword } from '../../utils/validators';

const RegisterPage = () => {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', college: '', department: '', yearOfStudy: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const yearOptions = [
    { value: '1st Year', label: '1st Year' },
    { value: '2nd Year', label: '2nd Year' },
    { value: '3rd Year', label: '3rd Year' },
    { value: '4th Year', label: '4th Year' },
    { value: 'Graduated', label: 'Graduated' },
    { value: 'Other', label: 'Other' },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!validateEmail(form.email)) newErrors.email = 'Valid email is required';
    if (!validatePassword(form.password)) newErrors.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    const { confirmPassword, ...submitData } = form;
    const result = await register(submitData);
    setLoading(false);

    if (result?.success) {
      toast.success(result.message || 'Registration successful! Please verify your email.');
      navigate('/student/dashboard');
    } else {
      toast.error(result?.message || 'Registration failed');
    }
  };

  return (
    <>
      <Helmet><title>Create Account — InternHub</title></Helmet>

      <div className="min-h-screen flex">
        {/* Left Panel */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-accent-950 to-slate-950 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Start Your Journey with{' '}
              <span className="bg-gradient-to-r from-accent-400 to-secondary-400 bg-clip-text text-transparent">InternHub</span>
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Create your free account to apply for internships, track applications, and build your professional portfolio.
            </p>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-10 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-accent-500 transition-colors">
                <FiArrowLeft className="h-3.5 w-3.5" /> Back to Home
              </Link>
              <div className="text-center lg:hidden">
                <Link to="/">
                  <span className="text-2xl font-extrabold bg-gradient-to-r from-accent-500 to-secondary-500 bg-clip-text text-transparent">InternHub</span>
                </Link>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Create Account</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fill in your details to get started.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="name" label="Full Name" placeholder="John Doe" icon={FiUser} value={form.name} onChange={handleChange} error={errors.name} required />
                <Input name="email" label="Email" type="email" placeholder="john@example.com" icon={FiMail} value={form.email} onChange={handleChange} error={errors.email} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="password" label="Password" type="password" placeholder="Min 6 characters" icon={FiLock} value={form.password} onChange={handleChange} error={errors.password} required />
                <Input name="confirmPassword" label="Confirm Password" type="password" placeholder="Re-enter password" icon={FiLock} value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="phone" label="Phone" placeholder="9876543210" icon={FiPhone} value={form.phone} onChange={handleChange} />
                <Input name="college" label="College" placeholder="Your College" icon={FiBookOpen} value={form.college} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="department" label="Department" placeholder="Computer Science" value={form.department} onChange={handleChange} />
                <Input name="yearOfStudy" label="Year of Study" type="select" options={yearOptions} placeholder="Select Year" value={form.yearOfStudy} onChange={handleChange} />
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} icon={FiUserPlus}>
                Create Account
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700">Sign In</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiLogIn, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const LoginPage = () => {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (result?.success) {
      toast.success('Login successful!');
      const from = location.state?.from?.pathname || '/student/dashboard';
      navigate(from, { replace: true });
    } else {
      toast.error(result?.message || 'Login failed');
    }
  };

  return (
    <>
      <Helmet><title>Sign In — InternHub</title></Helmet>

      <div className="min-h-screen flex">
        {/* Left Panel — Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-accent-950 to-slate-950 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Welcome Back to{' '}
              <span className="bg-gradient-to-r from-accent-400 to-secondary-400 bg-clip-text text-transparent">
                InternHub
              </span>
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Sign in to track your applications, manage payments, and access your internship dashboard.
            </p>
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 bg-slate-50 dark:bg-slate-950">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
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

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Sign In</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your credentials to access your account.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <Input name="email" label="Email" type="email" placeholder="you@example.com" icon={FiMail} value={form.email} onChange={handleChange} error={errors.email} required />
              <Input name="password" label="Password" type="password" placeholder="••••••••" icon={FiLock} value={form.password} onChange={handleChange} error={errors.password} required />

              <div className="flex items-center justify-end">
                <Link to="/forgot-password" className="text-xs font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700">
                  Forgot Password?
                </Link>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} icon={FiLogIn}>
                Sign In
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700">
                Create one
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

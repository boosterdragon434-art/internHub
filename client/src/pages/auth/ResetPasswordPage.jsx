import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiLock } from 'react-icons/fi';
import { resetPasswordRequest } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await resetPasswordRequest(token, form.password);
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired reset token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Reset Password — InternHub</title></Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link to="/"><span className="text-2xl font-extrabold bg-gradient-to-r from-accent-500 to-secondary-500 bg-clip-text text-transparent">InternHub</span></Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">Set New Password</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter your new password below.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Input name="password" label="New Password" type="password" placeholder="Min 6 characters" icon={FiLock} value={form.password} onChange={handleChange} required />
              <Input name="confirmPassword" label="Confirm Password" type="password" placeholder="Re-enter password" icon={FiLock} value={form.confirmPassword} onChange={handleChange} required />
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
                Reset Password
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              <Link to="/login" className="font-semibold text-accent-600 dark:text-accent-400">Back to Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPasswordPage;

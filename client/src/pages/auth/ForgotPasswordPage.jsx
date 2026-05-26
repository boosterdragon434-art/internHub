import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiMail, FiSend } from 'react-icons/fi';
import { forgotPasswordRequest } from '../../api/authApi';
import { useToast } from '../../context/ToastContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ForgotPasswordPage = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email.'); return; }
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      setSent(true);
      toast.success('If that email exists, a reset link has been sent.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>Forgot Password — InternHub</title></Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-6">
            <Link to="/"><span className="text-2xl font-extrabold bg-gradient-to-r from-accent-500 to-secondary-500 bg-clip-text text-transparent">InternHub</span></Link>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">Forgot Password</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Enter your email and we'll send a reset link.</p>

            {sent ? (
              <div className="mt-6 text-center">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-full inline-block text-emerald-600 dark:text-emerald-400 mb-3">
                  <FiMail className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Check your email</p>
                <p className="text-xs text-slate-500 mt-1">A password reset link has been sent to <strong>{email}</strong></p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <Input name="email" label="Email" type="email" placeholder="you@example.com" icon={FiMail} value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} icon={FiSend}>
                  Send Reset Link
                </Button>
              </form>
            )}

            <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              <Link to="/login" className="font-semibold text-accent-600 dark:text-accent-400">Back to Sign In</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;

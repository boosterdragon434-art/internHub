import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { verifyEmailToken } from '../../api/authApi';
import { FullPageLoader } from '../../components/common/Loader';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await verifyEmailToken(token);
        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired verification token.');
      }
    };
    if (token) verify();
  }, [token]);

  if (status === 'loading') return <FullPageLoader message="Verifying your email..." />;

  return (
    <>
      <Helmet><title>Email Verification — InternHub</title></Helmet>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-sm">
          {status === 'success' ? (
            <>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-full inline-block text-emerald-600 dark:text-emerald-400 mb-4">
                <FiCheckCircle className="h-10 w-10" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">Email Verified!</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
              <Link to="/login" className="mt-6 inline-block px-6 py-2.5 bg-accent-600 text-white text-sm font-bold rounded-xl hover:bg-accent-700 transition-colors shadow-sm">
                Sign In
              </Link>
            </>
          ) : (
            <>
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-full inline-block text-rose-600 dark:text-rose-400 mb-4">
                <FiXCircle className="h-10 w-10" />
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">Verification Failed</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
              <Link to="/register" className="mt-6 inline-block px-6 py-2.5 bg-accent-600 text-white text-sm font-bold rounded-xl hover:bg-accent-700 transition-colors shadow-sm">
                Register Again
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;

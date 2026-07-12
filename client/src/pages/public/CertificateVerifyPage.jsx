import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiAlertOctagon, FiAward, FiArrowLeft, FiShield, FiFileText, FiExternalLink } from 'react-icons/fi';
import { verifyCertificate } from '../../api/certificateApi';

/**
 * CertificateVerifyPage Component — Public validation board for recruiter lookup.
 */
const CertificateVerifyPage = () => {
  const { certificateId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    const performVerification = async () => {
      try {
        const response = await verifyCertificate(certificateId);
        if (active && response.data?.success) {
          setData(response.data.data);
        }
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Verification lookup failed');
      } finally {
        if (active) setLoading(false);
      }
    };
    performVerification();
    return () => {
      active = false;
    };
  }, [certificateId]);

  return (
    <div className="min-h-screen bg-[#030014] text-slate-100 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-violet-500/30">
      <Helmet>
        <title>Credential Authentication Board — InternHub</title>
      </Helmet>

      {/* Animated Background Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.3, 0.15],
          x: [0, 50, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-violet-600/30 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.1, 0.25, 0.1],
          x: [0, -50, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-fuchsia-600/20 rounded-full blur-[130px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl relative z-10 my-8"
      >
        {/* Main Glass Card */}
        <div className="backdrop-blur-2xl bg-white/[0.02] border border-white/[0.08] rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden relative">
          
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

          {/* Header Section */}
          <div className="relative p-8 md:p-10 border-b border-white/[0.05]">
            <div className="flex flex-col items-center text-center space-y-5">
              <Link to="/" className="group relative inline-flex items-center gap-3">
                <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full group-hover:bg-violet-500/40 transition-all duration-500" />
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 relative transform group-hover:scale-105 transition-transform duration-300">
                  <FiShield className="text-white w-7 h-7" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  InternHub
                </h1>
              </Link>
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/40 border border-white/10 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                <span className="text-[10px] sm:text-xs font-bold text-slate-300 tracking-[0.25em] uppercase">
                  Authentication Board
                </span>
              </div>
            </div>
          </div>

          <div className="relative p-8 md:p-10">
            {loading ? (
              <div className="flex flex-col justify-center items-center py-24 space-y-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <FiShield className="absolute inset-0 m-auto w-6 h-6 text-violet-500/50 animate-pulse" />
                </div>
                <p className="text-slate-400 text-sm font-bold tracking-widest uppercase animate-pulse">Verifying Cryptography...</p>
              </div>
            ) : error || !data ? (
              /* Error View */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 py-12">
                <div className="relative w-28 h-28 mx-auto">
                  <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full" />
                  <div className="relative w-full h-full bg-rose-950/50 border border-rose-500/30 rounded-3xl flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-900/50">
                    <FiAlertOctagon className="w-12 h-12" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-3">Invalid Credential</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    {error || 'This certificate record does not exist or has been revoked by administrators. It cannot be cryptographically verified.'}
                  </p>
                </div>
                <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95">
                  <FiArrowLeft /> Return to Home
                </Link>
              </motion.div>
            ) : data.status === 'revoked' ? (
              /* Revoked View */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 py-12">
                <div className="relative w-28 h-28 mx-auto">
                  <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full" />
                  <div className="relative w-full h-full bg-rose-950/50 border border-rose-500/30 rounded-[2.5rem] flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-900/50 transform rotate-12">
                    <FiAlertOctagon className="w-12 h-12 -rotate-12" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-rose-400 mb-3 drop-shadow-[0_0_15px_rgba(244,63,94,0.3)]">Revoked Credential</h2>
                  <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                    Warning: The certificate ID <strong className="text-white font-mono">{data.certificateId}</strong> has been permanently revoked. This credential is no longer valid or recognized.
                  </p>
                </div>
                <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-sm font-bold text-rose-400 transition-all hover:scale-105 active:scale-95">
                  <FiArrowLeft /> Return to Home
                </Link>
              </motion.div>
            ) : (
              /* Secure Verified View */
              <div className="space-y-10">
                {/* Verified Header Badge */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
                  className="relative group overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-400/20 to-emerald-500/10 opacity-70" />
                  
                  {/* Animated Shine Effect */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />

                  <div className="relative p-6 border border-emerald-500/30 rounded-2xl flex items-center gap-5 bg-emerald-950/40 backdrop-blur-md">
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      <FiCheckCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <span className="block text-[11px] uppercase font-bold tracking-[0.25em] text-emerald-500/90 mb-1.5">Network Status</span>
                      <span className="block text-base sm:text-lg font-black uppercase tracking-widest text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
                        Securely Verified Credential
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Data Grid */}
                <motion.div 
                  initial="hidden" animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                >
                  {[
                    { label: 'STUDENT NAME', value: data.studentName, icon: FiAward },
                    { label: 'CREDENTIAL ID', value: data.certificateId, icon: FiShield },
                    { label: 'INTERNSHIP PROGRAM', value: data.internshipTitle, icon: FiFileText },
                    { label: 'PROGRAM GRADE', value: `Grade ${data.grade}`, icon: FiAward },
                    { label: 'DURATION', value: data.duration, icon: FiCheckCircle },
                    { label: 'COMPLETION DATE', value: new Date(data.completionDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }), icon: FiCheckCircle },
                  ].map((item, idx) => (
                    <motion.div 
                      key={idx}
                      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                      className="group relative p-5 rounded-2xl bg-black/20 border border-white/[0.05] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 overflow-hidden shadow-inner"
                    >
                      <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-rotate-12 duration-500">
                        <item.icon className="w-16 h-16 text-white" />
                      </div>
                      <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mb-2">{item.label}</span>
                      <span className="block font-black text-white text-lg tracking-tight relative z-10">{item.value}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* SHA-256 Hash */}
                {data.verificationHash && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                    className="p-5 rounded-2xl bg-black/40 border border-white/[0.05] relative overflow-hidden group"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-indigo-500 opacity-80" />
                    <span className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mb-3 pl-3">
                      <FiShield className="w-4 h-4 text-violet-400" /> SHA-256 Cryptographic Signature
                    </span>
                    <div className="ml-3 p-3.5 rounded-xl bg-[#050505] border border-white/[0.03] group-hover:border-violet-500/30 transition-colors shadow-inner">
                      <span className="block font-mono text-slate-400 group-hover:text-slate-200 transition-colors text-[10px] sm:text-xs break-all leading-relaxed">
                        {data.verificationHash}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Skills */}
                {data.skillsAcquired && data.skillsAcquired.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                  >
                    <span className="block text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.2em] mb-4 pl-1">
                      Verified Competencies
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {data.skillsAcquired.map((s, idx) => (
                        <span 
                          key={idx} 
                          className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-300 font-bold hover:bg-white/[0.08] hover:-translate-y-1 transition-all cursor-default shadow-sm hover:shadow-violet-500/20 hover:text-white"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                  className="flex flex-col-reverse sm:flex-row items-center justify-between gap-6 pt-8 border-t border-white/[0.08] mt-10"
                >
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-white transition-colors py-2 group"
                  >
                    <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
                  </Link>

                  {data.pdfUrl && data.status !== 'revoked' && (
                    <a
                      href={data.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#030014] font-black text-sm rounded-xl overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-200 via-white to-fuchsia-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative z-10 flex items-center gap-2 tracking-widest">
                        <FiExternalLink className="w-4 h-4" /> 
                        VIEW {
                          {
                            certificate: 'CERTIFICATE',
                            offer_letter: 'OFFER LETTER',
                            joining_letter: 'JOINING LETTER',
                            completion_letter: 'COMPLETION LETTER',
                            appreciation_letter: 'APPRECIATION LETTER',
                            custom: 'DOCUMENT',
                          }[data.documentType] || 'CERTIFICATE'
                        }
                      </span>
                    </a>
                  )}
                </motion.div>
              </div>
            )}
          </div>
          
          {/* Footer Ribbon */}
          {data && data.status !== 'revoked' && (
            <div className="bg-black/20 border-t border-white/[0.05] p-5 text-center backdrop-blur-md">
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                <FiShield className="inline-block w-3 h-3 mr-1.5 text-slate-600" />
                This credential is cryptographically secured and verifiable on the InternHub network.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CertificateVerifyPage;

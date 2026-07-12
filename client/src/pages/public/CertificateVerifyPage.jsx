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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <Helmet>
        <title>Credential Authentication Board — InternHub</title>
      </Helmet>

      {/* Decorative blurry backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-card bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Top Logo branding */}
        <div className="text-center mb-6">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-white inline-flex items-center gap-2">
            <FiShield className="text-violet-500 w-5 h-5 animate-pulse" /> InternHub
          </Link>
          <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
            Credential Authentication Board
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error || !data ? (
          /* Error Invalid View */
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
              <FiAlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-500">Invalid Credential</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                {error || 'This certificate record does not exist or has been revoked by administrators.'}
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
              >
                <FiArrowLeft className="w-3.5 h-3.5" /> Back to home
              </Link>
            </div>
          </div>
        ) : data.status === 'revoked' ? (
          /* Revoked View */
          <div className="text-center space-y-4 py-6">
            <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-center text-rose-500 mx-auto">
              <FiAlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-rose-500">Revoked Credential</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Warning: The certificate ID <strong>{data.certificateId}</strong> has been revoked. This credential is no longer valid.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
              >
                <FiArrowLeft className="w-3.5 h-3.5" /> Back to home
              </Link>
            </div>
          </div>
        ) : (
          /* Secure Verified View */
          <div className="space-y-6">
            {/* Verified Header Badge */}
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center gap-3">
              <FiCheckCircle className="w-6 h-6 shrink-0" />
              <div>
                <span className="block text-[9px] uppercase font-bold tracking-widest text-slate-400">Status</span>
                <span className="block text-xs font-bold uppercase tracking-wider">Securely Verified Credential</span>
              </div>
            </div>

            {/* Credential Data Metadata */}
            <div className="space-y-4 bg-slate-950/40 p-5 border border-slate-800 rounded-2xl text-xs select-text">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-slate-500 font-semibold mb-0.5">STUDENT NAME</span>
                  <span className="block font-bold text-slate-200 text-sm">{data.studentName}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold mb-0.5">CREDENTIAL ID</span>
                  <span className="block font-bold text-slate-200 text-sm">{data.certificateId}</span>
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-slate-500 font-semibold mb-0.5">INTERNSHIP program</span>
                  <span className="block font-bold text-slate-200">{data.internshipTitle}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold mb-0.5">PROGRAM GRADE</span>
                  <span className="block font-bold text-slate-200">Grade {data.grade}</span>
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-slate-500 font-semibold mb-0.5">DURATION</span>
                  <span className="block font-bold text-slate-200">{data.duration}</span>
                </div>
                <div>
                  <span className="block text-slate-500 font-semibold mb-0.5">COMPLETION DATE</span>
                  <span className="block font-bold text-slate-200">
                    {new Date(data.completionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {data.verificationHash && (
                <>
                  <div className="h-px bg-slate-800" />
                  <div>
                    <span className="block text-slate-500 font-semibold mb-0.5 flex items-center gap-1"><FiShield className="w-3 h-3"/> SHA-256 SIGNATURE</span>
                    <span className="block font-mono text-slate-400 text-[9px] break-all">
                      {data.verificationHash}
                    </span>
                  </div>
                </>
              )}

              {data.skillsAcquired && data.skillsAcquired.length > 0 && (
                <>
                  <div className="h-px bg-slate-800" />
                  <div>
                    <span className="block text-slate-500 font-semibold mb-1.5">SKILLS VERIFIED</span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.skillsAcquired.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Document Type Label */}
            {data.documentType && (
              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  {{
                    certificate: 'Internship Certificate',
                    offer_letter: 'Offer Letter',
                    joining_letter: 'Joining Letter',
                    completion_letter: 'Completion Letter',
                    appreciation_letter: 'Appreciation Letter',
                    custom: 'Document',
                  }[data.documentType] || 'Certificate'}
                </span>
              </div>
            )}

            {/* View / Download Certificate PDF */}
            {data.pdfUrl && data.status !== 'revoked' && (
              <div className="flex justify-center">
                <a
                  href={data.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition"
                >
                  <FiExternalLink className="w-4 h-4" /> View Certificate PDF
                </a>
              </div>
            )}

            {/* Verification Seal Info */}
            <p className="text-[10px] text-slate-500 text-center leading-relaxed max-w-xs mx-auto">
              This credential has been securely stamped and signed. It corresponds to an verified database record issued by InternHub Administrators.
            </p>

            {/* Back button */}
            <div className="pt-4 border-t border-slate-800 flex justify-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition"
              >
                <FiArrowLeft className="w-3.5 h-3.5" /> Back to home
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CertificateVerifyPage;

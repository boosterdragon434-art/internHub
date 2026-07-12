import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiAward, FiDownload, FiExternalLink, FiAward as FiBadgeIcon } from 'react-icons/fi';
import { getMyCertificates, downloadCertificate } from '../../api/certificateApi';
import { toast } from 'react-hot-toast';
import EmptyState from '../../components/common/EmptyState';
import EnrollmentGate from '../../components/common/EnrollmentGate';

/**
 * Human-readable document type labels for certificate cards.
 */
const DOCUMENT_TYPE_LABELS = {
  certificate: 'Internship Certificate',
  offer_letter: 'Offer Letter',
  joining_letter: 'Joining Letter',
  completion_letter: 'Completion Letter',
  appreciation_letter: 'Appreciation Letter',
  custom: 'Document',
};

/**
 * MyCertificatesPage Component — Grid of certificates for students to view or download.
 * Gated behind active enrollment.
 */
const MyCertificatesPage = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const response = await getMyCertificates();
      if (response.data?.success) {
        setCertificates(response.data.data);
      }
    } catch (err) {
      toast.error('Failed to load certificates portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnrollmentGate featureName="Certificates">
      <div className="space-y-6">
        <Helmet>
          <title>My Professional Credentials — InternHub</title>
        </Helmet>

        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <FiAward className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
                My Professional Credentials
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Access, showcase, and download your verified completion certificates for completed internships.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : certificates.length > 0 ? (
          /* Grid of Credentials */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <motion.div
                key={cert._id}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col space-y-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top Row: Medal & Badge */}
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                    <FiBadgeIcon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/30">
                    Verified issued
                  </span>
                </div>

                {/* Title & Internship */}
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-50 text-base line-clamp-1">
                    {cert.internshipTitle}
                  </h3>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                    {DOCUMENT_TYPE_LABELS[cert.documentType] || 'Internship Certificate'}
                  </span>
                </div>

                {/* Grid Attributes */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/50 p-3 border border-slate-100 dark:border-slate-800/60 rounded-xl text-xs">
                  <div>
                    <span className="block text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Performance</span>
                    <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5">Grade {cert.grade}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Issued On</span>
                    <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {new Date(cert.completionDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex justify-between gap-3 pt-2">
                  <a
                    href={cert.verificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <FiExternalLink className="w-3.5 h-3.5" /> Verify Portal
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        const response = await downloadCertificate(cert._id);
                        const blob = new Blob([response.data], { type: 'application/pdf' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Certificate_${cert.certificateId}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        window.URL.revokeObjectURL(url);
                      } catch (err) {
                        toast.error('Failed to download certificate. Try again later.');
                      }
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-500 hover:to-brand-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-md shadow-brand-600/10"
                  >
                    <FiDownload className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiAward}
            title="No Certificates Issued Yet"
            description="Your verified completion certificates will be generated here by administrators once you successfully complete your active internship sync and payment requirements."
          />
        )}
      </div>
    </EnrollmentGate>
  );
};

export default MyCertificatesPage;

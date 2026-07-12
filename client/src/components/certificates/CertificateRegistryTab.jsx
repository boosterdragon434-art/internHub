import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  FiSearch, FiDownload, FiEye, FiSlash, FiChevronLeft, FiChevronRight,
  FiAward, FiCheckCircle, FiXCircle, FiTrendingUp,
} from 'react-icons/fi';
import { getAllCertificates, getCertificateStats, revokeCertificate, downloadCertificate } from '../../api/certificateApi';
import ConfirmDialog from '../common/ConfirmDialog';
import { Spinner } from '../common/Loader';

/**
 * Status badge styling map — consistent visual language across the registry.
 */
const STATUS_META = {
  issued: { label: 'Issued', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' },
  revoked: { label: 'Revoked', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' },
  draft: { label: 'Draft', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20' },
};

/**
 * Human-readable labels for all certificate/document types issued by the system.
 */
const DOCUMENT_TYPE_LABELS = {
  certificate: 'Certificate',
  offer_letter: 'Offer Letter',
  joining_letter: 'Joining Letter',
  completion_letter: 'Completion Letter',
  appreciation_letter: 'Appreciation Letter',
  custom: 'Custom Document',
};

const PAGE_SIZE = 20;

/**
 * CertificateRegistryTab — full admin visibility over every certificate/document
 * ever issued: search, filter, view, download, and standalone revoke (previously
 * only reachable bundled inside re-issuance).
 */
const CertificateRegistryTab = () => {
  const [stats, setStats] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');

  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const [viewingId, setViewingId] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await getCertificateStats();
      if (res.data?.success) setStats(res.data.data);
    } catch (err) {
      console.error('Failed to load certificate stats', err);
    }
  }, []);

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (documentTypeFilter !== 'all') params.documentType = documentTypeFilter;

      const res = await getAllCertificates(params);
      if (res.data?.success) {
        setCertificates(res.data.data);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load certificate registry');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, documentTypeFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchCertificates(); }, [fetchCertificates]);

  // Reset to page 1 whenever a filter changes
  useEffect(() => { setPage(1); }, [search, statusFilter, documentTypeFilter]);

  /**
   * Opens the certificate PDF in a new browser tab via a temporary blob URL.
   */
  const handleView = async (cert) => {
    setViewingId(cert._id);
    try {
      const res = await downloadCertificate(cert._id);
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      // Release the object URL after the new tab has had a chance to load it.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch (err) {
      toast.error('Failed to open certificate PDF');
    } finally {
      setViewingId(null);
    }
  };

  /**
   * Downloads the certificate PDF as a file using a programmatic anchor click.
   */
  const handleDownload = async (cert) => {
    try {
      const res = await downloadCertificate(cert._id);
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Certificate_${cert.certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error('Failed to download certificate PDF');
    }
  };

  /**
   * Executes the revocation after admin confirms via ConfirmDialog.
   */
  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await revokeCertificate(revokeTarget._id, revokeReason.trim());
      if (res.data?.success) {
        toast.success('Certificate revoked');
        setCertificates((prev) => prev.map((c) => (c._id === revokeTarget._id ? res.data.data : c)));
        fetchStats();
        setRevokeTarget(null);
        setRevokeReason('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke certificate');
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Issued', value: stats?.total ?? '—', icon: FiAward, tone: 'text-violet-500 dark:text-violet-400' },
          { label: 'Active', value: stats?.issued ?? '—', icon: FiCheckCircle, tone: 'text-emerald-500 dark:text-emerald-400' },
          { label: 'Revoked', value: stats?.revoked ?? '—', icon: FiXCircle, tone: 'text-rose-500 dark:text-rose-400' },
          { label: 'This Month', value: stats?.issuedThisMonth ?? '—', icon: FiTrendingUp, tone: 'text-amber-500 dark:text-amber-400' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 bg-white/80 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800/60">
            <Icon className={`w-4 h-4 shrink-0 ${tone}`} />
            <div className="min-w-0">
              <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider truncate">{label}</span>
              <span className="block text-lg font-bold text-slate-800 dark:text-slate-100">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/20">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by student, internship, or certificate ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="issued">Issued</option>
          <option value="revoked">Revoked</option>
        </select>
        <select
          value={documentTypeFilter}
          onChange={(e) => setDocumentTypeFilter(e.target.value)}
          className="px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
        >
          <option value="all">All Document Types</option>
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider">
                <th className="p-4">Student</th>
                <th className="p-4">Document</th>
                <th className="p-4">Internship</th>
                <th className="p-4">Certificate ID</th>
                <th className="p-4">Issued</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-sm text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center"><Spinner size="lg" /></td></tr>
              ) : certificates.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-500 dark:text-slate-400">No certificates match these filters.</td></tr>
              ) : (
                certificates.map((cert) => {
                  const statusMeta = STATUS_META[cert.status] || STATUS_META.issued;
                  return (
                    <tr key={cert._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-200">{cert.studentName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{cert.student?.email}</div>
                      </td>
                      <td className="p-4 text-xs">{DOCUMENT_TYPE_LABELS[cert.documentType] || 'Certificate'}</td>
                      <td className="p-4 text-xs truncate max-w-[180px]">{cert.internshipTitle}</td>
                      <td className="p-4 text-xs font-mono text-slate-500 dark:text-slate-400">{cert.certificateId}</td>
                      <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                        {cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusMeta.badge}`}>
                          {statusMeta.label}
                        </span>
                        {cert.status === 'revoked' && cert.revokeReason && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[160px] truncate" title={cert.revokeReason}>
                            {cert.revokeReason}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleView(cert)}
                            disabled={viewingId === cert._id}
                            className="p-2 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition disabled:opacity-50"
                            title="View PDF"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownload(cert)}
                            className="p-2 text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-500/10 rounded-lg transition"
                            title="Download PDF"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                          {cert.status === 'issued' && (
                            <button
                              onClick={() => setRevokeTarget(cert)}
                              className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title="Revoke certificate"
                            >
                              <FiSlash className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Revoke confirmation with optional reason */}
      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => { setRevokeTarget(null); setRevokeReason(''); }}
        onConfirm={handleConfirmRevoke}
        loading={revoking}
        title={`Revoke certificate for ${revokeTarget?.studentName || ''}?`}
        description="This marks the certificate as revoked immediately. The public verification page will show it as revoked, and the PDF link will no longer be presented as valid. This cannot be undone from here (re-issuing creates a new certificate)."
        confirmText="Revoke Certificate"
        variant="danger"
      >
        <textarea
          rows={2}
          placeholder="Reason for revocation (optional, shown in the admin registry)..."
          value={revokeReason}
          onChange={(e) => setRevokeReason(e.target.value)}
          className="w-full mt-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none"
        />
      </ConfirmDialog>
    </div>
  );
};

export default CertificateRegistryTab;

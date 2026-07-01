import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiDownload, FiCheckCircle, FiXCircle, FiImage, FiX } from 'react-icons/fi';
import { getAllPayments, exportPaymentsCsv, adminVerifyPayment } from '../../api/paymentApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';
import { formatDate, formatCurrency } from '../../utils/formatters';

const AdminPaymentsPage = () => {
  const toast = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');

  // Rejection Modal State
  const [rejectingPayment, setRejectingPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState(null);

  const statusOptions = [
    { value: 'paid', label: 'Paid' }, { value: 'pending_verification', label: 'Pending Verification' },
    { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' },
  ];

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await getAllPayments(params);
      if (res.success) {
        setPayments(res.data);
        if (res.pagination) setPagination((p) => ({ ...p, totalPages: res.pagination.totalPages }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, pagination.page]);

  const handleExport = async () => {
    try {
      const blob = await exportPaymentsCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'payments.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (err) { toast.error('Export failed.'); }
  };

  const handleApprove = async (paymentId) => {
    try {
      setActionLoading(true);
      const res = await adminVerifyPayment(paymentId, 'approve');
      if (res.success) {
        toast.success(`Payment approved successfully.`);
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to approve payment.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingPayment) return;

    try {
      setActionLoading(true);
      const res = await adminVerifyPayment(rejectingPayment._id, 'reject', rejectionReason);
      if (res.success) {
        toast.success(`Payment rejected successfully.`);
        setRejectingPayment(null);
        setRejectionReason('');
        fetchPayments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to reject payment.`);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { header: 'Student', render: (r) => <span className="font-bold text-slate-900 dark:text-slate-50">{r.user?.name || 'N/A'}</span> },
    { header: 'Email', render: (r) => r.user?.email || 'N/A' },
    { header: 'Internship', render: (r) => r.internship?.title || 'N/A' },
    { header: 'Amount', render: (r) => <span className="font-bold">{formatCurrency(r.amount)}</span> },
    { header: 'UTR No.', render: (r) => <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{r.utrNumber || 'N/A'}</span> },
    { 
      header: 'Receipt', 
      render: (r) => r.receiptUrl ? (
        <button 
          onClick={() => setViewingReceipt(r.receiptUrl)}
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md transition-colors"
          title="View Receipt"
        >
          <FiImage className="w-5 h-5" />
        </button>
      ) : (
        <span className="text-xs text-slate-400">None</span>
      )
    },
    { header: 'Status', render: (r) => <Badge status={r.status} type="payment" /> },
    { header: 'Date', render: (r) => formatDate(r.paidAt || r.createdAt) },
    { 
      header: 'Actions', 
      render: (r) => r.status === 'pending_verification' ? (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" icon={FiCheckCircle} onClick={() => handleApprove(r._id)} disabled={actionLoading}>Approve</Button>
          <Button variant="danger" size="sm" icon={FiXCircle} onClick={() => { setRejectingPayment(r); setRejectionReason(''); }} disabled={actionLoading}>Reject</Button>
        </div>
      ) : null 
    }
  ];

  return (
    <>
      <Helmet><title>Payments — InternHub Admin</title></Helmet>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Payment Records</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and export payment transaction history.</p>
        </div>
        <Button variant="outline" icon={FiDownload} onClick={handleExport}>Export CSV</Button>
      </div>

      <SearchFilter
        searchPlaceholder="Filter payments..." searchValue="" onSearchChange={() => {}}
        filters={[{ name: 'status', value: statusFilter, onChange: setStatusFilter, options: statusOptions, placeholder: 'All Statuses' }]}
        className="mb-4"
      />

      <DataTable columns={columns} data={payments} loading={loading} emptyTitle="No payments found" rowKey="_id" />
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))} className="mt-4" />

      {/* Reject Payment Modal */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4">Reject Payment</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Rejecting UTR: <strong className="font-mono">{rejectingPayment.utrNumber}</strong> from {rejectingPayment.user?.name}
            </p>
            
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Rejection <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR doesn't match, invalid amount, screenshot is blurry..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none h-24"
                  maxLength={500}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setRejectingPayment(null)} disabled={actionLoading}>Cancel</Button>
                <Button type="submit" variant="danger" loading={actionLoading} icon={FiXCircle}>Reject Payment</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Receipt Modal */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewingReceipt(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setViewingReceipt(null)}
              className="absolute -top-12 right-0 p-2 text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
            <img 
              src={viewingReceipt} 
              alt="Payment Receipt" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPaymentsPage;

import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiDownload, FiCheckCircle, FiXCircle } from 'react-icons/fi';
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

  const statusOptions = [
    { value: 'paid', label: 'Paid' }, { value: 'pending_verification', label: 'Pending Verification' },
    { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' },
  ];

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
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

  const handleVerify = async (paymentId, action) => {
    try {
      const res = await adminVerifyPayment(paymentId, action);
      if (res.success) {
        toast.success(`Payment ${action}d successfully.`);
        setPayments((prev) => prev.map((p) => (p._id === paymentId ? { ...p, status: res.data.status } : p)));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} payment.`);
    }
  };

  const columns = [
    { header: 'Student', render: (r) => <span className="font-bold text-slate-900 dark:text-slate-50">{r.user?.name || 'N/A'}</span> },
    { header: 'Email', render: (r) => r.user?.email || 'N/A' },
    { header: 'Internship', render: (r) => r.internship?.title || 'N/A' },
    { header: 'Amount', render: (r) => <span className="font-bold">{formatCurrency(r.amount)}</span> },
    { header: 'UTR No.', render: (r) => <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{r.utrNumber || 'N/A'}</span> },
    { header: 'Status', render: (r) => <Badge status={r.status} type="payment" /> },
    { header: 'Date', render: (r) => formatDate(r.paidAt || r.createdAt) },
    { 
      header: 'Actions', 
      render: (r) => r.status === 'pending_verification' ? (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" icon={FiCheckCircle} onClick={() => handleVerify(r._id, 'approve')}>Approve</Button>
          <Button variant="danger" size="sm" icon={FiXCircle} onClick={() => handleVerify(r._id, 'reject')}>Reject</Button>
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
    </>
  );
};

export default AdminPaymentsPage;

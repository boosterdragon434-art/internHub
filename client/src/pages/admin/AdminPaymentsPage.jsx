import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiDownload, FiCreditCard } from 'react-icons/fi';
import { getAllPayments, exportPaymentsCsv } from '../../api/paymentApi';
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
    { value: 'paid', label: 'Paid' }, { value: 'created', label: 'Pending' },
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

  const columns = [
    { header: 'Student', render: (r) => <span className="font-bold text-slate-900 dark:text-slate-50">{r.user?.name || 'N/A'}</span> },
    { header: 'Email', render: (r) => r.user?.email || 'N/A' },
    { header: 'Internship', render: (r) => r.internship?.title || 'N/A' },
    { header: 'Amount', render: (r) => <span className="font-bold">{formatCurrency(r.amount)}</span> },
    { header: 'Status', render: (r) => <Badge status={r.status} type="payment" /> },
    { header: 'Date', render: (r) => formatDate(r.paidAt || r.createdAt) },
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

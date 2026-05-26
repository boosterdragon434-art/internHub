import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiDownload } from 'react-icons/fi';
import { getAllApplications, updateApplicationStatus, assignPaymentAmount, performBulkAction, exportApplicationsCsv } from '../../api/applicationApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import SearchFilter from '../../components/common/SearchFilter';
import Pagination from '../../components/common/Pagination';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';

const AdminApplicationsPage = () => {
  const toast = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const debouncedSearch = useDebounce(search, 400);

  const [detailModal, setDetailModal] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', adminNotes: '' });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    'Applied', 'Under Review', 'Approved', 'Rejected', 'Payment Pending', 'Payment Completed', 'Joined',
  ].map((s) => ({ value: s, label: s }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const res = await getAllApplications(params);
      if (res.success) {
        setApps(res.data);
        if (res.pagination) setPagination((p) => ({ ...p, totalPages: res.pagination.totalPages }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [debouncedSearch, statusFilter, pagination.page]);

  const handleStatusUpdate = async () => {
    if (!statusForm.status) { toast.error('Select a status.'); return; }
    setSaving(true);
    try {
      if (statusForm.status === 'Approved' && Number(paymentAmount) > 0) {
        // Dynamic pricing assignment: sets status to Payment Pending and assigns cost
        await assignPaymentAmount(detailModal._id, Number(paymentAmount));
        toast.success('Application approved and payment request sent!');
      } else {
        // Standard status updates (e.g. Free Approved, Under Review, Joined, Rejected)
        await updateApplicationStatus(detailModal._id, statusForm.status, statusForm.adminNotes);
        toast.success('Status updated successfully!');
      }
      setDetailModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally { setSaving(false); }
  };

  const handleBulk = async (action) => {
    if (selectedIds.length === 0) { toast.error('Select at least one application.'); return; }
    try {
      await performBulkAction(selectedIds, action);
      toast.success(`Bulk ${action} completed.`);
      setSelectedIds([]);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Bulk action failed.'); }
  };

  const handleExport = async () => {
    try {
      const blob = await exportApplicationsCsv({ status: statusFilter });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'applications.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (err) { toast.error('Export failed.'); }
  };

  const columns = [
    { header: 'Name', render: (r) => <span className="font-bold text-slate-900 dark:text-slate-50">{r.name}</span> },
    { header: 'Email', key: 'email' },
    { header: 'Internship', render: (r) => r.internship?.title || 'N/A' },
    { header: 'Status', render: (r) => <Badge status={r.status} /> },
    { header: 'Applied', render: (r) => formatDate(r.createdAt) },
    { header: 'Actions', render: (r) => (
      <Button size="sm" variant="outline" onClick={() => { setDetailModal(r); setStatusForm({ status: r.status, adminNotes: r.adminNotes || '' }); setPaymentAmount(r.assignedPaymentAmount || ''); }}>
        View
      </Button>
    )},
  ];

  return (
    <>
      <Helmet><title>Applications — InternHub Admin</title></Helmet>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Manage Applications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review, approve, and manage student applications.</p>
        </div>
        <Button variant="outline" icon={FiDownload} onClick={handleExport}>Export CSV</Button>
      </div>

      <SearchFilter
        searchPlaceholder="Search by name, email, college..."
        searchValue={search} onSearchChange={setSearch}
        filters={[{ name: 'status', value: statusFilter, onChange: setStatusFilter, options: statusOptions, placeholder: 'All Statuses' }]}
        className="mb-4"
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{selectedIds.length} selected</span>
          <Button size="sm" variant="primary" onClick={() => handleBulk('approve')}>Approve</Button>
          <Button size="sm" variant="danger" onClick={() => handleBulk('reject')}>Reject</Button>
          <Button size="sm" variant="outline" onClick={() => handleBulk('under_review')}>Under Review</Button>
        </div>
      )}

      <DataTable
        columns={columns} data={apps} loading={loading} rowKey="_id"
        selectedIds={selectedIds}
        onSelectAll={(checked) => setSelectedIds(checked ? apps.map((a) => a._id) : [])}
        onSelectRow={(id, checked) => setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id))}
      />
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))} className="mt-4" />

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Application Details" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Name', detailModal.name], ['Email', detailModal.email], ['Phone', detailModal.phone], ['College', detailModal.college], ['Department', detailModal.department], ['Year', detailModal.yearOfStudy]].map(([l, v]) => (
                <div key={l} className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">{l}</span>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">{v || 'N/A'}</p>
                </div>
              ))}
            </div>
            {detailModal.resumeUrl && (
              <a href={detailModal.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-accent-600 hover:underline">View Resume →</a>
            )}

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Review Application</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input name="status" label="New Status" type="select" options={statusOptions} value={statusForm.status} onChange={(e) => {
                  setStatusForm({ ...statusForm, status: e.target.value });
                  if (e.target.value !== 'Approved') setPaymentAmount('');
                }} />
                <Input name="adminNotes" label="Admin Notes" value={statusForm.adminNotes} onChange={(e) => setStatusForm({ ...statusForm, adminNotes: e.target.value })} />
              </div>

              {statusForm.status === 'Approved' && (
                <div className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">Assign Internship Joining Fee</h4>
                  <p className="text-[10px] text-amber-700 dark:text-amber-500 leading-normal">
                    Enter the fee amount for this student. If the internship is free for this student, enter 0 or leave it empty.
                  </p>
                  <Input name="paymentAmount" label="Assigned Fee (₹)" type="number" placeholder="Enter amount (e.g. 450)" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                </div>
              )}

              <Button variant="primary" size="sm" onClick={handleStatusUpdate} loading={saving}>
                {statusForm.status === 'Approved' && Number(paymentAmount) > 0 ? 'Approve & Assign Payment' : 'Update Status'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AdminApplicationsPage;

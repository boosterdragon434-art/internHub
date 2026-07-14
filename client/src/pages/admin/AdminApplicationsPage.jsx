import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiDownload, FiCheckCircle } from 'react-icons/fi';
import {
  getAllApplications,
  updateApplicationStatus,
  completeApplication,
  assignPaymentAmount,
  performBulkAction,
  exportApplicationsCsv,
  sendOfferLetter,
} from '../../api/applicationApi';
import { getTemplates } from '../../api/certificateApi';
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
  const [paymentCurrency, setPaymentCurrency] = useState('INR');
  const [paymentDeadline, setPaymentDeadline] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Offer Letter State
  const [offerTemplates, setOfferTemplates] = useState([]);
  const [selectedOfferTemplate, setSelectedOfferTemplate] = useState('');
  const [sendingOfferLetter, setSendingOfferLetter] = useState(false);

  const statusOptions = [
    'Applied', 'Under Review', 'Approved', 'Rejected',
    'Payment Pending', 'Payment Verification Pending', 'Payment Completed',
    'Joined', 'Completed'
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [debouncedSearch, statusFilter, pagination.page]);

  useEffect(() => {
    const fetchOfferTemplates = async () => {
      try {
        const res = await getTemplates({ status: 'active' });
        if (res.data && res.data.success) {
          setOfferTemplates(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch offer templates', err);
      }
    };
    fetchOfferTemplates();
  }, []);

  const handleStatusUpdate = async () => {
    if (!statusForm.status) { toast.error('Select a status.'); return; }
    setSaving(true);
    try {
      if (statusForm.status === 'Approved' && Number(paymentAmount) > 0) {
        // Validate payment fields before making API calls
        if (!paymentDeadline) {
          toast.error('Please specify a payment deadline.');
          setSaving(false);
          return;
        }
        if (new Date(paymentDeadline) <= new Date()) {
          toast.error('Payment deadline must be in the future.');
          setSaving(false);
          return;
        }

        // Backend atomically approves + creates payment request in one call
        await assignPaymentAmount(
          detailModal._id,
          Number(paymentAmount),
          paymentCurrency,
          paymentDeadline,
          paymentNotes
        );
        toast.success('Application approved and payment request sent!');
      } else {
        await updateApplicationStatus(detailModal._id, statusForm.status, statusForm.adminNotes);
        toast.success('Status updated successfully!');
      }
      setDetailModal(null);
      setPaymentAmount('');
      setPaymentNotes('');
      fetchData();
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      toast.error(serverMessage || 'Update failed. Please try again.');
      console.error('Status update error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteApplication = async () => {
    setCompleting(true);
    try {
      await completeApplication(detailModal._id);
      toast.success('Application marked as complete. Certificate generated and email sent!');
      setDetailModal(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete application.');
    } finally {
      setCompleting(false);
    }
  };

  const handleSendOfferLetter = async () => {
    if (!selectedOfferTemplate) {
      toast.error('Please select an offer letter template.');
      return;
    }
    setSendingOfferLetter(true);
    try {
      await sendOfferLetter(detailModal._id, selectedOfferTemplate);
      toast.success('Offer letter generated and sent to the student!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send offer letter.');
    } finally {
      setSendingOfferLetter(false);
    }
  };

  const handleBulk = async (action) => {
    if (selectedIds.length === 0) { toast.error('Select at least one application.'); return; }
    try {
      await performBulkAction(selectedIds, action);
      toast.success(`Bulk ${action} completed.`);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk action failed.');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportApplicationsCsv({ status: statusFilter });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'applications.csv'; a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported!');
    } catch (err) {
      toast.error('Export failed.');
    }
  };

  const columns = [
    { header: 'Applicant', render: (r) => (
      <div>
        <div className="font-bold text-slate-900 dark:text-slate-50">{r.name}</div>
        <div className="text-[10px] text-slate-500">{r.email}</div>
      </div>
    )},
    { header: 'Role (Internship)', render: (r) => (
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
        {r.internship?.title || 'N/A'}
      </span>
    )},
    { header: 'Applied Date', render: (r) => (
      <span className="text-xs text-slate-600 dark:text-slate-400">
        {formatDate(r.createdAt)}
      </span>
    )},
    { header: 'Status', render: (r) => <Badge status={r.status} /> },
    { header: 'Actions', render: (r) => (
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setDetailModal(r);
          setStatusForm({ status: r.status, adminNotes: r.adminNotes || '' });
          setPaymentAmount('');
          setPaymentCurrency('INR');
          let defaultDeadline = new Date();
          defaultDeadline.setDate(defaultDeadline.getDate() + 3);
          setPaymentDeadline(defaultDeadline.toISOString().split('T')[0]);
          setPaymentNotes('');
        }}
      >
        Review
      </Button>
    )},
  ];

  return (
    <>
      <Helmet><title>Applications — FWT iZON Admin</title></Helmet>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Manage Applications</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review, approve, and finalize student applications.</p>
        </div>
        <Button variant="outline" icon={FiDownload} onClick={handleExport}>
          Export to CSV
        </Button>
      </div>

      {/* Filters */}
      <SearchFilter
        searchPlaceholder="Search by name, email, or institution..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          { name: 'status', value: statusFilter, onChange: setStatusFilter, options: statusOptions, placeholder: 'All Statuses' }
        ]}
        className="mb-4"
      />

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/30 rounded-xl">
          <span className="text-xs font-semibold text-brand-700 dark:text-brand-400 mr-2">
            {selectedIds.length} selected
          </span>
          <Button size="sm" variant="primary" onClick={() => handleBulk('approve')}>Approve Selected</Button>
          <Button size="sm" variant="danger" onClick={() => handleBulk('reject')}>Reject Selected</Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={apps}
        loading={loading}
        rowKey="_id"
        selectedIds={selectedIds}
        onSelectAll={(checked) => setSelectedIds(checked ? apps.map((a) => a._id) : [])}
        onSelectRow={(id, checked) => setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter((i) => i !== id))}
      />
      
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        className="mt-6"
      />

      {/* ── Detail & Review Modal ── */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Application Review" size="xl">
        {detailModal && (
          <div className="space-y-5">
            
            {/* Applicant Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                ['Name', detailModal.name],
                ['Email', detailModal.email],
                ['Phone', detailModal.phone],
                ['Institution', detailModal.college],
                ['Department', detailModal.department],
                ['Year', detailModal.yearOfStudy],
                ['Mode', detailModal.preferredMode || 'Remote'],
                ['Hours/Week', detailModal.hoursPerWeek ? `${detailModal.hoursPerWeek}h` : '20h'],
                ['Available From', detailModal.availableFrom ? formatDate(detailModal.availableFrom) : 'Flexible'],
              ].map(([label, value]) => (
                <div key={label} className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 mt-1.5 truncate" title={value}>{value || 'N/A'}</p>
                </div>
              ))}
            </div>

            {/* Extended Details */}
            {detailModal.motivation && (
              <div className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">Motivation</span>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{detailModal.motivation}</p>
              </div>
            )}
            
            {(detailModal.relevantExperience || detailModal.portfolioUrl) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {detailModal.relevantExperience && (
                  <div className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-2 block">Experience</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{detailModal.relevantExperience}</p>
                  </div>
                )}
                {detailModal.portfolioUrl && (
                  <div className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1 block">Portfolio Link</span>
                    <a href={detailModal.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline truncate">
                      {detailModal.portfolioUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            {detailModal.resumeUrl && (
              <div>
                <a href={detailModal.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-lg">
                  View Resume Document →
                </a>
              </div>
            )}

            {/* ── Status Update & Action Area ── */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-4">
              
              {/* Offer Letter Area */}
              {(detailModal.status === 'Joined' || detailModal.status === 'Payment Completed') && (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-5 mb-4">
                  <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 mb-3">
                    <FiCheckCircle className="w-4 h-4" /> Issue Offer Letter
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                      <Input
                        name="offerTemplate"
                        type="select"
                        label="Select Offer Letter Template"
                        required={true}
                        disabled={offerTemplates.length === 0}
                        options={offerTemplates.length === 0 
                          ? [{ value: '', label: 'No templates available. Please create one.' }] 
                          : [{ value: '', label: 'Select Template' }, ...offerTemplates.map(t => ({ value: t._id, label: t.name }))]}
                        value={selectedOfferTemplate}
                        onChange={(e) => setSelectedOfferTemplate(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="primary"
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white border-none h-[46px] mb-0.5"
                      onClick={handleSendOfferLetter}
                      loading={sendingOfferLetter}
                      disabled={offerTemplates.length === 0 || !selectedOfferTemplate}
                    >
                      Send Offer Letter
                    </Button>
                  </div>
                </div>
              )}

              {/* Finalization Area (Mark Complete) */}
              {detailModal.status === 'Joined' ? (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                        <FiCheckCircle className="w-4 h-4" /> Finalize Internship
                      </h3>
                      <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1 max-w-sm leading-relaxed">
                        The student is currently active. Marking as complete will generate their completion certificate and deliver it via email immediately.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white border-none"
                      onClick={handleCompleteApplication}
                      loading={completing}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </div>
              ) : detailModal.status === 'Completed' ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Badge status="Completed" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Certificate has been generated and delivered.</p>
                  </div>
                  {detailModal.certificateUrl && (
                    <a href={detailModal.certificateUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-brand-600 hover:underline">
                      View Certificate
                    </a>
                  )}
                </div>
              ) : null}

              {/* Standard Status Controls */}
              {detailModal.status !== 'Completed' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Update Status</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      name="status"
                      label="New Status"
                      type="select"
                      options={statusOptions.filter(o => o.value !== 'Completed')}
                      value={statusForm.status}
                      onChange={(e) => {
                        setStatusForm({ ...statusForm, status: e.target.value });
                        if (e.target.value !== 'Approved') setPaymentAmount('');
                      }}
                    />
                    <Input
                      name="adminNotes"
                      label="Admin Notes (Internal)"
                      value={statusForm.adminNotes}
                      onChange={(e) => setStatusForm({ ...statusForm, adminNotes: e.target.value })}
                    />
                  </div>

                  {statusForm.status === 'Approved' && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400">Assign Joining Fee</h4>
                        <p className="text-[10px] text-amber-700 dark:text-amber-500 leading-relaxed">
                          Configure the payment request for this student. Enter 0 or leave empty if free.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          name="paymentAmount"
                          label="Fee Amount"
                          type="number"
                          placeholder="e.g. 500"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                        <Input
                          name="paymentCurrency"
                          label="Currency"
                          type="select"
                          options={[{ value: 'INR', label: 'INR (₹)' }, { value: 'USD', label: 'USD ($)' }]}
                          value={paymentCurrency}
                          onChange={(e) => setPaymentCurrency(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <Input
                          name="paymentDeadline"
                          label="Payment Deadline"
                          type="date"
                          value={paymentDeadline}
                          onChange={(e) => setPaymentDeadline(e.target.value)}
                        />
                        <Input
                          name="paymentNotes"
                          label="Message / Notes to Student"
                          placeholder="e.g. Please complete the payment to secure your spot."
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button variant="primary" onClick={handleStatusUpdate} loading={saving}>
                      {statusForm.status === 'Approved' && Number(paymentAmount) > 0 ? 'Approve & Request Payment' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>
    </>
  );
};

export default AdminApplicationsPage;

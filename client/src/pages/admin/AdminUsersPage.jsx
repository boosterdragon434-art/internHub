import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiUsers, FiLock, FiUnlock, FiTrash2, FiRotateCcw, FiMoreVertical, FiAlertTriangle, FiShield, FiArchive, FiSearch, FiX } from 'react-icons/fi';
import { getAllUsers, lockUser, unlockUser, softDeleteUser, restoreUser, hardDeleteUser } from '../../api/userApi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';

// ─── Status Tab Configuration ─────────────────────────────────────
const STATUS_TABS = [
  { key: '',       label: 'All Active',  icon: FiUsers,   color: 'brand' },
  { key: 'locked', label: 'Locked',      icon: FiLock,    color: 'amber' },
  { key: 'deleted',label: 'Trash',       icon: FiArchive, color: 'rose' },
];

/**
 * AdminUsersPage — Premium user management dashboard.
 *
 * Features:
 * - Status tabs (Active / Locked / Trash)
 * - Lock/Unlock accounts with reason
 * - Soft-delete with reason (moves to Trash)
 * - Restore from Trash
 * - Permanent delete with email confirmation (two-step safety)
 * - Action dropdown per user row
 */
const AdminUsersPage = () => {
  // ─── State ────────────────────────────────────────────────────
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusTab, setStatusTab] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const toast = useToast();

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  // Lock modal
  const [lockModal, setLockModal] = useState({ open: false, user: null });
  const [lockReason, setLockReason] = useState('');

  // Soft-delete modal
  const [softDeleteModal, setSoftDeleteModal] = useState({ open: false, user: null });
  const [deleteReason, setDeleteReason] = useState('');

  // Hard-delete modal
  const [hardDeleteModal, setHardDeleteModal] = useState({ open: false, user: null });
  const [confirmEmail, setConfirmEmail] = useState('');

  // ─── Fetch Users ──────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter) params.role = roleFilter;
      if (statusTab) params.status = statusTab;
      const res = await getAllUsers(params);
      if (res.success) {
        setUsers(res.data);
        if (res.pagination) {
          setPagination((p) => ({ ...p, totalPages: res.pagination.pages }));
        }
      }
    } catch (err) {
      toast.error('Failed to fetch users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusTab, pagination.page, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset page on filter change
  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch, roleFilter, statusTab]);

  // ─── Click Outside → Close Dropdown ───────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Action Handlers ──────────────────────────────────────────
  const handleLock = async () => {
    if (!lockModal.user) return;
    setActionLoading(true);
    try {
      await lockUser(lockModal.user._id, lockReason);
      toast.success(`${lockModal.user.name}'s account has been locked.`);
      setLockModal({ open: false, user: null });
      setLockReason('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to lock account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlock = async (user) => {
    setActionLoading(true);
    try {
      await unlockUser(user._id);
      toast.success(`${user.name}'s account has been unlocked.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unlock account.');
    } finally {
      setActionLoading(false);
      setOpenDropdownId(null);
    }
  };

  const handleSoftDelete = async () => {
    if (!softDeleteModal.user) return;
    setActionLoading(true);
    try {
      await softDeleteUser(softDeleteModal.user._id, deleteReason);
      toast.success(`${softDeleteModal.user.name} moved to trash. Data preserved.`);
      setSoftDeleteModal({ open: false, user: null });
      setDeleteReason('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to soft-delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (user) => {
    setActionLoading(true);
    try {
      await restoreUser(user._id);
      toast.success(`${user.name} has been restored successfully.`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore user.');
    } finally {
      setActionLoading(false);
      setOpenDropdownId(null);
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteModal.user) return;
    setActionLoading(true);
    try {
      await hardDeleteUser(hardDeleteModal.user._id, confirmEmail);
      toast.success(`${hardDeleteModal.user.name} permanently deleted with all related data.`);
      setHardDeleteModal({ open: false, user: null });
      setConfirmEmail('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to permanently delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Status Badge Renderer ────────────────────────────────────
  const renderStatusBadge = (user) => {
    if (user.isDeleted) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
          <FiTrash2 className="w-3 h-3" />
          Deleted
        </span>
      );
    }
    if (!user.isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <FiLock className="w-3 h-3" />
          Locked
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  };

  // ─── Role Badge Renderer ──────────────────────────────────────
  const renderRoleBadge = (role) => {
    const styles = {
      admin:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      guide:   'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
      student: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    };
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${styles[role] || styles.student}`}>
        {role}
      </span>
    );
  };

  // ─── Action Dropdown Renderer ─────────────────────────────────
  const renderActions = (user) => {
    if (user.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-600">
          <FiShield className="w-3.5 h-3.5" />
          Protected
        </span>
      );
    }

    const isOpen = openDropdownId === user._id;

    return (
      <div className="relative" ref={isOpen ? dropdownRef : null}>
        <button
          id={`action-btn-${user._id}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpenDropdownId(isOpen ? null : user._id);
          }}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all duration-200"
          aria-label="User actions"
        >
          <FiMoreVertical className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Active users: Lock + Soft Delete */}
            {!user.isDeleted && user.isActive && (
              <>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                  onClick={() => {
                    setLockModal({ open: true, user });
                    setOpenDropdownId(null);
                  }}
                >
                  <FiLock className="w-4 h-4" />
                  Lock Account
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  onClick={() => {
                    setSoftDeleteModal({ open: true, user });
                    setOpenDropdownId(null);
                  }}
                >
                  <FiTrash2 className="w-4 h-4" />
                  Move to Trash
                </button>
              </>
            )}

            {/* Locked users: Unlock + Soft Delete */}
            {!user.isDeleted && !user.isActive && (
              <>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                  onClick={() => handleUnlock(user)}
                  disabled={actionLoading}
                >
                  <FiUnlock className="w-4 h-4" />
                  Unlock Account
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  onClick={() => {
                    setSoftDeleteModal({ open: true, user });
                    setOpenDropdownId(null);
                  }}
                >
                  <FiTrash2 className="w-4 h-4" />
                  Move to Trash
                </button>
              </>
            )}

            {/* Deleted users: Restore + Permanent Delete */}
            {user.isDeleted && (
              <>
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 transition-colors"
                  onClick={() => handleRestore(user)}
                  disabled={actionLoading}
                >
                  <FiRotateCcw className="w-4 h-4" />
                  Restore User
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                <button
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-700 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors font-semibold"
                  onClick={() => {
                    setHardDeleteModal({ open: true, user });
                    setOpenDropdownId(null);
                  }}
                >
                  <FiAlertTriangle className="w-4 h-4" />
                  Delete Permanently
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── Table Columns ────────────────────────────────────────────
  const columns = [
    {
      header: 'User',
      render: (r) => (
        <div className="flex items-center gap-3.5">
          <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-extrabold text-sm border ${
            r.isDeleted
              ? 'bg-gradient-to-br from-rose-100 to-rose-50 dark:from-rose-900/40 dark:to-rose-800/20 text-rose-700 dark:text-rose-300 border-rose-200/50 dark:border-rose-700/30 opacity-60'
              : !r.isActive
                ? 'bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-800/20 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-700/30'
                : 'bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-800/20 text-brand-700 dark:text-brand-300 border-brand-200/50 dark:border-brand-700/30'
          }`}>
            {r.name.charAt(0).toUpperCase()}
          </div>
          <div className={r.isDeleted ? 'opacity-60' : ''}>
            <span className="font-bold text-slate-900 dark:text-slate-50">{r.name}</span>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">{r.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Phone', key: 'phone' },
    { header: 'College', key: 'college' },
    {
      header: 'Role',
      render: (r) => renderRoleBadge(r.role),
    },
    {
      header: 'Status',
      render: (r) => renderStatusBadge(r),
    },
    {
      header: 'Joined',
      render: (r) => (
        <span className={r.isDeleted ? 'opacity-60' : ''}>
          {formatDate(r.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (r) => renderActions(r),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────
  return (
    <>
      <Helmet><title>Users — InternHub Admin</title></Helmet>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FiUsers className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Manage Users
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Lock, archive, or permanently remove student and guide accounts.
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 mb-5 border-b border-slate-200 dark:border-slate-800 pb-0">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = statusTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 -mb-px ${
                active
                  ? `border-${tab.color}-600 text-${tab.color}-700 dark:text-${tab.color}-400 dark:border-${tab.color}-400`
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <SearchFilter
        searchPlaceholder="Search by name, email..."
        searchValue={search}
        onSearchChange={setSearch}
        filters={[
          {
            name: 'role',
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { value: 'student', label: 'Student' },
              { value: 'guide', label: 'Guide' },
              { value: 'admin', label: 'Admin' },
            ],
            placeholder: 'All Roles',
          },
        ]}
        className="mb-4"
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        emptyTitle={statusTab === 'deleted' ? 'Trash is empty' : statusTab === 'locked' ? 'No locked accounts' : 'No users found'}
        emptyDescription={statusTab === 'deleted' ? 'No soft-deleted users here. Users moved to trash will appear here.' : statusTab === 'locked' ? 'All accounts are currently accessible.' : 'No users match your current filters.'}
        rowKey="_id"
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        className="mt-4"
      />

      {/* ═══════════════ LOCK MODAL ═══════════════ */}
      <Modal
        isOpen={lockModal.open}
        onClose={() => { setLockModal({ open: false, user: null }); setLockReason(''); }}
        title="Lock User Account"
        size="sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full mb-4 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400">
            <FiLock className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Lock <span className="font-bold text-slate-900 dark:text-slate-100">{lockModal.user?.name}</span>'s account?
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            They will be immediately logged out and unable to access the platform until unlocked.
          </p>

          <div className="w-full text-left mb-5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Reason <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              id="lock-reason-input"
              value={lockReason}
              onChange={(e) => setLockReason(e.target.value)}
              placeholder="e.g., Internship completed, Inactive, Policy violation..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setLockModal({ open: false, user: null }); setLockReason(''); }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              icon={FiLock}
              onClick={handleLock}
              loading={actionLoading}
            >
              Lock Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════ SOFT DELETE MODAL ═══════════════ */}
      <Modal
        isOpen={softDeleteModal.open}
        onClose={() => { setSoftDeleteModal({ open: false, user: null }); setDeleteReason(''); }}
        title="Move to Trash"
        size="sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full mb-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400">
            <FiTrash2 className="h-6 w-6" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Move <span className="font-bold text-slate-900 dark:text-slate-100">{softDeleteModal.user?.name}</span> to trash?
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            The user will be hidden and unable to access the platform. All data is preserved and can be restored later.
          </p>

          <div className="w-full text-left mb-5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Reason <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              id="softdelete-reason-input"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g., Internship completed, Duplicate account..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all resize-none"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setSoftDeleteModal({ open: false, user: null }); setDeleteReason(''); }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              icon={FiTrash2}
              onClick={handleSoftDelete}
              loading={actionLoading}
            >
              Move to Trash
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════ HARD DELETE MODAL ═══════════════ */}
      <Modal
        isOpen={hardDeleteModal.open}
        onClose={() => { setHardDeleteModal({ open: false, user: null }); setConfirmEmail(''); }}
        title="Permanently Delete User"
        size="sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-4 rounded-full mb-4 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 ring-4 ring-rose-50 dark:ring-rose-950/10">
            <FiAlertTriangle className="h-7 w-7" />
          </div>

          {/* Danger zone banner */}
          <div className="w-full px-3 py-2 mb-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40">
            <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
              ⚠️ Danger Zone — This action is irreversible
            </p>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Permanently delete <span className="font-bold text-rose-600 dark:text-rose-400">{hardDeleteModal.user?.name}</span>?
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            This will permanently remove the user and <strong>all related data</strong> including applications, attendance records, payments, certificates, tasks, and notifications. This cannot be undone.
          </p>

          <div className="w-full text-left mb-5">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Type <span className="font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded">{hardDeleteModal.user?.email}</span> to confirm
            </label>
            <input
              id="harddelete-confirm-input"
              type="text"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Enter email to confirm..."
              className="w-full px-3 py-2.5 text-sm border border-rose-200 dark:border-rose-800/60 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all font-mono"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setHardDeleteModal({ open: false, user: null }); setConfirmEmail(''); }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              icon={FiAlertTriangle}
              onClick={handleHardDelete}
              loading={actionLoading}
              disabled={confirmEmail.toLowerCase() !== (hardDeleteModal.user?.email || '').toLowerCase()}
            >
              Delete Forever
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminUsersPage;

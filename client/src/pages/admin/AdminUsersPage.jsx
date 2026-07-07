import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiUsers } from 'react-icons/fi';
import { getAllUsers } from '../../api/userApi';
import DataTable from '../../components/ui/DataTable';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import SearchFilter from '../../components/common/SearchFilter';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/formatters';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page: pagination.page, limit: 10 };
        if (debouncedSearch) params.search = debouncedSearch;
        if (roleFilter) params.role = roleFilter;
        const res = await getAllUsers(params);
        if (res.success) {
          setUsers(res.data);
          if (res.pagination) setPagination((p) => ({ ...p, totalPages: res.pagination.totalPages }));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [debouncedSearch, roleFilter, pagination.page]);

  const columns = [
    { header: 'User', render: (r) => (
      <div className="flex items-center gap-3.5">
        <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-800/20 flex items-center justify-center text-brand-700 dark:text-brand-300 font-extrabold text-sm border border-brand-200/50 dark:border-brand-700/30">
          {r.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-50">{r.name}</span>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{r.email}</p>
        </div>
      </div>
    )},
    { header: 'Phone', key: 'phone' },
    { header: 'College', key: 'college' },
    { header: 'Role', render: (r) => (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'}`}>
        {r.role}
      </span>
    )},
    { header: 'Verified', render: (r) => (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${r.isEmailVerified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${r.isEmailVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
        {r.isEmailVerified ? 'Verified' : 'Pending'}
      </span>
    )},
    { header: 'Joined', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <>
      <Helmet><title>Users — InternHub Admin</title></Helmet>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <FiUsers className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            Manage Users
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">View and manage all registered platform users elegantly.</p>
        </div>
      </div>

      <SearchFilter
        searchPlaceholder="Search by name, email, college..."
        searchValue={search} onSearchChange={setSearch}
        filters={[{ name: 'role', value: roleFilter, onChange: setRoleFilter, options: [{ value: 'student', label: 'Student' }, { value: 'admin', label: 'Admin' }], placeholder: 'All Roles' }]}
        className="mb-4"
      />
      <DataTable columns={columns} data={users} loading={loading} emptyTitle="No users found" rowKey="_id" />
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))} className="mt-4" />
    </>
  );
};

export default AdminUsersPage;

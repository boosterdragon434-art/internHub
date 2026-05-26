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
    { header: 'Name', render: (r) => (
      <div>
        <span className="font-bold text-slate-900 dark:text-slate-50">{r.name}</span>
        <p className="text-[10px] text-slate-500">{r.email}</p>
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
      <span className={`text-xs font-bold ${r.isEmailVerified ? 'text-emerald-600' : 'text-rose-500'}`}>
        {r.isEmailVerified ? 'Yes' : 'No'}
      </span>
    )},
    { header: 'Joined', render: (r) => formatDate(r.createdAt) },
  ];

  return (
    <>
      <Helmet><title>Users — InternHub Admin</title></Helmet>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Manage Users</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">View and search all registered users.</p>
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

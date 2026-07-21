import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiBriefcase, FiPlus, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { getInternshipsList, createInternship, updateInternship, deleteInternship } from '../../api/internshipApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import SearchFilter from '../../components/common/SearchFilter';
import { useDebounce } from '../../hooks/useDebounce';

const AdminInternshipsPage = () => {
  const toast = useToast();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', shortDescription: '', category: '', duration: '',
    mode: 'Remote', fees: '', openings: 1, skills: '', requirements: '',
    responsibilities: '', status: 'active',
  });
  const [image, setImage] = useState(null);

  const categoryOptions = [
    'Web Development', 'Mobile Development', 'Data Science', 'Machine Learning',
    'UI/UX Design', 'Cloud Computing', 'Cybersecurity', 'DevOps', 'Digital Marketing',
    'Content Writing', 'Graphic Design', 'Video Editing', 'Other',
  ].map((c) => ({ value: c, label: c }));

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 10, status: '' };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await getInternshipsList(params);
      if (res.success) {
        setInternships(res.data);
        if (res.pagination) setPagination((p) => ({ ...p, totalPages: res.pagination.totalPages }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [debouncedSearch, pagination.page]);

  const openCreateModal = () => {
    setEditing(null);
    setForm({ title: '', description: '', shortDescription: '', category: '', duration: '', mode: 'Remote', fees: '', openings: 1, skills: '', requirements: '', responsibilities: '', status: 'active' });
    setImage(null);
    setModalOpen(true);
  };

  const openEditModal = (intern) => {
    setEditing(intern);
    setForm({
      title: intern.title, description: intern.description, shortDescription: intern.shortDescription || '',
      category: intern.category, duration: intern.duration, mode: intern.mode,
      fees: intern.fees !== undefined && intern.fees !== null ? String(intern.fees) : '',
      openings: intern.openings,
      skills: intern.skills?.join(', ') || '', requirements: intern.requirements?.join('\n') || '',
      responsibilities: intern.responsibilities?.join('\n') || '',
      status: intern.status,
    });
    setImage(null);
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!form.title || !form.description || !form.category || !form.duration || !form.openings) {
      toast.error('Please fill all required fields.'); return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (['skills', 'requirements', 'responsibilities'].includes(k)) return;
        fd.append(k, v);
      });
      form.skills.split(',').map((s) => s.trim()).filter(Boolean).forEach((s) => fd.append('skills[]', s));
      form.requirements.split('\n').map((s) => s.trim()).filter(Boolean).forEach((s) => fd.append('requirements[]', s));
      form.responsibilities.split('\n').map((s) => s.trim()).filter(Boolean).forEach((s) => fd.append('responsibilities[]', s));
      if (image) fd.append('image', image);

      if (editing) {
        await updateInternship(editing._id, fd);
        toast.success('Internship updated!');
      } else {
        await createInternship(fd);
        toast.success('Internship created!');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteInternship(deleteId);
      toast.success('Internship deleted.');
      setDeleteId(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed.');
    } finally { setDeleting(false); }
  };

  const columns = [
    { header: 'Title', key: 'title', render: (r) => <span className="font-bold text-slate-900 dark:text-slate-50">{r.title}</span> },
    { header: 'Category', key: 'category' },
    { header: 'Mode', key: 'mode' },
    { header: 'Status', key: 'status', render: (r) => (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : r.status === 'closed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{r.status}</span>
    )},
    { header: 'Openings', key: 'openings' },
    { header: 'Actions', render: (r) => (
      <div className="flex items-center gap-2">
        <button onClick={() => openEditModal(r)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><FiEdit2 className="h-4 w-4" /></button>
        <button onClick={() => setDeleteId(r._id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"><FiTrash2 className="h-4 w-4" /></button>
      </div>
    )},
  ];

  return (
    <>
      <Helmet><title>Manage Internships — InternHub Admin</title></Helmet>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Manage Internships</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create, edit, and manage internship listings.</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={openCreateModal}>Create Internship</Button>
      </div>

      <SearchFilter searchPlaceholder="Search internships..." searchValue={search} onSearchChange={setSearch} className="mb-4" />
      <DataTable columns={columns} data={internships} loading={loading} emptyTitle="No internships found" rowKey="_id" />
      <Pagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))} className="mt-4" />

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Internship' : 'Create Internship'} size="xl">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input name="title" label="Title" value={form.title} onChange={handleChange} required />
            <Input name="category" label="Category" type="select" options={categoryOptions} placeholder="Select" value={form.category} onChange={handleChange} required />
            <Input name="duration" label="Duration" placeholder="e.g. 3 Months" value={form.duration} onChange={handleChange} required />
            <Input name="mode" label="Mode" type="select" options={[{value:'Remote',label:'Remote'},{value:'Hybrid',label:'Hybrid'},{value:'Offline',label:'Offline'}]} value={form.mode} onChange={handleChange} required />
            <Input name="fees" label="Fees" type="text" placeholder="e.g. 500, 500 - 1000, or Discussed after application" value={form.fees} onChange={handleChange} />
            <Input name="openings" label="Openings" type="number" value={form.openings} onChange={handleChange} required />
            <Input name="status" label="Status" type="select" options={[{value:'active',label:'Active'},{value:'closed',label:'Closed'},{value:'draft',label:'Draft'}]} value={form.status} onChange={handleChange} />
          </div>
          <Input name="shortDescription" label="Short Description" value={form.shortDescription} onChange={handleChange} />
          <Input name="description" label="Full Description" textarea rows={4} value={form.description} onChange={handleChange} required />
          <Input name="skills" label="Skills (comma-separated)" placeholder="React, Node.js" value={form.skills} onChange={handleChange} />
          <Input name="requirements" label="Requirements (one per line)" textarea rows={3} value={form.requirements} onChange={handleChange} />
          <Input name="responsibilities" label="Responsibilities (one per line)" textarea rows={3} value={form.responsibilities} onChange={handleChange} />
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Cover Image</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                  <p className="mb-2 text-sm text-slate-600 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">SVG, PNG, JPG or WEBP (MAX. 800x400px)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
              </label>
            </div>
            {image && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5"><FiCheckCircle className="w-4 h-4"/> Selected: {image.name}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{editing ? 'Update' : 'Create'}</Button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Internship?" description="This will permanently remove the internship and its image. This cannot be undone." loading={deleting} />
    </>
  );
};

export default AdminInternshipsPage;

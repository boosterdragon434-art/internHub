import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiUserPlus,
  FiUserCheck,
  FiChevronDown,
  FiX,
  FiCheckSquare,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import StatsCard from '../../components/ui/StatsCard';
import Spinner from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  updateTeamMembers,
  assignTeamGuide,
} from '../../api/teamApi';
import { getAllGuides } from '../../api/guideApi';
import api from '../../api/axios';



const TeamForm = ({
  onSubmit,
  isEdit = false,
  formData,
  setFormData,
  guides,
  students,
  studentSearch,
  setStudentSearch,
  filteredStudents,
  toggleMember,
  formLoading,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Team Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((f) => ({ ...f, name: e.target.value }))
          }
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-accent-500"
          placeholder="e.g., Alpha Cohort"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((f) => ({ ...f, description: e.target.value }))
          }
          rows={2}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-accent-500 resize-none"
          placeholder="Optional description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Assign Guide
        </label>
        <select
          value={formData.guide}
          onChange={(e) =>
            setFormData((f) => ({ ...f, guide: e.target.value }))
          }
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-accent-500"
        >
          <option value="">No guide assigned</option>
          {guides.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name} ({g.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Members ({formData.members.length} selected)
        </label>
        <div className="relative mb-2">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-accent-500"
            placeholder="Search students..."
          />
        </div>

        {/* Selected tags */}
        {formData.members.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {formData.members.map((id) => {
              const student = students.find((s) => s._id === id);
              return student ? (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950/20 text-accent-700 dark:text-accent-400 text-xs font-medium"
                >
                  {student.name}
                  <button
                    type="button"
                    onClick={() => toggleMember(id)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <FiX className="h-3 w-3" />
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}

        <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
          {filteredStudents.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No students found.
            </p>
          ) : (
            filteredStudents.slice(0, 50).map((student) => (
              <label
                key={student._id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.members.includes(student._id)}
                  onChange={() => toggleMember(student._id)}
                  className="rounded border-slate-300 dark:border-slate-600 text-accent-600 focus:ring-accent-500 h-3.5 w-3.5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                    {student.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {student.email}
                  </p>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={formLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white transition-colors"
        >
          {formLoading && <Spinner size="sm" />}
          {isEdit ? 'Update Team' : 'Create Team'}
        </button>
      </div>
    </form>
  );
};

const AdminTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    guide: '',
    members: [],
  });
  const [formLoading, setFormLoading] = useState(false);

  // Guides & Students data
  const [guides, setGuides] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');

  // Fetch teams
  const fetchTeams = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);
        const params = { page: pageNum, limit: 10 };
        if (search) params.search = search;
        const res = await getTeams(params);
        setTeams(res.data?.data || []);
        setPagination(res.data?.pagination || null);
      } catch (error) {
        console.error('Failed to fetch teams:', error);
        toast.error('Failed to load teams.');
      } finally {
        setLoading(false);
      }
    },
    [search]
  );

  // Fetch guides and students
  const fetchHelpers = useCallback(async () => {
    try {
      const [guidesRes, studentsRes] = await Promise.all([
        getAllGuides({ limit: 100 }),
        api.get('/users', { params: { limit: 200 } }),
      ]);
      setGuides(guidesRes.data?.data || []);
      const allUsers = studentsRes.data?.data || [];
      setStudents(allUsers.filter((u) => u.role === 'student'));
    } catch (error) {
      console.error('Failed to fetch helpers:', error);
    }
  }, []);

  useEffect(() => {
    fetchTeams(1);
    fetchHelpers();
  }, [fetchTeams, fetchHelpers]);

  // Create team
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Team name is required.');
      return;
    }
    try {
      setFormLoading(true);
      await createTeam({
        name: formData.name.trim(),
        description: formData.description.trim(),
        guide: formData.guide || null,
        members: formData.members,
      });
      toast.success('Team created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchTeams(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create team.');
    } finally {
      setFormLoading(false);
    }
  };

  // Edit team
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Team name is required.');
      return;
    }
    try {
      setFormLoading(true);
      await updateTeam(selectedTeam._id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        guide: formData.guide || null,
        members: formData.members,
      });
      toast.success('Team updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchTeams(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update team.');
    } finally {
      setFormLoading(false);
    }
  };

  // Delete team
  const handleDelete = async () => {
    try {
      await deleteTeam(selectedTeam._id);
      toast.success('Team deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedTeam(null);
      fetchTeams(page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete team.');
    }
  };

  const openEditModal = (team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      guide: team.guide?._id || '',
      members: team.members?.map((m) => m._id) || [],
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (team) => {
    setSelectedTeam(team);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', guide: '', members: [] });
    setSelectedTeam(null);
    setStudentSearch('');
  };

  const toggleMember = (studentId) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(studentId)
        ? prev.members.filter((id) => id !== studentId)
        : [...prev.members, studentId],
    }));
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Stats
  const totalTeams = teams.length;
  const totalMembers = teams.reduce(
    (sum, t) => sum + (t.members?.length || 0),
    0
  );
  const teamsWithGuide = teams.filter((t) => t.guide).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Teams & Groups
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create and manage intern teams with guide assignments
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white shadow-sm transition-colors"
        >
          <FiPlus className="h-4 w-4" />
          Create Team
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Teams"
          value={pagination?.total || totalTeams}
          icon={FiUsers}
          color="indigo"
        />
        <StatsCard
          title="Total Members"
          value={totalMembers}
          icon={FiUserPlus}
          color="teal"
        />
        <StatsCard
          title="Guided Teams"
          value={teamsWithGuide}
          icon={FiUserCheck}
          color="purple"
        />
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1);
                fetchTeams(1);
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none"
          />
        </div>
        <button
          onClick={() => {
            setPage(1);
            fetchTeams(1);
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent-600 hover:bg-accent-700 text-white transition-colors"
        >
          Search
        </button>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Create your first team to start organizing interns."
          icon={FiUsers}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <motion.div
                key={team._id}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                     <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 truncate">
                        {team.name}
                      </h3>
                      {team.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {team.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        team.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {team.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Guide */}
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <FiUserCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        Guide
                      </p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {team.guide?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-1.5">
                      Members ({team.members?.length || 0})
                    </p>
                    <div className="flex -space-x-2">
                      {(team.members || []).slice(0, 6).map((m) => (
                        <div
                          key={m._id}
                          title={m.name}
                          className="h-7 w-7 rounded-full border-2 border-white dark:border-slate-900 bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-[10px] font-bold text-accent-700 dark:text-accent-400"
                        >
                          {m.name?.charAt(0)?.toUpperCase()}
                        </div>
                      ))}
                      {(team.members?.length || 0) > 6 && (
                        <div className="h-7 w-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          +{team.members.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTeam(team);
                      setShowMembersModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <FiCheckSquare className="h-3.5 w-3.5" />
                    Verify
                  </button>
                  <button
                    onClick={() => openEditModal(team)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/20 transition-colors"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteConfirm(team)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.pages}
              onPageChange={(p) => {
                setPage(p);
                fetchTeams(p);
              }}
            />
          )}
        </>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Team"
        size="lg"
      >
        <TeamForm
          onSubmit={handleCreate}
          formData={formData}
          setFormData={setFormData}
          guides={guides}
          students={students}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          filteredStudents={filteredStudents}
          toggleMember={toggleMember}
          formLoading={formLoading}
          onCancel={() => {
            setShowCreateModal(false);
            resetForm();
          }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title={`Edit Team — ${selectedTeam?.name || ''}`}
        size="lg"
      >
        <TeamForm
          onSubmit={handleEdit}
          isEdit
          formData={formData}
          setFormData={setFormData}
          guides={guides}
          students={students}
          studentSearch={studentSearch}
          setStudentSearch={setStudentSearch}
          filteredStudents={filteredStudents}
          toggleMember={toggleMember}
          formLoading={formLoading}
          onCancel={() => {
            setShowEditModal(false);
            resetForm();
          }}
        />
      </Modal>

      {/* Contributions Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => {
          setShowMembersModal(false);
          setSelectedTeam(null);
        }}
        title={`Project & Contributions — ${selectedTeam?.name || ''}`}
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {selectedTeam?.projectTitle ? (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Project: {selectedTeam.projectTitle}</h4>
              {selectedTeam.projectLink && (
                <a href={selectedTeam.projectLink} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-600 hover:underline">
                  {selectedTeam.projectLink}
                </a>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 italic">No project title set by the team yet.</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Member Contributions</h4>
            {selectedTeam?.members?.length === 0 ? (
              <p className="text-sm text-slate-500">No members in this team.</p>
            ) : (
              <div className="space-y-4">
                {selectedTeam?.members?.map((member) => {
                  const contrib = selectedTeam.memberContributions?.find(c => c.student === member._id || c.student?._id === member._id);
                  
                  return (
                    <div key={member._id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{member.name}</p>
                        <p className="text-xs text-slate-500 mb-2">{member.email}</p>
                        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                          <p><span className="font-semibold text-slate-700 dark:text-slate-300">Role:</span> {contrib?.role || 'N/A'}</p>
                          <p><span className="font-semibold text-slate-700 dark:text-slate-300">Responsibilities:</span> {contrib?.responsibilities || 'N/A'}</p>
                          <p><span className="font-semibold text-slate-700 dark:text-slate-300">Tasks:</span> {contrib?.tasksCompleted || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-start">
                        <button
                          onClick={async () => {
                            try {
                              const newStatus = !contrib?.isVerified;
                              await api.put(`/teams/${selectedTeam._id}/contributions/${member._id}/verify`, { isVerified: newStatus });
                              toast.success(`Contribution ${newStatus ? 'verified' : 'unverified'}!`);
                              fetchTeams(page);
                              setShowMembersModal(false);
                            } catch (err) {
                              toast.error('Failed to verify contribution');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            contrib?.isVerified
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                          }`}
                        >
                          {contrib?.isVerified ? 'Verified' : 'Verify Work'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Team"
        message={`Are you sure you want to delete "${selectedTeam?.name}"? This action will deactivate the team.`}
      />
    </div>
  );
};

export default AdminTeamsPage;

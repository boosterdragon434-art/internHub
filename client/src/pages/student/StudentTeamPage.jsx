import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUsers,
  FiEdit3,
  FiExternalLink,
  FiCheckCircle,
  FiAward,
  FiBriefcase,
  FiX,
  FiGithub,
  FiGlobe,
  FiShield,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getMyTeam, updateProjectDetails, updateMyContribution } from '../../api/teamApi';
import Spinner from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';

const StudentTeamPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isContribModalOpen, setIsContribModalOpen] = useState(false);

  // Form state
  const [projectData, setProjectData] = useState({ projectTitle: '', projectLink: '' });
  const [contribData, setContribData] = useState({ role: '', responsibilities: '', tasksCompleted: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await getMyTeam();
      if (res.success && res.data.team) {
        setTeam(res.data.team);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProjectModal = () => {
    setProjectData({
      projectTitle: team.projectTitle || '',
      projectLink: team.projectLink || '',
    });
    setIsProjectModalOpen(true);
  };

  const handleOpenContribModal = () => {
    const myContrib = team.memberContributions?.find(c => c.student?._id === user.id || c.student === user.id);
    setContribData({
      role: myContrib?.role || '',
      responsibilities: myContrib?.responsibilities || '',
      tasksCompleted: myContrib?.tasksCompleted || '',
    });
    setIsContribModalOpen(true);
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateProjectDetails(team._id, projectData);
      if (res.success) {
        toast.success('Project details updated!');
        setTeam(res.data.team);
        setIsProjectModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateContribution = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await updateMyContribution(team._id, contribData);
      if (res.success) {
        toast.success('Your contribution has been updated!');
        setTeam(res.data.team);
        setIsContribModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  if (!team) {
    return (
      <>
        <Helmet><title>My Team — InternHub</title></Helmet>
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <EmptyState
            title="No Team Assigned"
            description="You have not been assigned to a team yet. Once your guide or admin assigns you to a project group, it will appear here."
            icon={FiUsers}
          />
        </div>
      </>
    );
  }

  const myContrib = team.memberContributions?.find(c => c.student?._id === user.id || c.student === user.id);

  return (
    <>
      <Helmet><title>My Team — InternHub</title></Helmet>

      {/* ── Header & Project Info ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-brand-900 text-white p-8 sm:p-10 mb-8 shadow-2xl"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-white opacity-[0.03] blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase border border-white/10">
                Team Workspace
              </span>
              <span className="px-3 py-1 bg-brand-500/20 text-brand-300 rounded-full text-xs font-bold border border-brand-500/30">
                {team.members.length} Members
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
              {team.name}
            </h1>
            <p className="text-slate-300 max-w-2xl text-sm sm:text-base leading-relaxed">
              {team.description || "Welcome to your team workspace. Collaborate, track your project progress, and manage your contributions here."}
            </p>

            {/* Project Card Overlay inside Header */}
            <div className="mt-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs text-brand-300 font-bold uppercase tracking-wider mb-1">Current Project</h3>
                {team.projectTitle ? (
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-white">{team.projectTitle}</span>
                    {team.projectLink && (
                      <a href={team.projectLink} target="_blank" rel="noopener noreferrer" className="text-brand-400 hover:text-brand-300 transition-colors p-1 bg-white/5 rounded-lg hover:bg-white/10">
                        <FiExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ) : (
                  <span className="text-sm italic text-slate-400">Project title not set yet</span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={FiEdit3}
                onClick={handleOpenProjectModal}
                className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30"
              >
                Update Project
              </Button>
            </div>
          </div>

          {/* Guide Widget */}
          {team.guide && (
            <div className="shrink-0 w-full md:w-72 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
              <h3 className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                <FiShield className="h-3.5 w-3.5" /> Assigned Guide
              </h3>
              <div className="flex items-center gap-4">
                {team.guide.avatar ? (
                  <img src={team.guide.avatar} alt="Guide" className="w-12 h-12 rounded-full border-2 border-emerald-500/30 object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg border-2 border-emerald-500/30">
                    {team.guide.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white">{team.guide.name}</p>
                  <p className="text-xs text-slate-300 truncate w-40">{team.guide.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Team Members & Contributions Grid ── */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <FiUsers className="h-5 w-5 text-brand-500" />
          Team Members
        </h2>
        {myContrib?.isVerified && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/30">
            <FiCheckCircle className="h-3.5 w-3.5" /> All Contributions Verified
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {team.members.map((member) => {
          const isMe = member._id === user.id;
          const contribution = team.memberContributions?.find(
            (c) => c.student?._id === member._id || c.student === member._id
          );

          return (
            <motion.div
              key={member._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl ${
                isMe 
                  ? 'border-brand-200 dark:border-brand-800/50 ring-1 ring-brand-100 dark:ring-brand-900/30' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Card Header (User Info) */}
              <div className={`p-6 border-b ${isMe ? 'bg-brand-50/50 dark:bg-brand-950/20 border-brand-100 dark:border-brand-800/30' : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-800 shadow-md object-cover" />
                    ) : (
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-md ${
                        isMe ? 'bg-brand-100 dark:bg-brand-900 text-brand-600 dark:text-brand-300 border-2 border-brand-200 dark:border-brand-700' 
                             : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border-2 border-white dark:border-slate-700'
                      }`}>
                        {member.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-50 text-base flex items-center gap-2">
                        {member.name}
                        {isMe && <span className="px-2 py-0.5 rounded-md bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-[10px] uppercase tracking-wider">You</span>}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate w-40">{member.college || member.email}</p>
                    </div>
                  </div>
                  
                  {/* Verification Badge */}
                  {contribution?.isVerified && (
                    <div className="shrink-0 group relative">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                        <FiAward className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="absolute top-10 right-0 w-max px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                        Verified by Guide
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body (Contributions) */}
              <div className="p-6 flex-1 flex flex-col gap-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                    Assigned Role
                  </span>
                  <div className="flex items-center gap-2">
                    <FiBriefcase className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {contribution?.role || <span className="italic text-slate-400 font-normal">Not specified</span>}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                    Key Responsibilities
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {contribution?.responsibilities || <span className="italic text-slate-400">No responsibilities listed yet.</span>}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
                    Tasks Completed
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 min-h-[4rem]">
                    {contribution?.tasksCompleted || <span className="italic text-slate-400">No completed tasks logged.</span>}
                  </p>
                </div>

                {isMe && (
                  <div className="mt-auto pt-4">
                    <Button
                      variant={contribution?.isVerified ? "outline" : "primary"}
                      className="w-full shadow-sm"
                      icon={FiEdit3}
                      onClick={handleOpenContribModal}
                    >
                      {contribution?.isVerified ? "Request Edit (Verified)" : "Update Contribution"}
                    </Button>
                    {contribution?.isVerified && (
                      <p className="text-[10px] text-center text-slate-500 mt-2">Editing will remove the verified badge.</p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 w-full max-w-md shadow-2xl relative"
            >
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
              >
                <FiX className="h-5 w-5" />
              </button>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mb-6">Update Project Info</h3>
              <form onSubmit={handleUpdateProject} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Project Title</label>
                  <input
                    type="text"
                    value={projectData.projectTitle}
                    onChange={(e) => setProjectData({ ...projectData, projectTitle: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    placeholder="e.g. NextGen E-commerce Platform"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Project Link (Repo/Live)</label>
                  <div className="relative">
                    <FiGlobe className="absolute left-4 top-3.5 text-slate-400 h-5 w-5" />
                    <input
                      type="url"
                      value={projectData.projectLink}
                      onChange={(e) => setProjectData({ ...projectData, projectLink: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      placeholder="https://github.com/... or live URL"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setIsProjectModalOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={isSubmitting}>Save Details</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isContribModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 w-full max-w-lg shadow-2xl relative my-auto max-h-[90vh] flex flex-col"
            >
              <button
                onClick={() => setIsContribModalOpen(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500 z-10"
              >
                <FiX className="h-5 w-5" />
              </button>
              
              <div className="mb-6 shrink-0 pr-8">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">My Contribution</h3>
                <p className="text-sm text-slate-500 mt-1">Log your work. Your guide will verify this at the end.</p>
              </div>

              <div className="overflow-y-auto px-1 -mx-1 flex-1">
                <form id="contrib-form" onSubmit={handleUpdateContribution} className="space-y-5 pb-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">My Role</label>
                    <input
                      type="text"
                      required
                      value={contribData.role}
                      onChange={(e) => setContribData({ ...contribData, role: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                      placeholder="e.g. Backend Developer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Key Responsibilities</label>
                    <textarea
                      rows={3}
                      value={contribData.responsibilities}
                      onChange={(e) => setContribData({ ...contribData, responsibilities: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                      placeholder="What was your main focus in the team?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Tasks Completed</label>
                    <textarea
                      rows={4}
                      value={contribData.tasksCompleted}
                      onChange={(e) => setContribData({ ...contribData, tasksCompleted: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-brand-50/30 dark:bg-slate-800/50 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                      placeholder="- Created API endpoints for user auth&#10;- Setup MongoDB schemas&#10;- Deployed to AWS"
                    />
                  </div>
                </form>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 dark:border-slate-800 mt-2 shrink-0">
                <Button variant="ghost" onClick={() => setIsContribModalOpen(false)}>Cancel</Button>
                <Button type="submit" form="contrib-form" loading={isSubmitting}>Submit Report</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentTeamPage;

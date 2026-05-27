import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiSave, FiX, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { updateGuideProfile } from '../../api/guideApi';
import toast from 'react-hot-toast';

/**
 * Guide Profile Page — allows guides to update their bio, expertise, and contact info.
 */
const GuideProfilePage = () => {
  const { user, updateLocalUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    expertise: user?.expertise || [],
  });
  const [newExpertise, setNewExpertise] = useState('');

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await updateGuideProfile(form);
      if (res.data?.success) {
        updateLocalUser(res.data.data.user);
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const addExpertise = () => {
    const trimmed = newExpertise.trim();
    if (trimmed && !form.expertise.includes(trimmed)) {
      setForm((prev) => ({ ...prev, expertise: [...prev.expertise, trimmed] }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (skill) => {
    setForm((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((s) => s !== skill),
    }));
  };

  return (
    <>
      <Helmet>
        <title>My Profile — InternHub</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            My Profile
          </h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-accent-500 text-white hover:bg-accent-600 transition-colors"
            >
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium rounded-xl bg-accent-500 text-white hover:bg-accent-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <FiSave className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="glass-card rounded-2xl p-6 md:p-8 space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-accent-400 to-secondary-500 flex items-center justify-center text-white font-bold text-3xl shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <FiUser className="h-4 w-4 text-slate-400" />
                {isEditing ? (
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="input-premium text-base font-semibold"
                    id="guide-name"
                  />
                ) : (
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {user?.name}
                  </h2>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 dark:text-slate-400">
                <FiMail className="h-4 w-4" />
                {user?.email}
              </div>
              <span className="inline-block mt-2 text-xs font-medium px-3 py-1 rounded-full bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400">
                Guide
              </span>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Phone
            </label>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <FiPhone className="h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="input-premium flex-1"
                  placeholder="Your phone number"
                  id="guide-phone"
                />
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                {user?.phone || 'Not set'}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bio
            </label>
            {isEditing ? (
              <textarea
                value={form.bio}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="input-premium w-full mt-1 min-h-[100px] resize-y"
                placeholder="Tell students about yourself, your experience, and how you can help..."
                maxLength={500}
                id="guide-bio"
              />
            ) : (
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {user?.bio || 'No bio set.'}
              </p>
            )}
          </div>

          {/* Expertise */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Areas of Expertise
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(isEditing ? form.expertise : user?.expertise || []).map(
                (skill) => (
                  <span
                    key={skill}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary-50 dark:bg-secondary-950/30 text-secondary-700 dark:text-secondary-400 flex items-center gap-1.5"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => removeExpertise(skill)}
                        className="hover:text-rose-500 transition-colors"
                        aria-label={`Remove ${skill}`}
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                )
              )}
              {!isEditing && (!user?.expertise || user.expertise.length === 0) && (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No expertise added yet.
                </p>
              )}
            </div>

            {isEditing && (
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="text"
                  value={newExpertise}
                  onChange={(e) => setNewExpertise(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addExpertise();
                    }
                  }}
                  className="input-premium flex-1"
                  placeholder="Add expertise (e.g., React, Machine Learning)"
                  id="new-expertise"
                />
                <button
                  type="button"
                  onClick={addExpertise}
                  className="px-3 py-2.5 rounded-xl bg-secondary-500 text-white hover:bg-secondary-600 transition-colors"
                  aria-label="Add expertise"
                >
                  <FiPlus className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default GuideProfilePage;

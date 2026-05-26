import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FiSave } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateProfile } from '../../api/userApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ProfilePage = () => {
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '', college: user?.college || '',
    department: user?.department || '', yearOfStudy: user?.yearOfStudy || '',
    skills: user?.skills?.join(', ') || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const yearOptions = [
    { value: '1st Year', label: '1st Year' }, { value: '2nd Year', label: '2nd Year' },
    { value: '3rd Year', label: '3rd Year' }, { value: '4th Year', label: '4th Year' },
    { value: 'Graduated', label: 'Graduated' }, { value: 'Other', label: 'Other' },
  ];

  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const data = { ...profileForm, skills: profileForm.skills.split(',').map((s) => s.trim()).filter(Boolean) };
      const res = await updateProfile(data);
      if (res.success) {
        updateLocalUser(res.data.user);
        toast.success('Profile updated successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <>
      <Helmet><title>My Profile — InternHub</title></Helmet>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your personal information.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Form */}
        <form onSubmit={handleProfileSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-2">Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="name" label="Full Name" value={profileForm.name} onChange={handleProfileChange} required />
            <Input name="phone" label="Phone" value={profileForm.phone} onChange={handleProfileChange} />
            <Input name="college" label="College" value={profileForm.college} onChange={handleProfileChange} />
            <Input name="department" label="Department" value={profileForm.department} onChange={handleProfileChange} />
            <Input name="yearOfStudy" label="Year" type="select" options={yearOptions} placeholder="Select" value={profileForm.yearOfStudy} onChange={handleProfileChange} />
            <Input name="skills" label="Skills (comma-separated)" placeholder="React, Node.js, Python" value={profileForm.skills} onChange={handleProfileChange} />
          </div>
          <Button type="submit" variant="primary" loading={profileLoading} icon={FiSave}>Save Changes</Button>
        </form>
      </div>
    </>
  );
};

export default ProfilePage;

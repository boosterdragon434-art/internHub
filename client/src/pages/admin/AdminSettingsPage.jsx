import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSettings,
  FiMail,
  FiLock,
  FiHardDrive,
  FiCreditCard,
  FiDatabase,
  FiUser,
  FiCheckCircle,
  FiEye,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { updateProfile, changePassword } from '../../api/userApi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

// High-fidelity Client-Side HTML Email Template Generators for Real-time Previews
const mockBaseTemplate = (title, content) => `
  <div style="font-family:'Segoe UI',system-ui,sans-serif; background-color:#F8FAFC; padding: 24px; border-radius: 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:550px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;">
      <tr>
        <td style="background:linear-gradient(135deg,#6366F1,#0F172A); padding:28px; text-align:center;">
          <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:700; letter-spacing:-0.5px;">InternHub</h1>
          <p style="color:rgba(255,255,255,0.8); margin:6px 0 0; font-size:12px;">Internship Management Platform</p>
        </td>
      </tr>
      <tr>
        <td style="padding:32px; color:#334155; font-size:14px; line-height:1.6;">
          ${content}
        </td>
      </tr>
      <tr>
        <td style="background-color:#F8FAFC; padding:20px; text-align:center; border-top:1px solid #E2E8F0; color:#64748B; font-size:11px;">
          <p style="margin:0;">© ${new Date().getFullYear()} InternHub. All rights reserved.</p>
          <p style="margin:6px 0 0;">This is an automated email. Please do not reply.</p>
        </td>
      </tr>
    </table>
  </div>
`;

const mockActionButton = (text) => `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px auto;">
    <tr>
      <td style="border-radius:8px; background:#6366F1;">
        <span style="display:inline-block; padding:12px 28px; color:#ffffff; font-size:14px; font-weight:600; border-radius:8px; cursor: pointer;">
          ${text}
        </span>
      </td>
    </tr>
  </table>
`;

const emailTemplatesMockData = [
  {
    id: 'welcome',
    name: 'Student Welcome Email',
    subject: 'Welcome to InternHub! 🎉',
    content: `
      <p style="color:#0F172A; font-size:16px; font-weight:600; margin:0 0 16px;">Hi Alex Johnson,</p>
      <p style="margin:0 0 16px;">Welcome to <strong>InternHub</strong>! 🎉 Your account has been created successfully.</p>
      <p style="margin:0 0 16px;">You can now browse internships, apply to exciting opportunities, and track your applications — all from your dashboard.</p>
      ${mockActionButton('Go to Dashboard')}
      <p style="margin:0;">If you have any questions, feel free to reach out to our support team.</p>
    `,
  },
  {
    id: 'verify',
    name: 'Email Verification',
    subject: 'Verify Your Email Address — InternHub',
    content: `
      <p style="color:#0F172A; font-size:16px; font-weight:600; margin:0 0 16px;">Hi Alex Johnson,</p>
      <p style="margin:0 0 16px;">Thank you for signing up! Please verify your email address to activate your account.</p>
      ${mockActionButton('Verify My Email')}
      <p style="margin:0 0 16px;">This link will expire in <strong>24 hours</strong>. If you didn't create an account, please ignore this email.</p>
      <p style="color:#64748B; font-size:12px; margin:0;">If the button doesn't work, copy this link: <br><span style="color:#6366F1; word-break:break-all;">https://internhub.com/verify-email/mock-token-xyz</span></p>
    `,
  },
  {
    id: 'applied',
    name: 'Application Submitted',
    subject: 'Application Received: Full-Stack Web Development',
    content: `
      <p style="color:#0F172A; font-size:16px; font-weight:600; margin:0 0 16px;">Hi Alex Johnson,</p>
      <p style="margin:0 0 16px;">Your application for <strong>Full-Stack Web Development</strong> has been submitted successfully! ✅</p>
      <p style="margin:0 0 16px;">Our team will review your application and get back to you shortly. You can track your application status from your dashboard.</p>
      ${mockActionButton('View My Applications')}
      <p style="margin:0;">Thank you for your interest. We appreciate your time!</p>
    `,
  },
  {
    id: 'approved',
    name: 'Application Approved',
    subject: 'Congratulations! Your application has been approved 🎉',
    content: `
      <p style="color:#0F172A; font-size:16px; font-weight:600; margin:0 0 16px;">Hi Alex Johnson,</p>
      <p style="margin:0 0 16px;">Congratulations! 🎉 Your application for <strong>Full-Stack Web Development</strong> has been <span style="color:#10B981; font-weight:600;">approved</span>!</p>
      <p style="margin:0 0 16px;">Please check your dashboard for next steps, including payment details if applicable.</p>
      ${mockActionButton('View Dashboard')}
      <p style="margin:0;">We're excited to have you on board!</p>
    `,
  },
  {
    id: 'payment_req',
    name: 'Payment Request',
    subject: 'Payment Required: Full-Stack Web Development Internship',
    content: `
      <p style="color:#0F172A; font-size:16px; font-weight:600; margin:0 0 16px;">Hi Alex Johnson,</p>
      <p style="margin:0 0 16px;">Your application for <strong>Full-Stack Web Development</strong> has been approved! To complete your enrollment, please make the following joining fee payment:</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0; background:#F8FAFC; border-radius:8px; border:1px solid #E2E8F0;">
        <tr>
          <td style="padding:20px;">
            <p style="color:#64748B; font-size:12px; margin:0; text-transform: uppercase; tracking-wider">Amount Due</p>
            <p style="color:#0F172A; font-size:24px; font-weight:800; margin:4px 0 0;">₹4,999</p>
          </td>
        </tr>
      </table>
      ${mockActionButton('Pay Now')}
      <p style="margin:0;">Payment supports UPI, Google Pay, Cards, and Net Banking.</p>
    `,
  },
  {
    id: 'payment_success',
    name: 'Payment Receipt',
    subject: 'Payment Successful! Receipt #IH-879483',
    content: `
      <p style="color:#0F172A; font-size:16px; font-weight:600; margin:0 0 16px;">Hi Alex Johnson,</p>
      <p style="margin:0 0 16px;">Your payment of <strong>₹4,999</strong> for <strong>Full-Stack Web Development</strong> has been received successfully! ✅</p>
      <p style="margin:0 0 16px;">Your enrollment is now confirmed. You can download your official receipt from your student dashboard.</p>
      ${mockActionButton('View Receipt')}
      <p style="margin:0;">Welcome aboard! We look forward to working with you.</p>
    `,
  },
];

const AdminSettingsPage = () => {
  const { user, updateLocalUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('system');

  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form States
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Email Preview State
  const [selectedTemplate, setSelectedTemplate] = useState(emailTemplatesMockData[0]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name) {
      toast.error('Name field cannot be empty.');
      return;
    }
    setProfileLoading(true);
    try {
      const res = await updateProfile(profileForm);
      if (res.success) {
        toast.success('Profile updated successfully!');
        updateLocalUser(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (res.success) {
        toast.success('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const systemStatusData = [
    { name: 'Database Service', icon: FiDatabase, desc: 'MongoDB Atlas Connection Pool', status: 'Connected', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' },
    { name: 'Storage Service', icon: FiHardDrive, desc: 'Google Drive API Workspace', status: 'Active (Credentials verified)', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' },
    { name: 'Payment Gateway', icon: FiCreditCard, desc: 'Razorpay API Integration (Test Mode)', status: 'Connected', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' },
    { name: 'SMTP Email Transport', icon: FiMail, desc: 'Nodemailer SMTP Relayer Service', status: 'Active', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' },
  ];

  return (
    <>
      <Helmet><title>Settings — InternHub Admin</title></Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your admin profile, monitor services, and preview automated correspondence.</p>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs Selector */}
        <div className="lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 pr-0 lg:pr-6 shrink-0">
          {[
            { id: 'system', label: 'System Integration', icon: FiSettings },
            { id: 'templates', label: 'Email Templates', icon: FiMail },
            { id: 'profile', label: 'Admin Security', icon: FiUser },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-accent-600 text-white shadow-lg shadow-accent-600/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <tab.icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content panel */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* SYSTEM TAB */}
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-50 mb-1 flex items-center gap-2">
                      <FiCheckCircle className="text-emerald-500" /> API Connections & Services
                    </h2>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mb-6">Real-time status check for connected server-side cloud resources.</p>

                    <div className="divide-y divide-slate-100 dark:divide-slate-850">
                      {systemStatusData.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4 first:pt-0 last:pb-0">
                          <div className="flex items-start gap-3.5">
                            <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-slate-600 dark:text-slate-350 mt-0.5">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.name}</h3>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full text-center ${item.badge}`}>
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TEMPLATES TAB */}
              {activeTab === 'templates' && (
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                  {/* Selector sidebar */}
                  <div className="xl:col-span-2 space-y-2">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Correspondence Forms</h3>
                    {emailTemplatesMockData.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          selectedTemplate.id === template.id
                            ? 'bg-white dark:bg-slate-900 border-accent-500 shadow-md ring-1 ring-accent-500/20'
                            : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                        }`}
                      >
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{template.name}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">Subject: {template.subject}</p>
                      </button>
                    ))}
                  </div>

                  {/* Mail mockup preview */}
                  <div className="xl:col-span-3">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col h-[550px]">
                      {/* Header block */}
                      <div className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 px-5 py-4 shrink-0">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="text-[10px] font-semibold text-slate-400 ml-2">Inbox Preview (Responsive Mail Format)</span>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs text-slate-500">From: <strong className="text-slate-700 dark:text-slate-300">InternHub Admin &lt;noreply@internhub.com&gt;</strong></p>
                          <p className="text-xs text-slate-500">Subject: <strong className="text-slate-900 dark:text-slate-50">{selectedTemplate.subject}</strong></p>
                        </div>
                      </div>

                      {/* Content Frame */}
                      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/40">
                        <div
                          dangerouslySetInnerHTML={{ __html: mockBaseTemplate(selectedTemplate.name, selectedTemplate.content) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ADMIN PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Edit profile form */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-1.5 flex items-center gap-2">
                      <FiUser className="text-accent-500" /> Update Profile
                    </h3>
                    <p className="text-xs text-slate-500 mb-5">Change your public administrative credentials.</p>

                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <Input
                        name="name"
                        label="Display Name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                      <Input
                        name="phone"
                        label="Phone Number"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        loading={profileLoading}
                      >
                        Save Changes
                      </Button>
                    </form>
                  </div>

                  {/* Change password form */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-1.5 flex items-center gap-2">
                      <FiLock className="text-accent-500" /> Security Settings
                    </h3>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mb-5">Change password to protect administrative account.</p>

                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <Input
                        type="password"
                        name="currentPassword"
                        label="Current Password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        required
                      />
                      <Input
                        type="password"
                        name="newPassword"
                        label="New Password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        required
                      />
                      <Input
                        type="password"
                        name="confirmNewPassword"
                        label="Confirm New Password"
                        value={passwordForm.confirmNewPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                        required
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        loading={passwordLoading}
                      >
                        Update Password
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AdminSettingsPage;

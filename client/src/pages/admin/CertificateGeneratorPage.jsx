import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAward,
  FiSearch,
  FiPlus,
  FiX,
  FiTrash2,
  FiEdit3,
  FiStar,
  FiImage,
  FiSliders,
  FiSave,
  FiUploadCloud,
  FiLayout,
  FiType,
  FiUsers,
  FiLayers,
  FiZoomIn,
  FiZoomOut,
  FiGrid,
  FiCopy,
  FiLock,
  FiUnlock,
  FiRotateCw,
  FiRotateCcw,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiMove,
} from 'react-icons/fi';
import { getAllApplications } from '../../api/applicationApi';
import {
  generateCertificate,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../../api/certificateApi';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────

const FIELD_OPTIONS = [
  { value: 'studentName', label: 'Student Name', color: '#6366F1' },
  { value: 'courseName', label: 'Course / Program', color: '#0EA5E9' },
  { value: 'date', label: 'Issue Date', color: '#059669' },
  { value: 'certificateId', label: 'Certificate ID', color: '#D97706' },
  { value: 'serialNumber', label: 'Serial Number', color: '#EC4899' },
  { value: 'instructorName', label: 'Guide / Instructor', color: '#8B5CF6' },
  { value: 'customText', label: 'Custom Text', color: '#64748B' },
  { value: 'wipe', label: 'Wipe (Blank Box)', color: '#94A3B8' },
];

const FONT_OPTIONS = [
  'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique',
  'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic',
  'Courier', 'Courier-Bold',
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '08/05/2026' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY', example: '08-05-2026' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '05/08/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-05-08' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY', example: '08 May 2026' },
  { value: 'MMMM DD, YYYY', label: 'Month DD, YYYY', example: 'May 08, 2026' },
];

const MOCK_DATA = {
  studentName: 'John Doe',
  courseName: 'Advanced Certificate in AI Engineering',
  certificateId: 'CERT-0001-ABCD',
  serialNumber: '0001',
  instructorName: 'Dr. Jane Smith',
};

const PREVIEW_DATE = new Date('2026-05-08T00:00:00');
const MIN_CANVAS_FONT_SIZE = 4;

const TABS = [
  { id: 'students', label: 'Eligible Students', icon: FiUsers },
  { id: 'templates', label: 'Templates Workspace', icon: FiLayout },
];

const getOverlayBoxX = (anchorX, width, align = 'left') => {
  if (align === 'center') return anchorX - width / 2;
  if (align === 'right') return anchorX - width;
  return anchorX;
};

const formatPreviewDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  switch (format) {
    case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'DD MMM YYYY': return `${day} ${shortMonths[d.getMonth()]} ${year}`;
    case 'MMMM DD, YYYY': return `${longMonths[d.getMonth()]} ${day}, ${year}`;
    default: return `${day}/${month}/${year}`;
  }
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

const CertificateGeneratorPage = () => {
  const [activeTab, setActiveTab] = useState('students');

  // ── Students Tab State ──
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Generation Modal State ──
  const [selectedApp, setSelectedApp] = useState(null);
  const [grade, setGrade] = useState('A+');
  const [skillsText, setSkillsText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);

  // ── Templates Tab State ──
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // ── Advanced Editor State ──
  const [editorTemplate, setEditorTemplate] = useState(null);

  // ── Template Upload State ──
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', description: '', backgroundImage: '', backgroundPreview: '', isDefault: false });
  const [uploading, setUploading] = useState(false);
  const uploadFileRef = useRef(null);

  // ── Data Fetch ──
  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const response = await getAllApplications({ limit: 100 });
      if (response?.success) {
        const eligible = (response.data || []).filter((app) =>
          ['Joined', 'Payment Completed'].includes(app.status)
        );
        setApplications(eligible);
      }
    } catch (err) {
      toast.error('Failed to load eligible applications');
    } finally {
      setLoadingApps(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const response = await getTemplates();
      if (response?.data?.success) {
        setTemplates(response.data.data || []);
      }
    } catch (err) {
      toast.error('Failed to load certificate templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    fetchTemplates();
  }, [fetchApplications, fetchTemplates]);

  // ── Handlers ──

  const handleIssueCertificate = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setGenerating(true);
    try {
      const skillsAcquired = skillsText.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      const payload = { applicationId: selectedApp._id, grade, skillsAcquired };
      if (selectedTemplateId) payload.templateId = selectedTemplateId;

      const response = await generateCertificate(payload);
      if (response.data?.success) {
        toast.success('Certificate generated and student notified!');
        setSelectedApp(null);
        setSkillsText('');
        setSelectedTemplateId('');
        fetchApplications();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleUploadBgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setUploadForm((p) => ({ ...p, backgroundImage: reader.result, backgroundPreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!uploadForm.name.trim()) { toast.error('Template name is required'); return; }
    if (!uploadForm.backgroundImage) { toast.error('Background image is required'); return; }
    setUploading(true);
    try {
      await createTemplate({
        name: uploadForm.name,
        description: uploadForm.description,
        backgroundImage: uploadForm.backgroundImage,
        isDefault: uploadForm.isDefault,
      });
      toast.success('Template created! Open the editor to configure overlays.');
      setShowUploadModal(false);
      setUploadForm({ name: '', description: '', backgroundImage: '', backgroundPreview: '', isDefault: false });
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create template');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Delete this template permanently?')) return;
    try {
      await deleteTemplate(id);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      (app.user?.name || '').toLowerCase().includes(q) ||
      (app.user?.email || '').toLowerCase().includes(q) ||
      (app.internship?.title || '').toLowerCase().includes(q)
    );
  });

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <Helmet><title>Certificate Generation Board — InternHub</title></Helmet>

      {/* Header */}
      <div className="glass-card hover-glow p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 flex items-center gap-4">
        <div className="w-12 h-12 bg-violet-600/10 border border-violet-500/20 text-violet-500 dark:text-violet-400 rounded-2xl flex items-center justify-center shrink-0">
          <FiAward className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-400 dark:to-indigo-300 bg-clip-text text-transparent">
            System Credentials Hub
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Upload templates, configure overlay positions visually, and generate credentials.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'students' && (
          <motion.div key="students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <StudentsTab loading={loadingApps} filteredApps={filteredApps} searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSelectedApp={setSelectedApp} />
          </motion.div>
        )}
        {activeTab === 'templates' && (
          <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <TemplatesTab
              loading={loadingTemplates}
              templates={templates}
              onUpload={() => setShowUploadModal(true)}
              onEdit={(tpl) => setEditorTemplate(tpl)}
              onDelete={handleDeleteTemplate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Issuance Modal */}
      <AnimatePresence>
        {selectedApp && (
          <IssuanceModal
            selectedApp={selectedApp} grade={grade} setGrade={setGrade}
            skillsText={skillsText} setSkillsText={setSkillsText}
            selectedTemplateId={selectedTemplateId} setSelectedTemplateId={setSelectedTemplateId}
            templates={templates} generating={generating}
            onClose={() => setSelectedApp(null)} onSubmit={handleIssueCertificate}
          />
        )}
      </AnimatePresence>

      {/* Upload Template Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadTemplateModal
            form={uploadForm} setForm={setUploadForm} uploading={uploading}
            fileRef={uploadFileRef} onBgChange={handleUploadBgChange}
            onClose={() => { setShowUploadModal(false); setUploadForm({ name: '', description: '', backgroundImage: '', backgroundPreview: '', isDefault: false }); }}
            onSubmit={handleCreateTemplate}
          />
        )}
      </AnimatePresence>

      {/* Advanced Template Editor (Full Screen) */}
      <AnimatePresence>
        {editorTemplate && (
          <AdvancedEditor
            template={editorTemplate}
            onSaved={(updated) => { setEditorTemplate(null); fetchTemplates(); }}
            onClose={() => setEditorTemplate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// StudentsTab
// ─────────────────────────────────────────────────────────────
const StudentsTab = ({ loading, filteredApps, searchQuery, setSearchQuery, setSelectedApp }) => (
  <>
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
      <div className="relative flex-1 min-w-[200px] w-full sm:max-w-xs">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text" placeholder="Search students..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition"
        />
      </div>
    </div>
    {loading ? (
      <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
    ) : filteredApps.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredApps.map((app) => (
          <motion.div key={app._id} whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col space-y-4 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                  {app.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">{app.user?.name}</h3>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">{app.user?.email}</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15">{app.status}</span>
            </div>
            <div>
              <h4 className="text-slate-800 dark:text-slate-100 font-bold text-sm leading-tight line-clamp-1">{app.internship?.title}</h4>
              <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase mt-0.5 font-semibold">Cohort Program</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p><strong>Duration:</strong> {app.internship?.duration || '3 Months'}</p>
              <p><strong>College:</strong> {app.user?.college || 'N/A'}</p>
            </div>
            <button onClick={() => setSelectedApp(app)} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-600/15">
              <FiAward className="w-4 h-4" /> Issue Certificate
            </button>
          </motion.div>
        ))}
      </div>
    ) : (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm">No eligible student applications found.</div>
    )}
  </>
);

// ─────────────────────────────────────────────────────────────
// TemplatesTab
// ─────────────────────────────────────────────────────────────
const TemplatesTab = ({ loading, templates, onUpload, onEdit, onDelete }) => (
  <>
    <div className="flex justify-between items-center">
      <p className="text-sm text-slate-600 dark:text-slate-400">{templates.length} template{templates.length !== 1 ? 's' : ''} configured</p>
      <button onClick={onUpload} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/15">
        <FiUploadCloud className="w-4 h-4" /> Upload Template
      </button>
    </div>
    {loading ? (
      <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
    ) : templates.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {templates.map((tpl) => (
          <motion.div key={tpl._id} whileHover={{ y: -3 }} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
              {tpl.backgroundImageUrl ? (
                <img src={tpl.backgroundImageUrl} alt={tpl.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <div className="text-center"><FiAward className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-1" /><span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Classic Design</span></div>
              )}
              {tpl.isDefault && (
                <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-amber-500/90 text-white text-[9px] font-bold uppercase rounded-full"><FiStar className="w-3 h-3" /> Default</span>
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur text-white text-[9px] font-bold rounded-full">
                {tpl.overlays?.length || 0} overlays
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{tpl.name}</h3>
                {tpl.description && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{tpl.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(tpl)} className="flex-1 py-2 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition border border-violet-200 dark:border-violet-800">
                  <FiSliders className="w-3.5 h-3.5" /> Open Editor
                </button>
                <button onClick={() => onDelete(tpl._id)} className="py-2 px-3 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-semibold flex items-center justify-center transition border border-red-200 dark:border-red-800">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">No templates yet. Upload a certificate background to get started.</div>
    )}
  </>
);

// ─────────────────────────────────────────────────────────────
// UploadTemplateModal
// ─────────────────────────────────────────────────────────────
const UploadTemplateModal = ({ form, setForm, uploading, fileRef, onBgChange, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
    <motion.form onSubmit={onSubmit} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><FiUploadCloud className="text-violet-500 w-4 h-4" /> Upload New Template</h3>
        <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"><FiX className="w-4.5 h-4.5" /></button>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Template Name *</label>
        <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="E.g. Modern Gradient Blue" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition" required />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={2} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition resize-none" />
      </div>
      <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
        {form.backgroundPreview ? (
          <img src={form.backgroundPreview} alt="Preview" className="max-h-28 rounded-lg shadow-md" />
        ) : (
          <><FiUploadCloud className="w-8 h-8 text-slate-400 group-hover:text-violet-500 transition mb-2" /><span className="text-xs text-slate-500">Click to upload background (PNG/JPG, max 5MB)</span></>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onBgChange} className="hidden" />
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 rounded accent-violet-600" />
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Set as default template</span>
      </label>
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold transition">Cancel</button>
        <button type="submit" disabled={uploading} className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/20">
          {uploading ? 'Uploading...' : 'Create Template'}
        </button>
      </div>
    </motion.form>
  </div>
);

// ─────────────────────────────────────────────────────────────
// IssuanceModal
// ─────────────────────────────────────────────────────────────
const IssuanceModal = ({ selectedApp, grade, setGrade, skillsText, setSkillsText, selectedTemplateId, setSelectedTemplateId, templates, generating, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
    <motion.form onSubmit={onSubmit} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><FiAward className="text-violet-600 dark:text-violet-400 w-4 h-4" /> Generate Certificate</h3>
        <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"><FiX className="w-4.5 h-4.5" /></button>
      </div>
      <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
        <p className="text-slate-700 dark:text-slate-300"><strong>Student:</strong> {selectedApp.user?.name}</p>
        <p className="text-slate-700 dark:text-slate-300"><strong>Internship:</strong> {selectedApp.internship?.title}</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1"><FiLayout className="w-3 h-3" /> Certificate Template</label>
        <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition">
          <option value="">Default (Classic Gold Border)</option>
          {templates.map((tpl) => (<option key={tpl._id} value={tpl._id}>{tpl.name} {tpl.isDefault ? '★' : ''} ({tpl.overlays?.length || 0} overlays)</option>))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Performance Grade</label>
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition">
          <option value="A+">A+ (Outstanding)</option><option value="A">A (Excellent)</option><option value="B+">B+ (Very Good)</option><option value="B">B (Good)</option><option value="C">C (Satisfactory)</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Skills Acquired</label>
        <input type="text" placeholder="React, Node.js, Mongoose..." value={skillsText} onChange={(e) => setSkillsText(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition" />
        <span className="block text-[9px] text-slate-400">Comma-separated keywords.</span>
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold transition">Cancel</button>
        <button type="submit" disabled={generating} className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/20">{generating ? 'Issuing...' : 'Issue Credential'}</button>
      </div>
    </motion.form>
  </div>
);

// ─────────────────────────────────────────────────────────────
// AdvancedEditor — Canvas-based visual overlay editor
// ─────────────────────────────────────────────────────────────
const AdvancedEditor = ({ template, onSaved, onClose }) => {
  const [overlays, setOverlays] = useState((template.overlays || []).map((o) => ({ ...o })));
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(template.metadata?.editorZoom || 80);
  const [showGrid, setShowGrid] = useState(template.metadata?.showGrid || false);
  const [gridSize, setGridSize] = useState(template.metadata?.gridSize || 10);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [locked, setLocked] = useState(new Set());
  const [history, setHistory] = useState([overlays]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [templateImg, setTemplateImg] = useState(null);
  const canvasRef = useRef(null);

  // Load template background image
  useEffect(() => {
    if (!template.backgroundImageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setTemplateImg(img);
    img.onerror = () => toast.error('Failed to load template background');
    img.src = template.backgroundImageUrl;
  }, [template.backgroundImageUrl]);

  // Canvas render
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const scale = zoom / 100;
    const baseW = template.width || 842;
    const baseH = template.height || 595;
    const renderW = baseW * scale;
    const renderH = baseH * scale;

    canvas.width = renderW;
    canvas.height = renderH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, renderW, renderH);

    if (templateImg) {
      ctx.drawImage(templateImg, 0, 0, renderW, renderH);
    } else {
      // Draw placeholder gradient
      const grad = ctx.createLinearGradient(0, 0, renderW, renderH);
      grad.addColorStop(0, '#f1f5f9');
      grad.addColorStop(1, '#e0e7ff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, renderW, renderH);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No background loaded', renderW / 2, renderH / 2);
    }

    // Grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;
      const gridPx = (gridSize / 100) * baseW * scale;
      for (let x = 0; x < renderW; x += gridPx) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, renderH); ctx.stroke(); }
      for (let y = 0; y < renderH; y += gridPx) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(renderW, y); ctx.stroke(); }
    }

    // Render overlays
    overlays.forEach((overlay) => {
      if (!overlay.visible) return;
      const x = (overlay.x / 100) * renderW;
      const y = (overlay.y / 100) * renderH;
      let fontSize = overlay.fontSize * scale;
      const maxWidth = (overlay.maxWidth / 100) * renderW;
      const height = (overlay.height / 100) * renderH;
      const isSelected = selected?.id === overlay.id;

      if (overlay.field === 'wipe') {
        ctx.save();
        if (overlay.rotation) { ctx.translate(x, y); ctx.rotate((overlay.rotation * Math.PI) / 180); ctx.translate(-x, -y); }
        ctx.fillStyle = overlay.color || '#ffffff';
        ctx.globalAlpha = overlay.opacity ?? 1;
        ctx.fillRect(x - maxWidth / 2, y - height / 2, maxWidth, height);
        if (isSelected) { ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.strokeRect(x - maxWidth / 2, y - height / 2, maxWidth, height); ctx.setLineDash([]); }
        ctx.restore();
        return;
      }

      const textValue = overlay.field === 'date'
        ? formatPreviewDate(PREVIEW_DATE, overlay.dateFormat)
        : overlay.field === 'customText'
          ? (overlay.customText || 'Custom Text')
          : MOCK_DATA[overlay.field] || overlay.field;
      const text = overlay.uppercase ? String(textValue).toUpperCase() : String(textValue);

      const boxX = getOverlayBoxX(x, maxWidth, overlay.align || 'left');
      ctx.strokeStyle = isSelected ? '#6366f1' : 'rgba(150, 150, 150, 0.4)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.setLineDash(isSelected ? [5, 5] : [3, 3]);
      ctx.strokeRect(boxX, y - height / 2, maxWidth, height);
      ctx.setLineDash([]);

      // Field color indicator dot
      const fieldInfo = FIELD_OPTIONS.find((f) => f.value === overlay.field);
      if (fieldInfo && isSelected) {
        ctx.fillStyle = fieldInfo.color;
        ctx.beginPath();
        ctx.arc(boxX - 6, y - height / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.save();
      ctx.font = `${overlay.fontWeight === 'bold' ? 'bold' : 'normal'} ${fontSize}px ${overlay.fontFamily || 'Arial'}`;
      ctx.fillStyle = overlay.color || '#000000';
      ctx.globalAlpha = overlay.opacity ?? 1;
      ctx.textAlign = overlay.align || 'left';

      if (overlay.rotation) { ctx.translate(x, y); ctx.rotate((overlay.rotation * Math.PI) / 180); ctx.translate(-x, -y); }

      // Word wrap
      let lines = wrapText(ctx, text, maxWidth);
      let lineHeight = fontSize * (overlay.lineHeight || 1.2);
      while (fontSize > MIN_CANVAS_FONT_SIZE && lines.length * lineHeight > height) {
        fontSize -= 0.5;
        ctx.font = `${overlay.fontWeight === 'bold' ? 'bold' : 'normal'} ${fontSize}px ${overlay.fontFamily || 'Arial'}`;
        lines = wrapText(ctx, text, maxWidth);
        lineHeight = fontSize * (overlay.lineHeight || 1.2);
      }
      const textBlockH = lines.length * lineHeight;
      const firstY = y - textBlockH / 2 + fontSize * 0.8;
      lines.forEach((line, idx) => ctx.fillText(line, x, firstY + idx * lineHeight));
      ctx.restore();
    });
  }, [templateImg, overlays, zoom, showGrid, gridSize, template, selected]);

  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach((word) => {
      const test = current + (current ? ' ' : '') + word;
      if (ctx.measureText(test).width > maxWidth && current) { lines.push(current); current = word; }
      else current = test;
    });
    if (current) lines.push(current);
    return lines;
  };

  // Overlay management
  const saveToHistory = (state) => { setHistory((h) => [...h.slice(0, historyIndex + 1), state]); setHistoryIndex((i) => i + 1); };
  const undo = () => { if (historyIndex > 0) { setHistoryIndex((i) => i - 1); setOverlays(history[historyIndex - 1]); } };
  const redo = () => { if (historyIndex < history.length - 1) { setHistoryIndex((i) => i + 1); setOverlays(history[historyIndex + 1]); } };

  const updateOverlay = (id, updates) => {
    setOverlays((prev) => { const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o)); saveToHistory(updated); return updated; });
    if (selected?.id === id) setSelected((prev) => ({ ...prev, ...updates }));
  };

  const addOverlay = (forcedField = null) => {
    const field = forcedField || 'studentName';
    const newOv = {
      id: `ov_${Date.now()}_${Math.random().toString(36).slice(9)}`,
      field, x: 50, y: 50, fontSize: 24, fontWeight: 'normal', letterSpacing: 0, lineHeight: 1.2,
      fontFamily: 'Helvetica-Bold', color: field === 'wipe' ? '#ffffff' : '#000000', align: 'center',
      maxWidth: field === 'wipe' ? 20 : 60, uppercase: false, rotation: 0, opacity: 1, visible: true,
      customText: '', dateFormat: 'DD/MM/YYYY', height: 5,
    };
    const updated = [...overlays, newOv];
    setOverlays(updated); setSelected(newOv); saveToHistory(updated);
  };

  const deleteOverlay = (id) => {
    const updated = overlays.filter((o) => o.id !== id);
    setOverlays(updated); if (selected?.id === id) setSelected(null); saveToHistory(updated);
  };

  const duplicateOverlay = (id) => {
    const orig = overlays.find((o) => o.id === id);
    if (!orig) return;
    const copy = { ...orig, id: `ov_${Date.now()}_${Math.random().toString(36).slice(9)}`, x: Math.min(100, orig.x + 5), y: Math.min(100, orig.y + 5) };
    const updated = [...overlays, copy];
    setOverlays(updated); setSelected(copy); saveToHistory(updated);
  };

  const toggleLock = (id) => setLocked((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  // Canvas drag
  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 100;
    const my = ((e.clientY - rect.top) / rect.height) * 100;
    const hit = [...overlays].reverse().find((o) => {
      if (!o.visible) return false;
      const ox = o.x, oy = o.y, ow = o.maxWidth, oh = o.height;
      const bx = o.field === 'wipe' ? ox - ow / 2 : o.align === 'center' ? ox - ow / 2 : o.align === 'right' ? ox - ow : ox;
      return mx >= bx - 2 && mx <= bx + ow + 2 && Math.abs(oy - my) < oh / 2 + 2;
    });
    if (hit) { if (!locked.has(hit.id)) { setDragging(hit.id); setSelected(hit); } }
    else { setSelected(null); }
  };

  const handleCanvasMouseMove = (e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    let y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    if (showGrid) { x = Math.round(x / gridSize) * gridSize; y = Math.round(y / gridSize) * gridSize; }
    updateOverlay(dragging, { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) });
  };

  const handleCanvasMouseUp = () => setDragging(null);

  // Save to API
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateTemplate(template._id, { overlays, metadata: { editorZoom: zoom, showGrid, gridSize } });
      if (res.data?.success) {
        toast.success('Template saved!');
        onSaved?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const fieldLabel = (field) => FIELD_OPTIONS.find((f) => f.value === field)?.label || field;
  const fieldColor = (field) => FIELD_OPTIONS.find((f) => f.value === field)?.color || '#64748B';

  // ─── Render ──
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-full md:max-h-[95vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <FiLayers className="text-violet-500" size={20} />
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Advanced Template Editor</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{template.name} — Drag to position, use controls to customize</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={historyIndex === 0} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition" title="Undo"><FiRotateCcw size={14} /></button>
            <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition" title="Redo"><FiRotateCw size={14} /></button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-emerald-600/20 disabled:opacity-50">
              {saving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSave size={14} />} Save
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"><FiX size={18} /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom((z) => Math.max(30, z - 10))} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition" title="Zoom out"><FiZoomOut size={14} /></button>
                <input type="range" min="30" max="200" value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-28 h-1.5 rounded-lg accent-violet-600" />
                <button onClick={() => setZoom((z) => Math.min(200, z + 10))} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition" title="Zoom in"><FiZoomIn size={14} /></button>
                <span className="text-[10px] font-bold text-slate-500 w-10 text-center">{zoom}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg transition ${showGrid ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`} title="Toggle grid"><FiGrid size={14} /></button>
                <div className="flex items-center gap-1">
                  <button onClick={() => addOverlay('studentName')} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg rounded-r-none transition"><FiPlus size={12} /> Add Field</button>
                  <button onClick={() => addOverlay('wipe')} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded-lg rounded-l-none border-l border-slate-600 transition" title="Add Wipe"><FiLayers size={12} /> Wipe</button>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className="border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-xl cursor-grab active:cursor-grabbing max-w-full max-h-full"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-80 xl:w-96 shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">

            {/* Overlay List */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Overlays ({overlays.length})</p>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {overlays.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">No overlays. Click "Add Field" to start.</p>
                ) : overlays.map((o) => (
                  <div
                    key={o.id}
                    onClick={() => setSelected(o)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all text-[11px] ${
                      selected?.id === o.id
                        ? 'bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fieldColor(o.field) }} />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-700 dark:text-slate-300 truncate">{fieldLabel(o.field)}</p>
                        <p className="text-[9px] text-slate-400 truncate">{o.x.toFixed(1)}%, {o.y.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); toggleLock(o.id); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" title={locked.has(o.id) ? 'Unlock' : 'Lock'}>
                        {locked.has(o.id) ? <FiLock size={11} /> : <FiUnlock size={11} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); updateOverlay(o.id, { visible: !o.visible }); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        {o.visible ? <FiEye size={11} /> : <FiEyeOff size={11} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteOverlay(o.id); }} className="p-1 text-red-400 hover:text-red-600">
                        <FiX size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Properties Panel */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {!selected ? (
                <p className="text-[10px] text-slate-400 text-center py-8">Select an overlay to edit properties</p>
              ) : (
                <>
                  {/* Field type */}
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Field Type</label>
                    <select value={selected.field} onChange={(e) => { const f = e.target.value; const u = { field: f }; if (f === 'date') u.dateFormat = selected.dateFormat || 'DD/MM/YYYY'; if (f === 'wipe') { u.color = '#ffffff'; u.maxWidth = Math.max(selected.maxWidth || 20, 20); } updateOverlay(selected.id, u); }}
                      className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500"
                    >
                      {FIELD_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>

                  {/* Custom text */}
                  {selected.field === 'customText' && (
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Text Content</label>
                      <textarea value={selected.customText} onChange={(e) => updateOverlay(selected.id, { customText: e.target.value })} placeholder="Your static text..." rows={2} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none resize-none focus:ring-1 focus:ring-violet-500" />
                    </div>
                  )}

                  {/* Date format */}
                  {selected.field === 'date' && (
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Date Format</label>
                      <select value={selected.dateFormat || 'DD/MM/YYYY'} onChange={(e) => updateOverlay(selected.id, { dateFormat: e.target.value })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500">
                        {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label} — {f.example}</option>)}
                      </select>
                      <p className="mt-1 text-[9px] text-slate-500">Preview: {formatPreviewDate(PREVIEW_DATE, selected.dateFormat || 'DD/MM/YYYY')}</p>
                    </div>
                  )}

                  {/* Position */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">X (%)</label>
                      <input type="number" min="0" max="100" step="0.1" value={selected.x} onChange={(e) => updateOverlay(selected.id, { x: parseFloat(e.target.value) || 0 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Y (%)</label>
                      <input type="number" min="0" max="100" step="0.1" value={selected.y} onChange={(e) => updateOverlay(selected.id, { y: parseFloat(e.target.value) || 0 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" />
                    </div>
                  </div>

                  {/* Size */}
                  <div className="grid grid-cols-2 gap-2">
                    {selected.field !== 'wipe' && (
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Font Size (pt)</label>
                        <input type="number" min="4" max="120" value={selected.fontSize} onChange={(e) => updateOverlay(selected.id, { fontSize: parseInt(e.target.value) || 24 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" />
                      </div>
                    )}
                    <div className={selected.field === 'wipe' ? 'col-span-2' : ''}>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">{selected.field === 'wipe' ? 'Width (%)' : 'Max Width (%)'}</label>
                      <input type="number" min="1" max="100" value={selected.maxWidth} onChange={(e) => updateOverlay(selected.id, { maxWidth: parseInt(e.target.value) || 10 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Height (%)</label>
                    <input type="number" min="0.1" max="100" step="0.1" value={selected.height || 5} onChange={(e) => updateOverlay(selected.id, { height: parseFloat(e.target.value) || 5 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" />
                  </div>

                  {/* Font */}
                  {selected.field !== 'wipe' && (
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Font Family</label>
                      <select value={selected.fontFamily} onChange={(e) => updateOverlay(selected.id, { fontFamily: e.target.value })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500">
                        {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Weight + Align */}
                  {selected.field !== 'wipe' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Weight</label>
                        <select value={selected.fontWeight} onChange={(e) => updateOverlay(selected.id, { fontWeight: e.target.value })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none">
                          <option value="normal">Normal</option><option value="bold">Bold</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Align</label>
                        <select value={selected.align} onChange={(e) => updateOverlay(selected.id, { align: e.target.value })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none">
                          <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Color + Opacity */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">{selected.field === 'wipe' ? 'Box Color' : 'Color'}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={selected.color} onChange={(e) => updateOverlay(selected.id, { color: e.target.value })} className="w-8 h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" />
                        <span className="text-[9px] text-slate-500 font-mono">{selected.color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Opacity ({(selected.opacity * 100).toFixed(0)}%)</label>
                      <input type="range" min="0" max="1" step="0.05" value={selected.opacity} onChange={(e) => updateOverlay(selected.id, { opacity: parseFloat(e.target.value) })} className="w-full accent-violet-600" />
                    </div>
                  </div>

                  {/* Line Height + Rotation */}
                  {selected.field !== 'wipe' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Line Height ({selected.lineHeight}x)</label>
                        <input type="range" min="0.8" max="2.5" step="0.1" value={selected.lineHeight} onChange={(e) => updateOverlay(selected.id, { lineHeight: parseFloat(e.target.value) })} className="w-full accent-violet-600" />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Rotation ({selected.rotation}°)</label>
                        <input type="range" min="0" max="360" value={selected.rotation} onChange={(e) => updateOverlay(selected.id, { rotation: parseInt(e.target.value) })} className="w-full accent-violet-600" />
                      </div>
                    </div>
                  )}

                  {/* Uppercase checkbox */}
                  {selected.field !== 'wipe' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selected.uppercase} onChange={(e) => updateOverlay(selected.id, { uppercase: e.target.checked })} className="w-3.5 h-3.5 rounded accent-violet-600" />
                      <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">UPPERCASE text</span>
                    </label>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                    <button onClick={() => duplicateOverlay(selected.id)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition border border-blue-200 dark:border-blue-800">
                      <FiCopy size={11} /> Duplicate
                    </button>
                    <button onClick={() => deleteOverlay(selected.id)} className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold transition border border-red-200 dark:border-red-800">
                      <FiTrash2 size={11} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CertificateGeneratorPage;

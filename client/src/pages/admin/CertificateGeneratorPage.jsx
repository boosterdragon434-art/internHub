import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiAward, FiSearch, FiPlus, FiX, FiTrash2, FiEdit3, FiStar, FiSliders, FiSave, FiUploadCloud,
  FiLayout, FiUsers, FiLayers, FiZoomIn, FiZoomOut, FiGrid, FiCopy, FiLock, FiUnlock,
  FiRotateCw, FiRotateCcw, FiEye, FiEyeOff, FiRefreshCw, FiCheck, FiDownload,
  FiAlertCircle, FiToggleLeft, FiToggleRight, FiFilter, FiFile, FiHardDrive, FiCheckSquare,
  FiArrowUp, FiArrowDown,
} from 'react-icons/fi';
import { getAllApplications } from '../../api/applicationApi';
import {
  generateCertificate, getTemplates, createTemplate, updateTemplate, deleteTemplate,
  toggleTemplateStatus, getTemplateStats, bulkGenerate, previewCertificate, downloadTemplateFile, duplicateTemplate, testRenderTemplate
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
  { value: 'startDate', label: 'Start Date', color: '#10B981' },
  { value: 'endDate', label: 'End Date', color: '#F59E0B' },
  { value: 'collegeName', label: 'College / University', color: '#3B82F6' },
  { value: 'companyName', label: 'Company Name', color: '#8B5CF6' },
  { value: 'grade', label: 'Grade / Score', color: '#EF4444' },
  { value: 'skills', label: 'Skills Acquired', color: '#F43F5E' },
  { value: 'performance', label: 'Performance Rating', color: '#FCD34D' },
  { value: 'customText', label: 'Custom Text', color: '#64748B' },
  { value: 'wipe', label: 'Wipe (Blank Box)', color: '#94A3B8' },
  { value: 'qrCode', label: 'QR Code', color: '#14B8A6' },
  { value: 'logo', label: 'Logo', color: '#3B82F6' },
  { value: 'signature', label: 'Signature', color: '#0EA5E9' },
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

const MOCK_DATA = { studentName: 'John Doe', courseName: 'Advanced Certificate in AI Engineering', certificateId: 'CERT-0001-ABCD', serialNumber: '0001', instructorName: 'Dr. Jane Smith' };
const PREVIEW_DATE = new Date('2026-05-08T00:00:00');
const MIN_CANVAS_FONT_SIZE = 4;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

const TABS = [
  { id: 'students', label: 'Student Applications', icon: FiUsers },
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

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
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
  const [internshipFilter, setInternshipFilter] = useState('');
  const [bulkSelected, setBulkSelected] = useState(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);

  // ── Generation Modal State ──
  const [selectedApp, setSelectedApp] = useState(null);
  const [grade, setGrade] = useState('A+');
  const [skillsText, setSkillsText] = useState('');
  const [performance, setPerformance] = useState('Excellent');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [generating, setGenerating] = useState(false);

  // ── Templates Tab State ──
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateStatusFilter, setTemplateStatusFilter] = useState('all');
  const [templateStats, setTemplateStats] = useState(null);

  // ── Advanced Editor State ──
  const [editorTemplate, setEditorTemplate] = useState(null);

  // ── Template Upload State ──
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ name: '', description: '', backgroundImage: '', backgroundPreview: '', isDefault: false, fileName: '', fileSize: 0, documentCategory: 'certificate', pageFormat: 'A4', orientation: 'landscape', customTextTemplate: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadFileRef = useRef(null);

  // ── Preview State ──
  const [previewData, setPreviewData] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  // ── Data Fetch ──
  const fetchApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      const response = await getAllApplications({ limit: 500 });
      if (response?.success) {
        setApplications(response.data || []);
      }
    } catch {
      toast.error('Failed to load eligible applications');
    } finally {
      setLoadingApps(false);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const [templatesRes, statsRes] = await Promise.all([
        getTemplates(),
        getTemplateStats(),
      ]);
      if (templatesRes?.data?.success) setTemplates(templatesRes.data.data || []);
      if (statsRes?.data?.success) setTemplateStats(statsRes.data.data);
    } catch {
      toast.error('Failed to load certificate templates');
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    fetchTemplates();
  }, [fetchApplications, fetchTemplates]);

  // ── File Handling ──
  const processFile = (file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Use PNG, JPG, WebP, or PDF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large (${formatBytes(file.size)}). Maximum is 10MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (file.type.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          setUploadForm((p) => ({
            ...p,
            backgroundImage: reader.result,
            backgroundPreview: reader.result,
            fileName: file.name,
            fileSize: file.size,
            width: img.width,
            height: img.height,
          }));
        };
        img.src = reader.result;
      } else {
        setUploadForm((p) => ({
          ...p,
          backgroundImage: reader.result,
          backgroundPreview: '',
          fileName: file.name,
          fileSize: file.size,
          width: 842,
          height: 595,
        }));
      }
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsDataURL(file);
  };

  const handleUploadBgChange = (e) => processFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };

  // ── Handlers ──
  const handleIssueCertificate = async (e, forceOverwrite = false) => {
    if (e) e.preventDefault();
    if (!selectedApp) return;
    setGenerating(true);
    try {
      const skillsAcquired = skillsText.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
      const payload = { applicationId: selectedApp._id, grade, skillsAcquired, performance, overwrite: forceOverwrite };
      if (selectedTemplateId) payload.templateId = selectedTemplateId;
      const response = await generateCertificate(payload);
      if (response.data?.success) {
        toast.success('Certificate generated and student notified!');
        setSelectedApp(null);
        setSkillsText('');
        setPerformance('Excellent');
        setSelectedTemplateId('');
        fetchApplications();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkGenerate = async (forceOverwrite = false) => {
    if (bulkSelected.size === 0) return;
    if (!window.confirm(`Generate certificates for ${bulkSelected.size} students? Each will receive an email automatically.`)) return;
    setBulkGenerating(true);
    try {
      const payload = { applicationIds: Array.from(bulkSelected), grade, skillsAcquired: [], performance, overwrite: forceOverwrite };
      if (selectedTemplateId) payload.templateId = selectedTemplateId;
      const response = await bulkGenerate(payload);
      if (response.data?.success) {
        const data = response.data.data;
        toast.success(`${data.succeeded}/${data.total} certificates generated!`);
        if (data.failed > 0) {
          toast(`${data.failed} failed. Check details.`, { icon: '⚠️' });
        }
        setBulkSelected(new Set());
        fetchApplications();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk generation failed');
    } finally {
      setBulkGenerating(false);
    }
  };

  const handlePreview = async (app) => {
    setPreviewing(true);
    try {
      const payload = { applicationId: app._id, grade };
      if (selectedTemplateId) payload.templateId = selectedTemplateId;
      const response = await previewCertificate(payload);
      if (response.data?.success) {
        setPreviewData(response.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Preview failed');
    } finally {
      setPreviewing(false);
    }
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!uploadForm.name.trim()) { toast.error('Template name is required'); return; }
    if (!uploadForm.backgroundImage) { toast.error('Background image is required'); return; }
    setUploading(true);
    setUploadProgress(0);
    try {
      await createTemplate(
        { name: uploadForm.name, description: uploadForm.description, backgroundImage: uploadForm.backgroundImage, isDefault: uploadForm.isDefault, documentCategory: uploadForm.documentCategory, pageFormat: uploadForm.pageFormat, orientation: uploadForm.orientation, customTextTemplate: uploadForm.customTextTemplate, width: uploadForm.width, height: uploadForm.height, customPageWidth: uploadForm.customPageWidth, customPageHeight: uploadForm.customPageHeight },
        (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(pct);
        }
      );
      toast.success('Template created! Open the editor to configure overlays.');
      setShowUploadModal(false);
      setUploadForm({ name: '', description: '', backgroundImage: '', backgroundPreview: '', isDefault: false, fileName: '', fileSize: 0, documentCategory: 'certificate', pageFormat: 'A4', orientation: 'landscape', customTextTemplate: '', width: 842, height: 595 });
      setUploadProgress(0);
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
      toast.error(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await toggleTemplateStatus(id, newStatus);
      toast.success(`Template ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDuplicateTemplate = async (id) => {
    try {
      await duplicateTemplate(id);
      toast.success('Template duplicated');
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate template');
    }
  };

  const handleTestRender = async (tpl) => {
    try {
      const response = await testRenderTemplate(tpl._id);
      setPreviewData({
        pdfBase64: response.data.data.pdfBase64.split(',')[1], // strip data prefix if present
        studentName: 'Test Render',
        internshipTitle: tpl.name,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to test render template');
    }
  };

  const handleDownloadTemplate = async (tpl) => {
    try {
      const response = await downloadTemplateFile(tpl._id);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tpl.name.replace(/\s+/g, '_')}.${tpl.templateType === 'pdf' ? 'pdf' : 'png'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download template');
    }
  };

  const toggleBulkSelect = (appId) => {
    setBulkSelected((prev) => {
      const s = new Set(prev);
      s.has(appId) ? s.delete(appId) : s.add(appId);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (bulkSelected.size === filteredApps.length) {
      setBulkSelected(new Set());
    } else {
      setBulkSelected(new Set(filteredApps.map((a) => a._id)));
    }
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = (
      (app.user?.name || '').toLowerCase().includes(q) ||
      (app.user?.email || '').toLowerCase().includes(q) ||
      (app.internship?.title || '').toLowerCase().includes(q)
    );
    const matchInternship = internshipFilter ? app.internship?._id === internshipFilter : true;
    return matchSearch && matchInternship;
  });

  const uniqueInternships = Array.from(new Set(applications.map(app => app.internship?._id)))
    .map(id => applications.find(a => a.internship?._id === id)?.internship)
    .filter(Boolean);

  const filteredTemplates = templates.filter((tpl) => {
    const matchSearch = !templateSearch || tpl.name.toLowerCase().includes(templateSearch.toLowerCase());
    const matchStatus = templateStatusFilter === 'all' || tpl.status === templateStatusFilter;
    return matchSearch && matchStatus;
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
            <StudentsTab
              loading={loadingApps} filteredApps={filteredApps} searchQuery={searchQuery}
              setSearchQuery={setSearchQuery} setSelectedApp={setSelectedApp}
              bulkSelected={bulkSelected} toggleBulkSelect={toggleBulkSelect}
              toggleSelectAll={toggleSelectAll} handleBulkGenerate={handleBulkGenerate}
              bulkGenerating={bulkGenerating} onPreview={handlePreview}
              templates={templates} selectedTemplateId={selectedTemplateId}
              setSelectedTemplateId={setSelectedTemplateId} grade={grade} setGrade={setGrade}
              uniqueInternships={uniqueInternships} internshipFilter={internshipFilter} setInternshipFilter={setInternshipFilter}
            />
          </motion.div>
        )}
        {activeTab === 'templates' && (
          <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            <TemplatesTab
              loading={loadingTemplates} templates={filteredTemplates} stats={templateStats}
              searchQuery={templateSearch} setSearchQuery={setTemplateSearch}
              statusFilter={templateStatusFilter} setStatusFilter={setTemplateStatusFilter}
              onUpload={() => setShowUploadModal(true)} onEdit={(tpl) => setEditorTemplate(tpl)}
              onDelete={handleDeleteTemplate} onToggleStatus={handleToggleStatus}
              onDownload={handleDownloadTemplate} onDuplicate={handleDuplicateTemplate}
              onTestRender={handleTestRender}
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
            performance={performance} setPerformance={setPerformance}
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
            uploadProgress={uploadProgress} isDragOver={isDragOver}
            fileRef={uploadFileRef} onBgChange={handleUploadBgChange}
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onClose={() => { setShowUploadModal(false); setUploadForm({ name: '', description: '', backgroundImage: '', backgroundPreview: '', isDefault: false, fileName: '', fileSize: 0, documentCategory: 'certificate', pageFormat: 'A4', orientation: 'landscape', customTextTemplate: '' }); }}
            onSubmit={handleCreateTemplate}
          />
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewData && (
          <PreviewModal data={previewData} onClose={() => setPreviewData(null)} />
        )}
      </AnimatePresence>

      {/* Advanced Template Editor (Full Screen) */}
      <AnimatePresence>
        {editorTemplate && (
          <AdvancedEditor
            template={editorTemplate}
            onSaved={() => { setEditorTemplate(null); fetchTemplates(); }}
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
const StudentsTab = ({ loading, filteredApps, searchQuery, setSearchQuery, setSelectedApp, bulkSelected, toggleBulkSelect, toggleSelectAll, handleBulkGenerate, bulkGenerating, onPreview, templates, selectedTemplateId, setSelectedTemplateId, grade, setGrade, uniqueInternships, internshipFilter, setInternshipFilter }) => (
  <>
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20">
      <div className="flex flex-col sm:flex-row flex-1 gap-3 w-full sm:max-w-xl">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl text-slate-800 dark:text-slate-200 outline-none transition" />
        </div>
        <select value={internshipFilter} onChange={(e) => setInternshipFilter(e.target.value)}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 outline-none transition cursor-pointer">
          <option value="">All Internships (Select one to filter)</option>
          {uniqueInternships.map(int => <option key={int._id} value={int._id}>{int.title}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {filteredApps.length > 0 && (
          <>
            <button onClick={toggleSelectAll} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 transition border border-slate-200 dark:border-slate-700">
              <FiCheckSquare className="w-3.5 h-3.5" />
              {bulkSelected.size === filteredApps.length ? 'Deselect All' : 'Select All'}
            </button>
            {bulkSelected.size > 0 && (
              <>
                <button onClick={() => handleBulkGenerate(true)} disabled={bulkGenerating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-red-600/15">
                  {bulkGenerating ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiAlertCircle className="w-3.5 h-3.5" />}
                  Revoke & Re-issue
                </button>
                <button onClick={() => handleBulkGenerate(false)} disabled={bulkGenerating}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-600/15">
                  {bulkGenerating ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiAward className="w-3.5 h-3.5" />}
                  Issue {bulkSelected.size} Document{bulkSelected.size !== 1 ? 's' : ''}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>

    {loading ? (
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>{[1,2,3,4,5].map(i => <th key={i} className="px-4 py-4"><div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full animate-pulse" /></th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {[1,2,3,4,5].map(i => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-4"><div className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                <td className="px-4 py-4"><div className="flex gap-3"><div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full shrink-0" /><div><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-2" /><div className="h-2 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></div></div></td>
                <td className="px-4 py-4"><div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded mb-2" /><div className="h-2 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                <td className="px-4 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                <td className="px-4 py-4 text-right"><div className="flex justify-end gap-2"><div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" /><div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : filteredApps.length > 0 ? (
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-xs uppercase font-extrabold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3.5 w-12 text-center">
                <button onClick={toggleSelectAll} className={`w-5 h-5 rounded flex items-center justify-center border transition ${bulkSelected.size === filteredApps.length && filteredApps.length > 0 ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'}`}>
                  {bulkSelected.size === filteredApps.length && filteredApps.length > 0 && <FiCheck className="w-3.5 h-3.5" />}
                </button>
              </th>
              <th className="px-4 py-3.5 tracking-wider">Student Details</th>
              <th className="px-4 py-3.5 tracking-wider">Internship Program</th>
              <th className="px-4 py-3.5 tracking-wider">Status</th>
              <th className="px-4 py-3.5 tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredApps.map((app) => (
              <tr key={app._id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group ${bulkSelected.has(app._id) ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => toggleBulkSelect(app._id)} className={`w-5 h-5 rounded flex items-center justify-center border transition mx-auto ${bulkSelected.has(app._id) ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 group-hover:border-violet-400'}`}>
                    {bulkSelected.has(app._id) && <FiCheck className="w-3.5 h-3.5" />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {app.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{app.user?.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{app.user?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 dark:text-slate-300 truncate max-w-[200px] sm:max-w-[300px]">{app.internship?.title}</p>
                  <p className="text-[10px] text-slate-500">Duration: {app.internship?.duration || '3 Months'}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    ['Joined', 'Payment Completed'].includes(app.status)
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20'
                  }`}>
                    {app.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => onPreview(app)} className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition border border-slate-200 dark:border-slate-700" title="Preview">
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setSelectedApp(app)} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-violet-500/20">
                      <FiAward className="w-3.5 h-3.5" /> Issue
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-sm">No student applications found.</div>
    )}
  </>
);

// ─────────────────────────────────────────────────────────────
// TemplatesTab
// ─────────────────────────────────────────────────────────────
const TemplatesTab = ({ loading, templates, stats, searchQuery, setSearchQuery, statusFilter, setStatusFilter, onUpload, onEdit, onDelete, onToggleStatus, onDownload, onDuplicate, onTestRender }) => (
  <>
    {/* Stats Bar */}
    {stats && (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: FiFile, color: 'text-blue-500' },
          { label: 'Active', value: stats.active, icon: FiCheck, color: 'text-emerald-500' },
          { label: 'Inactive', value: stats.inactive, icon: FiAlertCircle, color: 'text-amber-500' },
          { label: 'Storage', value: stats.storageFormatted, icon: FiHardDrive, color: 'text-violet-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div><p className="text-[10px] text-slate-500 uppercase font-bold">{s.label}</p><p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{s.value}</p></div>
          </div>
        ))}
      </div>
    )}

    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div className="flex items-center gap-2 flex-wrap flex-1">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input type="text" placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg text-slate-800 dark:text-slate-200 outline-none transition" />
        </div>
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          {['all', 'active', 'inactive'].map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold capitalize transition ${
                statusFilter === f ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500'
              }`}>{f}</button>
          ))}
        </div>
      </div>
      <button onClick={onUpload} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/15">
        <FiUploadCloud className="w-4 h-4" /> Upload Template
      </button>
    </div>

    {loading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1,2,3].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden animate-pulse">
            <div className="h-36 bg-slate-200 dark:bg-slate-800" />
            <div className="p-4 space-y-3"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" /><div className="flex gap-2"><div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg flex-1" /><div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-lg w-10" /></div></div>
          </div>
        ))}
      </div>
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
              <span className={`absolute top-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                tpl.status === 'active' ? 'bg-emerald-500/90 text-white' : 'bg-slate-500/80 text-white'
              }`}>{tpl.status}</span>
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur text-white text-[9px] font-bold rounded-full">
                {tpl.overlays?.length || 0} overlays
              </span>
              {tpl.fileSize > 0 && (
                <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur text-white text-[9px] font-bold rounded-full">
                  {formatBytes(tpl.fileSize)}
                </span>
              )}
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{tpl.name}</h3>
                {tpl.description && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{tpl.description}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(tpl)} className="flex-1 py-2 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition border border-violet-200 dark:border-violet-800">
                  <FiSliders className="w-3.5 h-3.5" /> Editor
                </button>
                <button onClick={() => onToggleStatus(tpl._id, tpl.status)} className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] transition border border-slate-200 dark:border-slate-700" title={tpl.status === 'active' ? 'Deactivate' : 'Activate'}>
                  {tpl.status === 'active' ? <FiToggleRight className="w-4 h-4 text-emerald-500" /> : <FiToggleLeft className="w-4 h-4" />}
                </button>
                <button onClick={() => onDuplicate(tpl._id)} className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] transition border border-slate-200 dark:border-slate-700" title="Duplicate">
                  <FiCopy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDownload(tpl)} className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] transition border border-slate-200 dark:border-slate-700" title="Download">
                  <FiDownload className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onTestRender(tpl)} className="py-2 px-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] transition border border-slate-200 dark:border-slate-700" title="Test Render">
                  <FiEye className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => onDelete(tpl._id)} className="py-2 px-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-[10px] transition border border-red-200 dark:border-red-800" title="Delete">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    ) : (
      <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">No templates found. Upload a certificate background to get started.</div>
    )}
  </>
);

// ─────────────────────────────────────────────────────────────
// UploadTemplateModal
// ─────────────────────────────────────────────────────────────
const UploadTemplateModal = ({ form, setForm, uploading, uploadProgress, isDragOver, fileRef, onBgChange, onDrop, onDragOver, onDragLeave, onClose, onSubmit }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
    <motion.form onSubmit={onSubmit} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><FiUploadCloud className="text-violet-500 w-4 h-4" /> Upload New Template</h3>
        <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"><FiX className="w-4 h-4" /></button>
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Template Name *</label>
        <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="E.g. Modern Gradient Blue"
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition" required />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description..." rows={2}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Document Type *</label>
          <select value={form.documentCategory} onChange={(e) => setForm((p) => ({ ...p, documentCategory: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition">
            <option value="certificate">Certificate</option>
            <option value="offer_letter">Offer Letter</option>
            <option value="joining_letter">Joining Letter</option>
            <option value="completion_letter">Completion Letter</option>
            <option value="appreciation_letter">Appreciation Letter</option>
            <option value="custom">Custom Letter</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Page Format *</label>
          <select value={form.pageFormat} onChange={(e) => setForm((p) => ({ ...p, pageFormat: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition">
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
      </div>
      
      {form.pageFormat === 'Custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Width (pts)</label>
            <input type="number" min="100" max="5000" value={form.customPageWidth || 842} onChange={(e) => setForm((p) => ({ ...p, customPageWidth: Number(e.target.value) }))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Height (pts)</label>
            <input type="number" min="100" max="5000" value={form.customPageHeight || 595} onChange={(e) => setForm((p) => ({ ...p, customPageHeight: Number(e.target.value) }))}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 outline-none transition" />
          </div>
        </div>
      )}
      
      <div>
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Orientation *</label>
        <div className="flex gap-2">
          <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl cursor-pointer border transition ${form.orientation === 'landscape' ? 'bg-violet-50 border-violet-500 text-violet-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <input type="radio" name="orientation" value="landscape" checked={form.orientation === 'landscape'} onChange={(e) => setForm((p) => ({ ...p, orientation: e.target.value }))} className="hidden" />
            <FiLayout className="w-4 h-4 rotate-90" /> <span className="text-xs font-semibold">Landscape</span>
          </label>
          <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl cursor-pointer border transition ${form.orientation === 'portrait' ? 'bg-violet-50 border-violet-500 text-violet-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
            <input type="radio" name="orientation" value="portrait" checked={form.orientation === 'portrait'} onChange={(e) => setForm((p) => ({ ...p, orientation: e.target.value }))} className="hidden" />
            <FiLayout className="w-4 h-4" /> <span className="text-xs font-semibold">Portrait</span>
          </label>
        </div>
      </div>

      {/* Aspect Ratio Warning */}
      {form.width && form.height && form.orientation && form.backgroundImage && (
        ((form.orientation === 'landscape' && form.width < form.height) || 
        (form.orientation === 'portrait' && form.width > form.height))
      ) && (
        <div className="flex gap-2 items-start p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-xs">
          <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>This image looks {form.width > form.height ? 'landscape' : 'portrait'} but <strong>{form.orientation}</strong> is selected. The background will be stretched to fit the PDF dimensions.</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={() => fileRef.current?.click()}
        onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group ${
          isDragOver
            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20 scale-[1.02]'
            : form.backgroundPreview || form.fileName
              ? 'border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10'
              : 'border-slate-300 dark:border-slate-700 hover:border-violet-500'
        }`}
      >
        {form.backgroundPreview ? (
          <div className="space-y-2 text-center">
            <img src={form.backgroundPreview} alt="Preview" className="max-h-28 rounded-lg shadow-md mx-auto" />
            <p className="text-[10px] text-slate-500 font-medium">{form.fileName} ({formatBytes(form.fileSize)})</p>
          </div>
        ) : form.fileName ? (
          <div className="space-y-2 text-center">
            <FiFile className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">{form.fileName}</p>
            <p className="text-[10px] text-slate-500">{formatBytes(form.fileSize)}</p>
          </div>
        ) : (
          <>
            <FiUploadCloud className={`w-8 h-8 mb-2 transition ${isDragOver ? 'text-violet-500 scale-110' : 'text-slate-400 group-hover:text-violet-500'}`} />
            <span className="text-xs text-slate-500 text-center">
              {isDragOver ? 'Drop file here!' : 'Drag & drop or click to upload'}
            </span>
            <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP, PDF — max 10MB</span>
          </>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={onBgChange} className="hidden" />

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} className="w-4 h-4 rounded accent-violet-600" />
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Set as default template</span>
      </label>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-500"><span>Uploading...</span><span>{uploadProgress}%</span></div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${uploadProgress}%` }}
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold transition">Cancel</button>
        <button type="submit" disabled={uploading}
          className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/20">
          {uploading ? `Uploading ${uploadProgress}%...` : 'Create Template'}
        </button>
      </div>
    </motion.form>
  </div>
);

// ─────────────────────────────────────────────────────────────
// IssuanceModal
// ─────────────────────────────────────────────────────────────
const IssuanceModal = ({ selectedApp, grade, setGrade, skillsText, setSkillsText, performance, setPerformance, selectedTemplateId, setSelectedTemplateId, templates, generating, onClose, onSubmit }) => {
  const selectedTemplate = templates.find(t => t._id === selectedTemplateId);
  const isCertificate = !selectedTemplate || selectedTemplate.documentCategory === 'certificate';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><FiAward className="text-violet-600 dark:text-violet-400 w-4 h-4" /> Issue Document</h3>
          <button type="button" onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-slate-800"><FiX className="w-4 h-4" /></button>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
          <p className="text-slate-700 dark:text-slate-300"><strong>Student:</strong> {selectedApp.user?.name}</p>
          <p className="text-slate-700 dark:text-slate-300"><strong>Internship:</strong> {selectedApp.internship?.title}</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1"><FiLayout className="w-3 h-3" /> Select Document Template</label>
          <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition cursor-pointer">
            <option value="">Default Certificate (Classic Gold Border)</option>
            {['certificate', 'offer_letter', 'joining_letter', 'completion_letter', 'appreciation_letter', 'custom'].map(cat => {
              const catTemplates = templates.filter(t => t.status === 'active' && (t.documentCategory === cat || (!t.documentCategory && cat === 'certificate')));
              if (catTemplates.length === 0) return null;
              return (
                <optgroup key={cat} label={cat.replace('_', ' ').toUpperCase()}>
                  {catTemplates.map(tpl => (
                    <option key={tpl._id} value={tpl._id}>{tpl.name} {tpl.isDefault ? '★' : ''}</option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>
        
        {isCertificate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Performance Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition">
                <option value="A+">A+ (Outstanding)</option><option value="A">A (Excellent)</option><option value="B+">B+ (Very Good)</option><option value="B">B (Good)</option><option value="C">C (Satisfactory)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Skills Acquired</label>
              <input type="text" placeholder="React, Node.js, Mongoose..." value={skillsText} onChange={(e) => setSkillsText(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition" />
              <span className="block text-[9px] text-slate-400">Comma-separated keywords.</span>
            </div>
          </motion.div>
        )}
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Custom Performance Rating</label>
          <select value={performance} onChange={(e) => setPerformance(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none transition">
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
            <option value="Worse">Worse</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold transition">Cancel</button>
          
          {isCertificate && (
            <button type="button" disabled={generating} onClick={(e) => onSubmit(e, true)}
              className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-red-600/20">
              {generating ? 'Revoking...' : 'Force Revoke & Re-issue'}
            </button>
          )}

          <button type="button" disabled={generating} onClick={(e) => onSubmit(e, false)}
            className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-indigo-600/20">
            {generating ? <span className="flex items-center gap-1.5"><FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> Issuing...</span> : 'Issue Document'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// PreviewModal
// ─────────────────────────────────────────────────────────────
const PreviewModal = ({ data, onClose }) => {
  const pdfUrl = `data:application/pdf;base64,${data.pdfBase64}`;
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Preview_${data.studentName.replace(/\s+/g, '_')}.pdf`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"><FiEye className="text-violet-500 w-4 h-4" /> Certificate Preview</h3>
            <p className="text-[10px] text-slate-500">{data.studentName} — {data.internshipTitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><FiX className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950">
          <iframe src={pdfUrl} title="Certificate Preview" className="w-full rounded-lg border border-slate-300 dark:border-slate-700" style={{ height: '70vh' }} />
        </div>
        <div className="flex justify-end gap-3 px-5 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button onClick={handleDownload} className="flex items-center gap-1.5 px-4 py-2 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-semibold transition"><FiDownload className="w-3.5 h-3.5" /> Download Preview</button>
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold transition">Close</button>
        </div>
      </motion.div>
    </div>
  );
};

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
  const [replacingBg, setReplacingBg] = useState(false);
  const canvasRef = useRef(null);
  const replaceBgRef = useRef(null);

  const handleReplaceBg = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Invalid file type'); return; }
    
    setReplacingBg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await updateTemplate(template._id, { backgroundImage: reader.result, overlays, metadata: { editorZoom: zoom, showGrid, gridSize } });
        if (res.data?.success) {
          toast.success('Background replaced!');
          onSaved?.(res.data.data);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to replace background');
      } finally {
        setReplacingBg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load template background image
  useEffect(() => {
    if (!template.backgroundImageUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setTemplateImg(img);
    img.onerror = () => toast.error('Failed to load template background');
    img.src = template.backgroundImageUrl;
  }, [template.backgroundImageUrl]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Delete' && selected && !e.ctrlKey) { deleteOverlay(selected.id); }
      if (selected && !locked.has(selected.id) && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.2;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        updateOverlay(selected.id, { x: Math.max(0, Math.min(100, selected.x + dx)), y: Math.max(0, Math.min(100, selected.y + dy)) });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

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

    if (showGrid) {
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
      ctx.lineWidth = 1;
      const gridPx = (gridSize / 100) * baseW * scale;
      for (let x = 0; x < renderW; x += gridPx) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, renderH); ctx.stroke(); }
      for (let y = 0; y < renderH; y += gridPx) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(renderW, y); ctx.stroke(); }
    }

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
        : overlay.field === 'customText' ? (overlay.customText || 'Custom Text') : MOCK_DATA[overlay.field] || overlay.field;
      const text = overlay.uppercase ? String(textValue).toUpperCase() : String(textValue);
      const boxX = getOverlayBoxX(x, maxWidth, overlay.align || 'left');
      ctx.strokeStyle = isSelected ? '#6366f1' : 'rgba(150, 150, 150, 0.4)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.setLineDash(isSelected ? [5, 5] : [3, 3]);
      ctx.strokeRect(boxX, y - height / 2, maxWidth, height);
      ctx.setLineDash([]);

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
      if (ctx.letterSpacing !== undefined) {
        ctx.letterSpacing = `${(overlay.letterSpacing || 0) * scale}px`;
      }
      if (overlay.rotation) { ctx.translate(x, y); ctx.rotate((overlay.rotation * Math.PI) / 180); ctx.translate(-x, -y); }

      let lines = wrapText(ctx, text, maxWidth);
      let lineHeight = fontSize * (overlay.lineHeight || 1.2);
      let textHeight = lines.length * lineHeight;
      if (textHeight > height && fontSize > 6) {
        const scaleFactor = Math.max(0.5, height / textHeight);
        fontSize = Math.max(6, fontSize * scaleFactor);
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

  const saveToHistory = (state) => { setHistory((h) => [...h.slice(0, historyIndex + 1), state]); setHistoryIndex((i) => i + 1); };
  const undo = () => { if (historyIndex > 0) { setHistoryIndex((i) => i - 1); setOverlays(history[historyIndex - 1]); } };
  const redo = () => { if (historyIndex < history.length - 1) { setHistoryIndex((i) => i + 1); setOverlays(history[historyIndex + 1]); } };

  const updateOverlay = (id, updates, noHistory = false) => {
    setOverlays((prev) => { const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o)); if(!noHistory) saveToHistory(updated); return updated; });
    if (selected?.id === id) setSelected((prev) => ({ ...prev, ...updates }));
  };

  const addOverlay = (forcedField = null) => {
    const field = forcedField || 'studentName';
    const newOv = {
      id: `ov_${Date.now()}_${Math.random().toString(36).slice(9)}`, field, x: 50, y: 50, fontSize: 24, fontWeight: 'normal', letterSpacing: 0, lineHeight: 1.2,
      fontFamily: 'Helvetica-Bold', color: field === 'wipe' ? '#ffffff' : '#000000', align: 'center',
      maxWidth: field === 'wipe' ? 20 : 60, uppercase: false, rotation: 0, opacity: 1, visible: true, customText: '', dateFormat: 'DD/MM/YYYY', height: 5,
    };
    const updated = [...overlays, newOv];
    setOverlays(updated); setSelected(newOv); saveToHistory(updated);
  };

  const deleteOverlay = (id) => { const updated = overlays.filter((o) => o.id !== id); setOverlays(updated); if (selected?.id === id) setSelected(null); saveToHistory(updated); };
  const duplicateOverlay = (id) => {
    const orig = overlays.find((o) => o.id === id); if (!orig) return;
    const copy = { ...orig, id: `ov_${Date.now()}_${Math.random().toString(36).slice(9)}`, x: Math.min(100, orig.x + 5), y: Math.min(100, orig.y + 5) };
    const updated = [...overlays, copy]; setOverlays(updated); setSelected(copy); saveToHistory(updated);
  };
  
  const moveOverlayForward = (id) => {
    setOverlays((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx < 0 || idx === prev.length - 1) return prev;
      const updated = [...prev];
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      saveToHistory(updated);
      return updated;
    });
  };

  const moveOverlayBackward = (id) => {
    setOverlays((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx <= 0) return prev;
      const updated = [...prev];
      [updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]];
      saveToHistory(updated);
      return updated;
    });
  };

  const toggleLock = (id) => setLocked((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

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
    updateOverlay(dragging, { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) }, true);
  };

  const handleCanvasMouseUp = () => {
    if (dragging) {
      setOverlays(prev => { saveToHistory(prev); return prev; });
      setDragging(null);
    }
  };

  // Touch support for mobile
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    handleCanvasMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  };
  const handleTouchMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleCanvasMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

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

  const handleClose = () => {
    if (historyIndex > 0 && !window.confirm('You have unsaved changes. Are you sure you want to close?')) return;
    onClose();
  };

  const fieldLabel = (field) => FIELD_OPTIONS.find((f) => f.value === field)?.label || field;
  const fieldColor = (field) => FIELD_OPTIONS.find((f) => f.value === field)?.color || '#64748B';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-full md:max-h-[95vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <FiLayers className="text-violet-500" size={20} />
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Advanced Template Editor</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{template.name} — Drag to position | Ctrl+S save | Ctrl+Z undo | Delete remove</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={historyIndex === 0} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition" title="Undo (Ctrl+Z)"><FiRotateCcw size={14} /></button>
            <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition" title="Redo (Ctrl+Y)"><FiRotateCw size={14} /></button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-emerald-600/20 disabled:opacity-50">
              {saving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSave size={14} />} Save
            </button>
            <button onClick={handleClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"><FiX size={18} /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Canvas Area */}
          <div className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom((z) => Math.max(10, z - 10))} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"><FiZoomOut size={14} /></button>
                <input type="range" min="10" max="300" value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-28 h-1.5 rounded-lg accent-violet-600" />
                <button onClick={() => setZoom((z) => Math.min(300, z + 10))} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition"><FiZoomIn size={14} /></button>
                <span className="text-[10px] font-bold text-slate-500 w-10 text-center">{zoom}%</span>
              </div>
              <div className="flex items-center gap-2">
                <input ref={replaceBgRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleReplaceBg} className="hidden" />
                <button onClick={() => replaceBgRef.current?.click()} disabled={replacingBg} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg transition disabled:opacity-50">
                  {replacingBg ? <FiRefreshCw size={12} className="animate-spin" /> : <FiUploadCloud size={12} />}
                  Replace BG
                </button>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg transition ${showGrid ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}><FiGrid size={14} /></button>
                <div className="flex items-center gap-1">
                  <button onClick={() => addOverlay('studentName')} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg rounded-r-none transition"><FiPlus size={12} /> Add Field</button>
                  <button onClick={() => addOverlay('wipe')} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold rounded-lg rounded-l-none border-l border-slate-600 transition"><FiLayers size={12} /> Wipe</button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 relative">
              <div className="min-w-full min-h-full w-fit h-fit p-8 flex">
                <canvas ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown} onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp} onMouseLeave={handleCanvasMouseUp}
                  onTouchStart={handleTouchStart} onTouchMove={handleTouchMove}
                  onTouchEnd={handleCanvasMouseUp}
                  className="m-auto border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-xl cursor-grab active:cursor-grabbing touch-none max-w-none"
                  style={{ imageRendering: 'auto' }} />
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-80 xl:w-96 shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden max-h-[40vh] md:max-h-none">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Overlays ({overlays.length})</p>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {overlays.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center py-4">No overlays. Click "Add Field" to start.</p>
                ) : overlays.map((o) => (
                  <div key={o.id} onClick={() => setSelected(o)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all text-[11px] ${
                      selected?.id === o.id ? 'bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fieldColor(o.field) }} />
                      <div className="min-w-0"><p className="font-bold text-slate-700 dark:text-slate-300 truncate">{fieldLabel(o.field)}</p><p className="text-[9px] text-slate-400 truncate">{o.x.toFixed(1)}%, {o.y.toFixed(1)}%</p></div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); toggleLock(o.id); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">{locked.has(o.id) ? <FiLock size={11} /> : <FiUnlock size={11} />}</button>
                      <button onClick={(e) => { e.stopPropagation(); updateOverlay(o.id, { visible: !o.visible }); }} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">{o.visible ? <FiEye size={11} /> : <FiEyeOff size={11} />}</button>
                      <button onClick={(e) => { e.stopPropagation(); deleteOverlay(o.id); }} className="p-1 text-red-400 hover:text-red-600"><FiX size={11} /></button>
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
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Field Type</label>
                    <select value={selected.field} onChange={(e) => { const f = e.target.value; const u = { field: f }; if (f === 'date') u.dateFormat = selected.dateFormat || 'DD/MM/YYYY'; if (f === 'wipe') { u.color = '#ffffff'; u.maxWidth = Math.max(selected.maxWidth || 20, 20); } updateOverlay(selected.id, u); }}
                      className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500">
                      {FIELD_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  {selected.field === 'customText' && (
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Text Content (Supports {'{{variables}}'})</label>
                      <textarea value={selected.customText} onChange={(e) => updateOverlay(selected.id, { customText: e.target.value })} placeholder="Your static text or {{student_name}}..." rows={4} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none resize-none focus:ring-1 focus:ring-violet-500" />
                      <p className="mt-1 text-[9px] text-slate-500 font-mono">Available: {'{{student_name}}, {{internship_role}}, {{start_date}}, {{end_date}}, {{company_name}}'}</p>
                    </div>
                  )}
                  {selected.field === 'date' && (
                    <div><label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1">Date Format</label>
                      <select value={selected.dateFormat || 'DD/MM/YYYY'} onChange={(e) => updateOverlay(selected.id, { dateFormat: e.target.value })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500">
                        {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label} — {f.example}</option>)}
                      </select>
                      <p className="mt-1 text-[9px] text-slate-500">Preview: {formatPreviewDate(PREVIEW_DATE, selected.dateFormat || 'DD/MM/YYYY')}</p></div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">X (%)</label><input type="number" min="0" max="100" step="0.1" value={selected.x} onChange={(e) => updateOverlay(selected.id, { x: parseFloat(e.target.value) || 0 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" /></div>
                    <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Y (%)</label><input type="number" min="0" max="100" step="0.1" value={selected.y} onChange={(e) => updateOverlay(selected.id, { y: parseFloat(e.target.value) || 0 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.field !== 'wipe' && (
                      <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Font Size</label><input type="number" min="4" max="120" value={selected.fontSize} onChange={(e) => updateOverlay(selected.id, { fontSize: parseInt(e.target.value) || 24 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" /></div>
                    )}
                    <div className={selected.field === 'wipe' ? 'col-span-2' : ''}>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{selected.field === 'wipe' ? 'Width (%)' : 'Max Width (%)'}</label>
                      <input type="number" min="1" max="100" value={selected.maxWidth} onChange={(e) => updateOverlay(selected.id, { maxWidth: parseInt(e.target.value) || 10 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" />
                    </div>
                  </div>
                  <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Height (%)</label><input type="number" min="0.1" max="100" step="0.1" value={selected.height || 5} onChange={(e) => updateOverlay(selected.id, { height: parseFloat(e.target.value) || 5 })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none" /></div>
                  {selected.field !== 'wipe' && (
                    <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Font Family</label>
                      <select value={selected.fontFamily} onChange={(e) => updateOverlay(selected.id, { fontFamily: e.target.value })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500">
                        {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select></div>
                  )}
                  {selected.field !== 'wipe' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Weight</label><select value={selected.fontWeight} onChange={(e) => updateOverlay(selected.id, { fontWeight: e.target.value })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none"><option value="normal">Normal</option><option value="bold">Bold</option></select></div>
                      <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Align</label><select value={selected.align} onChange={(e) => updateOverlay(selected.id, { align: e.target.value })} className="w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-300 outline-none"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">{selected.field === 'wipe' ? 'Box Color' : 'Color'}</label><div className="flex items-center gap-2"><input type="color" value={selected.color} onChange={(e) => updateOverlay(selected.id, { color: e.target.value })} className="w-8 h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" /><span className="text-[9px] text-slate-500 font-mono">{selected.color}</span></div></div>
                    <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Opacity ({(selected.opacity * 100).toFixed(0)}%)</label><input type="range" min="0" max="1" step="0.05" value={selected.opacity} onChange={(e) => updateOverlay(selected.id, { opacity: parseFloat(e.target.value) })} className="w-full accent-violet-600" /></div>
                  </div>
                  {selected.field !== 'wipe' && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Line Height ({selected.lineHeight}x)</label><input type="range" min="0.8" max="2.5" step="0.1" value={selected.lineHeight} onChange={(e) => updateOverlay(selected.id, { lineHeight: parseFloat(e.target.value) })} className="w-full accent-violet-600" /></div>
                        <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Rotation ({selected.rotation}°)</label><input type="range" min="0" max="360" value={selected.rotation} onChange={(e) => updateOverlay(selected.id, { rotation: parseInt(e.target.value) })} className="w-full accent-violet-600" /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Letter Spacing ({selected.letterSpacing || 0}px)</label><input type="range" min="-5" max="20" step="0.5" value={selected.letterSpacing || 0} onChange={(e) => updateOverlay(selected.id, { letterSpacing: parseFloat(e.target.value) })} className="w-full accent-violet-600" /></div>
                      </div>
                    </>
                  )}
                  {selected.field !== 'wipe' && (
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={selected.uppercase} onChange={(e) => updateOverlay(selected.id, { uppercase: e.target.checked })} className="w-3.5 h-3.5 rounded accent-violet-600" /><span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">UPPERCASE text</span></label>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                    <button onClick={() => moveOverlayForward(selected.id)} className="flex items-center justify-center gap-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition border border-slate-200 dark:border-slate-700"><FiArrowUp size={11} /> Bring Forward</button>
                    <button onClick={() => moveOverlayBackward(selected.id)} className="flex items-center justify-center gap-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition border border-slate-200 dark:border-slate-700"><FiArrowDown size={11} /> Send Backward</button>
                    <button onClick={() => duplicateOverlay(selected.id)} className="flex items-center justify-center gap-1 py-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition border border-blue-200 dark:border-blue-800"><FiCopy size={11} /> Duplicate</button>
                    <button onClick={() => deleteOverlay(selected.id)} className="flex items-center justify-center gap-1 py-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold transition border border-red-200 dark:border-red-800"><FiTrash2 size={11} /> Delete</button>
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

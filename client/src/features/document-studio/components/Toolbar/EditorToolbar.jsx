import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiZoomIn, FiZoomOut, FiGrid, FiPlus, FiRotateCcw, FiRotateCw, FiSave, FiRefreshCw,
  FiUploadCloud, FiX, FiAlignCenter, FiAlignLeft, FiAlignRight,
  FiArrowUp, FiArrowDown, FiCopy, FiTrash2, FiMaximize,
} from 'react-icons/fi';

/** Extended field options including new Phase 6+ types */
export const FIELD_OPTIONS = [
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
  { value: 'shape', label: '● Shape', color: '#F97316' },
  { value: 'table', label: '▦ Table', color: '#06B6D4' },
  { value: 'image', label: '🖼 Image', color: '#A855F7' },
  { value: 'barcode', label: '▮▯▮ Barcode', color: '#7C3AED' },
];

/**
 * EditorToolbar — Top toolbar for zoom, grid, add-field, undo/redo, save.
 */
const EditorToolbar = ({
  zoom, setZoom, showGrid, setShowGrid, onAddField, onUndo, onRedo, canUndo, canRedo,
  onSave, saving, hasUnsavedChanges, onReplaceBg, replacingBg, onFitToScreen,
  autosaveStatus, onClose, templateName,
}) => {
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const replaceBgRef = useRef(null);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      <div className="flex items-center gap-2">
        {/* Zoom controls */}
        <button onClick={() => setZoom((z) => Math.max(10, z - 10))} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition" aria-label="Zoom out">
          <FiZoomOut size={14} />
        </button>
        <input type="range" min="10" max="300" value={zoom} onChange={(e) => setZoom(+e.target.value)} className="w-24 h-1.5 rounded-lg accent-violet-600" aria-label="Zoom slider" />
        <button onClick={() => setZoom((z) => Math.min(300, z + 10))} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition" aria-label="Zoom in">
          <FiZoomIn size={14} />
        </button>
        <span className="text-[10px] font-bold text-slate-500 w-10 text-center">{zoom}%</span>
        <button onClick={onFitToScreen} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition text-[9px] font-bold" aria-label="Fit to screen">
          <FiMaximize size={12} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

        {/* Undo/Redo */}
        <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition" aria-label="Undo (Ctrl+Z)">
          <FiRotateCcw size={14} />
        </button>
        <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-30 transition" aria-label="Redo (Ctrl+Y)">
          <FiRotateCw size={14} />
        </button>

        {/* Autosave indicator */}
        {autosaveStatus && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            autosaveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400' :
            autosaveStatus === 'saving' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400' :
            autosaveStatus === 'offline' ? 'bg-slate-100 text-slate-500' :
            autosaveStatus === 'error' ? 'bg-red-50 text-red-600' :
            'bg-amber-50 text-amber-600'
          }`}>
            {autosaveStatus === 'saved' ? '● Saved' :
             autosaveStatus === 'saving' ? '◌ Saving...' :
             autosaveStatus === 'offline' ? '○ Offline' :
             autosaveStatus === 'error' ? '✕ Error' : '◌ Unsaved'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Replace BG */}
        <input ref={replaceBgRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={onReplaceBg} className="hidden" />
        <button onClick={() => replaceBgRef.current?.click()} disabled={replacingBg} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg transition disabled:opacity-50" aria-label="Replace background">
          {replacingBg ? <FiRefreshCw size={12} className="animate-spin" /> : <FiUploadCloud size={12} />}
          Replace BG
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

        {/* Grid toggle */}
        <button onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg transition ${showGrid ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`} aria-label="Toggle grid">
          <FiGrid size={14} />
        </button>

        {/* Add Field dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setShowFieldDropdown(!showFieldDropdown)} className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold rounded-lg transition" aria-label="Add field">
            <FiPlus size={12} /> Add Field <span className="text-[8px] opacity-70">▾</span>
          </button>
          <AnimatePresence>
            {showFieldDropdown && (
              <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 w-56 max-h-80 overflow-y-auto p-1.5">
                {FIELD_OPTIONS.map((f) => (
                  <button key={f.value} onClick={() => { onAddField(f.value); setShowFieldDropdown(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                    {f.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />

        {/* Save */}
        <button onClick={onSave} disabled={saving} className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-lg transition shadow-lg disabled:opacity-50 ${hasUnsavedChanges ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'}`} aria-label="Save template">
          {saving ? <FiRefreshCw size={14} className="animate-spin" /> : <FiSave size={14} />}
          {hasUnsavedChanges ? 'Save*' : 'Saved'}
          {hasUnsavedChanges && <span className="w-2 h-2 bg-white rounded-full animate-pulse" />}
        </button>

        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition" aria-label="Close editor">
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default EditorToolbar;

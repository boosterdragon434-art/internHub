import React from 'react';
import { FiArrowUp, FiArrowDown, FiCopy, FiTrash2, FiLink, FiLink2 } from 'react-icons/fi';
import { FIELD_OPTIONS } from '../Toolbar/EditorToolbar';
import AlignmentTools from '../Toolbar/AlignmentTools';

const FONT_OPTIONS = [
  'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique',
  'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic',
  'Courier', 'Courier-Bold',
];

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
  { value: 'MMMM DD, YYYY', label: 'Month DD, YYYY' },
];

const SHAPE_TYPES = [
  { value: 'rectangle', label: 'Rectangle' },
  { value: 'roundedRectangle', label: 'Rounded Rect' },
  { value: 'circle', label: 'Circle' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'line', label: 'Line' },
  { value: 'star', label: 'Star' },
];

const BARCODE_FORMATS = [
  { value: 'CODE128', label: 'Code 128' },
  { value: 'CODE39', label: 'Code 39' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'UPC', label: 'UPC' },
];

const PLACEHOLDER_VARS = [
  { key: 'student_name', label: 'Student' },
  { key: 'internship_role', label: 'Role' },
  { key: 'department', label: 'Dept' },
  { key: 'college_name', label: 'College' },
  { key: 'company_name', label: 'Company' },
  { key: 'start_date', label: 'Start' },
  { key: 'end_date', label: 'End' },
  { key: 'duration', label: 'Duration' },
  { key: 'guide_name', label: 'Guide' },
  { key: 'skills', label: 'Skills' },
  { key: 'performance', label: 'Perf' },
  { key: 'certificate_id', label: 'Cert ID' },
  { key: 'issue_date', label: 'Issue' },
  { key: 'verification_url', label: 'URL' },
  { key: 'page', label: 'Page#' },
  { key: 'totalPages', label: 'Total#' },
];

/**
 * PropertiesPanel — Comprehensive property editor for all overlay types.
 */
const PropertiesPanel = ({
  selected,
  selectedOverlays = [],
  onUpdateOverlay,
  onUpdateMultipleOverlays,
  onDeleteOverlay,
  onDuplicateOverlay,
  onMoveForward,
  onMoveBackward,
  onGroup,
  onUngroup,
}) => {
  if (!selected) {
    return (
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] text-slate-400 text-center py-8">
          Select an overlay to edit properties
        </p>
      </div>
    );
  }

  const isTextType = !['wipe', 'qrCode', 'logo', 'signature', 'shape', 'table', 'image', 'barcode'].includes(selected.field);
  const isShapeType = selected.field === 'shape';
  const isTableType = selected.field === 'table';
  const isBarcodeType = selected.field === 'barcode';
  const isImageLike = ['qrCode', 'logo', 'signature', 'image'].includes(selected.field);

  const inputClass = "w-full text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-violet-500";
  const labelClass = "text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-1";

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {/* Multi-select alignment tools */}
      {selectedOverlays.length > 1 && (
        <AlignmentTools
          selectedOverlays={selectedOverlays}
          onUpdateOverlays={onUpdateMultipleOverlays}
        />
      )}

      {/* Field Type */}
      <div>
        <label className={labelClass}>Field Type</label>
        <select
          value={selected.field}
          onChange={(e) => {
            const f = e.target.value;
            const updates = { field: f };
            if (f === 'date') updates.dateFormat = selected.dateFormat || 'DD/MM/YYYY';
            if (f === 'wipe') { updates.color = '#ffffff'; updates.maxWidth = Math.max(selected.maxWidth || 20, 20); }
            if (f === 'shape') { updates.shapeType = 'rectangle'; updates.fill = '#3B82F6'; updates.stroke = '#1E40AF'; updates.strokeWidth = 2; }
            if (f === 'table') { updates.rows = 3; updates.columns = 3; updates.cellData = []; }
            if (f === 'barcode') { updates.barcodeFormat = 'CODE128'; updates.barcodeValue = ''; }
            onUpdateOverlay(selected.id, updates);
          }}
          className={inputClass}
        >
          {FIELD_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Custom Text content */}
      {selected.field === 'customText' && (
        <div>
          <label className={labelClass}>Text Content (Supports {'{{variables}}'})</label>
          <textarea
            id="studioCustomTextArea"
            value={selected.customText || ''}
            onChange={(e) => onUpdateOverlay(selected.id, { customText: e.target.value })}
            placeholder="Your static text or {{student_name}}..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <div className="mt-1.5 flex flex-wrap gap-1">
            {PLACEHOLDER_VARS.map((v) => (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  const ta = document.getElementById('studioCustomTextArea');
                  const ins = `{{${v.key}}}`;
                  const start = ta?.selectionStart || (selected.customText || '').length;
                  const before = (selected.customText || '').slice(0, start);
                  const after = (selected.customText || '').slice(start);
                  onUpdateOverlay(selected.id, { customText: before + ins + after });
                }}
                className="px-1.5 py-0.5 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded text-[8px] font-mono font-bold hover:bg-violet-100 dark:hover:bg-violet-900/40 transition border border-violet-200 dark:border-violet-800"
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date format */}
      {selected.field === 'date' && (
        <div>
          <label className={labelClass}>Date Format</label>
          <select value={selected.dateFormat || 'DD/MM/YYYY'} onChange={(e) => onUpdateOverlay(selected.id, { dateFormat: e.target.value })} className={inputClass}>
            {DATE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      )}

      {/* Shape-specific controls */}
      {isShapeType && (
        <>
          <div>
            <label className={labelClass}>Shape Type</label>
            <select value={selected.shapeType || 'rectangle'} onChange={(e) => onUpdateOverlay(selected.id, { shapeType: e.target.value })} className={inputClass}>
              {SHAPE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Fill</label>
              <div className="flex items-center gap-2">
                <input type="color" value={selected.fill || '#3B82F6'} onChange={(e) => onUpdateOverlay(selected.id, { fill: e.target.value })} className="w-8 h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" />
                <span className="text-[9px] text-slate-500 font-mono">{selected.fill || '#3B82F6'}</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>Stroke</label>
              <div className="flex items-center gap-2">
                <input type="color" value={selected.stroke || '#1E40AF'} onChange={(e) => onUpdateOverlay(selected.id, { stroke: e.target.value })} className="w-8 h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" />
                <span className="text-[9px] text-slate-500 font-mono">{selected.stroke || '#1E40AF'}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Stroke Width ({selected.strokeWidth ?? 2}px)</label>
              <input type="range" min="0" max="20" value={selected.strokeWidth ?? 2} onChange={(e) => onUpdateOverlay(selected.id, { strokeWidth: parseInt(e.target.value) })} className="w-full accent-violet-600" />
            </div>
            <div>
              <label className={labelClass}>Corner Radius ({selected.cornerRadius || 0})</label>
              <input type="range" min="0" max="100" value={selected.cornerRadius || 0} onChange={(e) => onUpdateOverlay(selected.id, { cornerRadius: parseInt(e.target.value) })} className="w-full accent-violet-600" />
            </div>
          </div>
        </>
      )}

      {/* Table-specific controls */}
      {isTableType && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelClass}>Rows</label>
            <input type="number" min="1" max="50" value={selected.rows || 3} onChange={(e) => onUpdateOverlay(selected.id, { rows: parseInt(e.target.value) || 3 })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Columns</label>
            <input type="number" min="1" max="20" value={selected.columns || 3} onChange={(e) => onUpdateOverlay(selected.id, { columns: parseInt(e.target.value) || 3 })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Border Color</label>
            <input type="color" value={selected.tableBorderColor || '#CBD5E1'} onChange={(e) => onUpdateOverlay(selected.id, { tableBorderColor: e.target.value })} className="w-full h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" />
          </div>
          <div>
            <label className={labelClass}>Header BG</label>
            <input type="color" value={selected.tableHeaderBg || '#F1F5F9'} onChange={(e) => onUpdateOverlay(selected.id, { tableHeaderBg: e.target.value })} className="w-full h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" />
          </div>
        </div>
      )}

      {/* Barcode-specific controls */}
      {isBarcodeType && (
        <>
          <div>
            <label className={labelClass}>Barcode Format</label>
            <select value={selected.barcodeFormat || 'CODE128'} onChange={(e) => onUpdateOverlay(selected.id, { barcodeFormat: e.target.value })} className={inputClass}>
              {BARCODE_FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Barcode Value (or {'{{variable}}'})</label>
            <input type="text" value={selected.barcodeValue || ''} onChange={(e) => onUpdateOverlay(selected.id, { barcodeValue: e.target.value })} placeholder="{{certificate_id}}" className={inputClass} />
          </div>
        </>
      )}

      {/* Position X / Y */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>X (%)</label>
          <input type="number" min="0" max="100" step="0.1" value={selected.x} onChange={(e) => onUpdateOverlay(selected.id, { x: parseFloat(e.target.value) || 0 })} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Y (%)</label>
          <input type="number" min="0" max="100" step="0.1" value={selected.y} onChange={(e) => onUpdateOverlay(selected.id, { y: parseFloat(e.target.value) || 0 })} className={inputClass} />
        </div>
      </div>

      {/* Font Size + Max Width */}
      <div className="grid grid-cols-2 gap-2">
        {isTextType && (
          <div>
            <label className={labelClass}>Font Size</label>
            <input type="number" min="4" max="120" value={selected.fontSize} onChange={(e) => onUpdateOverlay(selected.id, { fontSize: parseInt(e.target.value) || 24 })} className={inputClass} />
          </div>
        )}
        <div className={isTextType ? '' : 'col-span-2'}>
          <label className={labelClass}>Width (%)</label>
          <input type="number" min="1" max="100" value={selected.maxWidth} onChange={(e) => onUpdateOverlay(selected.id, { maxWidth: parseInt(e.target.value) || 10 })} className={inputClass} />
        </div>
      </div>

      {/* Height */}
      <div>
        <label className={labelClass}>Height (%)</label>
        <input type="number" min="0.1" max="100" step="0.1" value={selected.height || 5} onChange={(e) => onUpdateOverlay(selected.id, { height: parseFloat(e.target.value) || 5 })} className={inputClass} />
      </div>

      {/* Text-only controls */}
      {isTextType && (
        <>
          <div>
            <label className={labelClass}>Font Family</label>
            <select value={selected.fontFamily} onChange={(e) => onUpdateOverlay(selected.id, { fontFamily: e.target.value })} className={inputClass}>
              {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Weight</label>
              <select value={selected.fontWeight} onChange={(e) => onUpdateOverlay(selected.id, { fontWeight: e.target.value })} className={inputClass}>
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Align</label>
              <select value={selected.align} onChange={(e) => onUpdateOverlay(selected.id, { align: e.target.value })} className={inputClass}>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Color + Opacity (universal) */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>{selected.field === 'wipe' ? 'Box Color' : 'Color'}</label>
          <div className="flex items-center gap-2">
            <input type="color" value={selected.color} onChange={(e) => onUpdateOverlay(selected.id, { color: e.target.value })} className="w-8 h-7 rounded border border-slate-200 dark:border-slate-700 cursor-pointer" />
            <span className="text-[9px] text-slate-500 font-mono">{selected.color}</span>
          </div>
        </div>
        <div>
          <label className={labelClass}>Opacity ({(selected.opacity * 100).toFixed(0)}%)</label>
          <input type="range" min="0" max="1" step="0.05" value={selected.opacity} onChange={(e) => onUpdateOverlay(selected.id, { opacity: parseFloat(e.target.value) })} className="w-full accent-violet-600" />
        </div>
      </div>

      {/* Line height, rotation, letter spacing for text */}
      {isTextType && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Line Height ({selected.lineHeight}x)</label>
              <input type="range" min="0.8" max="2.5" step="0.1" value={selected.lineHeight} onChange={(e) => onUpdateOverlay(selected.id, { lineHeight: parseFloat(e.target.value) })} className="w-full accent-violet-600" />
            </div>
            <div>
              <label className={labelClass}>Rotation ({selected.rotation}°)</label>
              <input type="range" min="0" max="360" value={selected.rotation} onChange={(e) => onUpdateOverlay(selected.id, { rotation: parseInt(e.target.value) })} className="w-full accent-violet-600" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Letter Spacing ({selected.letterSpacing || 0}px)</label>
            <input type="range" min="-5" max="20" step="0.5" value={selected.letterSpacing || 0} onChange={(e) => onUpdateOverlay(selected.id, { letterSpacing: parseFloat(e.target.value) })} className="w-full accent-violet-600" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={selected.uppercase} onChange={(e) => onUpdateOverlay(selected.id, { uppercase: e.target.checked })} className="w-3.5 h-3.5 rounded accent-violet-600" />
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">UPPERCASE text</span>
          </label>
        </>
      )}

      {/* Rotation for non-text types */}
      {!isTextType && (
        <div>
          <label className={labelClass}>Rotation ({selected.rotation}°)</label>
          <input type="range" min="0" max="360" value={selected.rotation || 0} onChange={(e) => onUpdateOverlay(selected.id, { rotation: parseInt(e.target.value) })} className="w-full accent-violet-600" />
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
        {/* Group/Ungroup */}
        {selectedOverlays?.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onGroup} className="flex items-center justify-center gap-1 py-2 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-lg text-[10px] font-bold transition border border-violet-200 dark:border-violet-800" aria-label="Group selected">
              <FiLink size={11} /> Group
            </button>
            <button onClick={onUngroup} className="flex items-center justify-center gap-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition border border-slate-200 dark:border-slate-700" aria-label="Ungroup selected">
              <FiLink2 size={11} /> Ungroup
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onMoveForward?.(selected.id)} className="flex items-center justify-center gap-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition border border-slate-200 dark:border-slate-700" aria-label="Bring forward">
            <FiArrowUp size={11} /> Forward
          </button>
          <button onClick={() => onMoveBackward?.(selected.id)} className="flex items-center justify-center gap-1 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition border border-slate-200 dark:border-slate-700" aria-label="Send backward">
            <FiArrowDown size={11} /> Backward
          </button>
          <button onClick={() => onDuplicateOverlay?.(selected.id)} className="flex items-center justify-center gap-1 py-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] font-bold transition border border-blue-200 dark:border-blue-800" aria-label="Duplicate overlay">
            <FiCopy size={11} /> Duplicate
          </button>
          <button onClick={() => onDeleteOverlay?.(selected.id)} className="flex items-center justify-center gap-1 py-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg text-[10px] font-bold transition border border-red-200 dark:border-red-800" aria-label="Delete overlay">
            <FiTrash2 size={11} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;

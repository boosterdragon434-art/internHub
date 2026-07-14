import React, { useState } from 'react';
import { FiEye, FiEyeOff, FiLock, FiUnlock, FiX, FiLink, FiLink2 } from 'react-icons/fi';
import { FIELD_OPTIONS } from '../Toolbar/EditorToolbar';

/**
 * LayersPanel — Z-index ordered overlay list with rename, show/hide, lock, drag-to-reorder.
 */
const LayersPanel = ({ overlays, selectedIds, onSelect, onUpdateOverlay, onDeleteOverlay, onReorder }) => {
  const [draggedIdx, setDraggedIdx] = useState(null);

  const fieldLabel = (field) => FIELD_OPTIONS.find((f) => f.value === field)?.label || field;
  const fieldColor = (field) => FIELD_OPTIONS.find((f) => f.value === field)?.color || '#64748B';

  // Group overlays by groupId
  const groups = {};
  overlays.forEach((o) => {
    if (o.groupId) {
      if (!groups[o.groupId]) groups[o.groupId] = [];
      groups[o.groupId].push(o.id);
    }
  });

  return (
    <div className="p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
        Layers ({overlays.length})
      </p>
      <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
        {overlays.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-4">No overlays. Click "Add Field" to start.</p>
        ) : (
          overlays.map((o, idx) => {
            const isSelected = selectedIds.has(o.id);
            const isGrouped = !!o.groupId;
            const groupMembers = o.groupId ? (groups[o.groupId] || []).length : 0;

            return (
              <div
                key={o.id}
                onClick={() => onSelect?.(o.id, false)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedIdx(idx);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedIdx === null || draggedIdx === idx) return;
                  onReorder?.(draggedIdx, idx);
                  setDraggedIdx(null);
                }}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-[11px] group ${
                  isSelected
                    ? 'bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                } ${!o.visible ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Drag handle */}
                  <span className="text-slate-300 dark:text-slate-600 cursor-grab text-[10px]">⠿</span>
                  {/* Color indicator */}
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: fieldColor(o.field) }} />
                  {/* Group indicator */}
                  {isGrouped && (
                    <FiLink2 size={9} className="text-violet-400 shrink-0" title={`Group: ${o.groupId} (${groupMembers} items)`} />
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-700 dark:text-slate-300 truncate text-[10px]">
                      {fieldLabel(o.field)}
                    </p>
                    <p className="text-[8px] text-slate-400 truncate">
                      {o.x?.toFixed(1)}%, {o.y?.toFixed(1)}%
                      {o.field === 'shape' ? ` · ${o.shapeType || 'rect'}` : ''}
                      {o.field === 'table' ? ` · ${o.rows}×${o.columns}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateOverlay(o.id, { locked: !o.locked }); }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={o.locked ? 'Unlock layer' : 'Lock layer'}
                  >
                    {o.locked ? <FiLock size={10} /> : <FiUnlock size={10} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateOverlay(o.id, { visible: !o.visible }); }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    aria-label={o.visible ? 'Hide layer' : 'Show layer'}
                  >
                    {o.visible ? <FiEye size={10} /> : <FiEyeOff size={10} />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteOverlay(o.id); }}
                    className="p-1 text-red-400 hover:text-red-600"
                    aria-label="Delete layer"
                  >
                    <FiX size={10} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LayersPanel;

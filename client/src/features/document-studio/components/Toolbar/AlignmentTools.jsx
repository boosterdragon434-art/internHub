import React from 'react';
import {
  FiAlignLeft, FiAlignCenter, FiAlignRight,
} from 'react-icons/fi';
import {
  RiAlignTop, RiAlignBottom, RiAlignVertically,
} from 'react-icons/ri';

/**
 * AlignmentTools — Align left/right/top/bottom/center/middle and distribute evenly.
 * Pure client-side bounding box math on the current selection.
 */
const AlignmentTools = ({ selectedOverlays, onUpdateOverlays }) => {
  if (!selectedOverlays || selectedOverlays.length < 2) return null;

  const getBounds = (o) => ({
    left: o.x - o.maxWidth / 2,
    right: o.x + o.maxWidth / 2,
    top: o.y - o.height / 2,
    bottom: o.y + o.height / 2,
    centerX: o.x,
    centerY: o.y,
  });

  const alignLeft = () => {
    const minLeft = Math.min(...selectedOverlays.map((o) => getBounds(o).left));
    const updates = selectedOverlays.map((o) => ({
      id: o.id,
      x: parseFloat((minLeft + o.maxWidth / 2).toFixed(2)),
    }));
    onUpdateOverlays(updates);
  };

  const alignRight = () => {
    const maxRight = Math.max(...selectedOverlays.map((o) => getBounds(o).right));
    const updates = selectedOverlays.map((o) => ({
      id: o.id,
      x: parseFloat((maxRight - o.maxWidth / 2).toFixed(2)),
    }));
    onUpdateOverlays(updates);
  };

  const alignTop = () => {
    const minTop = Math.min(...selectedOverlays.map((o) => getBounds(o).top));
    const updates = selectedOverlays.map((o) => ({
      id: o.id,
      y: parseFloat((minTop + o.height / 2).toFixed(2)),
    }));
    onUpdateOverlays(updates);
  };

  const alignBottom = () => {
    const maxBottom = Math.max(...selectedOverlays.map((o) => getBounds(o).bottom));
    const updates = selectedOverlays.map((o) => ({
      id: o.id,
      y: parseFloat((maxBottom - o.height / 2).toFixed(2)),
    }));
    onUpdateOverlays(updates);
  };

  const alignCenterH = () => {
    const avg = selectedOverlays.reduce((sum, o) => sum + o.x, 0) / selectedOverlays.length;
    const updates = selectedOverlays.map((o) => ({
      id: o.id,
      x: parseFloat(avg.toFixed(2)),
    }));
    onUpdateOverlays(updates);
  };

  const alignCenterV = () => {
    const avg = selectedOverlays.reduce((sum, o) => sum + o.y, 0) / selectedOverlays.length;
    const updates = selectedOverlays.map((o) => ({
      id: o.id,
      y: parseFloat(avg.toFixed(2)),
    }));
    onUpdateOverlays(updates);
  };

  const distributeH = () => {
    if (selectedOverlays.length < 3) return;
    const sorted = [...selectedOverlays].sort((a, b) => a.x - b.x);
    const first = sorted[0].x;
    const last = sorted[sorted.length - 1].x;
    const step = (last - first) / (sorted.length - 1);
    const updates = sorted.map((o, i) => ({
      id: o.id,
      x: parseFloat((first + step * i).toFixed(2)),
    }));
    onUpdateOverlays(updates);
  };

  const distributeV = () => {
    if (selectedOverlays.length < 3) return;
    const sorted = [...selectedOverlays].sort((a, b) => a.y - b.y);
    const first = sorted[0].y;
    const last = sorted[sorted.length - 1].y;
    const step = (last - first) / (sorted.length - 1);
    const updates = sorted.map((o, i) => ({
      id: o.id,
      y: parseFloat((first + step * i).toFixed(2)),
    }));
    onUpdateOverlays(updates);
  };

  const btnClass = "p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition";

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
      <span className="text-[8px] font-bold text-slate-400 uppercase mr-1">Align</span>
      <button onClick={alignLeft} className={btnClass} title="Align Left" aria-label="Align left"><FiAlignLeft size={12} /></button>
      <button onClick={alignCenterH} className={btnClass} title="Align Center" aria-label="Align center horizontal"><FiAlignCenter size={12} /></button>
      <button onClick={alignRight} className={btnClass} title="Align Right" aria-label="Align right"><FiAlignRight size={12} /></button>
      <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-0.5" />
      <button onClick={alignTop} className={btnClass} title="Align Top" aria-label="Align top">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="20" y2="4" /><rect x="9" y="4" width="6" height="14" rx="1" /></svg>
      </button>
      <button onClick={alignCenterV} className={btnClass} title="Align Middle" aria-label="Align center vertical">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="12" x2="20" y2="12" /><rect x="9" y="5" width="6" height="14" rx="1" /></svg>
      </button>
      <button onClick={alignBottom} className={btnClass} title="Align Bottom" aria-label="Align bottom">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="20" x2="20" y2="20" /><rect x="9" y="6" width="6" height="14" rx="1" /></svg>
      </button>
      <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-0.5" />
      <button onClick={distributeH} className={btnClass} title="Distribute Horizontally" aria-label="Distribute horizontally" disabled={selectedOverlays.length < 3}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="4" y2="20" /><line x1="12" y1="7" x2="12" y2="17" /><line x1="20" y1="4" x2="20" y2="20" /></svg>
      </button>
      <button onClick={distributeV} className={btnClass} title="Distribute Vertically" aria-label="Distribute vertically" disabled={selectedOverlays.length < 3}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="20" y2="4" /><line x1="7" y1="12" x2="17" y2="12" /><line x1="4" y1="20" x2="20" y2="20" /></svg>
      </button>
    </div>
  );
};

export default AlignmentTools;

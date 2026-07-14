import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiRefreshCw, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../api/axios';

/**
 * VersionHistoryPanel — Preview and one-click-restore prior template snapshots.
 * Capped at 20 versions per template, oldest pruned on save.
 */
const VersionHistoryPanel = ({ templateId, isOpen, onClose, onRestore }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);

  const fetchVersions = useCallback(async () => {
    if (!templateId || !isOpen) return;
    setLoading(true);
    try {
      const res = await api.get(`/certificates/templates/${templateId}/versions`);
      if (res.data?.success) {
        setVersions(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setLoading(false);
    }
  }, [templateId, isOpen]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (versionId) => {
    setRestoring(versionId);
    try {
      const res = await api.post(`/certificates/templates/${templateId}/versions/${versionId}/restore`);
      if (res.data?.success) {
        toast.success('Version restored successfully!');
        onRestore?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore version');
    } finally {
      setRestoring(null);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  return (
    <div className="absolute right-0 top-0 w-72 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FiClock size={14} className="text-violet-500" />
          <span className="text-[11px] font-bold text-slate-700 dark:text-white">Version History</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs" aria-label="Close version history">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <FiRefreshCw size={16} className="animate-spin text-slate-400" />
          </div>
        ) : versions.length === 0 ? (
          <p className="text-[10px] text-slate-400 text-center py-8">
            No version history yet. Versions are created on each explicit save.
          </p>
        ) : (
          versions.map((v, idx) => (
            <div
              key={v._id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  {idx === 0 ? 'Latest save' : `Version ${versions.length - idx}`}
                </p>
                <p className="text-[9px] text-slate-400 truncate">
                  {formatDate(v.createdAt)}
                </p>
                <p className="text-[8px] text-slate-400">
                  {v.overlayCount || 0} overlays
                  {v.pageCount ? ` · ${v.pageCount} pages` : ''}
                </p>
              </div>
              {idx > 0 && (
                <button
                  onClick={() => handleRestore(v._id)}
                  disabled={restoring === v._id}
                  className="flex items-center gap-1 px-2 py-1 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-[9px] font-bold rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  aria-label={`Restore version ${versions.length - idx}`}
                >
                  {restoring === v._id ? <FiRefreshCw size={10} className="animate-spin" /> : <FiChevronRight size={10} />}
                  Restore
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionHistoryPanel;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiLayers, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import DocumentCanvas from './components/Canvas/DocumentCanvas';
import EditorToolbar from './components/Toolbar/EditorToolbar';
import LayersPanel from './components/LayersPanel/LayersPanel';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import PageNavigator from './components/PageNavigator/PageNavigator';
import VersionHistoryPanel from './components/VersionHistory/VersionHistoryPanel';
import useCanvasHistory from './hooks/useCanvasHistory';
import useSelection from './hooks/useSelection';
import useSnapping from './hooks/useSnapping';
import useAutosave from './hooks/useAutosave';
import { generateOverlayId, getDefaultsForField } from './utils/coordinateMath';
import { updateTemplate, downloadTemplateFile } from '../../api/certificateApi';

/**
 * DocumentStudioEditor — Top-level Konva-based editor replacing the legacy Canvas 2D AdvancedEditor.
 * Composes DocumentCanvas, Toolbar, LayersPanel, PropertiesPanel, PageNavigator, and VersionHistory.
 */
const DocumentStudioEditor = ({ template, onSaved, onClose }) => {
  // ── State ──
  const [overlays, setOverlays] = useState((template.overlays || []).map((o) => ({ ...o })));
  const [pages, setPages] = useState(template.pages || []);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoom, setZoom] = useState(template.metadata?.editorZoom || 80);
  const [showGrid, setShowGrid] = useState(template.metadata?.showGrid || false);
  const [gridSize, setGridSize] = useState(template.metadata?.gridSize || 10);
  const [saving, setSaving] = useState(false);
  const [templateImg, setTemplateImg] = useState(null);
  const [replacingBg, setReplacingBg] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const canvasContainerRef = useRef(null);

  // ── Hooks ──
  const history = useCanvasHistory(overlays);
  const selection = useSelection();
  const snapping = useSnapping({ showGrid, gridSize, overlays, snapThreshold: 1.5 });

  const metadata = { editorZoom: zoom, showGrid, gridSize };
  const { autosaveStatus, markAsSaved } = useAutosave({
    templateId: template._id,
    overlays,
    pages,
    metadata,
    updateTemplateFn: async (id, data) => {
      await updateTemplate(id, data);
    },
    enabled: true,
    debounceMs: 7000,
  });

  // Sync overlays from history when undo/redo
  useEffect(() => {
    if (history.currentState && history.currentState !== overlays) {
      setOverlays(history.currentState);
    }
  }, [history.currentState]);

  // ── Template Background Loading ──
  useEffect(() => {
    if (!template.backgroundImageUrl) return;
    let objectUrl = null;
    let isMounted = true;

    const loadImg = async () => {
      try {
        const response = await downloadTemplateFile(template._id);
        if (!isMounted) return;
        const blob = new Blob([response.data]);
        objectUrl = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => { if (isMounted) setTemplateImg(img); };
        img.onerror = () => { if (isMounted) toast.error('Failed to load template background'); };
        img.src = objectUrl;
      } catch {
        if (isMounted) toast.error('Failed to download template background');
      }
    };
    loadImg();
    return () => { isMounted = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [template.backgroundImageUrl, template._id]);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); history.undo(); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); history.redo(); }
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); handleSave(); }
      if (e.key === 'Escape') { selection.clearSelection(); }
      if (e.key === 'Delete' && selection.selectedCount > 0) {
        const ids = [...selection.selectedIds];
        ids.forEach((id) => deleteOverlay(id));
      }
      // Arrow key nudge
      if (selection.selectedCount === 1 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.2;
        const selected = overlays.find((o) => selection.selectedIds.has(o.id));
        if (selected && !selected.locked) {
          let dx = 0, dy = 0;
          if (e.key === 'ArrowUp') dy = -step;
          if (e.key === 'ArrowDown') dy = step;
          if (e.key === 'ArrowLeft') dx = -step;
          if (e.key === 'ArrowRight') dx = step;
          handleUpdateOverlay(selected.id, {
            x: Math.max(0, Math.min(100, selected.x + dx)),
            y: Math.max(0, Math.min(100, selected.y + dy)),
          });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [overlays, selection.selectedIds, history]);

  // ── Unsaved changes guard ──
  useEffect(() => {
    const handler = (e) => {
      if (history.hasUnsavedChanges) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [history.hasUnsavedChanges]);

  // ── Overlay CRUD ──
  const handleUpdateOverlay = useCallback((id, updates) => {
    setOverlays((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, ...updates } : o));
      history.pushState(updated);
      return updated;
    });
  }, [history]);

  const handleUpdateMultipleOverlays = useCallback((updatesList) => {
    setOverlays((prev) => {
      const updated = prev.map((o) => {
        const upd = updatesList.find((u) => u.id === o.id);
        return upd ? { ...o, ...upd } : o;
      });
      history.pushState(updated);
      return updated;
    });
  }, [history]);

  const addOverlay = useCallback((field) => {
    const defaults = getDefaultsForField(field);
    const newOverlay = { ...defaults, id: generateOverlayId(), field };
    setOverlays((prev) => {
      const updated = [...prev, newOverlay];
      history.pushState(updated);
      return updated;
    });
    selection.selectOne(newOverlay.id);
  }, [history, selection]);

  const deleteOverlay = useCallback((id) => {
    setOverlays((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      history.pushState(updated);
      return updated;
    });
    if (selection.selectedIds.has(id)) selection.clearSelection();
  }, [history, selection]);

  const duplicateOverlay = useCallback((id) => {
    const orig = overlays.find((o) => o.id === id);
    if (!orig) return;
    const copy = { ...orig, id: generateOverlayId(), x: Math.min(100, orig.x + 5), y: Math.min(100, orig.y + 5) };
    setOverlays((prev) => {
      const updated = [...prev, copy];
      history.pushState(updated);
      return updated;
    });
    selection.selectOne(copy.id);
  }, [overlays, history, selection]);

  const moveOverlayForward = useCallback((id) => {
    const idx = overlays.findIndex((o) => o.id === id);
    if (idx < 0 || idx === overlays.length - 1) return;
    const updated = [...overlays];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    setOverlays(updated);
    history.pushState(updated);
  }, [overlays, history]);

  const moveOverlayBackward = useCallback((id) => {
    const idx = overlays.findIndex((o) => o.id === id);
    if (idx <= 0) return;
    const updated = [...overlays];
    [updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]];
    setOverlays(updated);
    history.pushState(updated);
  }, [overlays, history]);

  const handleReorder = useCallback((fromIdx, toIdx) => {
    const updated = [...overlays];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setOverlays(updated);
    history.pushState(updated);
  }, [overlays, history]);

  // ── Group/Ungroup ──
  const handleGroup = useCallback(() => {
    if (selection.selectedCount < 2) return;
    const groupId = `grp_${Date.now()}`;
    setOverlays((prev) => {
      const updated = prev.map((o) =>
        selection.selectedIds.has(o.id) ? { ...o, groupId } : o
      );
      history.pushState(updated);
      return updated;
    });
    toast.success('Objects grouped');
  }, [selection, history]);

  const handleUngroup = useCallback(() => {
    setOverlays((prev) => {
      const updated = prev.map((o) =>
        selection.selectedIds.has(o.id) ? { ...o, groupId: null } : o
      );
      history.pushState(updated);
      return updated;
    });
    toast.success('Objects ungrouped');
  }, [selection, history]);

  // ── Multi-page ──
  const handleAddPage = useCallback(() => {
    setPages((prev) => {
      const newPage = {
        backgroundImageUrl: '',
        cloudinaryPublicId: '',
        overlays: [],
        pageFormat: template.pageFormat || 'A4',
        orientation: template.orientation || 'landscape',
      };
      if (prev.length === 0) {
        // Convert current single-page to first page, add new second page
        return [
          {
            backgroundImageUrl: template.backgroundImageUrl || '',
            cloudinaryPublicId: template.cloudinaryPublicId || '',
            overlays: [...overlays],
            pageFormat: template.pageFormat || 'A4',
            orientation: template.orientation || 'landscape',
          },
          newPage,
        ];
      }
      return [...prev, newPage];
    });
  }, [template, overlays]);

  const handleDuplicatePage = useCallback((idx) => {
    if (pages.length === 0) return;
    setPages((prev) => {
      const copy = JSON.parse(JSON.stringify(prev[idx]));
      const updated = [...prev];
      updated.splice(idx + 1, 0, copy);
      return updated;
    });
    setCurrentPageIndex(idx + 1);
  }, [pages]);

  const handleDeletePage = useCallback((idx) => {
    if (pages.length <= 1) return;
    setPages((prev) => prev.filter((_, i) => i !== idx));
    setCurrentPageIndex((ci) => Math.min(ci, pages.length - 2));
  }, [pages]);

  // ── Canvas Events ──
  const handleDragStart = useCallback((id) => {
    history.startDrag();
  }, [history]);

  const handleDragEnd = useCallback((id, newPos) => {
    setOverlays((prev) => {
      const updated = prev.map((o) => (o.id === id ? { ...o, ...newPos } : o));
      history.endDrag(updated);
      return updated;
    });
  }, [history]);

  const handleCanvasSelect = useCallback((id, shiftKey) => {
    if (!id) {
      selection.clearSelection();
      return;
    }
    selection.handleClick(id, shiftKey);
  }, [selection]);

  // ── Save ──
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = { overlays, metadata: { editorZoom: zoom, showGrid, gridSize } };
      if (pages.length > 0) payload.pages = pages;
      const res = await updateTemplate(template._id, payload);
      if (res.data?.success) {
        toast.success('Template saved!');
        history.markSaved();
        markAsSaved();
        onSaved?.(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [overlays, pages, zoom, showGrid, gridSize, template._id, history, markAsSaved, onSaved]);

  // ── Replace Background ──
  const handleReplaceBg = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReplacingBg(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await updateTemplate(template._id, {
          backgroundImage: reader.result,
          overlays,
          metadata: { editorZoom: zoom, showGrid, gridSize },
        });
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
  }, [template._id, overlays, zoom, showGrid, gridSize, onSaved]);

  // ── Fit to Screen ──
  const handleFitToScreen = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const baseW = template.width || 842;
    const baseH = template.height || 595;
    const containerW = container.clientWidth - 64;
    const containerH = container.clientHeight - 64;
    const fitZoom = Math.min((containerW / baseW) * 100, (containerH / baseH) * 100);
    setZoom(Math.max(10, Math.min(300, Math.round(fitZoom))));
  }, [template]);

  // ── Close ──
  const handleClose = useCallback(() => {
    if (history.hasUnsavedChanges && !window.confirm('You have unsaved changes. Close anyway?')) return;
    onClose();
  }, [history.hasUnsavedChanges, onClose]);

  // ── Version Restore ──
  const handleVersionRestore = useCallback((restoredTemplate) => {
    setOverlays(restoredTemplate.overlays || []);
    setPages(restoredTemplate.pages || []);
    history.reset(restoredTemplate.overlays || []);
    setShowVersionHistory(false);
    onSaved?.(restoredTemplate);
  }, [history, onSaved]);

  // Get selected overlay(s) for the properties panel
  const selectedOverlaysList = overlays.filter((o) => selection.selectedIds.has(o.id));
  const primarySelected = selection.getPrimarySelected(overlays);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-full md:max-h-[95vh] flex flex-col rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <FiLayers className="text-violet-500" size={20} />
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-white">Document Studio</h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{template.name} — Drag to position | Ctrl+S save | Ctrl+Z undo | Delete remove</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVersionHistory(!showVersionHistory)}
              className={`p-2 rounded-lg transition ${showVersionHistory ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              aria-label="Toggle version history"
              title="Version History"
            >
              <FiClock size={14} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <EditorToolbar
          zoom={zoom}
          setZoom={setZoom}
          showGrid={showGrid}
          setShowGrid={setShowGrid}
          onAddField={addOverlay}
          onUndo={history.undo}
          onRedo={history.redo}
          canUndo={history.canUndo}
          canRedo={history.canRedo}
          onSave={handleSave}
          saving={saving}
          hasUnsavedChanges={history.hasUnsavedChanges}
          onReplaceBg={handleReplaceBg}
          replacingBg={replacingBg}
          onFitToScreen={handleFitToScreen}
          autosaveStatus={autosaveStatus}
          onClose={handleClose}
          templateName={template.name}
        />

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">
          {/* Canvas Area */}
          <div ref={canvasContainerRef} className="flex-1 flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden">
            <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 relative">
              <div className="min-w-full min-h-full w-fit h-fit p-8 flex">
                <div className="m-auto border-2 border-slate-300 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                  <DocumentCanvas
                    overlays={overlays}
                    templateWidth={template.width || 842}
                    templateHeight={template.height || 595}
                    zoom={zoom}
                    showGrid={showGrid}
                    gridSize={gridSize}
                    templateImg={templateImg}
                    selectedIds={selection.selectedIds}
                    onSelect={handleCanvasSelect}
                    onUpdateOverlay={handleUpdateOverlay}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    snapPosition={snapping.snapPosition}
                  />
                </div>
              </div>
            </div>

            {/* Page Navigator */}
            <PageNavigator
              pages={pages}
              currentPageIndex={currentPageIndex}
              onSelectPage={setCurrentPageIndex}
              onAddPage={handleAddPage}
              onDuplicatePage={handleDuplicatePage}
              onDeletePage={handleDeletePage}
            />
          </div>

          {/* Right Panel */}
          <div className="w-full md:w-80 xl:w-96 shrink-0 flex flex-col border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden max-h-[40vh] md:max-h-none">
            {/* Layers Panel */}
            <LayersPanel
              overlays={overlays}
              selectedIds={selection.selectedIds}
              onSelect={handleCanvasSelect}
              onUpdateOverlay={handleUpdateOverlay}
              onDeleteOverlay={deleteOverlay}
              onReorder={handleReorder}
            />

            {/* Properties Panel */}
            <PropertiesPanel
              selected={primarySelected}
              selectedOverlays={selectedOverlaysList}
              onUpdateOverlay={handleUpdateOverlay}
              onUpdateMultipleOverlays={handleUpdateMultipleOverlays}
              onDeleteOverlay={deleteOverlay}
              onDuplicateOverlay={duplicateOverlay}
              onMoveForward={moveOverlayForward}
              onMoveBackward={moveOverlayBackward}
              onGroup={handleGroup}
              onUngroup={handleUngroup}
            />
          </div>

          {/* Version History Slide-over */}
          <VersionHistoryPanel
            templateId={template._id}
            isOpen={showVersionHistory}
            onClose={() => setShowVersionHistory(false)}
            onRestore={handleVersionRestore}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default DocumentStudioEditor;

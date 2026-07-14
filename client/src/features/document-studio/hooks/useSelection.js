import { useState, useCallback, useRef } from 'react';

/**
 * useSelection — Manages single and multi-select state for canvas objects.
 * Supports shift-click multi-select and programmatic selection.
 */
const useSelection = () => {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [lastClickedId, setLastClickedId] = useState(null);
  const transformerRef = useRef(null);

  /** Select a single overlay, clearing others */
  const selectOne = useCallback((id) => {
    setSelectedIds(new Set([id]));
    setLastClickedId(id);
  }, []);

  /** Toggle selection of an overlay (for shift-click multi-select) */
  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setLastClickedId(id);
  }, []);

  /** Add an overlay to the current selection */
  const addToSelection = useCallback((id) => {
    setSelectedIds((prev) => new Set([...prev, id]));
  }, []);

  /** Clear all selection */
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setLastClickedId(null);
  }, []);

  /** Select multiple overlays at once (e.g., from marquee select) */
  const selectMultiple = useCallback((ids) => {
    setSelectedIds(new Set(ids));
  }, []);

  /** Check if an overlay is selected */
  const isSelected = useCallback((id) => selectedIds.has(id), [selectedIds]);

  /** Handle click on an overlay — single or shift-multi */
  const handleClick = useCallback((id, shiftKey = false) => {
    if (shiftKey) {
      toggleSelect(id);
    } else {
      selectOne(id);
    }
  }, [toggleSelect, selectOne]);

  /** Get selected overlays from the full overlays array */
  const getSelectedOverlays = useCallback((overlays) => {
    return overlays.filter((o) => selectedIds.has(o.id));
  }, [selectedIds]);

  /** Get the first (primary) selected overlay */
  const getPrimarySelected = useCallback((overlays) => {
    const id = lastClickedId || [...selectedIds][0];
    return overlays.find((o) => o.id === id) || null;
  }, [selectedIds, lastClickedId]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    selectOne,
    toggleSelect,
    addToSelection,
    clearSelection,
    selectMultiple,
    isSelected,
    handleClick,
    getSelectedOverlays,
    getPrimarySelected,
    transformerRef,
  };
};

export default useSelection;

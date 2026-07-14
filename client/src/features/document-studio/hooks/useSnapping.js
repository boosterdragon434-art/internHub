import { useCallback, useRef } from 'react';
import { snapToGrid, snapToCenter, clamp } from '../utils/coordinateMath';

/**
 * useSnapping — Edge-to-edge object snapping, center snapping, and grid snapping.
 * Wires up the existing metadata.showGrid/gridSize schema fields that were previously dead.
 */
const useSnapping = ({ showGrid = false, gridSize = 10, overlays = [], snapThreshold = 1.5 }) => {
  const snapLinesRef = useRef([]);

  /**
   * Snap a position considering grid, center, and nearby object edges.
   * @param {number} x - Current x percentage
   * @param {number} y - Current y percentage
   * @param {string} excludeId - ID of the overlay being dragged (exclude from edge snapping)
   * @returns {{ x: number, y: number, snapLines: Array }}
   */
  const snapPosition = useCallback((x, y, excludeId = null) => {
    let snappedX = clamp(x, 0, 100);
    let snappedY = clamp(y, 0, 100);
    const lines = [];

    // Center snap (always active)
    if (Math.abs(snappedX - 50) < snapThreshold) {
      snappedX = 50;
      lines.push({ type: 'vertical', position: 50 });
    }
    if (Math.abs(snappedY - 50) < snapThreshold) {
      snappedY = 50;
      lines.push({ type: 'horizontal', position: 50 });
    }

    // Edge snapping to other objects
    const otherOverlays = overlays.filter((o) => o.id !== excludeId && o.visible);
    for (const other of otherOverlays) {
      // Snap to other overlay's center
      if (Math.abs(snappedX - other.x) < snapThreshold) {
        snappedX = other.x;
        lines.push({ type: 'vertical', position: other.x });
      }
      if (Math.abs(snappedY - other.y) < snapThreshold) {
        snappedY = other.y;
        lines.push({ type: 'horizontal', position: other.y });
      }

      // Snap to other overlay's edges
      const otherLeft = other.x - other.maxWidth / 2;
      const otherRight = other.x + other.maxWidth / 2;
      const otherTop = other.y - other.height / 2;
      const otherBottom = other.y + other.height / 2;

      if (Math.abs(snappedX - otherLeft) < snapThreshold) {
        snappedX = otherLeft;
        lines.push({ type: 'vertical', position: otherLeft });
      }
      if (Math.abs(snappedX - otherRight) < snapThreshold) {
        snappedX = otherRight;
        lines.push({ type: 'vertical', position: otherRight });
      }
      if (Math.abs(snappedY - otherTop) < snapThreshold) {
        snappedY = otherTop;
        lines.push({ type: 'horizontal', position: otherTop });
      }
      if (Math.abs(snappedY - otherBottom) < snapThreshold) {
        snappedY = otherBottom;
        lines.push({ type: 'horizontal', position: otherBottom });
      }
    }

    // Grid snapping (when grid is enabled, overrides other snapping)
    if (showGrid && gridSize > 0) {
      snappedX = snapToGrid(snappedX, gridSize, snapThreshold);
      snappedY = snapToGrid(snappedY, gridSize, snapThreshold);
    }

    snapLinesRef.current = lines;

    return {
      x: parseFloat(snappedX.toFixed(2)),
      y: parseFloat(snappedY.toFixed(2)),
      snapLines: lines,
    };
  }, [showGrid, gridSize, overlays, snapThreshold]);

  return {
    snapPosition,
    snapLines: snapLinesRef.current,
  };
};

export default useSnapping;

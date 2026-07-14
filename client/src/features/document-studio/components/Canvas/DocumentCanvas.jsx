import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Transformer, Image as KonvaImage } from 'react-konva';
import TextObject from './TextObject';
import ShapeObject from './ShapeObject';
import ImageObject from './ImageObject';
import TableObject from './TableObject';

/**
 * DocumentCanvas — Konva Stage/Layer wrapper rendering one node per overlay.
 * Replaces the raw Canvas 2D imperative code from the existing AdvancedEditor.
 */
const DocumentCanvas = ({
  overlays,
  templateWidth = 842,
  templateHeight = 595,
  zoom = 80,
  showGrid = false,
  gridSize = 10,
  templateImg = null,
  selectedIds = new Set(),
  onSelect,
  onUpdateOverlay,
  onDragStart,
  onDragEnd,
  snapPosition,
}) => {
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const layerRef = useRef(null);
  const [bgImage, setBgImage] = useState(null);

  const scale = zoom / 100;
  const renderW = templateWidth * scale;
  const renderH = templateHeight * scale;

  // Load background image
  useEffect(() => {
    if (!templateImg) { setBgImage(null); return; }
    if (templateImg instanceof HTMLImageElement) {
      setBgImage(templateImg);
      return;
    }
    // If it's a URL string
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setBgImage(img);
    img.onerror = () => setBgImage(null);
    img.src = templateImg;
  }, [templateImg]);

  // Update transformer nodes when selection changes
  useEffect(() => {
    if (!transformerRef.current || !layerRef.current) return;
    const stage = stageRef.current;
    if (!stage) return;

    const selectedNodes = [];
    selectedIds.forEach((id) => {
      const node = stage.findOne(`#${id}`);
      if (node) selectedNodes.push(node);
    });
    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, overlays]);

  const handleStageClick = useCallback((e) => {
    // Click on empty space = deselect
    if (e.target === e.target.getStage() || e.target.getClassName() === 'Image') {
      onSelect?.(null, false);
    }
  }, [onSelect]);

  const handleDragMoveWithSnap = useCallback((e, overlayId) => {
    if (!snapPosition) return;
    const node = e.target;
    const rawX = (node.x() / renderW) * 100;
    const rawY = (node.y() / renderH) * 100;
    // Snapping is applied when drag ends, not during move for performance
  }, [snapPosition, renderW, renderH]);

  const handleOverlayDragEnd = useCallback((id, newPos) => {
    let finalPos = newPos;
    if (snapPosition) {
      const snapped = snapPosition(newPos.x, newPos.y, id);
      finalPos = { x: snapped.x, y: snapped.y };
    }
    onDragEnd?.(id, finalPos);
  }, [snapPosition, onDragEnd]);

  const handleTransformEnd = useCallback((id, updates) => {
    onUpdateOverlay?.(id, updates);
  }, [onUpdateOverlay]);

  // Render grid lines
  const gridLines = [];
  if (showGrid && gridSize > 0) {
    const gridPx = (gridSize / 100) * renderW;
    for (let x = gridPx; x < renderW; x += gridPx) {
      gridLines.push(
        <Line key={`gv-${x}`} points={[x, 0, x, renderH]} stroke="rgba(200,200,200,0.25)" strokeWidth={0.5} />
      );
    }
    const gridPxH = (gridSize / 100) * renderH;
    for (let y = gridPxH; y < renderH; y += gridPxH) {
      gridLines.push(
        <Line key={`gh-${y}`} points={[0, y, renderW, y]} stroke="rgba(200,200,200,0.25)" strokeWidth={0.5} />
      );
    }
  }

  // Center guide lines for selected overlay
  const guideLines = [];
  if (selectedIds.size > 0) {
    const selOverlay = overlays.find((o) => selectedIds.has(o.id));
    if (selOverlay) {
      if (Math.abs(selOverlay.x - 50) < 0.5) {
        guideLines.push(
          <Line key="guide-v" points={[renderW / 2, 0, renderW / 2, renderH]} stroke="rgba(139,92,246,0.3)" strokeWidth={1} dash={[4, 4]} />
        );
      }
      if (Math.abs(selOverlay.y - 50) < 0.5) {
        guideLines.push(
          <Line key="guide-h" points={[0, renderH / 2, renderW, renderH / 2]} stroke="rgba(139,92,246,0.3)" strokeWidth={1} dash={[4, 4]} />
        );
      }
    }
  }

  /** Text-like fields rendered as TextObject */
  const TEXT_FIELDS = ['studentName', 'courseName', 'date', 'certificateId', 'serialNumber',
    'instructorName', 'startDate', 'endDate', 'collegeName', 'companyName', 'grade',
    'skills', 'performance', 'customText'];

  /** Image-type fields rendered as ImageObject */
  const IMAGE_FIELDS = ['qrCode', 'logo', 'signature', 'image', 'barcode'];

  return (
    <Stage
      ref={stageRef}
      width={renderW}
      height={renderH}
      onClick={handleStageClick}
      onTap={handleStageClick}
      style={{ cursor: 'default' }}
    >
      <Layer ref={layerRef}>
        {/* Background */}
        {bgImage ? (
          <KonvaImage image={bgImage} width={renderW} height={renderH} />
        ) : (
          <>
            <Rect width={renderW} height={renderH} fillLinearGradientStartPoint={{ x: 0, y: 0 }}
              fillLinearGradientEndPoint={{ x: renderW, y: renderH }}
              fillLinearGradientColorStops={[0, '#f1f5f9', 1, '#e0e7ff']} />
          </>
        )}

        {/* Grid */}
        {gridLines}

        {/* Guide lines */}
        {guideLines}

        {/* Overlays */}
        {overlays.map((overlay) => {
          if (!overlay.visible) return null;

          const isSelected = selectedIds.has(overlay.id);

          // Wipe = colored rectangle
          if (overlay.field === 'wipe') {
            const cx = (overlay.x / 100) * renderW;
            const cy = (overlay.y / 100) * renderH;
            const w = (overlay.maxWidth / 100) * renderW;
            const h = (overlay.height / 100) * renderH;
            return (
              <Rect
                key={overlay.id}
                id={overlay.id}
                x={cx - w / 2}
                y={cy - h / 2}
                width={w}
                height={h}
                fill={overlay.color || '#ffffff'}
                opacity={overlay.opacity ?? 1}
                rotation={overlay.rotation || 0}
                draggable={!overlay.locked}
                stroke={isSelected ? '#3b82f6' : undefined}
                strokeWidth={isSelected ? 2 : 0}
                dash={isSelected ? [5, 5] : undefined}
                onClick={(e) => onSelect?.(overlay.id, e.evt.shiftKey)}
                onTap={() => onSelect?.(overlay.id, false)}
                onDragStart={() => onDragStart?.(overlay.id)}
                onDragEnd={(e) => {
                  const node = e.target;
                  handleOverlayDragEnd(overlay.id, {
                    x: parseFloat(Math.max(0, Math.min(100, ((node.x() + w / 2) / renderW) * 100)).toFixed(2)),
                    y: parseFloat(Math.max(0, Math.min(100, ((node.y() + h / 2) / renderH) * 100)).toFixed(2)),
                  });
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const sx = node.scaleX(); const sy = node.scaleY();
                  node.scaleX(1); node.scaleY(1);
                  handleTransformEnd(overlay.id, {
                    maxWidth: parseFloat(Math.max(1, (node.width() * sx / renderW) * 100).toFixed(2)),
                    height: parseFloat(Math.max(1, (node.height() * sy / renderH) * 100).toFixed(2)),
                    rotation: parseFloat((node.rotation() || 0).toFixed(1)),
                  });
                }}
              />
            );
          }

          // Shape overlays
          if (overlay.field === 'shape') {
            return (
              <ShapeObject
                key={overlay.id}
                overlay={overlay}
                renderW={renderW}
                renderH={renderH}
                isSelected={isSelected}
                onSelect={onSelect}
                onDragStart={() => onDragStart?.(overlay.id)}
                onDragEnd={handleOverlayDragEnd}
                onTransformEnd={handleTransformEnd}
              />
            );
          }

          // Table overlays
          if (overlay.field === 'table') {
            return (
              <TableObject
                key={overlay.id}
                overlay={overlay}
                renderW={renderW}
                renderH={renderH}
                isSelected={isSelected}
                onSelect={onSelect}
                onDragStart={() => onDragStart?.(overlay.id)}
                onDragEnd={handleOverlayDragEnd}
                onTransformEnd={handleTransformEnd}
              />
            );
          }

          // Image-type overlays (placeholder boxes)
          if (IMAGE_FIELDS.includes(overlay.field)) {
            return (
              <ImageObject
                key={overlay.id}
                overlay={overlay}
                renderW={renderW}
                renderH={renderH}
                isSelected={isSelected}
                onSelect={onSelect}
                onDragStart={() => onDragStart?.(overlay.id)}
                onDragEnd={handleOverlayDragEnd}
                onTransformEnd={handleTransformEnd}
              />
            );
          }

          // Text-type overlays
          if (TEXT_FIELDS.includes(overlay.field)) {
            return (
              <TextObject
                key={overlay.id}
                overlay={overlay}
                renderW={renderW}
                renderH={renderH}
                isSelected={isSelected}
                onSelect={onSelect}
                onDragStart={() => onDragStart?.(overlay.id)}
                onDragEnd={handleOverlayDragEnd}
                onDragMove={(e) => handleDragMoveWithSnap(e, overlay.id)}
                onTransformEnd={handleTransformEnd}
              />
            );
          }

          return null;
        })}

        {/* Transformer for resize/rotate handles */}
        <Transformer
          ref={transformerRef}
          rotateEnabled={true}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
          borderStroke="#6366F1"
          borderStrokeWidth={1.5}
          anchorFill="#6366F1"
          anchorStroke="#FFFFFF"
          anchorSize={8}
          anchorCornerRadius={2}
        />
      </Layer>
    </Stage>
  );
};

export default DocumentCanvas;

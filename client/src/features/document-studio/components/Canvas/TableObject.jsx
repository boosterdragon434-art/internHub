import React from 'react';
import { Group, Rect, Line, Text } from 'react-konva';

/**
 * TableObject — Konva renderer for table-type overlays.
 * Fixed row/column counts set at design time. Renders grid lines + per-cell text.
 */
const TableObject = ({ overlay, renderW, renderH, isSelected, onSelect, onDragStart, onDragEnd, onDragMove, onTransformEnd }) => {
  if (!overlay.visible) return null;

  const cx = (overlay.x / 100) * renderW;
  const cy = (overlay.y / 100) * renderH;
  const width = (overlay.maxWidth / 100) * renderW;
  const height = (overlay.height / 100) * renderH;
  const x = cx - width / 2;
  const y = cy - height / 2;

  const rows = overlay.rows || 3;
  const cols = overlay.columns || 3;
  const cellData = overlay.cellData || [];
  const borderColor = overlay.tableBorderColor || '#CBD5E1';
  const headerBg = overlay.tableHeaderBg || '#F1F5F9';
  const rowH = height / rows;
  const colW = width / cols;
  const fontSize = Math.max(8, Math.min(rowH * 0.5, 14));

  return (
    <Group
      id={overlay.id}
      x={x}
      y={y}
      width={width}
      height={height}
      rotation={overlay.rotation || 0}
      opacity={overlay.opacity ?? 1}
      draggable={!overlay.locked}
      onClick={(e) => onSelect?.(overlay.id, e.evt.shiftKey)}
      onTap={() => onSelect?.(overlay.id, false)}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        const node = e.target;
        const newCx = ((node.x() + width / 2) / renderW) * 100;
        const newCy = ((node.y() + height / 2) / renderH) * 100;
        onDragEnd?.(overlay.id, {
          x: parseFloat(Math.max(0, Math.min(100, newCx)).toFixed(2)),
          y: parseFloat(Math.max(0, Math.min(100, newCy)).toFixed(2)),
        });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onTransformEnd?.(overlay.id, {
          maxWidth: parseFloat(Math.max(5, (node.width() * scaleX / renderW) * 100).toFixed(2)),
          height: parseFloat(Math.max(5, (node.height() * scaleY / renderH) * 100).toFixed(2)),
          rotation: parseFloat((node.rotation() || 0).toFixed(1)),
        });
      }}
    >
      {/* Outer border */}
      <Rect
        width={width}
        height={height}
        fill="#FFFFFF"
        stroke={isSelected ? '#6366F1' : borderColor}
        strokeWidth={isSelected ? 2 : 1}
      />
      {/* Header row background */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={rowH}
        fill={headerBg}
      />
      {/* Row lines */}
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <Line
          key={`row-${i}`}
          points={[0, (i + 1) * rowH, width, (i + 1) * rowH]}
          stroke={borderColor}
          strokeWidth={1}
        />
      ))}
      {/* Column lines */}
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <Line
          key={`col-${i}`}
          points={[(i + 1) * colW, 0, (i + 1) * colW, height]}
          stroke={borderColor}
          strokeWidth={1}
        />
      ))}
      {/* Cell text */}
      {Array.from({ length: rows }).map((_, ri) =>
        Array.from({ length: cols }).map((_, ci) => {
          const cellText = cellData[ri]?.[ci] || (ri === 0 ? `Col ${ci + 1}` : '');
          return (
            <Text
              key={`cell-${ri}-${ci}`}
              x={ci * colW + 4}
              y={ri * rowH + 2}
              width={colW - 8}
              height={rowH - 4}
              text={cellText}
              fontSize={fontSize}
              fontFamily="Arial, sans-serif"
              fontStyle={ri === 0 ? 'bold' : 'normal'}
              fill={overlay.color || '#334155'}
              align="center"
              verticalAlign="middle"
              wrap="none"
              ellipsis={true}
            />
          );
        })
      )}
    </Group>
  );
};

export default TableObject;

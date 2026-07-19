import React from 'react';
import { Rect, Text, Group, Circle, RegularPolygon, Line, Star } from 'react-konva';

/**
 * ShapeObject — Konva renderer for shape-type overlays.
 * Supports: rectangle, roundedRectangle, circle, ellipse, triangle, line, star.
 */
const ShapeObject = React.memo(({ overlay, renderW, renderH, isSelected, onSelect, onDragStart, onDragEnd, onDragMove, onTransformEnd }) => {
  if (!overlay.visible) return null;

  const cx = (overlay.x / 100) * renderW;
  const cy = (overlay.y / 100) * renderH;
  const width = (overlay.maxWidth / 100) * renderW;
  const height = (overlay.height / 100) * renderH;
  const x = cx - width / 2;
  const y = cy - height / 2;

  const commonProps = {
    opacity: overlay.opacity ?? 1,
    rotation: overlay.rotation || 0,
    draggable: !overlay.locked,
    onClick: (e) => onSelect?.(overlay.id, e.evt.shiftKey),
    onTap: () => onSelect?.(overlay.id, false),
    onDragStart,
    onDragMove,
    onDragEnd: (e) => {
      const node = e.target;
      // Shapes are centered, so convert back to center percentage
      let newCx, newCy;
      if (overlay.shapeType === 'circle' || overlay.shapeType === 'star') {
        newCx = (node.x() / renderW) * 100;
        newCy = (node.y() / renderH) * 100;
      } else {
        newCx = ((node.x() + width / 2) / renderW) * 100;
        newCy = ((node.y() + height / 2) / renderH) * 100;
      }
      onDragEnd?.(overlay.id, {
        x: parseFloat(Math.max(0, Math.min(100, newCx)).toFixed(2)),
        y: parseFloat(Math.max(0, Math.min(100, newCy)).toFixed(2)),
      });
    },
    onTransformEnd: (e) => {
      const node = e.target;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      onTransformEnd?.(overlay.id, {
        maxWidth: parseFloat(Math.max(1, (node.width() * scaleX / renderW) * 100).toFixed(2)),
        height: parseFloat(Math.max(1, (node.height() * scaleY / renderH) * 100).toFixed(2)),
        rotation: parseFloat((node.rotation() || 0).toFixed(1)),
      });
    },
  };

  const fill = overlay.fill || '#3B82F6';
  const stroke = overlay.stroke || '#1E40AF';
  const strokeWidth = overlay.strokeWidth ?? 2;
  const cornerRadius = overlay.cornerRadius || 0;

  switch (overlay.shapeType) {
    case 'circle':
      return (
        <Circle
          id={overlay.id}
          x={cx}
          y={cy}
          radius={Math.min(width, height) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...commonProps}
        />
      );

    case 'ellipse': {
      // Use a scaled circle approach
      return (
        <Group
          id={overlay.id}
          x={x}
          y={y}
          width={width}
          height={height}
          {...commonProps}
        >
          <Rect
            width={width}
            height={height}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            cornerRadius={Math.min(width, height) / 2}
          />
        </Group>
      );
    }

    case 'triangle':
      return (
        <RegularPolygon
          id={overlay.id}
          x={cx}
          y={cy}
          sides={3}
          radius={Math.min(width, height) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...commonProps}
        />
      );

    case 'star':
      return (
        <Star
          id={overlay.id}
          x={cx}
          y={cy}
          numPoints={5}
          innerRadius={Math.min(width, height) / 4}
          outerRadius={Math.min(width, height) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          {...commonProps}
        />
      );

    case 'line':
      return (
        <Line
          id={overlay.id}
          points={[x, cy, x + width, cy]}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={overlay.opacity ?? 1}
          rotation={overlay.rotation || 0}
          draggable={!overlay.locked}
          onClick={(e) => onSelect?.(overlay.id, e.evt.shiftKey)}
          onTap={() => onSelect?.(overlay.id, false)}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={(e) => {
            const node = e.target;
            onDragEnd?.(overlay.id, {
              x: parseFloat(((node.x() + width / 2) / renderW) * 100).toFixed(2),
              y: parseFloat((node.y() / renderH) * 100).toFixed(2),
            });
          }}
        />
      );

    case 'roundedRectangle':
      return (
        <Rect
          id={overlay.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={cornerRadius || 10}
          {...commonProps}
        />
      );

    case 'rectangle':
    default:
      return (
        <Rect
          id={overlay.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          cornerRadius={cornerRadius}
          {...commonProps}
        />
      );
  }
});

export default ShapeObject;

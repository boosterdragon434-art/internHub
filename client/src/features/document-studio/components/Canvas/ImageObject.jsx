import React from 'react';
import { Group, Rect, Text } from 'react-konva';

/**
 * ImageObject — Konva renderer for image-type overlays (qrCode, logo, signature, image).
 * Displays styled placeholder boxes in the editor (actual images render in the PDF).
 */

const PLACEHOLDER_STYLES = {
  qrCode: { bg: '#E0F2FE', border: '#0EA5E9', text: '#0284C7', label: '▣ QR Code' },
  logo: { bg: '#EDE9FE', border: '#8B5CF6', text: '#7C3AED', label: '◆ Logo' },
  signature: { bg: '#ECFDF5', border: '#10B981', text: '#059669', label: '✎ Signature' },
  image: { bg: '#FFF7ED', border: '#F97316', text: '#EA580C', label: '🖼 Image' },
  barcode: { bg: '#F5F3FF', border: '#7C3AED', text: '#6D28D9', label: '▮▯▮ Barcode' },
};

const ImageObject = React.memo(({ overlay, renderW, renderH, isSelected, onSelect, onDragStart, onDragEnd, onDragMove, onTransformEnd }) => {
  if (!overlay.visible) return null;

  const cx = (overlay.x / 100) * renderW;
  const cy = (overlay.y / 100) * renderH;
  const width = (overlay.maxWidth / 100) * renderW;
  const height = (overlay.height / 100) * renderH;
  const x = cx - width / 2;
  const y = cy - height / 2;

  const style = PLACEHOLDER_STYLES[overlay.field] || PLACEHOLDER_STYLES.image;

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
          maxWidth: parseFloat(Math.max(1, (node.width() * scaleX / renderW) * 100).toFixed(2)),
          height: parseFloat(Math.max(1, (node.height() * scaleY / renderH) * 100).toFixed(2)),
          rotation: parseFloat((node.rotation() || 0).toFixed(1)),
        });
      }}
    >
      {/* Background fill */}
      <Rect
        width={width}
        height={height}
        fill={style.bg}
        stroke={isSelected ? '#6366F1' : style.border}
        strokeWidth={isSelected ? 2 : 1}
        dash={isSelected ? [5, 5] : [3, 3]}
        cornerRadius={4}
      />
      {/* Label */}
      <Text
        width={width}
        height={height}
        text={style.label}
        fontSize={Math.max(10, Math.min(width, height) * 0.2)}
        fontFamily="Arial, sans-serif"
        fontStyle="bold"
        fill={style.text}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
});

export default ImageObject;

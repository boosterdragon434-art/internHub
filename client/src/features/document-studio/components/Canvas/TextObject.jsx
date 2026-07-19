import React, { useEffect, useRef } from 'react';
import { Text } from 'react-konva';
import { autoScaleFont } from '../../utils/coordinateMath';

/**
 * Mock data for preview text rendering in the editor.
 */
const MOCK_DATA = {
  studentName: 'John Doe',
  courseName: 'Advanced Certificate in AI Engineering',
  certificateId: 'CERT-0001-ABCD',
  serialNumber: '0001',
  instructorName: 'Dr. Jane Smith',
  startDate: '08/05/2026',
  endDate: '08/08/2026',
  collegeName: 'Oxford University',
  companyName: 'InternHub',
  grade: 'A+',
  skills: 'React, Node.js, MongoDB',
  performance: 'Outstanding',
};

const PREVIEW_DATE = new Date('2026-05-08T00:00:00');

const formatPreviewDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  switch (format) {
    case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'DD MMM YYYY': return `${day} ${shortMonths[d.getMonth()]} ${year}`;
    case 'MMMM DD, YYYY': return `${longMonths[d.getMonth()]} ${day}, ${year}`;
    default: return `${day}/${month}/${year}`;
  }
};

/**
 * Resolve the display text for an overlay in the editor preview.
 */
const resolvePreviewText = (overlay) => {
  if (overlay.field === 'date') {
    return formatPreviewDate(PREVIEW_DATE, overlay.dateFormat || 'DD/MM/YYYY');
  }
  if (overlay.field === 'customText') {
    return overlay.customText || 'Custom Text';
  }
  return MOCK_DATA[overlay.field] || overlay.field;
};

/**
 * Map overlay fontFamily to CSS-compatible font string for Konva.
 */
const resolveCanvasFont = (fontFamily) => {
  const map = {
    'Helvetica': 'Arial, Helvetica, sans-serif',
    'Helvetica-Bold': 'Arial, Helvetica, sans-serif',
    'Helvetica-Oblique': 'Arial, Helvetica, sans-serif',
    'Helvetica-BoldOblique': 'Arial, Helvetica, sans-serif',
    'Times-Roman': 'Times New Roman, Times, serif',
    'Times-Bold': 'Times New Roman, Times, serif',
    'Times-Italic': 'Times New Roman, Times, serif',
    'Times-BoldItalic': 'Times New Roman, Times, serif',
    'Courier': 'Courier New, Courier, monospace',
    'Courier-Bold': 'Courier New, Courier, monospace',
  };
  return map[fontFamily] || 'Arial, sans-serif';
};

const isBoldFont = (fontFamily, fontWeight) =>
  fontWeight === 'bold' || fontFamily?.includes('Bold');

const isItalicFont = (fontFamily) =>
  fontFamily?.includes('Italic') || fontFamily?.includes('Oblique');

/**
 * TextObject — Konva Text node renderer for text-type overlay fields.
 * Mirrors the exact text rendering logic from the existing Canvas 2D editor
 * and certificateService.js _buildOverlayPDF.
 */
const TextObject = React.memo(({ overlay, renderW, renderH, isSelected, onSelect, onDragStart, onDragEnd, onDragMove, onTransformEnd }) => {
  if (!overlay.visible) return null;

  const x = (overlay.x / 100) * renderW;
  const y = (overlay.y / 100) * renderH;
  const maxWidth = (overlay.maxWidth / 100) * renderW;
  const boxHeight = (overlay.height / 100) * renderH;

  let text = resolvePreviewText(overlay);
  if (overlay.uppercase) text = text.toUpperCase();

  const fontFamily = resolveCanvasFont(overlay.fontFamily);
  const fontStyle = `${isBoldFont(overlay.fontFamily, overlay.fontWeight) ? 'bold' : 'normal'} ${isItalicFont(overlay.fontFamily) ? 'italic' : 'normal'}`;

  // Calculate position based on alignment
  const align = overlay.align || 'center';
  let textX = x;
  if (align === 'center') textX = x - maxWidth / 2;
  else if (align === 'right') textX = x - maxWidth;

  return (
    <Text
      id={overlay.id}
      x={textX}
      y={y - boxHeight / 2}
      width={maxWidth}
      height={boxHeight}
      text={text}
      fontSize={overlay.fontSize}
      fontFamily={fontFamily}
      fontStyle={fontStyle}
      fill={overlay.color || '#000000'}
      opacity={overlay.opacity ?? 1}
      align={align}
      verticalAlign="middle"
      lineHeight={overlay.lineHeight || 1.2}
      letterSpacing={overlay.letterSpacing || 0}
      rotation={overlay.rotation || 0}
      offsetX={overlay.rotation ? 0 : 0}
      offsetY={overlay.rotation ? 0 : 0}
      draggable={!overlay.locked}
      wrap="word"
      ellipsis={false}
      onClick={(e) => onSelect?.(overlay.id, e.evt.shiftKey)}
      onTap={(e) => onSelect?.(overlay.id, false)}
      onDragStart={onDragStart}
      onDragEnd={(e) => {
        const node = e.target;
        const newPctX = align === 'center'
          ? ((node.x() + maxWidth / 2) / renderW) * 100
          : align === 'right'
            ? ((node.x() + maxWidth) / renderW) * 100
            : (node.x() / renderW) * 100;
        const newPctY = ((node.y() + boxHeight / 2) / renderH) * 100;
        onDragEnd?.(overlay.id, {
          x: parseFloat(Math.max(0, Math.min(100, newPctX)).toFixed(2)),
          y: parseFloat(Math.max(0, Math.min(100, newPctY)).toFixed(2)),
        });
      }}
      onDragMove={onDragMove}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        const newWidth = Math.max(5, (node.width() * scaleX / renderW) * 100);
        const newHeight = Math.max(1, (node.height() * scaleY / renderH) * 100);
        onTransformEnd?.(overlay.id, {
          maxWidth: parseFloat(newWidth.toFixed(2)),
          height: parseFloat(newHeight.toFixed(2)),
          rotation: parseFloat((node.rotation() || 0).toFixed(1)),
        });
      }}
    />
  );
});

export default TextObject;

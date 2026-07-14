/**
 * Coordinate conversion utilities for the Document Studio.
 * Single source of truth for canvas-pixel ↔ percentage ↔ PDF-point conversions.
 * Mirrors the exact math used in server/services/certificateService.js _buildOverlayPDF.
 */

/**
 * Convert percentage-based position to pixel coordinates.
 * @param {number} pct - Percentage value (0-100)
 * @param {number} dimension - Target dimension in pixels
 * @returns {number} Pixel value
 */
export const pctToPixel = (pct, dimension) => (pct / 100) * dimension;

/**
 * Convert pixel coordinate to percentage.
 * @param {number} px - Pixel value
 * @param {number} dimension - Reference dimension in pixels
 * @returns {number} Percentage value (0-100)
 */
export const pixelToPct = (px, dimension) => (px / dimension) * 100;

/**
 * Scale a font size from canvas pixels to the current zoom level.
 * @param {number} baseFontSize - Font size at 100% zoom
 * @param {number} zoom - Current zoom level (percentage)
 * @returns {number} Scaled font size
 */
export const scaleFontSize = (baseFontSize, zoom) => baseFontSize * (zoom / 100);

/**
 * Compute the bounding box of an overlay at the given render dimensions.
 * Mirrors the positioning logic in both the canvas editor and _buildOverlayPDF.
 * @param {object} overlay - Overlay object with x, y, maxWidth, height, align, field
 * @param {number} renderW - Render width in pixels
 * @param {number} renderH - Render height in pixels
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export const getOverlayBounds = (overlay, renderW, renderH) => {
  const cx = pctToPixel(overlay.x, renderW);
  const cy = pctToPixel(overlay.y, renderH);
  const width = pctToPixel(overlay.maxWidth, renderW);
  const height = pctToPixel(overlay.height, renderH);

  // Wipe/image-type fields center the box on (cx, cy)
  const isImageType = ['wipe', 'qrCode', 'logo', 'signature', 'shape', 'table', 'image', 'barcode'].includes(overlay.field);
  if (isImageType) {
    return { x: cx - width / 2, y: cy - height / 2, width, height };
  }

  // Text fields position based on alignment
  const align = overlay.align || 'center';
  let boxX = cx;
  if (align === 'center') boxX = cx - width / 2;
  else if (align === 'right') boxX = cx - width;

  return { x: boxX, y: cy - height / 2, width, height };
};

/**
 * Auto-scale text that overflows its bounding box.
 * Port of the exact formula from certificateService.js _buildOverlayPDF.
 * @param {number} fontSize - Current font size
 * @param {number} textHeight - Measured text height
 * @param {number} boxHeight - Available box height
 * @returns {number} Adjusted font size
 */
export const autoScaleFont = (fontSize, textHeight, boxHeight) => {
  if (textHeight > boxHeight && fontSize > 6) {
    const scaleFactor = Math.max(0.5, boxHeight / textHeight);
    return Math.max(6, fontSize * scaleFactor);
  }
  return fontSize;
};

/**
 * Snap a coordinate to the nearest grid point if within threshold.
 * @param {number} value - Current percentage value
 * @param {number} gridSize - Grid size in percentage
 * @param {number} threshold - Snap threshold in percentage (default 1.5)
 * @returns {number} Snapped value
 */
export const snapToGrid = (value, gridSize, threshold = 1.5) => {
  const nearest = Math.round(value / gridSize) * gridSize;
  return Math.abs(value - nearest) < threshold ? nearest : value;
};

/**
 * Snap a coordinate to the center line (50%) if within threshold.
 * @param {number} value - Current percentage value
 * @param {number} threshold - Snap threshold (default 1.5)
 * @returns {number} Snapped value
 */
export const snapToCenter = (value, threshold = 1.5) => {
  return Math.abs(value - 50) < threshold ? 50 : value;
};

/**
 * Clamp a value between min and max.
 */
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Generate a unique overlay ID.
 * @returns {string}
 */
export const generateOverlayId = () =>
  `ov_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Default values for new overlay creation by field type.
 */
export const DEFAULT_OVERLAY_PROPS = {
  text: {
    x: 50, y: 50, fontSize: 24, fontWeight: 'normal', fontFamily: 'Helvetica-Bold',
    color: '#000000', align: 'center', maxWidth: 60, height: 5, uppercase: false,
    rotation: 0, opacity: 1, visible: true, customText: '', dateFormat: 'DD/MM/YYYY',
    lineHeight: 1.2, letterSpacing: 0, locked: false, groupId: null,
  },
  wipe: {
    x: 50, y: 50, fontSize: 24, fontWeight: 'normal', fontFamily: 'Helvetica-Bold',
    color: '#ffffff', align: 'center', maxWidth: 20, height: 8, uppercase: false,
    rotation: 0, opacity: 1, visible: true, locked: false, groupId: null,
  },
  image: {
    x: 50, y: 50, fontSize: 24, fontWeight: 'normal', fontFamily: 'Helvetica-Bold',
    color: '#000000', align: 'center', maxWidth: 12, height: 12, uppercase: false,
    rotation: 0, opacity: 1, visible: true, locked: false, groupId: null,
  },
  shape: {
    x: 50, y: 50, fontSize: 24, fontWeight: 'normal', fontFamily: 'Helvetica-Bold',
    color: '#000000', align: 'center', maxWidth: 15, height: 15, uppercase: false,
    rotation: 0, opacity: 1, visible: true, locked: false, groupId: null,
    shapeType: 'rectangle', fill: '#3B82F6', stroke: '#1E40AF', strokeWidth: 2, cornerRadius: 0,
  },
  table: {
    x: 50, y: 50, fontSize: 12, fontWeight: 'normal', fontFamily: 'Helvetica',
    color: '#000000', align: 'center', maxWidth: 40, height: 25, uppercase: false,
    rotation: 0, opacity: 1, visible: true, locked: false, groupId: null,
    rows: 3, columns: 3, cellData: [], columnWidths: [], rowHeights: [],
    tableBorderColor: '#CBD5E1', tableHeaderBg: '#F1F5F9',
  },
  barcode: {
    x: 50, y: 50, fontSize: 24, fontWeight: 'normal', fontFamily: 'Helvetica-Bold',
    color: '#000000', align: 'center', maxWidth: 20, height: 8, uppercase: false,
    rotation: 0, opacity: 1, visible: true, locked: false, groupId: null,
    barcodeFormat: 'CODE128', barcodeValue: '',
  },
};

/**
 * Get default overlay properties for a given field type.
 * @param {string} field - Overlay field type
 * @returns {object} Default properties
 */
export const getDefaultsForField = (field) => {
  const imageFields = ['qrCode', 'logo', 'signature', 'image'];
  if (field === 'wipe') return { ...DEFAULT_OVERLAY_PROPS.wipe };
  if (field === 'shape') return { ...DEFAULT_OVERLAY_PROPS.shape };
  if (field === 'table') return { ...DEFAULT_OVERLAY_PROPS.table };
  if (field === 'barcode') return { ...DEFAULT_OVERLAY_PROPS.barcode };
  if (imageFields.includes(field)) return { ...DEFAULT_OVERLAY_PROPS.image };
  return { ...DEFAULT_OVERLAY_PROPS.text };
};

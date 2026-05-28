const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const logger = require('../utils/logger');

/**
 * Generates a base64 QR Code Data URL for the given verification text link.
 */
const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 120,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });
  } catch (err) {
    logger.error('Failed to generate QR Code data url:', err);
    throw err;
  }
};

/**
 * Format a Date object to a string according to the given format pattern.
 * @param {Date} date
 * @param {string} format
 * @returns {string}
 */
const formatDate = (date, format = 'DD/MM/YYYY') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  const yearShort = year.slice(-2);
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  switch (format) {
    case 'DD-MM-YYYY': return `${day}-${month}-${year}`;
    case 'MM/DD/YYYY': return `${month}/${day}/${year}`;
    case 'YYYY/MM/DD': return `${year}/${month}/${day}`;
    case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
    case 'DD MMM YYYY': return `${day} ${shortMonths[d.getMonth()]} ${year}`;
    case 'DD MMMM YYYY': return `${day} ${longMonths[d.getMonth()]} ${year}`;
    case 'DD/MMM/YY': return `${day}/${shortMonths[d.getMonth()]}/${yearShort}`;
    case 'DD/MMMM/YY': return `${day}/${longMonths[d.getMonth()]}/${yearShort}`;
    case 'MMMM DD, YYYY': return `${longMonths[d.getMonth()]} ${day}, ${year}`;
    default: return `${day}/${month}/${year}`;
  }
};

/**
 * Resolve the appropriate PDFKit font string from an overlay font family.
 * PDFKit only supports built-in fonts, so map custom font names to closest equivalent.
 * @param {string} fontFamily
 * @param {string} fontWeight
 * @returns {string}
 */
const resolvePDFFont = (fontFamily, fontWeight = 'normal') => {
  const family = (fontFamily || 'Helvetica').replace(/-Bold$|-Italic$|-Oblique$|-BoldOblique$|-BoldItalic$/, '');
  const isBold = fontWeight === 'bold' || fontFamily?.includes('Bold');
  const isItalic = fontFamily?.includes('Italic') || fontFamily?.includes('Oblique');

  const fontMap = {
    'Helvetica': isBold && isItalic ? 'Helvetica-BoldOblique' : isBold ? 'Helvetica-Bold' : isItalic ? 'Helvetica-Oblique' : 'Helvetica',
    'Times': isBold && isItalic ? 'Times-BoldItalic' : isBold ? 'Times-Bold' : isItalic ? 'Times-Italic' : 'Times-Roman',
    'Times-Roman': isBold && isItalic ? 'Times-BoldItalic' : isBold ? 'Times-Bold' : isItalic ? 'Times-Italic' : 'Times-Roman',
    'Courier': isBold ? 'Courier-Bold' : isItalic ? 'Courier-Oblique' : 'Courier',
  };

  // Check if the original fontFamily is already a valid PDFKit font
  const validPDFKitFonts = [
    'Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique',
    'Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic',
    'Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique',
  ];

  if (validPDFKitFonts.includes(fontFamily)) {
    return fontFamily;
  }

  return fontMap[family] || (isBold ? 'Helvetica-Bold' : 'Helvetica');
};

/**
 * Compiles a premium landscape A4 Certificate PDF.
 * Supports three modes:
 *   1. Overlays mode — uses template.overlays[] for dynamic per-field positioning
 *   2. Custom background mode — legacy fixed layout positions with custom BG image
 *   3. Classic mode — default gold-border vector certificate design
 *
 * @param {Object} certData
 */
const buildCertificatePDF = (certData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // Landscape A4 dimensions in PDF points
      const pdfW = 841.89;
      const pdfH = 595.28;

      const hasCustomBg = certData.backgroundImageBuffer && certData.backgroundImageBuffer.length > 0;
      const hasOverlays = certData.overlays && certData.overlays.length > 0;

      if (hasOverlays && hasCustomBg) {
        // ── Mode 1: Advanced overlay-based rendering ──
        _buildOverlayPDF(doc, certData, pdfW, pdfH);
      } else if (hasCustomBg) {
        // ── Mode 2: Legacy custom background with fixed positions ──
        _buildCustomTemplatePDF(doc, certData, pdfW, pdfH);
      } else {
        // ── Mode 3: Classic gold-border vector design ──
        _buildClassicPDF(doc, certData, pdfW, pdfH);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Renders certificate using the advanced overlay-based system.
 * Overlays use percentage-based coordinates mapped to PDF dimensions.
 * @private
 */
const _buildOverlayPDF = (doc, certData, pdfW, pdfH) => {
  // Draw background
  doc.image(certData.backgroundImageBuffer, 0, 0, { width: pdfW, height: pdfH });

  // Build data mapping for dynamic field resolution
  const dataMap = {
    studentName: certData.studentName || 'Student Name',
    courseName: certData.internshipTitle || 'Program Title',
    date: formatDate(certData.completionDate || new Date(), 'DD/MM/YYYY'),
    certificateId: certData.certificateId || 'CERT-0000',
    serialNumber: certData.certificateId?.split('-').pop() || '0000',
    instructorName: certData.guideName || 'InternHub Advisor',
  };

  const canvasW = certData.canvasWidth || 842;
  const canvasH = certData.canvasHeight || 595;

  // Process each overlay
  for (const overlay of certData.overlays) {
    if (!overlay.visible) continue;

    // Convert percentage positions to PDF points
    const x = (overlay.x / 100) * pdfW;
    const y = (overlay.y / 100) * pdfH;
    const maxWidthPt = (overlay.maxWidth / 100) * pdfW;
    const heightPt = (overlay.height / 100) * pdfH;

    // Scale font size from canvas pixels to PDF points
    const fontSize = Math.max(4, overlay.fontSize * (pdfW / canvasW));

    if (overlay.field === 'wipe') {
      // Draw white/colored rectangle to mask area
      doc.save();
      if (overlay.rotation) {
        doc.translate(x, y);
        doc.rotate(overlay.rotation);
        doc.translate(-x, -y);
      }
      doc.fillColor(overlay.color || '#ffffff');
      doc.opacity(overlay.opacity ?? 1);
      doc.rect(x - maxWidthPt / 2, y - heightPt / 2, maxWidthPt, heightPt).fill();
      doc.restore();
      continue;
    }

    // Resolve text value
    let text = '';
    if (overlay.field === 'customText') {
      text = overlay.customText || '';
    } else if (overlay.field === 'date') {
      text = formatDate(certData.completionDate || new Date(), overlay.dateFormat || 'DD/MM/YYYY');
    } else {
      text = dataMap[overlay.field] || overlay.field;
    }

    if (overlay.uppercase) {
      text = text.toUpperCase();
    }

    // Resolve PDF-compatible font
    const fontName = resolvePDFFont(overlay.fontFamily, overlay.fontWeight);

    doc.save();
    doc.font(fontName);
    doc.fontSize(fontSize);
    doc.fillColor(overlay.color || '#000000');
    doc.opacity(overlay.opacity ?? 1);

    if (overlay.rotation) {
      doc.translate(x, y);
      doc.rotate(overlay.rotation);
      doc.translate(-x, -y);
    }

    // Calculate text position based on alignment
    const align = overlay.align || 'center';
    let textX = x;
    if (align === 'center') {
      textX = x - maxWidthPt / 2;
    } else if (align === 'right') {
      textX = x - maxWidthPt;
    }

    // Render text with proper alignment and wrapping
    doc.text(text, textX, y - heightPt / 2 + (heightPt - fontSize) / 2, {
      width: maxWidthPt,
      align: align,
      lineGap: fontSize * ((overlay.lineHeight || 1.2) - 1),
    });

    doc.restore();
  }

  // Always render QR code at bottom-right corner if available
  if (certData.qrCodeBase64) {
    const qrBuffer = Buffer.from(
      certData.qrCodeBase64.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );
    doc.image(qrBuffer, pdfW - 110, pdfH - 110, { width: 85, height: 85 });
    doc.fillColor('#64748B').fontSize(7).font('Helvetica').text(
      `ID: ${certData.certificateId}`,
      pdfW - 115,
      pdfH - 20,
      { width: 95, align: 'center' }
    );
  }
};

/**
 * Renders certificate with custom uploaded background image and legacy fixed layout positions.
 * @private
 */
const _buildCustomTemplatePDF = (doc, certData, pdfW, pdfH) => {
  const layout = certData.layout || {};
  const typo = certData.typography || {};

  const namePos = layout.namePosition || { x: 300, y: 220 };
  const datePos = layout.datePosition || { x: 150, y: 420 };
  const idPos = layout.idPosition || { x: 150, y: 450 };
  const qrPos = layout.qrPosition || { x: 480, y: 400 };

  const fontFamily = typo.fontFamily || 'Helvetica';
  const fontSize = typo.fontSize || 28;
  const fontColor = typo.color || '#1E293B';

  doc.image(certData.backgroundImageBuffer, 0, 0, { width: pdfW, height: pdfH });

  doc.fillColor(fontColor).fontSize(fontSize).font(`${fontFamily}-Bold`);
  doc.text(certData.studentName.toUpperCase(), namePos.x, namePos.y, {
    width: pdfW - namePos.x - 50,
    align: 'left',
  });

  doc.fillColor(fontColor).fontSize(Math.max(12, fontSize - 14)).font(fontFamily);
  doc.text(formatDate(certData.completionDate, 'MMMM DD, YYYY'), datePos.x, datePos.y, {
    width: 300,
    align: 'left',
  });

  doc.fillColor('#64748B').fontSize(Math.max(9, fontSize - 18)).font(fontFamily);
  doc.text(`ID: ${certData.certificateId}`, idPos.x, idPos.y, {
    width: 300,
    align: 'left',
  });

  doc.fillColor(fontColor).fontSize(Math.max(16, fontSize - 8)).font(`${fontFamily}-Bold`);
  doc.text(certData.internshipTitle, namePos.x, namePos.y + fontSize + 15, {
    width: pdfW - namePos.x - 50,
    align: 'left',
  });

  doc.fillColor('#6366F1').fontSize(Math.max(14, fontSize - 10)).font(`${fontFamily}-Bold`);
  doc.text(`Grade: ${certData.grade}`, namePos.x, namePos.y + fontSize + 50, {
    width: 200,
    align: 'left',
  });

  if (certData.guideName) {
    doc.fillColor(fontColor).fontSize(Math.max(11, fontSize - 16)).font(fontFamily);
    doc.text(`Guide: ${certData.guideName}`, namePos.x, namePos.y + fontSize + 75, {
      width: 300,
      align: 'left',
    });
  }

  if (certData.qrCodeBase64) {
    const qrBuffer = Buffer.from(
      certData.qrCodeBase64.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );
    doc.image(qrBuffer, qrPos.x, qrPos.y, { width: 85, height: 85 });
  }
};

/**
 * Renders the classic gold-border vector graphics certificate design.
 * @private
 */
const _buildClassicPDF = (doc, certData, pdfW, pdfH) => {
  doc.rect(0, 0, pdfW, pdfH).fill('#F8FAFC');

  doc.rect(20, 20, pdfW - 40, pdfH - 40).stroke('#E2E8F0');
  doc.lineWidth(3);
  doc.rect(28, 28, pdfW - 56, pdfH - 56).stroke('#0F172A');
  doc.lineWidth(1);
  doc.rect(34, 34, pdfW - 68, pdfH - 68).stroke('#D97706');

  const drawCorner = (cx, cy) => {
    doc.rect(cx, cy, 20, 20).fill('#D97706');
  };
  drawCorner(28, 28);
  drawCorner(pdfW - 48, 28);
  drawCorner(28, pdfH - 48);
  drawCorner(pdfW - 48, pdfH - 48);

  doc.fillColor('#0F172A').fontSize(32).font('Helvetica-Bold');
  doc.text('CERTIFICATE OF COMPLETION', 0, 75, { align: 'center', tracking: 2 });

  doc.fillColor('#64748B').fontSize(13).font('Helvetica-Oblique');
  doc.text('This is proudly presented to', 0, 125, { align: 'center' });

  doc.fillColor('#6366F1').fontSize(28).font('Helvetica-Bold');
  doc.text(certData.studentName.toUpperCase(), 0, 160, { align: 'center' });

  doc.lineWidth(2);
  doc.moveTo(pdfW / 2 - 180, 195).lineTo(pdfW / 2 + 180, 195).stroke('#6366F1');

  doc.fillColor('#334155').fontSize(14).font('Helvetica');
  doc.text('for outstanding performance and successful completion of the requirements for', 0, 220, {
    align: 'center',
    lineGap: 4,
  });

  doc.fillColor('#0F172A').fontSize(20).font('Helvetica-Bold');
  doc.text(certData.internshipTitle, 0, 248, { align: 'center' });

  doc.fillColor('#64748B').fontSize(12).font('Helvetica');
  doc.text('A dynamic program demonstrating practical expertise and professional collaboration.', 0, 285, { align: 'center' });

  const boxY = 320;
  doc.rect(80, boxY, pdfW - 160, 85).fill('#FFFFFF');
  doc.lineWidth(1);
  doc.rect(80, boxY, pdfW - 160, 85).stroke('#E2E8F0');

  const colWidth = (pdfW - 160) / 4;
  const drawColHeader = (colIdx, label, value) => {
    const x = 80 + colIdx * colWidth;
    doc.fillColor('#64748B').fontSize(10).font('Helvetica-Bold').text(label.toUpperCase(), x, boxY + 20, { width: colWidth, align: 'center' });
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text(value, x, boxY + 45, { width: colWidth, align: 'center' });
  };

  drawColHeader(0, 'Internship', certData.duration);
  drawColHeader(1, 'Performance Grade', certData.grade);
  drawColHeader(2, 'Completion Date', new Date(certData.completionDate).toLocaleDateString());
  drawColHeader(3, 'Assigned Guide', certData.guideName || 'InternHub Advisor');

  doc.lineWidth(1);
  for (let i = 1; i <= 3; i++) {
    doc.moveTo(80 + i * colWidth, boxY).lineTo(80 + i * colWidth, boxY + 85).stroke('#E2E8F0');
  }

  const footerY = 440;

  if (certData.qrCodeBase64) {
    const qrBuffer = Buffer.from(certData.qrCodeBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    doc.image(qrBuffer, 85, footerY, { width: 85, height: 85 });
  }

  doc.fillColor('#64748B').fontSize(9).font('Helvetica-Bold').text('SECURE VERIFICATION', 185, footerY + 25, { width: 150 });
  doc.fillColor('#94A3B8').fontSize(8).font('Helvetica').text(`ID: ${certData.certificateId}`, 185, footerY + 40, { width: 180 });

  const sigX = pdfW - 265;
  doc.lineWidth(1.5);
  doc.moveTo(sigX, footerY + 50).lineTo(sigX + 180, footerY + 50).stroke('#475569');
  doc.fillColor('#6366F1').fontSize(16).font('Helvetica-Oblique').text('Admin Core Committee', sigX, footerY + 22, { width: 180, align: 'center' });
  doc.fillColor('#64748B').fontSize(10).font('Helvetica-Bold').text('AUTHORIZED SIGNATURE', sigX, footerY + 58, { width: 180, align: 'center' });
};

module.exports = {
  generateQRCode,
  buildCertificatePDF,
};

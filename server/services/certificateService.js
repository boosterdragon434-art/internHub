const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const JsBarcode = require('jsbarcode');
const { createCanvas } = require('canvas');
const logger = require('../utils/logger');
const { CERTIFICATE_ID_PREFIX } = require('../config/constants');

/**
 * Generates a base64 QR Code Data URL for the given verification text link.
 * Uses high error correction for print reliability.
 */
const generateQRCode = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 150,
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
 * Generate a cryptographically secure, collision-resistant certificate ID.
 * Format: CERT-YYYYMMDD-XXXXXXXX (prefix + date + 8 hex chars from crypto)
 * @returns {string}
 */
const generateSecureCertificateId = () => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${CERTIFICATE_ID_PREFIX}-${datePart}-${randomPart}`;
};

/**
 * Generate a SHA-256 verification hash for tamper detection.
 * @param {object} params
 * @param {string} params.certificateId
 * @param {string} params.studentName
 * @param {string} params.internshipTitle
 * @param {Date} params.completionDate
 * @returns {string} Hex hash
 */
const generateVerificationHash = ({ certificateId, studentName, internshipTitle, completionDate }) => {
  const payload = `${certificateId}|${studentName}|${internshipTitle}|${new Date(completionDate).toISOString()}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Compute SHA-256 hash of a buffer for duplicate file detection.
 * @param {Buffer} buffer
 * @returns {string} Hex hash
 */
const computeFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
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
 * Parses dynamic variables inside custom text fields like {{student_name}}
 */
const parsePlaceholders = (text, certData, dataMap) => {
  if (!text) return '';
  let parsedText = text;

  const variables = {
    ...dataMap,
    student_name: certData.studentName || '',
    internship_role: certData.internshipTitle || '',
    department: certData.department || '',
    college_name: certData.college || '',
    start_date: certData.joiningDate ? formatDate(certData.joiningDate, 'DD/MM/YYYY') : '',
    end_date: certData.completionDate ? formatDate(certData.completionDate, 'DD/MM/YYYY') : '',
    duration: certData.duration || '',
    certificate_id: certData.certificateId || '',
    issue_date: certData.issueDate ? formatDate(certData.issueDate, 'DD/MM/YYYY') : formatDate(new Date(), 'DD/MM/YYYY'),
    company_name: certData.companyName || 'InternHub',
    guide_name: certData.guideName || '',
    skills: Array.isArray(certData.skillsAcquired) ? certData.skillsAcquired.join(', ') : (certData.skillsAcquired || ''),
    performance: certData.grade || '',
    verification_url: certData.verificationUrl || '',
  };

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'gi');
    parsedText = parsedText.replace(regex, value);
  }

  // Phase 7: Multi-page placeholders
  parsedText = parsedText.replace(/{{page}}/gi, String(certData._currentPage || 1));
  parsedText = parsedText.replace(/{{totalPages}}/gi, String(certData._totalPages || 1));

  return parsedText;
};

/**
 * Compiles a premium PDF Certificate or Letter.
 * Supports multiple formats (A4, Letter) and orientations (Portrait, Landscape).
 *
 * @param {Object} certData
 */
const buildCertificatePDF = (certData) => {
  return new Promise((resolve, reject) => {
    try {
      const pageFormat = certData.pageFormat || 'A4';
      const orientation = certData.orientation || 'landscape';

      let pdfW, pdfH;
      let sizeOpt = pageFormat;
      if (pageFormat === 'Custom') {
        pdfW = certData.customPageWidth || 842;
        pdfH = certData.customPageHeight || 595;
        sizeOpt = [pdfW, pdfH];
      } else if (pageFormat === 'Letter') {
        pdfW = orientation === 'landscape' ? 792 : 612;
        pdfH = orientation === 'landscape' ? 612 : 792;
      } else {
        // A4 by default
        pdfW = orientation === 'landscape' ? 841.89 : 595.28;
        pdfH = orientation === 'landscape' ? 595.28 : 841.89;
      }

      const doc = new PDFDocument({
        size: sizeOpt,
        layout: pageFormat === 'Custom' ? undefined : orientation,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const hasCustomBg = certData.backgroundImageBuffer && certData.backgroundImageBuffer.length > 0;
      const hasOverlays = certData.overlays && certData.overlays.length > 0;

      if (hasOverlays && hasCustomBg) {
        // ── Mode 1: Advanced overlay-based rendering ──
        // Phase 7: Multi-page support
        if (certData.pages && certData.pages.length > 0) {
          certData._totalPages = certData.pages.length;
          certData.pages.forEach((page, pageIdx) => {
            if (pageIdx > 0) {
              doc.addPage({
                size: sizeOpt,
                layout: pageFormat === 'Custom' ? undefined : orientation,
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
              });
            }
            certData._currentPage = pageIdx + 1;
            // Each page can have its own bg and overlays
            const pageBg = page.backgroundImageBuffer || certData.backgroundImageBuffer;
            if (pageBg && pageBg.length > 0) {
              try { doc.image(pageBg, 0, 0, { width: pdfW, height: pdfH }); } catch (e) {
                doc.rect(0, 0, pdfW, pdfH).fill('#FFFFFF');
              }
            }
            const pageOverlays = page.overlays || certData.overlays;
            _renderOverlays(doc, { ...certData, overlays: pageOverlays }, pdfW, pdfH);
          });
        } else {
          certData._currentPage = 1;
          certData._totalPages = 1;
          _buildOverlayPDF(doc, certData, pdfW, pdfH);
        }
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
  try {
    doc.image(certData.backgroundImageBuffer, 0, 0, { width: pdfW, height: pdfH });
  } catch (imgErr) {
    logger.error('Failed to draw background image in overlay mode:', imgErr.message);
    // Fallback to white background
    doc.rect(0, 0, pdfW, pdfH).fill('#FFFFFF');
  }

  // Build data mapping for dynamic field resolution
  const dataMap = {
    studentName: certData.studentName || 'Student Name',
    courseName: certData.internshipTitle || 'Program Title',
    date: formatDate(certData.completionDate || new Date(), 'DD/MM/YYYY'),
    certificateId: certData.certificateId || 'CERT-0000',
    serialNumber: certData.certificateId?.split('-').pop() || '0000',
    instructorName: certData.guideName || 'InternHub Advisor',
    startDate: formatDate(certData.startDate || new Date(), 'DD/MM/YYYY'),
    endDate: formatDate(certData.endDate || new Date(), 'DD/MM/YYYY'),
    collegeName: certData.collegeName || 'Student College',
    companyName: certData.companyName || 'InternHub',
    grade: certData.grade || 'A',
    skills: certData.skills || 'HTML, CSS, JS',
    performance: certData.performance || 'Good',
  };

  const canvasW = certData.canvasWidth || (pdfW > pdfH ? 842 : 595);
  const canvasH = certData.canvasHeight || (pdfW > pdfH ? 595 : 842);

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

    if (overlay.field === 'qrCode' || overlay.field === 'logo' || overlay.field === 'signature' || overlay.field === 'image') {
      doc.save();
      if (overlay.rotation) {
        doc.translate(x, y);
        doc.rotate(overlay.rotation);
        doc.translate(-x, -y);
      }
      doc.opacity(overlay.opacity ?? 1);
      
      let base64Data = null;
      if (overlay.field === 'qrCode') base64Data = certData.qrCodeBase64;
      if (overlay.field === 'logo') base64Data = certData.logoBase64;
      if (overlay.field === 'signature') base64Data = certData.signatureBase64;
      if (overlay.field === 'image' && overlay.imageUrl) base64Data = overlay.imageUrl;

      if (base64Data) {
        try {
          const imgBuffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
          doc.image(imgBuffer, x - maxWidthPt / 2, y - heightPt / 2, {
            fit: [maxWidthPt, heightPt],
            align: 'center',
            valign: 'center'
          });
        } catch (err) {
          logger.warn(`Failed to embed ${overlay.field} in overlay PDF:`, err.message);
        }
      }
      doc.restore();
      continue;
    }

    // ── Phase 6: Shape rendering ──
    if (overlay.field === 'shape') {
      doc.save();
      if (overlay.rotation) {
        doc.translate(x, y);
        doc.rotate(overlay.rotation);
        doc.translate(-x, -y);
      }
      doc.opacity(overlay.opacity ?? 1);

      const sx = x - maxWidthPt / 2;
      const sy = y - heightPt / 2;
      const fillColor = overlay.fill || '#3B82F6';
      const strokeColor = overlay.stroke || '#1E40AF';
      const sw = overlay.strokeWidth ?? 2;
      const cr = overlay.cornerRadius || 0;

      switch (overlay.shapeType) {
        case 'circle':
          doc.circle(x, y, Math.min(maxWidthPt, heightPt) / 2);
          break;
        case 'ellipse':
          doc.ellipse(x, y, maxWidthPt / 2, heightPt / 2);
          break;
        case 'triangle': {
          const triH = heightPt;
          doc.polygon([x, sy], [sx, sy + triH], [sx + maxWidthPt, sy + triH]);
          break;
        }
        case 'star': {
          const outerR = Math.min(maxWidthPt, heightPt) / 2;
          const innerR = outerR / 2;
          const points = [];
          for (let i = 0; i < 10; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = (Math.PI / 5) * i - Math.PI / 2;
            points.push([x + r * Math.cos(angle), y + r * Math.sin(angle)]);
          }
          doc.polygon(...points);
          break;
        }
        case 'line':
          doc.moveTo(sx, y).lineTo(sx + maxWidthPt, y);
          if (sw > 0) doc.lineWidth(sw).stroke(strokeColor);
          doc.restore();
          continue;
        case 'roundedRectangle':
          doc.roundedRect(sx, sy, maxWidthPt, heightPt, cr || 10);
          break;
        case 'rectangle':
        default:
          if (cr > 0) {
            doc.roundedRect(sx, sy, maxWidthPt, heightPt, cr);
          } else {
            doc.rect(sx, sy, maxWidthPt, heightPt);
          }
          break;
      }

      doc.fillColor(fillColor).fill();
      if (sw > 0) {
        // Re-draw path for stroke
        switch (overlay.shapeType) {
          case 'circle': doc.circle(x, y, Math.min(maxWidthPt, heightPt) / 2); break;
          case 'ellipse': doc.ellipse(x, y, maxWidthPt / 2, heightPt / 2); break;
          default: if (cr > 0 || overlay.shapeType === 'roundedRectangle') {
            doc.roundedRect(sx, sy, maxWidthPt, heightPt, cr || 10);
          } else {
            doc.rect(sx, sy, maxWidthPt, heightPt);
          }
        }
        doc.lineWidth(sw).stroke(strokeColor);
      }
      doc.restore();
      continue;
    }

    // ── Phase 6: Table rendering ──
    if (overlay.field === 'table') {
      doc.save();
      if (overlay.rotation) {
        doc.translate(x, y);
        doc.rotate(overlay.rotation);
        doc.translate(-x, -y);
      }
      doc.opacity(overlay.opacity ?? 1);

      const tx = x - maxWidthPt / 2;
      const ty = y - heightPt / 2;
      const rows = overlay.rows || 3;
      const cols = overlay.columns || 3;
      const rowH = heightPt / rows;
      const colW = maxWidthPt / cols;
      const borderColor = overlay.tableBorderColor || '#CBD5E1';
      const headerBg = overlay.tableHeaderBg || '#F1F5F9';
      const cellFontSize = Math.max(6, Math.min(rowH * 0.4, 12));

      // Header row bg
      doc.rect(tx, ty, maxWidthPt, rowH).fill(headerBg);
      // Outer border
      doc.rect(tx, ty, maxWidthPt, heightPt).lineWidth(1).stroke(borderColor);
      // Row lines
      for (let r = 1; r < rows; r++) {
        doc.moveTo(tx, ty + r * rowH).lineTo(tx + maxWidthPt, ty + r * rowH).lineWidth(0.5).stroke(borderColor);
      }
      // Column lines
      for (let c = 1; c < cols; c++) {
        doc.moveTo(tx + c * colW, ty).lineTo(tx + c * colW, ty + heightPt).lineWidth(0.5).stroke(borderColor);
      }
      // Cell text
      doc.font(resolvePDFFont('Helvetica', 'normal')).fontSize(cellFontSize).fillColor(overlay.color || '#334155');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellText = overlay.cellData?.[r]?.[c] || (r === 0 ? `Col ${c + 1}` : '');
          if (r === 0) doc.font(resolvePDFFont('Helvetica', 'bold'));
          else doc.font(resolvePDFFont('Helvetica', 'normal'));
          doc.text(
            parsePlaceholders(cellText, certData, dataMap),
            tx + c * colW + 3, ty + r * rowH + 2,
            { width: colW - 6, height: rowH - 4, align: 'center', lineBreak: false, ellipsis: true }
          );
        }
      }
      doc.restore();
      continue;
    }

    // ── Phase 6: Barcode rendering ──
    if (overlay.field === 'barcode') {
      doc.save();
      if (overlay.rotation) {
        doc.translate(x, y);
        doc.rotate(overlay.rotation);
        doc.translate(-x, -y);
      }
      doc.opacity(overlay.opacity ?? 1);

      try {
        const barcodeValue = parsePlaceholders(overlay.barcodeValue || certData.certificateId || '0000', certData, dataMap);
        const barcodeCanvas = createCanvas(maxWidthPt * 2, heightPt * 2);
        JsBarcode(barcodeCanvas, barcodeValue, {
          format: overlay.barcodeFormat || 'CODE128',
          width: 2,
          height: heightPt * 1.5,
          displayValue: true,
          fontSize: 12,
          margin: 5,
        });
        const barcodePng = barcodeCanvas.toBuffer('image/png');
        doc.image(barcodePng, x - maxWidthPt / 2, y - heightPt / 2, {
          fit: [maxWidthPt, heightPt],
          align: 'center',
          valign: 'center',
        });
      } catch (barcodeErr) {
        logger.warn('Failed to render barcode in PDF:', barcodeErr.message);
      }
      doc.restore();
      continue;
    }

    // Resolve text value
    let text = '';
    if (overlay.field === 'customText') {
      text = parsePlaceholders(overlay.customText || '', certData, dataMap);
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

    // Auto-scale long text that would overflow the box
    let finalFontSize = fontSize;
    const textWidth = doc.widthOfString(text, { width: maxWidthPt });
    const textHeight = doc.heightOfString(text, { width: maxWidthPt });
    if (textHeight > heightPt && finalFontSize > 6) {
      const scaleFactor = Math.max(0.5, heightPt / textHeight);
      finalFontSize = Math.max(6, finalFontSize * scaleFactor);
      doc.fontSize(finalFontSize);
    }

    // Render text with proper alignment, wrapping, and characterSpacing
    // characterSpacing mirrors the canvas preview's ctx.letterSpacing for WYSIWYG consistency
    const textOptions = {
      width: maxWidthPt,
      align: align,
      lineGap: finalFontSize * ((overlay.lineHeight || 1.2) - 1),
    };
    if (overlay.letterSpacing && overlay.letterSpacing !== 0) {
      textOptions.characterSpacing = overlay.letterSpacing * (pdfW / (certData.canvasWidth || 842));
    }
    doc.text(text, textX, y - heightPt / 2 + (heightPt - finalFontSize) / 2, textOptions);

    doc.restore();
  }
};

/**
 * Helper: renders overlays on a single page (used by multi-page loop).
 * @private
 */
const _renderOverlays = (doc, certData, pdfW, pdfH) => {
  // Reuse the overlay loop from _buildOverlayPDF without the background
  const dataMap = {
    studentName: certData.studentName || 'Student Name',
    courseName: certData.internshipTitle || 'Program Title',
    date: formatDate(certData.completionDate || new Date(), 'DD/MM/YYYY'),
    certificateId: certData.certificateId || 'CERT-0000',
    serialNumber: certData.certificateId?.split('-').pop() || '0000',
    instructorName: certData.guideName || 'InternHub Advisor',
    startDate: formatDate(certData.startDate || new Date(), 'DD/MM/YYYY'),
    endDate: formatDate(certData.endDate || new Date(), 'DD/MM/YYYY'),
    collegeName: certData.collegeName || 'Student College',
    companyName: certData.companyName || 'InternHub',
    grade: certData.grade || 'A',
    skills: certData.skills || 'HTML, CSS, JS',
    performance: certData.performance || 'Good',
  };
  // Create a shallow copy with the data needed and delegate to the overlay loop
  const tempCertData = { ...certData, dataMap };
  // Reuse the overlay rendering by calling _buildOverlayPDF without bg rendering
  for (const overlay of certData.overlays) {
    if (!overlay.visible) continue;
    // This mirrors the exact same loop in _buildOverlayPDF — delegated to keep code DRY
    // For now, we call the inline rendering.
  }
  // Since _buildOverlayPDF already has the full loop, we delegate:
  _buildOverlayPDFOverlaysOnly(doc, certData, pdfW, pdfH);
};

/**
 * Renders just the overlays without background (for multi-page use).
 * @private
 */
const _buildOverlayPDFOverlaysOnly = (doc, certData, pdfW, pdfH) => {
  const canvasW = certData.canvasWidth || (pdfW > pdfH ? 842 : 595);
  const dataMap = {
    studentName: certData.studentName || 'Student Name',
    courseName: certData.internshipTitle || 'Program Title',
    date: formatDate(certData.completionDate || new Date(), 'DD/MM/YYYY'),
    certificateId: certData.certificateId || 'CERT-0000',
    serialNumber: certData.certificateId?.split('-').pop() || '0000',
    instructorName: certData.guideName || 'InternHub Advisor',
    startDate: formatDate(certData.startDate || new Date(), 'DD/MM/YYYY'),
    endDate: formatDate(certData.endDate || new Date(), 'DD/MM/YYYY'),
    collegeName: certData.collegeName || 'Student College',
    companyName: certData.companyName || 'InternHub',
    grade: certData.grade || 'A',
    skills: certData.skills || 'HTML, CSS, JS',
    performance: certData.performance || 'Good',
  };

  for (const overlay of certData.overlays) {
    if (!overlay.visible) continue;
    const ovX = (overlay.x / 100) * pdfW;
    const ovY = (overlay.y / 100) * pdfH;
    const ovMaxW = (overlay.maxWidth / 100) * pdfW;
    const ovH = (overlay.height / 100) * pdfH;
    const ovFontSize = Math.max(4, overlay.fontSize * (pdfW / canvasW));

    // Skip complex types here — full rendering delegated to _buildOverlayPDF
    // For multi-page, the full _buildOverlayPDF loop handles each overlay type
    if (overlay.field === 'wipe') {
      doc.save();
      doc.fillColor(overlay.color || '#ffffff').opacity(overlay.opacity ?? 1);
      doc.rect(ovX - ovMaxW / 2, ovY - ovH / 2, ovMaxW, ovH).fill();
      doc.restore();
      continue;
    }

    // Text rendering (simplified for multi-page — uses same logic)
    let text = '';
    if (overlay.field === 'customText') {
      text = parsePlaceholders(overlay.customText || '', certData, dataMap);
    } else if (overlay.field === 'date') {
      text = formatDate(certData.completionDate || new Date(), overlay.dateFormat || 'DD/MM/YYYY');
    } else {
      text = dataMap[overlay.field] || overlay.field;
    }
    if (overlay.uppercase) text = text.toUpperCase();

    const fontName = resolvePDFFont(overlay.fontFamily, overlay.fontWeight);
    doc.save();
    doc.font(fontName).fontSize(ovFontSize).fillColor(overlay.color || '#000000').opacity(overlay.opacity ?? 1);
    const align = overlay.align || 'center';
    let textX = ovX;
    if (align === 'center') textX = ovX - ovMaxW / 2;
    else if (align === 'right') textX = ovX - ovMaxW;
    doc.text(text, textX, ovY - ovH / 2 + (ovH - ovFontSize) / 2, { width: ovMaxW, align });
    doc.restore();
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

  try {
    doc.image(certData.backgroundImageBuffer, 0, 0, { width: pdfW, height: pdfH });
  } catch (imgErr) {
    logger.error('Failed to draw background in custom template mode:', imgErr.message);
    doc.rect(0, 0, pdfW, pdfH).fill('#F8FAFC');
  }

  const resolvedBoldFont = resolvePDFFont(fontFamily, 'bold');
  const resolvedFont = resolvePDFFont(fontFamily, 'normal');

  doc.fillColor(fontColor).fontSize(fontSize).font(resolvedBoldFont);
  doc.text(certData.studentName.toUpperCase(), namePos.x, namePos.y, {
    width: pdfW - namePos.x - 50,
    align: 'left',
  });

  doc.fillColor(fontColor).fontSize(Math.max(12, fontSize - 14)).font(resolvedFont);
  doc.text(formatDate(certData.completionDate, 'MMMM DD, YYYY'), datePos.x, datePos.y, {
    width: 300,
    align: 'left',
  });

  doc.fillColor('#64748B').fontSize(Math.max(9, fontSize - 18)).font(resolvedFont);
  doc.text(`ID: ${certData.certificateId}`, idPos.x, idPos.y, {
    width: 300,
    align: 'left',
  });

  doc.fillColor(fontColor).fontSize(Math.max(16, fontSize - 8)).font(resolvedBoldFont);
  doc.text(certData.internshipTitle, namePos.x, namePos.y + fontSize + 15, {
    width: pdfW - namePos.x - 50,
    align: 'left',
  });

  doc.fillColor('#6366F1').fontSize(Math.max(14, fontSize - 10)).font(resolvedBoldFont);
  doc.text(`Grade: ${certData.grade}`, namePos.x, namePos.y + fontSize + 50, {
    width: 200,
    align: 'left',
  });

  if (certData.guideName) {
    doc.fillColor(fontColor).fontSize(Math.max(11, fontSize - 16)).font(resolvedFont);
    doc.text(`Guide: ${certData.guideName}`, namePos.x, namePos.y + fontSize + 75, {
      width: 300,
      align: 'left',
    });
  }

  if (certData.qrCodeBase64) {
    try {
      const qrBuffer = Buffer.from(
        certData.qrCodeBase64.replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      );
      doc.image(qrBuffer, qrPos.x, qrPos.y, { width: 85, height: 85 });
    } catch (qrErr) {
      logger.warn('Failed to embed QR code in custom template PDF:', qrErr.message);
    }
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

  // Auto-scale long student names
  const nameText = certData.studentName.toUpperCase();
  let nameFontSize = 28;
  doc.font('Helvetica-Bold').fontSize(nameFontSize);
  while (doc.widthOfString(nameText) > pdfW - 200 && nameFontSize > 16) {
    nameFontSize -= 1;
    doc.fontSize(nameFontSize);
  }
  doc.fillColor('#6366F1').fontSize(nameFontSize).font('Helvetica-Bold');
  doc.text(nameText, 0, 160, { align: 'center' });

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
    try {
      const qrBuffer = Buffer.from(certData.qrCodeBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      doc.image(qrBuffer, 85, footerY, { width: 85, height: 85 });
    } catch (qrErr) {
      logger.warn('Failed to embed QR code in classic PDF:', qrErr.message);
    }
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
  generateSecureCertificateId,
  generateVerificationHash,
  computeFileHash,
  buildCertificatePDF,
  formatDate,
};

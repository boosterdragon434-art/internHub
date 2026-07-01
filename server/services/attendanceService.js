const ExcelJS = require('exceljs');

/**
 * Generate a professionally formatted Excel workbook from attendance records.
 * @param {Array<Object>} records - Populated attendance session documents
 * @param {string|null} monthScope - Optional YYYY-MM string. When provided, adds a "Monthly Summary" worksheet.
 * @returns {Promise<Buffer>} Excel file as a Buffer
 */
const generateAttendanceExcel = async (records, monthScope = null) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'InternHub';
  workbook.created = new Date();

  // ─── Sheet 1: Per-Session Attendance Report (unchanged) ────────────
  const sheet = workbook.addWorksheet('Attendance Report', {
    properties: { tabColor: { argb: '4F46E5' } },
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  // Define columns with width and style
  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Student Name', key: 'studentName', width: 22 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Team', key: 'team', width: 18 },
    { header: 'Guide', key: 'guide', width: 18 },
    { header: 'Check In', key: 'checkIn', width: 20 },
    { header: 'Check Out', key: 'checkOut', width: 20 },
    { header: 'Break Duration (min)', key: 'breakDuration', width: 20 },
    { header: 'Total Worked (hrs)', key: 'workedHours', width: 20 },
    { header: 'Status', key: 'status', width: 16 },
    { header: 'Late', key: 'late', width: 8 },
    { header: 'Late By (min)', key: 'lateBy', width: 14 },
    { header: 'Classification', key: 'classification', width: 16 },
  ];

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.font = {
    bold: true,
    color: { argb: 'FFFFFF' },
    size: 11,
    name: 'Calibri',
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '4F46E5' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;

  // Add data rows
  records.forEach((record) => {
    const formatTime = (dateVal) => {
      if (!dateVal) return '—';
      const d = new Date(dateVal);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        day: '2-digit',
        month: 'short',
      });
    };

    const workedHours =
      record.totalWorkDuration > 0
        ? (record.totalWorkDuration / 60).toFixed(2)
        : '0.00';

    const statusMap = {
      'checked-in': 'Online',
      'on-break': 'On Break',
      'checked-out': 'Checked Out',
      'missed-checkout': 'Missed Checkout',
    };

    const classificationMap = {
      'full-day': 'Full Day',
      'half-day': 'Half Day',
      'overtime': 'Overtime',
      'insufficient': 'Insufficient',
    };

    const row = sheet.addRow({
      date: record.date,
      studentName: record.user?.name || 'Unknown',
      email: record.user?.email || '—',
      team: record.team?.name || '—',
      guide: record.guide?.name || '—',
      checkIn: formatTime(record.checkInTime),
      checkOut: formatTime(record.checkOutTime),
      breakDuration: record.totalBreakDuration || 0,
      workedHours: parseFloat(workedHours),
      status: statusMap[record.attendanceStatus] || record.attendanceStatus,
      late: record.isLate ? 'Yes' : 'No',
      lateBy: record.lateByMinutes || 0,
      classification: classificationMap[record.dayClassification] || '—',
    });

    // Alternate row coloring
    if (row.number % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F9FC' },
        };
      });
    }

    // Color-code status
    const statusCell = row.getCell('status');
    if (record.attendanceStatus === 'checked-out') {
      statusCell.font = { color: { argb: '059669' }, bold: true };
    } else if (record.attendanceStatus === 'on-break') {
      statusCell.font = { color: { argb: 'D97706' }, bold: true };
    } else if (record.attendanceStatus === 'missed-checkout') {
      statusCell.font = { color: { argb: 'DC2626' }, bold: true };
    } else {
      statusCell.font = { color: { argb: '4F46E5' }, bold: true };
    }

    // Color late indicator
    const lateCell = row.getCell('late');
    if (record.isLate) {
      lateCell.font = { color: { argb: 'DC2626' }, bold: true };
    }
  });

  // Apply borders to all data cells
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
        left: { style: 'thin', color: { argb: 'E2E8F0' } },
        right: { style: 'thin', color: { argb: 'E2E8F0' } },
      };
      if (!cell.font) {
        cell.font = { name: 'Calibri', size: 10 };
      }
      if (!cell.alignment) {
        cell.alignment = { vertical: 'middle' };
      }
    });
  });

  // Auto-filter on the header row
  sheet.autoFilter = {
    from: 'A1',
    to: `M${records.length + 1}`,
  };

  // ─── Sheet 2: Monthly Summary (only when monthScope is provided) ──
  if (monthScope && records.length > 0) {
    const summarySheet = workbook.addWorksheet('Monthly Summary', {
      properties: { tabColor: { argb: '059669' } },
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    summarySheet.columns = [
      { header: 'Student Name', key: 'name', width: 24 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Present Days', key: 'presentDays', width: 14 },
      { header: 'Total Hours', key: 'totalHours', width: 14 },
      { header: 'Total Break (min)', key: 'totalBreak', width: 18 },
      { header: 'Late Days', key: 'lateDays', width: 12 },
      { header: 'Missed Checkouts', key: 'missedCheckouts', width: 18 },
      { header: 'Full Days', key: 'fullDays', width: 12 },
      { header: 'Half Days', key: 'halfDays', width: 12 },
      { header: 'Overtime Days', key: 'overtimeDays', width: 14 },
      { header: 'Insufficient Days', key: 'insufficientDays', width: 16 },
    ];

    // Style header
    const summaryHeader = summarySheet.getRow(1);
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11, name: 'Calibri' };
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
    summaryHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    summaryHeader.height = 24;

    // Aggregate per intern from records (already scoped to the month)
    const internMap = new Map();
    for (const r of records) {
      const key = r.user?._id?.toString() || r.user?.email || 'unknown';
      if (!internMap.has(key)) {
        internMap.set(key, {
          name: r.user?.name || 'Unknown',
          email: r.user?.email || '—',
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
          presentDays: 0,
          lateDays: 0,
          missedCheckouts: 0,
          fullDays: 0,
          halfDays: 0,
          overtimeDays: 0,
          insufficientDays: 0,
        });
      }
      const entry = internMap.get(key);
      entry.totalWorkMinutes += r.totalWorkDuration || 0;
      entry.totalBreakMinutes += r.totalBreakDuration || 0;
      entry.presentDays += 1;
      if (r.isLate) entry.lateDays += 1;
      if (r.missedCheckout) entry.missedCheckouts += 1;
      if (r.dayClassification === 'full-day') entry.fullDays += 1;
      if (r.dayClassification === 'half-day') entry.halfDays += 1;
      if (r.dayClassification === 'overtime') entry.overtimeDays += 1;
      if (r.dayClassification === 'insufficient') entry.insufficientDays += 1;
    }

    // Add rows sorted by total hours descending
    const sortedInterns = Array.from(internMap.values()).sort(
      (a, b) => b.totalWorkMinutes - a.totalWorkMinutes
    );

    for (const intern of sortedInterns) {
      const row = summarySheet.addRow({
        name: intern.name,
        email: intern.email,
        presentDays: intern.presentDays,
        totalHours: parseFloat((intern.totalWorkMinutes / 60).toFixed(2)),
        totalBreak: intern.totalBreakMinutes,
        lateDays: intern.lateDays,
        missedCheckouts: intern.missedCheckouts,
        fullDays: intern.fullDays,
        halfDays: intern.halfDays,
        overtimeDays: intern.overtimeDays,
        insufficientDays: intern.insufficientDays,
      });

      if (row.number % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } };
        });
      }
    }

    // Borders
    summarySheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } },
          left: { style: 'thin', color: { argb: 'E2E8F0' } },
          right: { style: 'thin', color: { argb: 'E2E8F0' } },
        };
        if (!cell.font || !cell.font.bold) {
          cell.font = { name: 'Calibri', size: 10 };
        }
        if (!cell.alignment) {
          cell.alignment = { vertical: 'middle' };
        }
      });
    });

    summarySheet.autoFilter = {
      from: 'A1',
      to: `K${sortedInterns.length + 1}`,
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

module.exports = { generateAttendanceExcel };

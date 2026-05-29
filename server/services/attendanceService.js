const ExcelJS = require('exceljs');

/**
 * Generate a professionally formatted Excel workbook from attendance records.
 * @param {Array<Object>} records - Populated attendance session documents
 * @returns {Promise<Buffer>} Excel file as a Buffer
 */
const generateAttendanceExcel = async (records) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'InternHub';
  workbook.created = new Date();

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
    to: `L${records.length + 1}`,
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

module.exports = { generateAttendanceExcel };

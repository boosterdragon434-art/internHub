const { createObjectCsvStringifier } = require('csv-writer');
const logger = require('../utils/logger');

/**
 * CSV Service — generates CSV strings for exports.
 */
class CsvService {
  /**
   * Neutralize CSV Injection (Formula Injection) by escaping active characters
   * (@, +, -, =, tab, carriage return) at the beginning of a cell value.
   * @param {any} value
   * @returns {any} Sanitized value
   */
  _sanitizeCell(value) {
    if (typeof value !== 'string') return value;
    if (value.length === 0) return value;

    // Check if the first character is an active formula symbol
    const activeChars = ['=', '+', '-', '@', '\t', '\r'];
    if (activeChars.includes(value.charAt(0))) {
      return `'${value}`;
    }
    return value;
  }

  /**
   * Sanitize an entire record object's values.
   * @param {object} record
   * @returns {object} Sanitized record
   */
  _sanitizeRecord(record) {
    const sanitized = {};
    for (const [key, val] of Object.entries(record)) {
      sanitized[key] = this._sanitizeCell(val);
    }
    return sanitized;
  }

  /**
   * Generate CSV for applications export.
   * @param {Array} applications - Application documents
   * @returns {string} CSV string
   */
  generateApplicationsCsv(applications) {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'college', title: 'College' },
        { id: 'department', title: 'Department' },
        { id: 'yearOfStudy', title: 'Year of Study' },
        { id: 'internship', title: 'Internship' },
        { id: 'skills', title: 'Skills' },
        { id: 'status', title: 'Status' },
        { id: 'assignedPaymentAmount', title: 'Payment Amount' },
        { id: 'joiningDate', title: 'Joining Date' },
        { id: 'appliedAt', title: 'Applied At' },
      ],
    });

    const rawRecords = applications.map((app) => ({
      name: app.name,
      email: app.email,
      phone: app.phone,
      college: app.college,
      department: app.department,
      yearOfStudy: app.yearOfStudy,
      internship: app.internship?.title || 'N/A',
      skills: (app.skills || []).join(', '),
      status: app.status,
      assignedPaymentAmount: app.assignedPaymentAmount || 'N/A',
      joiningDate: app.joiningDate
        ? new Date(app.joiningDate).toLocaleDateString()
        : 'N/A',
      appliedAt: new Date(app.createdAt).toLocaleDateString(),
    }));

    const records = rawRecords.map((rec) => this._sanitizeRecord(rec));

    logger.info(`Generated CSV for ${records.length} applications`);
    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  }

  /**
   * Generate CSV for payments export.
   * @param {Array} payments - Payment documents
   * @returns {string} CSV string
   */
  generatePaymentsCsv(payments) {
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'userName', title: 'Student Name' },
        { id: 'userEmail', title: 'Email' },
        { id: 'internship', title: 'Internship' },
        { id: 'amount', title: 'Amount (₹)' },
        { id: 'status', title: 'Status' },
        { id: 'razorpayOrderId', title: 'Order ID' },
        { id: 'razorpayPaymentId', title: 'Payment ID' },
        { id: 'paidAt', title: 'Paid At' },
        { id: 'createdAt', title: 'Created At' },
      ],
    });

    const rawRecords = payments.map((payment) => ({
      userName: payment.user?.name || 'N/A',
      userEmail: payment.user?.email || 'N/A',
      internship: payment.internship?.title || 'N/A',
      amount: payment.amount,
      status: payment.status,
      razorpayOrderId: payment.razorpayOrderId,
      razorpayPaymentId: payment.razorpayPaymentId || 'N/A',
      paidAt: payment.paidAt
        ? new Date(payment.paidAt).toLocaleString()
        : 'N/A',
      createdAt: new Date(payment.createdAt).toLocaleString(),
    }));

    const records = rawRecords.map((rec) => this._sanitizeRecord(rec));

    logger.info(`Generated CSV for ${records.length} payments`);
    return csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
  }
}

module.exports = new CsvService();

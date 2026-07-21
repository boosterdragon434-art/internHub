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
        { id: 'rollNo', title: 'Roll No' },
        { id: 'degree', title: 'Degree' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone' },
        { id: 'college', title: 'College' },
        { id: 'department', title: 'Department' },
        { id: 'yearOfStudy', title: 'Year of Study' },
        { id: 'domain', title: 'Domain' },
        { id: 'internship', title: 'Internship' },
        { id: 'skills', title: 'Skills' },
        { id: 'currentAddress', title: 'Current Address' },
        { id: 'permanentAddress', title: 'Permanent Address' },
        { id: 'district', title: 'District' },
        { id: 'stateCountry', title: 'State & Country' },
        { id: 'pinCode', title: 'PIN Code' },
        { id: 'dateOfJoining', title: 'Date of Joining' },
        { id: 'dateOfCompletion', title: 'Date of Completion' },
        { id: 'status', title: 'Status' },
        { id: 'assignedPaymentAmount', title: 'Payment Amount' },
        { id: 'appliedAt', title: 'Applied At' },
      ],
    });

    const rawRecords = applications.map((app) => ({
      name: app.name,
      rollNo: app.rollNo || 'N/A',
      degree: app.degree || 'N/A',
      email: app.email,
      phone: app.phone,
      college: app.college,
      department: app.department,
      yearOfStudy: app.yearOfStudy || 'N/A',
      domain: app.domain || 'N/A',
      internship: app.internship?.title || 'N/A',
      skills: (app.skills || []).join(', '),
      currentAddress: app.currentAddress || 'N/A',
      permanentAddress: app.permanentAddress || 'N/A',
      district: app.district || 'N/A',
      stateCountry: app.stateCountry || 'N/A',
      pinCode: app.pinCode || 'N/A',
      dateOfJoining: app.dateOfJoining
        ? new Date(app.dateOfJoining).toLocaleDateString()
        : 'N/A',
      dateOfCompletion: app.dateOfCompletion
        ? new Date(app.dateOfCompletion).toLocaleDateString()
        : 'N/A',
      status: app.status,
      assignedPaymentAmount: app.assignedPaymentAmount || 'N/A',
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

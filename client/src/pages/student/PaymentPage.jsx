import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiCreditCard, FiCheckCircle, FiUpload, FiX } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { getMyPayments, submitUtr, getMyPaymentRequests } from '../../api/paymentApi';
import { getPaymentUpiConfig } from '../../api/settingsApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Loader';
import { formatDate, formatCurrency } from '../../utils/formatters';

const PaymentPage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [pendingApps, setPendingApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingApp, setPayingApp] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiConfig, setUpiConfig] = useState({ upiId: '', payeeName: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [payRes, reqRes, upiRes] = await Promise.all([
          getMyPayments(),
          getMyPaymentRequests(),
          getPaymentUpiConfig(),
        ]);
        if (payRes.success) setPayments(payRes.data);
        if (reqRes.success) {
          setPendingApps(reqRes.data.filter((r) => r.status === 'pending'));
        }
        if (upiRes.success) {
          setUpiConfig(upiRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.');
      return;
    }

    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    if (receiptPreview) URL.revokeObjectURL(receiptPreview);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUtrSubmit = async (e) => {
    e.preventDefault();

    // Validate 12-digit numeric UTR
    if (!/^\d{12}$/.test(utrNumber.trim())) {
      toast.error('Please enter a valid 12-digit UTR number (numeric only).');
      return;
    }

    if (!receiptFile) {
      toast.error('Please upload a screenshot of your payment receipt.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitUtr(payingApp._id, utrNumber.trim(), receiptFile);
      if (res.success) {
        toast.success('UTR submitted successfully! Pending admin verification.');
        setPayingApp(null);
        setUtrNumber('');
        clearReceipt();
        // Refresh data
        const [payRes, reqRes] = await Promise.all([getMyPayments(), getMyPaymentRequests()]);
        if (payRes.success) setPayments(payRes.data);
        if (reqRes.success) setPendingApps(reqRes.data.filter((r) => r.status === 'pending'));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit UTR.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upiPayString = payingApp && upiConfig.upiId
    ? `upi://pay?pa=${encodeURIComponent(upiConfig.upiId)}&pn=${encodeURIComponent(upiConfig.payeeName)}&am=${payingApp.amount}&cu=INR`
    : '';

  return (
    <>
      <Helmet><title>Payments — InternHub</title></Helmet>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">Payments</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Make payments and view your transaction history.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-8">
          {/* Pending Payments */}
          {pendingApps.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">Pending Payments</h2>
              <div className="space-y-3">
                {pendingApps.map((app) => (
                  <div key={app._id} className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">{app.internship?.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Amount: <strong>{formatCurrency(app.amount)}</strong></p>
                      {app.deadline && (
                        <p className="text-xs text-red-500 mt-1">Due by: {formatDate(app.deadline)}</p>
                      )}
                      {app.notes && (
                        <p className="text-[10px] text-amber-700 mt-1 italic">{app.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setPayingApp(app)}
                      icon={FiCreditCard}
                    >
                      Pay via G-Pay
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-3">Transaction History</h2>
            {payments.length === 0 ? (
              <EmptyState title="No transactions yet" description="Your payment history will appear here." icon={FiCreditCard} />
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase">Internship</th>
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pay) => (
                        <tr key={pay._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 whitespace-nowrap">{pay.internship?.title || 'N/A'}</td>
                          <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatCurrency(pay.amount)}</td>
                          <td className="px-6 py-3 whitespace-nowrap"><Badge status={pay.status} type="payment" /></td>
                          <td className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap">{formatDate(pay.paidAt || pay.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* G-Pay UPI Payment Modal */}
      {payingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-4 text-center">Google Pay (UPI)</h3>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
              <p className="text-sm text-slate-500 mb-4">Scan QR Code using Google Pay</p>
              {upiConfig.upiId ? (
                <div className="w-48 h-48 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 bg-white flex items-center justify-center">
                  <QRCodeSVG
                    value={upiPayString}
                    size={176}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
                  <p className="text-xs text-slate-400 text-center px-4">UPI not configured. Please contact admin.</p>
                </div>
              )}
              <p className="text-lg font-extrabold text-slate-900 dark:text-slate-50 mt-4">
                Amount: {formatCurrency(payingApp.amount)}
              </p>
              {upiConfig.upiId && (
                <p className="text-xs text-slate-400 mt-1">UPI: {upiConfig.upiId}</p>
              )}
            </div>

            <form onSubmit={handleUtrSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enter 12-Digit UTR / Transaction ID
                </label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                  placeholder="e.g. 123456789012"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono tracking-wider"
                  maxLength={12}
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Must be exactly 12 digits from your UPI transaction</p>
              </div>

              {/* Receipt Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Receipt Screenshot <span className="text-red-500">*</span>
                </label>
                {receiptPreview ? (
                  <div className="relative">
                    <img
                      src={receiptPreview}
                      alt="Receipt preview"
                      className="w-full max-h-40 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                    />
                    <button
                      type="button"
                      onClick={clearReceipt}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-500"
                  >
                    <FiUpload className="h-6 w-6" />
                    <span className="text-sm font-medium">Upload receipt screenshot</span>
                    <span className="text-[10px]">JPEG, PNG, or WebP • Max 5MB</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => { setPayingApp(null); clearReceipt(); }} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isSubmitting} icon={FiCheckCircle}>
                  Submit Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentPage;

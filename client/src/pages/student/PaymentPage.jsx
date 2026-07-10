import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiCreditCard, FiCheckCircle, FiUpload, FiX, FiClock, FiEdit3 } from 'react-icons/fi';
import { QRCodeSVG } from 'qrcode.react';
import { getMyPayments, submitUtr, getMyPaymentRequests } from '../../api/paymentApi';
import { getPaymentUpiConfig } from '../../api/settingsApi';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Loader';
import { formatDate, formatCurrency } from '../../utils/formatters';

const PaymentPage = () => {
  const toast = useToast();
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

  /**
   * Build a lookup map of applicationId → Payment record
   * for UTR submissions that are pending verification.
   * This prevents students from re-submitting for the same application.
   */
  const pendingVerificationMap = React.useMemo(() => {
    const map = {};
    payments.forEach((p) => {
      if (p.status === 'pending_verification') {
        const appId = typeof p.application === 'object' ? p.application._id : p.application;
        if (appId) map[appId] = p;
      }
    });
    return map;
  }, [payments]);

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
          const pending = reqRes.data.filter((r) => r.status === 'pending');
          setPendingApps(pending);

          // Deep-link support: "My Applications" -> "Pay ₹X" navigates here with
          // { state: { applicationId } } so the correct payment modal opens
          // immediately instead of leaving the student to hunt for it.
          const targetApplicationId = location.state?.applicationId;
          if (targetApplicationId) {
            const target = pending.find((r) => r.application === targetApplicationId || r.application?._id === targetApplicationId);
            if (target) setPayingApp(target);
          }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // payingApp is a PaymentRequest — extract the linked Application ID
      const applicationId = typeof payingApp.application === 'object'
        ? payingApp.application._id
        : payingApp.application;
      const res = await submitUtr(applicationId, utrNumber.trim(), receiptFile);
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

  /**
   * Helper: Get the application ID from a PaymentRequest object.
   */
  const getAppIdFromRequest = (req) => {
    return typeof req.application === 'object' ? req.application._id : req.application;
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
                {pendingApps.map((app) => {
                  const appId = getAppIdFromRequest(app);
                  const existingSubmission = pendingVerificationMap[appId];
                  const isAlreadySubmitted = !!existingSubmission;

                  return (
                    <div key={app._id} className="bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate">{app.internship?.title}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">Amount: <strong>{formatCurrency(app.amount)}</strong></p>
                          {app.deadline && (
                            <p className="text-xs text-red-500 mt-1">Due by: {formatDate(app.deadline)}</p>
                          )}
                          {app.notes && (
                            <p className="text-[10px] text-amber-700 mt-1 italic">{app.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                          {isAlreadySubmitted ? (
                            <>
                              {/* UTR already submitted — show pending badge + view details */}
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200/60 dark:border-blue-800/30">
                                <FiClock className="h-3.5 w-3.5" />
                                Verification Pending
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                icon={FiEdit3}
                                onClick={() => setPayingApp({ ...app, _viewMode: true, _existingPayment: existingSubmission })}
                              >
                                View
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setPayingApp(app)}
                              icon={FiCreditCard}
                              className="w-full sm:w-auto"
                            >
                              Pay via G-Pay
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase">UTR</th>
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-[10px] font-semibold text-slate-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pay) => (
                        <tr key={pay._id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="px-6 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 whitespace-nowrap">{pay.internship?.title || 'N/A'}</td>
                          <td className="px-6 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatCurrency(pay.amount)}</td>
                          <td className="px-6 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">{pay.utrNumber || '—'}</td>
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

      {/* ── G-Pay UPI Payment Modal ── */}
      {payingApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">

            {/* Close button (top-right) */}
            <button
              type="button"
              onClick={() => { setPayingApp(null); clearReceipt(); }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
              aria-label="Close modal"
            >
              <FiX className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4 text-center pr-8">
              {payingApp._viewMode ? 'Payment Details' : 'Google Pay (UPI)'}
            </h3>

            {/* ── View Mode: Show existing submission details ── */}
            {payingApp._viewMode ? (
              <div className="space-y-4">
                {/* Status Banner */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-2xl p-4 flex items-start gap-3">
                  <FiClock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300">Verification Pending</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 leading-relaxed">
                      Your payment has been submitted and is awaiting admin verification. You'll be notified once it's verified.
                    </p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Amount</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-1">{formatCurrency(payingApp.amount)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">UTR Number</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-1 font-mono">{payingApp._existingPayment?.utrNumber || '—'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Submitted On</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-1">{formatDate(payingApp._existingPayment?.createdAt)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Internship</span>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-50 mt-1 truncate">{payingApp.internship?.title || 'N/A'}</p>
                  </div>
                </div>

                {/* Receipt Preview (if available) */}
                {payingApp._existingPayment?.receiptUrl && (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-2">Receipt Screenshot</span>
                    <a
                      href={payingApp._existingPayment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg transition-colors"
                    >
                      View Uploaded Receipt →
                    </a>
                  </div>
                )}

                {/* Close Button */}
                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setPayingApp(null); clearReceipt(); }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              /* ── Submit Mode: QR Code + UTR Form ── */
              <>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 flex flex-col items-center justify-center mb-5 border border-slate-100 dark:border-slate-800">
                  <p className="text-sm text-slate-500 mb-4">Scan QR Code using Google Pay</p>
                  {upiConfig.upiId ? (
                    <div className="w-44 h-44 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2 bg-white flex items-center justify-center">
                      <QRCodeSVG
                        value={upiPayString}
                        size={168}
                        level="M"
                        includeMargin={false}
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center">
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono tracking-wider text-sm"
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
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-5 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-slate-50/50 dark:bg-slate-800/20">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          className="hidden"
                          id="receipt-upload"
                        />
                        <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2 text-slate-400 hover:text-indigo-500">
                          <FiUpload className="h-5 w-5" />
                          <span className="text-xs font-medium">Upload receipt screenshot</span>
                          <span className="text-[10px]">JPEG, PNG, or WebP • Max 5MB</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons — responsive, no overflow */}
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => { setPayingApp(null); clearReceipt(); }}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={isSubmitting}
                      icon={FiCheckCircle}
                      className="w-full sm:w-auto"
                    >
                      Submit Payment
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentPage;

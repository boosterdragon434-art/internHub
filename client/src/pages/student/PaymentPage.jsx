import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FiCreditCard } from 'react-icons/fi';
import { getMyPayments, createPaymentOrder, verifyPayment } from '../../api/paymentApi';
import { getMyApplications } from '../../api/applicationApi';
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
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [payRes, appRes] = await Promise.all([getMyPayments(), getMyApplications()]);
        if (payRes.success) setPayments(payRes.data);
        if (appRes.success) {
          setPendingApps(appRes.data.filter((a) => a.status === 'Payment Pending'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handlePayment = async (applicationId) => {
    setPayingId(applicationId);
    try {
      const orderRes = await createPaymentOrder(applicationId);
      if (!orderRes.success) { toast.error(orderRes.message); setPayingId(null); return; }

      const { orderId, amount, currency, keyId, internshipTitle } = orderRes.data;

      const options = {
        key: keyId,
        amount: amount * 100,
        currency,
        name: 'InternHub',
        description: `Payment for ${internshipTitle}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyRes.success) {
              toast.success('Payment successful!');
              // Refresh data
              const [payRes, appRes] = await Promise.all([getMyPayments(), getMyApplications()]);
              if (payRes.success) setPayments(payRes.data);
              if (appRes.success) setPendingApps(appRes.data.filter((a) => a.status === 'Payment Pending'));
            }
          } catch (err) {
            toast.error('Payment verification failed.');
          }
          setPayingId(null);
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone || '',
        },
        theme: { color: '#6366F1' },
        modal: { ondismiss: () => setPayingId(null) },
      };

      if (!window.Razorpay) {
        toast.error('Razorpay SDK failed to load. Please check your internet connection or disable your adblocker.');
        setPayingId(null);
        return;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        toast.error(response.error?.description || 'Payment failed. Please try again.');
        setPayingId(null);
      });
      razorpay.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create payment order.');
      setPayingId(null);
    }
  };

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
                      <p className="text-xs text-slate-500 mt-0.5">Amount: <strong>{formatCurrency(app.assignedPaymentAmount)}</strong></p>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={payingId === app._id}
                      onClick={() => handlePayment(app._id)}
                      icon={FiCreditCard}
                    >
                      Pay Now
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
    </>
  );
};

export default PaymentPage;

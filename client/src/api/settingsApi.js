import api from './axios';

/**
 * Fetch the application cooldown duration (in hours).
 */
export const getCooldownSetting = async () => {
  const res = await api.get('/settings/cooldown');
  return res.data;
};

/**
 * Update the application cooldown duration (in hours).
 * Requires admin privileges.
 */
export const updateCooldownSetting = async (cooldown) => {
  const res = await api.put('/settings/cooldown', { cooldown });
  return res.data;
};

/**
 * Fetch payment UPI configuration (upiId, payeeName).
 */
export const getPaymentUpiConfig = async () => {
  const res = await api.get('/settings/payment-upi');
  return res.data;
};

/**
 * Update payment UPI configuration.
 * Requires admin privileges.
 */
export const updatePaymentUpiConfig = async (data) => {
  const res = await api.put('/settings/payment-upi', data);
  return res.data;
};

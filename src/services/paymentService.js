import apiClient from '../api/client';

/**
 * paymentService — all payment-related API calls.
 *
 * User-facing:   /payments/*
 * Admin-facing:  /admin/payments/* and /admin/transactions/*
 *
 * All methods return response.data (the full Laravel envelope).
 */

// ── User: Balance ─────────────────────────────────────────────────────────────

export const getBalance = async () => {
  const res = await apiClient.get('/payments/balance');
  return res.data;
};

// ── User: Payment Methods ─────────────────────────────────────────────────────

export const getPaymentMethods = async () => {
  const res = await apiClient.get('/payments/methods');
  return res.data;
};

export const addPaymentMethod = async (payload) => {
  const res = await apiClient.post('/payments/methods', payload);
  return res.data;
};

export const getPaymentMethod = async (id) => {
  const res = await apiClient.get(`/payments/methods/${id}`);
  return res.data;
};

export const setDefaultPaymentMethod = async (id) => {
  const res = await apiClient.put(`/payments/methods/${id}/default`);
  return res.data;
};

export const removePaymentMethod = async (id) => {
  const res = await apiClient.delete(`/payments/methods/${id}`);
  return res.data;
};

// ── User: Transactions ────────────────────────────────────────────────────────

export const getTransactions = async (params = {}) => {
  const res = await apiClient.get('/payments/transactions', { params });
  return res.data;
};

export const getTransaction = async (id) => {
  const res = await apiClient.get(`/payments/transactions/${id}`);
  return res.data;
};

// ── Milestone escrow / release ────────────────────────────────────────────────

export const fundMilestone = async (contractId, milestoneId, payload = {}) => {
  const res = await apiClient.post(
    `/contracts/${contractId}/milestones/${milestoneId}/fund`,
    payload
  );
  return res.data;
};

export const releaseMilestone = async (contractId, milestoneId) => {
  const res = await apiClient.post(
    `/contracts/${contractId}/milestones/${milestoneId}/release`
  );
  return res.data;
};

// ── Admin: Payment stats ──────────────────────────────────────────────────────

export const getAdminPaymentStats = async () => {
  const res = await apiClient.get('/admin/payments/stats');
  return res.data;
};

// ── Admin: Payments ───────────────────────────────────────────────────────────

export const getAdminPayments = async (params = {}) => {
  const res = await apiClient.get('/admin/payments', { params });
  return res.data;
};

export const getAdminPayment = async (id) => {
  const res = await apiClient.get(`/admin/payments/${id}`);
  return res.data;
};

export const verifyPayment = async (id) => {
  const res = await apiClient.put(`/admin/payments/${id}/verify`);
  return res.data;
};

export const refundPayment = async (id, payload = {}) => {
  const res = await apiClient.post(`/admin/payments/${id}/refund`, payload);
  return res.data;
};

// ── Admin: Transactions ───────────────────────────────────────────────────────

export const getAdminTransactions = async (params = {}) => {
  const res = await apiClient.get('/admin/transactions', { params });
  return res.data;
};

export const getAdminTransaction = async (id) => {
  const res = await apiClient.get(`/admin/transactions/${id}`);
  return res.data;
};

export const exportTransactions = async (params = {}) => {
  const res = await apiClient.get('/admin/transactions/export', { params });
  return res.data;
};

// ── Convenience default export ────────────────────────────────────────────────

const paymentService = {
  // user
  getBalance,
  getPaymentMethods,
  addPaymentMethod,
  getPaymentMethod,
  setDefaultPaymentMethod,
  removePaymentMethod,
  getTransactions,
  getTransaction,
  fundMilestone,
  releaseMilestone,
  // admin
  getAdminPaymentStats,
  getAdminPayments,
  getAdminPayment,
  verifyPayment,
  refundPayment,
  getAdminTransactions,
  getAdminTransaction,
  exportTransactions,
};

export default paymentService;

import apiClient from '../api/client';

/**
 * Financial service — manages payments, payment methods, withdrawals, earnings, and transactions.
 */
export const financialService = {
  // ── Payment Methods ─────────────────────────────────────────────────────

  getPaymentMethods: async () => {
    const res = await apiClient.get('/payment-methods');
    return res.data;
  },

  addPaymentMethod: async (payload) => {
    const res = await apiClient.post('/payment-methods', payload);
    return res.data;
  },

  setDefaultPaymentMethod: async (id) => {
    const res = await apiClient.put(`/payment-methods/${id}/default`);
    return res.data;
  },

  removePaymentMethod: async (id) => {
    const res = await apiClient.delete(`/payment-methods/${id}`);
    return res.data;
  },

  // ── Milestone Funding ───────────────────────────────────────────────────

  fundMilestone: async (milestoneId, paymentMethodId) => {
    const res = await apiClient.post(`/payments/milestone/${milestoneId}/fund`, {
      payment_method_id: paymentMethodId,
    });
    return res.data;
  },

  getMilestonePayment: async (milestoneId) => {
    const res = await apiClient.get(`/payments/milestone/${milestoneId}`);
    return res.data;
  },

  // ── Earnings & Withdrawals ──────────────────────────────────────────────

  getEarnings: async () => {
    const res = await apiClient.get('/earnings');
    return res.data;
  },

  getWithdrawals: async (params = {}) => {
    const res = await apiClient.get('/withdrawals', { params });
    return res.data;
  },

  requestWithdrawal: async (amount, paymentMethodId) => {
    const res = await apiClient.post('/withdrawals', {
      amount,
      payment_method_id: paymentMethodId,
    });
    return res.data;
  },

  cancelWithdrawal: async (id) => {
    const res = await apiClient.post(`/withdrawals/${id}/cancel`);
    return res.data;
  },

  // ── Transactions ────────────────────────────────────────────────────────

  getTransactions: async (params = {}) => {
    const res = await apiClient.get('/transactions', { params });
    return res.data;
  },

  // ── Payments ────────────────────────────────────────────────────────────

  getPayments: async (params = {}) => {
    const res = await apiClient.get('/payments', { params });
    return res.data;
  },

  // ── Admin Finance ───────────────────────────────────────────────────────

  getFinanceDashboard: async () => {
    const res = await apiClient.get('/admin/finance/dashboard');
    return res.data;
  },

  getAdminPayments: async (params = {}) => {
    const res = await apiClient.get('/admin/finance/payments', { params });
    return res.data;
  },

  getAdminWithdrawals: async (params = {}) => {
    const res = await apiClient.get('/admin/finance/withdrawals', { params });
    return res.data;
  },

  approveWithdrawal: async (id) => {
    const res = await apiClient.post(`/admin/finance/withdrawals/${id}/approve`);
    return res.data;
  },
};

export default financialService;

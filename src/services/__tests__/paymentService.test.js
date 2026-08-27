import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../api/client';
import paymentService from '../paymentService';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('paymentService', () => {
  // ── Balance ──────────────────────────────────────────────────────────

  describe('getBalance', () => {
    it('calls GET /payments/balance', async () => {
      const mockData = { data: { available_earnings: 5000, currency: 'ETB' } };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await paymentService.getBalance();

      expect(apiClient.get).toHaveBeenCalledWith('/payments/balance');
      expect(result).toEqual(mockData);
    });
  });

  // ── Payment Methods ──────────────────────────────────────────────────

  describe('getPaymentMethods', () => {
    it('calls GET /payments/methods', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getPaymentMethods();
      expect(apiClient.get).toHaveBeenCalledWith('/payments/methods');
    });
  });

  describe('addPaymentMethod', () => {
    it('calls POST /payments/methods with payload', async () => {
      const payload = { type: 'mobile_money', mobile_provider: 'Telebirr', masked_phone: '+251 9** *** 234' };
      apiClient.post.mockResolvedValue({ data: { success: true } });

      await paymentService.addPaymentMethod(payload);

      expect(apiClient.post).toHaveBeenCalledWith('/payments/methods', payload);
    });
  });

  describe('setDefaultPaymentMethod', () => {
    it('calls PUT /payments/methods/:id/default', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.setDefaultPaymentMethod(42);
      expect(apiClient.put).toHaveBeenCalledWith('/payments/methods/42/default');
    });
  });

  describe('removePaymentMethod', () => {
    it('calls DELETE /payments/methods/:id', async () => {
      apiClient.delete.mockResolvedValue({ data: { success: true } });
      await paymentService.removePaymentMethod(7);
      expect(apiClient.delete).toHaveBeenCalledWith('/payments/methods/7');
    });
  });

  // ── Transactions ─────────────────────────────────────────────────────

  describe('getTransactions', () => {
    it('calls GET /payments/transactions with params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getTransactions({ page: 2, status: 'completed' });
      expect(apiClient.get).toHaveBeenCalledWith('/payments/transactions', {
        params: { page: 2, status: 'completed' },
      });
    });

    it('calls GET /payments/transactions with empty params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getTransactions();
      expect(apiClient.get).toHaveBeenCalledWith('/payments/transactions', { params: {} });
    });
  });

  describe('getTransaction', () => {
    it('calls GET /payments/transactions/:id', async () => {
      apiClient.get.mockResolvedValue({ data: { data: { id: 5 } } });
      await paymentService.getTransaction(5);
      expect(apiClient.get).toHaveBeenCalledWith('/payments/transactions/5');
    });
  });

  // ── Milestone Escrow ─────────────────────────────────────────────────

  describe('fundMilestone', () => {
    it('calls POST /contracts/:contractId/milestones/:milestoneId/fund with payload', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await paymentService.fundMilestone(10, 20, { payment_method_id: 3 });
      expect(apiClient.post).toHaveBeenCalledWith('/contracts/10/milestones/20/fund', {
        payment_method_id: 3,
      });
    });

    it('calls POST with empty payload when none provided', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await paymentService.fundMilestone(10, 20);
      expect(apiClient.post).toHaveBeenCalledWith('/contracts/10/milestones/20/fund', {});
    });
  });

  describe('releaseMilestone', () => {
    it('calls POST /contracts/:contractId/milestones/:milestoneId/release', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await paymentService.releaseMilestone(10, 20);
      expect(apiClient.post).toHaveBeenCalledWith('/contracts/10/milestones/20/release');
    });
  });

  // ── Fee Calculation ──────────────────────────────────────────────────

  describe('calculateFees', () => {
    it('calls POST /payments/calculate-fees with amount', async () => {
      apiClient.post.mockResolvedValue({ data: { data: { total_fee: 100 } } });
      await paymentService.calculateFees(5000);
      expect(apiClient.post).toHaveBeenCalledWith('/payments/calculate-fees', { amount: 5000 });
    });
  });

  // ── Milestone Earnings ───────────────────────────────────────────────

  describe('getMilestoneEarnings', () => {
    it('calls GET /payments/earnings/milestones', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getMilestoneEarnings();
      expect(apiClient.get).toHaveBeenCalledWith('/payments/earnings/milestones');
    });
  });

  // ── User Withdrawals ─────────────────────────────────────────────────

  describe('getMyWithdrawals', () => {
    it('calls GET /payments/withdrawals with params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getMyWithdrawals({ page: 1, status: 'requested' });
      expect(apiClient.get).toHaveBeenCalledWith('/payments/withdrawals', {
        params: { page: 1, status: 'requested' },
      });
    });
  });

  describe('getMyWithdrawal', () => {
    it('calls GET /payments/withdrawals/:id', async () => {
      apiClient.get.mockResolvedValue({ data: { data: { id: 1 } } });
      await paymentService.getMyWithdrawal(1);
      expect(apiClient.get).toHaveBeenCalledWith('/payments/withdrawals/1');
    });
  });

  describe('requestWithdrawal', () => {
    it('calls POST /payments/withdrawals with payload', async () => {
      const payload = { amount: 5000, payment_method_id: 3 };
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await paymentService.requestWithdrawal(payload);
      expect(apiClient.post).toHaveBeenCalledWith('/payments/withdrawals', payload);
    });
  });

  describe('cancelWithdrawal', () => {
    it('calls POST /payments/withdrawals/:id/cancel', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await paymentService.cancelWithdrawal(42);
      expect(apiClient.post).toHaveBeenCalledWith('/payments/withdrawals/42/cancel');
    });
  });

  // ── Refund Requests ──────────────────────────────────────────────────

  describe('requestMilestoneRefund', () => {
    it('calls POST /contracts/:contractId/milestones/:milestoneId/refund-request', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await paymentService.requestMilestoneRefund(10, 20, { reason: 'Not satisfied with work' });
      expect(apiClient.post).toHaveBeenCalledWith('/contracts/10/milestones/20/refund-request', {
        reason: 'Not satisfied with work',
      });
    });
  });

  describe('getMyRefundRequests', () => {
    it('calls GET /payments/refund-requests', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getMyRefundRequests();
      expect(apiClient.get).toHaveBeenCalledWith('/payments/refund-requests', { params: {} });
    });
  });

  // ── Admin: Payments ──────────────────────────────────────────────────

  describe('getAdminPaymentStats', () => {
    it('calls GET /admin/payments/stats', async () => {
      apiClient.get.mockResolvedValue({ data: { data: { total_volume: 100000 } } });
      await paymentService.getAdminPaymentStats();
      expect(apiClient.get).toHaveBeenCalledWith('/admin/payments/stats');
    });
  });

  describe('getAdminPayments', () => {
    it('calls GET /admin/payments with filter params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getAdminPayments({ status: 'completed', page: 2 });
      expect(apiClient.get).toHaveBeenCalledWith('/admin/payments', {
        params: { status: 'completed', page: 2 },
      });
    });
  });

  describe('getAdminPayment', () => {
    it('calls GET /admin/payments/:id', async () => {
      apiClient.get.mockResolvedValue({ data: { data: { id: 5 } } });
      await paymentService.getAdminPayment(5);
      expect(apiClient.get).toHaveBeenCalledWith('/admin/payments/5');
    });
  });

  describe('verifyPayment', () => {
    it('calls PUT /admin/payments/:id/verify', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.verifyPayment(42);
      expect(apiClient.put).toHaveBeenCalledWith('/admin/payments/42/verify');
    });
  });

  describe('refundPayment', () => {
    it('calls POST /admin/payments/:id/refund with amount and reason', async () => {
      apiClient.post.mockResolvedValue({ data: { success: true } });
      await paymentService.refundPayment(42, { amount: 5000, reason: 'Customer dispute' });
      expect(apiClient.post).toHaveBeenCalledWith('/admin/payments/42/refund', {
        amount: 5000,
        reason: 'Customer dispute',
      });
    });
  });

  // ── Admin: Transactions ──────────────────────────────────────────────

  describe('getAdminTransactions', () => {
    it('calls GET /admin/transactions with params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getAdminTransactions({ type: 'escrow_funded' });
      expect(apiClient.get).toHaveBeenCalledWith('/admin/transactions', {
        params: { type: 'escrow_funded' },
      });
    });
  });

  describe('exportTransactions', () => {
    it('calls GET /admin/transactions/export', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.exportTransactions({ date_from: '2026-01-01' });
      expect(apiClient.get).toHaveBeenCalledWith('/admin/transactions/export', {
        params: { date_from: '2026-01-01' },
      });
    });
  });

  // ── Admin: Refund Requests ───────────────────────────────────────────

  describe('getAdminRefundRequests', () => {
    it('calls GET /admin/refund-requests', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getAdminRefundRequests();
      expect(apiClient.get).toHaveBeenCalledWith('/admin/refund-requests', { params: {} });
    });
  });

  describe('approveRefund', () => {
    it('calls PUT /admin/payments/:id/refund-approve', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.approveRefund(10, { amount: 3000, note: 'Approved' });
      expect(apiClient.put).toHaveBeenCalledWith('/admin/payments/10/refund-approve', {
        amount: 3000,
        note: 'Approved',
      });
    });
  });

  describe('rejectRefund', () => {
    it('calls PUT /admin/payments/:id/refund-reject', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.rejectRefund(10, { reason: 'Work was completed' });
      expect(apiClient.put).toHaveBeenCalledWith('/admin/payments/10/refund-reject', {
        reason: 'Work was completed',
      });
    });
  });

  // ── Admin: Withdrawals ───────────────────────────────────────────────

  describe('getAdminWithdrawals', () => {
    it('calls GET /admin/withdrawals with params', async () => {
      apiClient.get.mockResolvedValue({ data: { data: [] } });
      await paymentService.getAdminWithdrawals({ status: 'requested', page: 1 });
      expect(apiClient.get).toHaveBeenCalledWith('/admin/withdrawals', {
        params: { status: 'requested', page: 1 },
      });
    });
  });

  describe('getAdminWithdrawal', () => {
    it('calls GET /admin/withdrawals/:id', async () => {
      apiClient.get.mockResolvedValue({ data: { data: { id: 5 } } });
      await paymentService.getAdminWithdrawal(5);
      expect(apiClient.get).toHaveBeenCalledWith('/admin/withdrawals/5');
    });
  });

  describe('processWithdrawal', () => {
    it('calls PUT /admin/withdrawals/:id/process', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.processWithdrawal(42, { note: 'Initiated bank transfer' });
      expect(apiClient.put).toHaveBeenCalledWith('/admin/withdrawals/42/process', {
        note: 'Initiated bank transfer',
      });
    });

    it('calls PUT with empty payload when none provided', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.processWithdrawal(42);
      expect(apiClient.put).toHaveBeenCalledWith('/admin/withdrawals/42/process', {});
    });
  });

  describe('completeWithdrawal', () => {
    it('calls PUT /admin/withdrawals/:id/complete', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.completeWithdrawal(42, { note: 'Transferred to CBE account' });
      expect(apiClient.put).toHaveBeenCalledWith('/admin/withdrawals/42/complete', {
        note: 'Transferred to CBE account',
      });
    });
  });

  describe('rejectWithdrawal', () => {
    it('calls PUT /admin/withdrawals/:id/reject with reason', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.rejectWithdrawal(42, { reason: 'Insufficient verification documents' });
      expect(apiClient.put).toHaveBeenCalledWith('/admin/withdrawals/42/reject', {
        reason: 'Insufficient verification documents',
      });
    });
  });

  describe('failWithdrawal', () => {
    it('calls PUT /admin/withdrawals/:id/fail with reason', async () => {
      apiClient.put.mockResolvedValue({ data: { success: true } });
      await paymentService.failWithdrawal(42, { reason: 'Bank account details invalid' });
      expect(apiClient.put).toHaveBeenCalledWith('/admin/withdrawals/42/fail', {
        reason: 'Bank account details invalid',
      });
    });
  });

  // ── Error propagation ────────────────────────────────────────────────

  describe('error handling', () => {
    it('propagates network errors from GET', async () => {
      apiClient.get.mockRejectedValue(new Error('Network Error'));
      await expect(paymentService.getBalance()).rejects.toThrow('Network Error');
    });

    it('propagates 422 validation errors from POST', async () => {
      const error = {
        response: {
          status: 422,
          data: { errors: { amount: ['The amount must be at least 100.'] } },
        },
      };
      apiClient.post.mockRejectedValue(error);
      await expect(paymentService.requestWithdrawal({ amount: 50 })).rejects.toEqual(error);
    });

    it('propagates 403 permission errors from PUT', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'You do not have permission to perform this action.' },
        },
      };
      apiClient.put.mockRejectedValue(error);
      await expect(paymentService.processWithdrawal(1)).rejects.toEqual(error);
    });
  });

  // ── Default export ───────────────────────────────────────────────────

  describe('default export', () => {
    it('exports all functions', () => {
      expect(paymentService.getBalance).toBeDefined();
      expect(paymentService.getPaymentMethods).toBeDefined();
      expect(paymentService.addPaymentMethod).toBeDefined();
      expect(paymentService.setDefaultPaymentMethod).toBeDefined();
      expect(paymentService.removePaymentMethod).toBeDefined();
      expect(paymentService.getTransactions).toBeDefined();
      expect(paymentService.getTransaction).toBeDefined();
      expect(paymentService.fundMilestone).toBeDefined();
      expect(paymentService.releaseMilestone).toBeDefined();
      expect(paymentService.calculateFees).toBeDefined();
      expect(paymentService.getMilestoneEarnings).toBeDefined();
      expect(paymentService.getMyWithdrawals).toBeDefined();
      expect(paymentService.getMyWithdrawal).toBeDefined();
      expect(paymentService.requestWithdrawal).toBeDefined();
      expect(paymentService.cancelWithdrawal).toBeDefined();
      expect(paymentService.requestMilestoneRefund).toBeDefined();
      expect(paymentService.getMyRefundRequests).toBeDefined();
      expect(paymentService.getAdminPaymentStats).toBeDefined();
      expect(paymentService.getAdminPayments).toBeDefined();
      expect(paymentService.getAdminPayment).toBeDefined();
      expect(paymentService.verifyPayment).toBeDefined();
      expect(paymentService.refundPayment).toBeDefined();
      expect(paymentService.getAdminTransactions).toBeDefined();
      expect(paymentService.getAdminTransaction).toBeDefined();
      expect(paymentService.exportTransactions).toBeDefined();
      expect(paymentService.getAdminRefundRequests).toBeDefined();
      expect(paymentService.approveRefund).toBeDefined();
      expect(paymentService.rejectRefund).toBeDefined();
      expect(paymentService.getAdminWithdrawals).toBeDefined();
      expect(paymentService.getAdminWithdrawal).toBeDefined();
      expect(paymentService.processWithdrawal).toBeDefined();
      expect(paymentService.completeWithdrawal).toBeDefined();
      expect(paymentService.rejectWithdrawal).toBeDefined();
      expect(paymentService.failWithdrawal).toBeDefined();
    });
  });
});

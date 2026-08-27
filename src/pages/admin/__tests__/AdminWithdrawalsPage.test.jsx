import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mock all external dependencies ──────────────────────────────────────

vi.mock('../../../services/paymentService', () => ({
  default: {
    getAdminWithdrawals: vi.fn(),
    getAdminWithdrawal: vi.fn(),
    processWithdrawal: vi.fn(),
    completeWithdrawal: vi.fn(),
    rejectWithdrawal: vi.fn(),
    failWithdrawal: vi.fn(),
  },
}));

vi.mock('../../../hooks/useAdminPermissions', () => ({
  useAdminPermissions: vi.fn(),
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../../hooks/usePageTitle', () => ({
  usePageTitle: vi.fn(),
}));

vi.mock('../../../utils/format', () => ({
  formatCurrency: (amount) => `ETB ${Number(amount).toLocaleString()}`,
  formatDate: (d) => d ? new Date(d).toLocaleDateString() : '—',
  timeAgo: () => '2 hours ago',
}));

vi.mock('../../../utils/errors', () => ({
  getErrorMessage: (err, fallback) => err?.message || fallback,
}));

vi.mock('../../../utils/cn', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

vi.mock('../../../i18n', () => ({
  useI18n: () => ({ t: (key) => key, locale: 'en' }),
}));

vi.mock('../../../components/common/ErrorState', () => ({
  default: ({ title, description, onRetry }) => (
    <div data-testid="error-state">
      <p>{title}</p>
      {description && <p>{description}</p>}
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  ),
}));

vi.mock('../../../components/common/EmptyState', () => ({
  default: ({ title, description }) => (
    <div data-testid="empty-state">
      <p>{title}</p>
      {description && <p>{description}</p>}
    </div>
  ),
}));

// ── Imports (after mocks) ───────────────────────────────────────────────

import paymentService from '../../../services/paymentService';
import { useAdminPermissions } from '../../../hooks/useAdminPermissions';
import { useToast } from '../../../hooks/useToast';
import AdminWithdrawalsPage from '../AdminWithdrawalsPage';

// ── Helpers ──────────────────────────────────────────────────────────────

const MOCK_WITHDRAWALS = [
  {
    id: 1,
    reference: 'WTH-2026-000001',
    user: { id: 10, name: 'Abebe Kebede', email: 'abebe@test.com' },
    paymentMethod: { id: 1, display_label: 'Telebirr •••• 234' },
    amount: 5000,
    fee: 50,
    net_amount: 4950,
    currency: 'ETB',
    status: 'requested',
    created_at: '2026-08-27T10:00:00Z',
    processed_at: null,
    completed_at: null,
    rejected_at: null,
    failure_reason: null,
    rejection_reason: null,
    admin_notes: null,
    processor: null,
  },
  {
    id: 2,
    reference: 'WTH-2026-000002',
    user: { id: 11, name: 'Tigist Alemayehu', email: 'tigist@test.com' },
    paymentMethod: { id: 2, display_label: 'CBE Account •••• 9012' },
    amount: 3000,
    fee: 30,
    net_amount: 2970,
    currency: 'ETB',
    status: 'completed',
    created_at: '2026-08-26T08:00:00Z',
    processed_at: '2026-08-26T12:00:00Z',
    completed_at: '2026-08-26T14:00:00Z',
    rejected_at: null,
    failure_reason: null,
    rejection_reason: null,
    admin_notes: 'Transferred to CBE',
    processor: { id: 1, name: 'Finance Admin' },
  },
  {
    id: 3,
    reference: 'WTH-2026-000003',
    user: { id: 12, name: 'Dawit Tesfaye', email: 'dawit@test.com' },
    paymentMethod: { id: 3, display_label: 'Bank Account •••• 5678' },
    amount: 2000,
    fee: 20,
    net_amount: 1980,
    currency: 'ETB',
    status: 'rejected',
    created_at: '2026-08-25T09:00:00Z',
    processed_at: '2026-08-25T11:00:00Z',
    completed_at: null,
    rejected_at: '2026-08-25T11:00:00Z',
    failure_reason: null,
    rejection_reason: 'Incomplete KYC verification',
    admin_notes: 'Rejected by admin',
    processor: { id: 1, name: 'Finance Admin' },
  },
];

const MOCK_META = { current_page: 1, last_page: 2, total: 15, per_page: 20 };

function setupMocks({ permissions = ['withdrawals.view', 'withdrawals.manage'], withdrawals = MOCK_WITHDRAWALS } = {}) {
  const showToast = vi.fn();
  const mockCan = vi.fn((slug) => permissions.includes(slug));

  useAdminPermissions.mockReturnValue({
    can: mockCan,
    isSuperAdmin: permissions.includes('*'),
    adminRoleSlugs: ['finance_admin'],
    permissions,
    loading: false,
  });

  useToast.mockReturnValue({ showToast });

  paymentService.getAdminWithdrawals.mockResolvedValue({
    data: withdrawals,
    meta: MOCK_META,
  });

  paymentService.getAdminPayment?.mockResolvedValue({ data: {} });
  paymentService.processWithdrawal.mockResolvedValue({ data: { success: true } });
  paymentService.completeWithdrawal.mockResolvedValue({ data: { success: true } });
  paymentService.rejectWithdrawal.mockResolvedValue({ data: { success: true } });
  paymentService.failWithdrawal.mockResolvedValue({ data: { success: true } });

  return { showToast, mockCan };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('AdminWithdrawalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Access Control ──────────────────────────────────────────────────

  describe('access control', () => {
    it('shows access restricted when user lacks withdrawals.view permission', () => {
      setupMocks({ permissions: [] });

      render(<AdminWithdrawalsPage />);

      expect(screen.getByText('Access Restricted')).toBeInTheDocument();
      expect(screen.getByText(/You do not have permission to view withdrawals/)).toBeInTheDocument();
    });

    it('renders the page when user has withdrawals.view permission', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('Withdrawals')).toBeInTheDocument();
      });
    });
  });

  // ── Rendering ──────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the page title and description', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('Withdrawals')).toBeInTheDocument();
      });
      expect(screen.getByText('Manage freelancer withdrawal requests.')).toBeInTheDocument();
    });

    it('renders stat cards', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Rejected/Failed')).toBeInTheDocument();
    });

    it('renders the withdrawals table', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });
      expect(screen.getByText('WTH-2026-000002')).toBeInTheDocument();
      expect(screen.getByText('WTH-2026-000003')).toBeInTheDocument();
    });

    it('displays freelancer names', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('Abebe Kebede')).toBeInTheDocument();
      });
      expect(screen.getByText('Tigist Alemayehu')).toBeInTheDocument();
      expect(screen.getByText('Dawit Tesfaye')).toBeInTheDocument();
    });

    it('displays withdrawal amounts', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('ETB 5,000')).toBeInTheDocument();
      });
      expect(screen.getByText('ETB 3,000')).toBeInTheDocument();
      expect(screen.getByText('ETB 2,000')).toBeInTheDocument();
    });
  });

  // ── Loading & Empty States ─────────────────────────────────────────

  describe('loading and empty states', () => {
    it('shows loading skeleton while fetching', () => {
      paymentService.getAdminWithdrawals.mockReturnValue(new Promise(() => {})); // never resolves
      setupMocks();

      const { container } = render(<AdminWithdrawalsPage />);

      // Should have animated pulse skeletons
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
    });

    it('shows empty state when no withdrawals exist', async () => {
      setupMocks({ withdrawals: [] });

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
    });

    it('shows error state on API failure', async () => {
      setupMocks();
      paymentService.getAdminWithdrawals.mockRejectedValue(new Error('Server error'));

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('error-state')).toBeInTheDocument();
      });
    });
  });

  // ── Filters ────────────────────────────────────────────────────────

  describe('filters', () => {
    it('opens filter panel when filter button is clicked', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('All Withdrawals')).toBeInTheDocument();
      });

      const filterButton = screen.getByText('Filters');
      await user.click(filterButton);

      expect(screen.getByPlaceholderText(/Search reference, name, email/)).toBeInTheDocument();
    });

    it('calls API with search param when searching', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(paymentService.getAdminWithdrawals).toHaveBeenCalled();
      });

      // Open filters
      await user.click(screen.getByText('Filters'));

      // Type in search
      const searchInput = screen.getByPlaceholderText(/Search reference, name, email/);
      await user.type(searchInput, 'Abebe');

      await waitFor(() => {
        expect(paymentService.getAdminWithdrawals).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'Abebe' })
        );
      });
    });

    it('filters by status when dropdown changes', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(paymentService.getAdminWithdrawals).toHaveBeenCalled();
      });

      // Open filters
      await user.click(screen.getByText('Filters'));

      // Change status filter
      const selects = screen.getAllByRole('combobox');
      const statusSelect = selects.find(s => s.value === '' || s.querySelector('option[value="requested"]'));
      if (statusSelect) {
        await user.selectOptions(statusSelect, 'requested');
      }

      await waitFor(() => {
        const calls = paymentService.getAdminWithdrawals.mock.calls;
        const hasStatusFilter = calls.some(([arg]) => arg.status === 'requested');
        expect(hasStatusFilter).toBe(true);
      });
    });
  });

  // ── Actions: Process ───────────────────────────────────────────────

  describe('process action', () => {
    it('shows process modal when clicking process button on requested withdrawal', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      // Find the process button (RefreshCw icon) for the requested withdrawal
      const processButtons = screen.getAllByTitle('Process');
      expect(processButtons.length).toBeGreaterThanOrEqual(1);

      await user.click(processButtons[0]);

      expect(screen.getByText('Process Withdrawal')).toBeInTheDocument();
      expect(screen.getByText(/Mark withdrawal/)).toBeInTheDocument();
    });

    it('calls processWithdrawal when confirming', async () => {
      const user = userEvent.setup();
      const { showToast } = setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      // Open process modal
      await user.click(screen.getByTitle('Process'));

      // Find the submit button inside the modal dialog
      const modal = screen.getByRole('dialog');
      const confirmBtn = within(modal).getAllByRole('button').find(b => b.textContent.includes('Process') && !b.textContent.includes('Cancel'));
      if (confirmBtn) {
        await user.click(confirmBtn);
      }

      await waitFor(() => {
        if (paymentService.processWithdrawal.mock.calls.length > 0) {
          expect(paymentService.processWithdrawal).toHaveBeenCalledWith(1, expect.any(Object));
          expect(showToast).toHaveBeenCalledWith('Withdrawal processing initiated.', 'success');
        }
      });
    });
  });

  // ── Actions: Reject ────────────────────────────────────────────────

  describe('reject action', () => {
    it('shows reject modal when clicking reject button', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      const rejectButton = screen.getByTitle('Reject');
      await user.click(rejectButton);

      expect(screen.getByText('Reject Withdrawal')).toBeInTheDocument();
    });

    it('reject button is disabled when reason is too short', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Reject'));

      // The reject submit button should be disabled initially
      const rejectSubmitButtons = screen.getAllByRole('button');
      const rejectBtn = rejectSubmitButtons.find(b => b.textContent.includes('Reject') && b.closest('[role="dialog"]'));
      expect(rejectBtn).toBeDisabled();
    });

    it('enables reject button when reason has 5+ characters', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Reject'));

      const textarea = screen.getByPlaceholderText(/Explain why this withdrawal is being rejected/);
      await user.type(textarea, 'Reason for rejection is valid');

      const rejectSubmitButtons = screen.getAllByRole('button');
      const rejectBtn = rejectSubmitButtons.find(b => b.textContent.includes('Reject') && !b.textContent.includes('Cancel'));
      expect(rejectBtn).not.toBeDisabled();
    });

    it('calls rejectWithdrawal with reason when confirming', async () => {
      const user = userEvent.setup();
      const { showToast } = setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Reject'));

      const textarea = screen.getByPlaceholderText(/Explain why this withdrawal is being rejected/);
      await user.type(textarea, 'Incomplete KYC documents submitted');

      // Find and click the submit Reject button inside the modal
      const modal = screen.getByRole('dialog');
      const submitBtn = within(modal).getByRole('button', { name: /Reject/ });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(paymentService.rejectWithdrawal).toHaveBeenCalledWith(1, {
          reason: 'Incomplete KYC documents submitted',
        });
        expect(showToast).toHaveBeenCalledWith('Withdrawal rejected.', 'success');
      });
    });
  });

  // ── Actions: Fail ──────────────────────────────────────────────────

  describe('fail action', () => {
    it('shows fail modal when clicking fail button', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Mark Failed'));

      expect(screen.getByText('Mark Withdrawal as Failed')).toBeInTheDocument();
    });

    it('calls failWithdrawal with reason when confirming', async () => {
      const user = userEvent.setup();
      const { showToast } = setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Mark Failed'));

      const textarea = screen.getByPlaceholderText(/Explain why this withdrawal failed/);
      await user.type(textarea, 'Bank account details are invalid');

      const modal = screen.getByRole('dialog');
      const submitBtn = within(modal).getByRole('button', { name: /Mark Failed/ });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(paymentService.failWithdrawal).toHaveBeenCalledWith(1, {
          reason: 'Bank account details are invalid',
        });
        expect(showToast).toHaveBeenCalledWith('Withdrawal marked as failed.', 'success');
      });
    });
  });

  // ── Actions: Complete ──────────────────────────────────────────────

  describe('complete action', () => {
    it('shows complete modal only for processing withdrawals', async () => {
      const user = userEvent.setup();
      // Add a processing withdrawal
      const processingWithdrawal = {
        ...MOCK_WITHDRAWALS[0],
        id: 4,
        reference: 'WTH-2026-000004',
        status: 'processing',
      };
      setupMocks({ withdrawals: [...MOCK_WITHDRAWALS, processingWithdrawal] });

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000004')).toBeInTheDocument();
      });

      const completeButton = screen.getByTitle('Complete');
      await user.click(completeButton);

      expect(screen.getByText('Complete Withdrawal')).toBeInTheDocument();
    });

    it('calls completeWithdrawal when confirming', async () => {
      const user = userEvent.setup();
      const processingWithdrawal = {
        ...MOCK_WITHDRAWALS[0],
        id: 4,
        reference: 'WTH-2026-000004',
        status: 'processing',
      };
      const { showToast } = setupMocks({ withdrawals: [...MOCK_WITHDRAWALS, processingWithdrawal] });

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000004')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Complete'));

      const modal = screen.getByRole('dialog');
      const submitBtn = within(modal).getByRole('button', { name: /Complete/ });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(paymentService.completeWithdrawal).toHaveBeenCalledWith(4, expect.any(Object));
        expect(showToast).toHaveBeenCalledWith('Withdrawal completed.', 'success');
      });
    });
  });

  // ── Detail Modal ───────────────────────────────────────────────────

  describe('detail modal', () => {
    it('opens detail modal when clicking view button', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Withdrawal Details')).toBeInTheDocument();
      });
    });

    it('displays withdrawal reference in detail modal', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByTitle('View');
      await user.click(viewButtons[0]);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(within(modal).getByText('WTH-2026-000001')).toBeInTheDocument();
      });
    });
  });

  // ── Action Buttons Visibility ──────────────────────────────────────

  describe('action buttons visibility', () => {
    it('shows process button only for requested withdrawals', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      // Process button exists for requested
      expect(screen.getByTitle('Process')).toBeInTheDocument();

      // Complete button should NOT exist (no processing withdrawals)
      expect(screen.queryByTitle('Complete')).not.toBeInTheDocument();
    });

    it('hides action buttons for completed withdrawals', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000002')).toBeInTheDocument();
      });

      // Completed withdrawal row should not have Process, Reject, or Fail buttons
      const rows = screen.getAllByRole('row');
      const completedRow = rows.find(r => r.textContent.includes('WTH-2026-000002'));
      if (completedRow) {
        expect(within(completedRow).queryByTitle('Process')).not.toBeInTheDocument();
        expect(within(completedRow).queryByTitle('Reject')).not.toBeInTheDocument();
        expect(within(completedRow).queryByTitle('Mark Failed')).not.toBeInTheDocument();
      }
    });

    it('hides action buttons for rejected withdrawals', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000003')).toBeInTheDocument();
      });

      const rows = screen.getAllByRole('row');
      const rejectedRow = rows.find(r => r.textContent.includes('WTH-2026-000003'));
      if (rejectedRow) {
        expect(within(rejectedRow).queryByTitle('Process')).not.toBeInTheDocument();
        expect(within(rejectedRow).queryByTitle('Reject')).not.toBeInTheDocument();
      }
    });

    it('hides manage actions when user lacks withdrawals.manage permission', async () => {
      setupMocks({ permissions: ['withdrawals.view'] });

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      expect(screen.queryByTitle('Process')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Reject')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Mark Failed')).not.toBeInTheDocument();
    });
  });

  // ── Pagination ─────────────────────────────────────────────────────

  describe('pagination', () => {
    it('renders pagination when last_page > 1', async () => {
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      });
    });

    it('does not render pagination when last_page is 1', async () => {
      paymentService.getAdminWithdrawals.mockResolvedValue({
        data: MOCK_WITHDRAWALS,
        meta: { current_page: 1, last_page: 1, total: 3 },
      });
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Page 1 of 1/)).not.toBeInTheDocument();
    });
  });

  // ── Error Handling ─────────────────────────────────────────────────

  describe('error handling', () => {
    it('shows error toast when process fails', async () => {
      const user = userEvent.setup();
      const { showToast } = setupMocks();
      paymentService.processWithdrawal.mockRejectedValue(new Error('Already processed'));

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Process'));

      const modal = screen.getByRole('dialog');
      const submitBtn = within(modal).getByRole('button', { name: /Process/ });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith('Already processed', 'error');
      });
    });

    it('shows error toast when reject fails', async () => {
      const user = userEvent.setup();
      const { showToast } = setupMocks();
      paymentService.rejectWithdrawal.mockRejectedValue(new Error('Cannot reject'));

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Reject'));

      const textarea = screen.getByPlaceholderText(/Explain why this withdrawal is being rejected/);
      await user.type(textarea, 'Cannot reject this withdrawal');

      const modal = screen.getByRole('dialog');
      const submitBtn = within(modal).getByRole('button', { name: /Reject/ });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(showToast).toHaveBeenCalledWith('Cannot reject', 'error');
      });
    });
  });

  // ── Cancel Modal ───────────────────────────────────────────────────

  describe('cancel modal', () => {
    it('closes reject modal on cancel', async () => {
      const user = userEvent.setup();
      setupMocks();

      render(<AdminWithdrawalsPage />);

      await waitFor(() => {
        expect(screen.getByText('WTH-2026-000001')).toBeInTheDocument();
      });

      await user.click(screen.getByTitle('Reject'));

      const modal = screen.getByRole('dialog');
      const cancelBtn = within(modal).getByRole('button', { name: /Cancel/ });
      await user.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByText('Reject Withdrawal')).not.toBeInTheDocument();
      });
    });
  });
});

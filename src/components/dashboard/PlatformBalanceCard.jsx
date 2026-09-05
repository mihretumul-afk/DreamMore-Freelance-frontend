import { useCallback, useEffect, useState } from 'react';
import {
  Wallet, PlusCircle, ArrowDownToLine, X, RefreshCw,
} from 'lucide-react';
import Button from '../ui/Button';
import { financialService } from '../../services/financialService';
import { formatETB } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import { getEcho } from '../../config/echo';

/**
 * PlatformBalanceCard — the single platform pool card (milestone fees +
 * featured revenue + deposits − withdrawals) with the Chapa-backed
 * Add Funds / Withdraw actions.
 *
 * Used by BOTH the main admin dashboard and the admin finance dashboard so
 * the platform balance is always the same number everywhere.
 *
 * Props:
 *  - summary:   pre-fetched platform finance summary (from /admin/dashboard
 *               `finance`). When omitted, the card fetches
 *               /admin/finance/platform-revenue itself.
 *  - onUpdated: optional callback fired after an action or a live finance
 *               event so the parent can refresh its own data.
 */
export default function PlatformBalanceCard({ summary = null, onUpdated = null }) {
  const { showToast } = useToast();

  // Self-managed summary (used when no `summary` prop is provided).
  const [localSummary, setLocalSummary] = useState(null);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [addFundsLoading, setAddFundsLoading] = useState(false);

  // Withdraw form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawBankCode, setWithdrawBankCode] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [platformBanks, setPlatformBanks] = useState([]);

  // Add funds form
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsDescription, setAddFundsDescription] = useState('');
  const [addFundsSource, setAddFundsSource] = useState('');

  const displaySummary = summary ?? localSummary;
  const platformAvailable = displaySummary?.available_revenue ?? 0;
  const milestoneFeesTotal = displaySummary?.milestone_fees ?? 0;
  const featuredRevenueTotal = displaySummary?.featured_revenue ?? 0;
  const platformDepositedTotal = displaySummary?.total_deposits ?? 0;
  const platformWithdrawnTotal = displaySummary?.total_withdrawn ?? 0;

  const fetchSummary = useCallback(async () => {
    try {
      const res = await financialService.getPlatformRevenue();
      const revData = res.data ?? res;
      if (revData && typeof revData === 'object') {
        setLocalSummary(revData);
      }
    } catch {
      /* best-effort refresh */
    }
  }, []);

  // Fetch our own summary when the parent doesn't provide one.
  useEffect(() => {
    if (!summary) {
      fetchSummary();
    }
  }, [summary, fetchSummary]);

  // Live refresh: whenever a finance event fires, update the balance and
  // let the parent know so its own numbers refresh too.
  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private('admin.finance');
    channel.listen('.finance.updated', () => {
      if (!summary) fetchSummary();
      onUpdated?.();
    });

    return () => {
      channel.stopListening('.finance.updated');
    };
  }, [summary, fetchSummary, onUpdated]);

  // Load payout banks from the provider (Chapa) when the Withdraw modal
  // opens — Chapa requires its numeric bank code and rejects guessed ones.
  useEffect(() => {
    if (!showWithdrawModal) return;
    financialService.getPlatformBanks()
      .then((res) => {
        const banks = res.data?.banks ?? res?.banks;
        setPlatformBanks(Array.isArray(banks) ? banks : []);
      })
      .catch(() => setPlatformBanks([]));
  }, [showWithdrawModal]);

  const handleWithdrawRevenue = async () => {
    if (!withdrawAmount || !withdrawAccountName || !withdrawAccountNumber || !withdrawBankName) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    setWithdrawLoading(true);
    try {
      await financialService.withdrawPlatformRevenue({
        amount: parseFloat(withdrawAmount),
        account_name: withdrawAccountName,
        account_number: withdrawAccountNumber,
        bank_name: withdrawBankName,
        bank_code: withdrawBankCode || undefined,
        description: withdrawDescription || 'Platform revenue withdrawal',
      });

      showToast('Platform revenue withdrawn successfully!', 'success');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawAccountName('');
      setWithdrawAccountNumber('');
      setWithdrawBankName('');
      setWithdrawBankCode('');
      setWithdrawDescription('');
      fetchSummary();
      onUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to withdraw revenue.', 'error');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!addFundsAmount || !addFundsDescription) {
      showToast('Please fill in amount and description.', 'error');
      return;
    }

    setAddFundsLoading(true);
    try {
      const res = await financialService.addPlatformFunds({
        amount: parseFloat(addFundsAmount),
        description: addFundsDescription,
        source: addFundsSource || undefined,
      });
      const data = res.data ?? res;

      // Redirect-based provider (Chapa) — complete the payment on Chapa's
      // hosted checkout. On return, reconciliation credits the balance.
      if (data?.checkout_url) {
        setShowAddFundsModal(false);
        window.location.href = data.checkout_url;
        return;
      }

      showToast('Funds added to platform successfully!', 'success');
      setShowAddFundsModal(false);
      setAddFundsAmount('');
      setAddFundsDescription('');
      setAddFundsSource('');
      fetchSummary();
      onUpdated?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add funds.', 'error');
    } finally {
      setAddFundsLoading(false);
    }
  };

  const resetWithdrawBankSelection = () => {
    setWithdrawBankCode('');
    setWithdrawBankName('');
  };

  return (
    <>
      {/* ─── Platform Balance (single card: milestone fees + featured revenue + deposits − withdrawals) ─ */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="relative overflow-hidden px-6 py-6 sm:px-8">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-blue-100/60 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-ink-900">Platform Balance</h2>
                <p className="text-xs text-gray-400">Milestone fees + featured revenue + deposits − withdrawals</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Updates automatically on new revenue
            </div>
          </div>

          <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Available Balance</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-ink-900">{formatETB(platformAvailable)}</p>
              <p className="mt-1 text-[11px] text-gray-400">Ready to withdraw to your bank account via Chapa</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="success"
                onClick={() => {
                  resetWithdrawBankSelection();
                  setShowWithdrawModal(true);
                }}
                className="flex items-center gap-2"
              >
                <ArrowDownToLine className="h-4 w-4" /> Withdraw
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddFundsModal(true)}
                className="flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" /> Add Funds
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-gray-100 bg-gray-100 lg:grid-cols-4">
          <div className="bg-white px-6 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Milestone Fees</p>
            <p className="mt-1 text-xl font-extrabold text-ink-900">{formatETB(milestoneFeesTotal)}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">Earned when milestones are released</p>
          </div>
          <div className="bg-white px-6 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-violet-600">Featured Revenue</p>
            <p className="mt-1 text-xl font-extrabold text-ink-900">{formatETB(featuredRevenueTotal)}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">Jobs & profiles boosted</p>
          </div>
          <div className="bg-white px-6 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Total Deposited</p>
            <p className="mt-1 text-xl font-extrabold text-ink-900">{formatETB(platformDepositedTotal)}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">Added via Chapa checkout</p>
          </div>
          <div className="bg-white px-6 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Total Withdrawn</p>
            <p className="mt-1 text-xl font-extrabold text-ink-900">{formatETB(platformWithdrawnTotal)}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">Transferred to bank</p>
          </div>
        </div>
      </div>

      {/* ─── Withdraw Revenue Modal ─────────────────────────────────── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <ArrowDownToLine className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900">Withdraw Platform Revenue</h3>
                  <p className="text-xs text-gray-400">Transfer collected fees to your bank account</p>
                </div>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="rounded-xl p-2 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 flex-1 min-h-0">
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4">
                  <p className="text-xs font-bold text-emerald-600">Available for Withdrawal</p>
                  <p className="text-2xl font-extrabold text-emerald-900">{formatETB(platformAvailable)}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Amount (ETB) *</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Account Holder Name *</label>
                  <input
                    type="text"
                    value={withdrawAccountName}
                    onChange={(e) => setWithdrawAccountName(e.target.value)}
                    placeholder="e.g., DreamMore Technologies PLC"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Account Number *</label>
                  <input
                    type="text"
                    value={withdrawAccountNumber}
                    onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                    placeholder="Enter bank account number"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {platformBanks.length > 0 ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Bank *</label>
                    <select
                      value={withdrawBankCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setWithdrawBankCode(code);
                        const bank = platformBanks.find((b) => b.code === code);
                        setWithdrawBankName(bank ? bank.name : '');
                      }}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select bank…</option>
                      {platformBanks.map((bank) => (
                        <option key={bank.code} value={bank.code}>{bank.name}</option>
                      ))}
                    </select>
                    {withdrawBankCode && withdrawBankName && (
                      <p className="mt-1 text-[10px] text-gray-400">
                        {withdrawBankName} (Chapa bank code {withdrawBankCode}) will receive the transfer.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Bank Name *</label>
                      <input
                        type="text"
                        value={withdrawBankName}
                        onChange={(e) => setWithdrawBankName(e.target.value)}
                        placeholder="e.g., Commercial Bank of Ethiopia"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Bank Code *</label>
                      <input
                        type="text"
                        value={withdrawBankCode}
                        onChange={(e) => setWithdrawBankCode(e.target.value)}
                        placeholder="Required by Chapa"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={withdrawDescription}
                    onChange={(e) => setWithdrawDescription(e.target.value)}
                    placeholder="Optional note for this withdrawal"
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={handleWithdrawRevenue}
                disabled={withdrawLoading}
                className="flex-1"
              >
                {withdrawLoading ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><ArrowDownToLine className="h-4 w-4" /> Withdraw Revenue</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add Funds Modal ────────────────────────────────────────── */}
      {showAddFundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddFundsModal(false)} />
          <div className="relative w-full max-w-lg max-h-[90vh] rounded-3xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <PlusCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-ink-900">Add Funds to Platform</h3>
                  <p className="text-xs text-gray-400">Deposit funds for operations or promotions</p>
                </div>
              </div>
              <button onClick={() => setShowAddFundsModal(false)} className="rounded-xl p-2 hover:bg-gray-100 transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-4 flex-1 min-h-0">
              <div className="space-y-4">
                <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4">
                  <p className="text-xs font-bold text-blue-600">Current Platform Balance</p>
                  <p className="text-2xl font-extrabold text-blue-900">{formatETB(platformAvailable)}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Amount (ETB) *</label>
                  <input
                    type="number"
                    value={addFundsAmount}
                    onChange={(e) => setAddFundsAmount(e.target.value)}
                    placeholder="Enter amount to deposit"
                    min="1"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Description *</label>
                  <textarea
                    value={addFundsDescription}
                    onChange={(e) => setAddFundsDescription(e.target.value)}
                    placeholder="e.g., Operational deposit, Promotional credits, etc."
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Source (Optional)</label>
                  <input
                    type="text"
                    value={addFundsSource}
                    onChange={(e) => setAddFundsSource(e.target.value)}
                    placeholder="e.g., Company bank transfer, Investment"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <Button variant="outline" onClick={() => setShowAddFundsModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddFunds}
                disabled={addFundsLoading}
                className="flex-1"
              >
                {addFundsLoading ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><PlusCircle className="h-4 w-4" /> Add Funds</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
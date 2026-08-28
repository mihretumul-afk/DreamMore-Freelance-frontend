import { useEffect, useState } from 'react';
import { Wallet, ArrowDownRight, Clock, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import { getWallet, withdrawWallet } from '../../services/paymentService';
import { formatETB } from '../../utils/format';

export default function WalletCard({ userRole = 'freelancer' }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await getWallet();
      if (res.success) {
        setWallet(res.data);
      }
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid withdrawal amount.');
      return;
    }

    if (wallet && amount > wallet.available_balance) {
      setError(`Amount exceeds available balance (${formatETB(wallet.available_balance)}).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await withdrawWallet(amount, 'ETB');
      if (res.success) {
        setMessage('Withdrawal completed successfully (Test Mode).');
        setWithdrawAmount('');
        fetchWallet();
        setTimeout(() => {
          setModalOpen(false);
          setMessage(null);
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process withdrawal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink-900">Wallet Balance</h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                  <ShieldCheck className="h-3 w-3" /> Test Mode
                </span>
              </div>
              <p className="text-xs text-gray-500">Internal Escrow Wallet</p>
            </div>
          </div>

          <Button
            variant="success"
            size="sm"
            onClick={() => setModalOpen(true)}
            disabled={loading || !wallet || wallet.available_balance <= 0}
          >
            <ArrowDownRight className="h-4 w-4" /> Withdraw
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div>
            <p className="text-xs font-medium text-gray-400">Available Balance</p>
            <p className="text-xl font-extrabold text-emerald-600">
              {loading ? '...' : formatETB(wallet?.available_balance ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400">Escrow Pending</p>
            <p className="text-xl font-bold text-amber-600">
              {loading ? '...' : formatETB(wallet?.pending_balance ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Withdraw Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-ink-900">Withdraw Funds</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>Test Mode:</strong> No real payment gateway transfer is executed yet. Withdrawals immediately deduct from your local test wallet balance.
              </span>
            </div>

            {error && (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {message}
              </div>
            )}

            <form onSubmit={handleWithdraw} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount to Withdraw (ETB)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={wallet?.available_balance || 0}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="e.g. 500"
                    required
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm font-semibold text-ink-900 focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-gray-400">ETB</span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Available for withdrawal: {formatETB(wallet?.available_balance ?? 0)}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="success" type="submit" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Confirm Test Withdrawal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

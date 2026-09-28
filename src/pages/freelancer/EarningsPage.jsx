import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, ArrowDownRight, Clock, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { financialService } from '../../services/financialService';
import { formatETB, formatDate } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';

const TX_TYPES = {
  payment: { label: 'Payment', tone: 'success' },
  platform_fee: { label: 'Platform Fee', tone: 'warning' },
  processing_fee: { label: 'Processing Fee', tone: 'warning' },
  funds_held: { label: 'Funds Held', tone: 'info' },
  funds_released: { label: 'Funds Released', tone: 'success' },
  refund: { label: 'Refund', tone: 'info' },
  withdrawal: { label: 'Withdrawal', tone: 'danger' },
  withdrawal_fee: { label: 'Withdrawal Fee', tone: 'warning' },
  adjustment: { label: 'Adjustment', tone: 'neutral' },
};

export default function EarningsPage() {
  usePageTitle('Earnings — Freelancer');
  const { showToast } = useToast();
  const [earnings, setEarnings] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [txMeta, setTxMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [txPage, setTxPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [earningsRes, txRes] = await Promise.all([
        financialService.getEarnings(),
        financialService.getTransactions({ page: txPage }),
      ]);
      setEarnings(earningsRes.data ?? null);
      const txData = txRes.data ?? [];
      setTransactions(Array.isArray(txData) ? txData : (txData.data ?? []));
      setTxMeta(txRes.meta ?? txData.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load earnings.');
    } finally {
      setLoading(false);
    }
  }, [txPage]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900" />)}
        </div>
        <div className="h-96 rounded-2xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load earnings" description={error} onRetry={load} />;

  const e = earnings || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-slate-100">Earnings</h1>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">Track your balance, earnings, and withdrawal history.</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/freelancer/withdrawals" className="group rounded-2xl border border-emerald-200 bg-emerald-50 p-5 hover:shadow-md hover:border-emerald-300 transition-all dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:hover:border-emerald-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <Wallet className="h-4 w-4" /> Available Balance
            </div>
            {(e.available_balance || 0) > 0 && <span className="text-[10px] font-medium text-emerald-600 group-hover:underline flex items-center gap-0.5 dark:text-emerald-400">Withdraw <ExternalLink className="h-3 w-3" /></span>}
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">{formatETB(e.available_balance || 0)}</p>
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">Available for withdrawal</p>
        </Link>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" /> Pending Balance
          </div>
          <p className="mt-2 text-2xl font-extrabold text-amber-900 dark:text-amber-100">{formatETB(e.pending_balance || 0)}</p>
          <p className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">Clearing period</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/40">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <TrendingUp className="h-4 w-4" /> Total Earned
          </div>
          <p className="mt-2 text-2xl font-extrabold text-blue-900 dark:text-blue-100">{formatETB(e.total_earned || 0)}</p>
          <p className="mt-0.5 text-[11px] text-blue-600 dark:text-blue-400">All time earnings</p>
        </div>

        <Link to="/freelancer/withdrawals" className="group rounded-2xl border border-gray-200 bg-gray-50 p-5 hover:shadow-md hover:border-gray-300 transition-all dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-300">
              <ArrowDownRight className="h-4 w-4" /> Total Withdrawn
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:underline flex items-center gap-0.5 dark:text-slate-400">View <ExternalLink className="h-3 w-3" /></span>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-gray-900 dark:text-slate-100">{formatETB(e.total_withdrawn || 0)}</p>
          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-slate-400">All time withdrawals</p>
        </Link>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader title="Transaction History" description={`${txMeta.total || 0} transactions`} />
        <CardBody>
          {transactions.length === 0 ? (
            <EmptyState icon={Wallet} title="No transactions yet" description="Your financial transactions will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-slate-800 text-left">
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400 dark:text-slate-400">Type</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400 dark:text-slate-400">Description</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400 dark:text-slate-400 text-right">Amount</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400 dark:text-slate-400 text-right">Balance</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400 dark:text-slate-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {transactions.map((tx) => {
                    const meta = TX_TYPES[tx.type] || { label: tx.type, tone: 'neutral' };
                    const isCredit = tx.direction === 'credit';
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                        <td className="py-3"><Badge tone={meta.tone} size="xs">{meta.label}</Badge></td>
                        <td className="py-3 text-gray-600 dark:text-slate-300 max-w-xs truncate">{tx.description || '—'}</td>
                        <td className={`py-3 text-right font-semibold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isCredit ? '+' : '-'}{formatETB(Math.abs(tx.amount))}
                        </td>
                        <td className="py-3 text-right text-gray-500 dark:text-slate-400">{tx.balance_after != null ? formatETB(tx.balance_after) : '—'}</td>
                        <td className="py-3 text-gray-400 dark:text-slate-400 text-xs">{formatDate(tx.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {txMeta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-400 dark:text-slate-400">Page {txMeta.current_page} of {txMeta.last_page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" disabled={txMeta.current_page <= 1} onClick={() => setTxPage((p) => p - 1)}>
                  <ChevronLeft className="h-3 w-3" /> Prev
                </Button>
                <Button variant="outline" size="xs" disabled={txMeta.current_page >= txMeta.last_page} onClick={() => setTxPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

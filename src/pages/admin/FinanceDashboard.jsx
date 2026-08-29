import { useCallback, useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Wallet, AlertTriangle, CreditCard, ArrowDownRight, CheckCircle2, Clock } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import ErrorState from '../../components/common/ErrorState';
import { financialService } from '../../services/financialService';
import { formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

function StatCard({ icon: Icon, label, value, sublabel, color = 'gray' }) {
  const colors = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    gray: 'border-gray-200 bg-gray-50 text-gray-700',
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="flex items-center gap-2 text-xs font-semibold">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-ink-900">{value}</p>
      {sublabel && <p className="mt-0.5 text-[11px] text-gray-500">{sublabel}</p>}
    </div>
  );
}

export default function FinanceDashboard() {
  usePageTitle('Finance Dashboard — Admin');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financialService.getFinanceDashboard();
      setData(res.data ?? res);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load finance dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl border border-gray-200 bg-white" />)}
        </div>
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  const d = data || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Finance Dashboard</h1>
        <p className="mt-0.5 text-sm text-gray-500">Platform financial overview and key metrics.</p>
      </div>

      {/* Payment Volume */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={DollarSign} label="Total Payment Volume" value={formatETB(d.payment_volume?.total || 0)} sublabel={`This month: ${formatETB(d.payment_volume?.monthly || 0)}`} color="emerald" />
        <StatCard icon={TrendingUp} label="Platform Revenue" value={formatETB(d.platform_revenue?.total || 0)} sublabel={`This month: ${formatETB(d.platform_revenue?.monthly || 0)}`} color="blue" />
        <StatCard icon={Wallet} label="Held Funds (Escrow)" value={formatETB(d.held_funds || 0)} sublabel="Awaiting release" color="amber" />
        <StatCard icon={CheckCircle2} label="Released Funds" value={formatETB(d.released_funds || 0)} sublabel="Paid to freelancers" color="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={AlertTriangle} label="Total Refunds" value={formatETB(d.total_refunds || 0)} color="red" />
        <StatCard icon={ArrowDownRight} label="Completed Withdrawals" value={formatETB(d.withdrawals?.completed || 0)} color="emerald" />
        <StatCard icon={Clock} label="Pending Withdrawals" value={String(d.withdrawals?.pending || 0)} color="amber" />
        <StatCard icon={CreditCard} label="Failed Payments" value={String(d.failed_payments || 0)} color="red" />
      </div>

      {/* Wallet Summary */}
      <Card>
        <CardHeader title="Freelancer Wallets" description="Aggregate wallet balances" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">Total Earned</p>
              <p className="mt-1 text-xl font-bold text-ink-900">{formatETB(d.wallets?.total_earned || 0)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">Available Balance</p>
              <p className="mt-1 text-xl font-bold text-emerald-600">{formatETB(d.wallets?.total_available || 0)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-bold uppercase text-gray-400">Pending Balance</p>
              <p className="mt-1 text-xl font-bold text-amber-600">{formatETB(d.wallets?.total_pending || 0)}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {d.disputed_funds > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardBody>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-900">Disputed Funds</p>
                <p className="text-sm text-amber-700">{formatETB(d.disputed_funds)} held in disputed milestones. Resolve disputes to release or refund these funds.</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

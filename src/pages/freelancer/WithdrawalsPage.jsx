import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownRight, Clock, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, Wallet, CreditCard, Plus } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { financialService } from '../../services/financialService';
import { formatETB, formatDate } from '../../utils/format';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';

const STATUS_MAP = {
  requested:  { tone: 'warning', icon: Clock, label: 'Requested' },
  processing: { tone: 'info', icon: Clock, label: 'Processing' },
  completed:  { tone: 'success', icon: CheckCircle2, label: 'Completed' },
  failed:     { tone: 'danger', icon: AlertTriangle, label: 'Failed' },
  cancelled:  { tone: 'neutral', icon: AlertTriangle, label: 'Cancelled' },
};

export default function WithdrawalsPage() {
  usePageTitle('Withdrawals — Freelancer');
  const { showToast } = useToast();
  const [earnings, setEarnings] = useState(null);
  const [methods, setMethods] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [earnRes, methodRes, wdRes] = await Promise.all([
        financialService.getEarnings(),
        financialService.getPaymentMethods(),
        financialService.getWithdrawals({ page }),
      ]);
      setEarnings(earnRes.data ?? null);
      setMethods(methodRes.data ?? []);
      const wdData = wdRes.data ?? [];
      setWithdrawals(Array.isArray(wdData) ? wdData : (wdData.data ?? []));
      setMeta(wdRes.meta ?? wdData.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load withdrawals.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleWithdraw = async () => {
    if (!amount || !methodId) { showToast('Please enter amount and select a method.', 'error'); return; }
    setSubmitting(true);
    try {
      await financialService.requestWithdrawal(parseFloat(amount), parseInt(methodId));
      showToast('Withdrawal request submitted successfully.', 'success');
      setShowWithdraw(false);
      setAmount('');
      setMethodId('');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit withdrawal.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await financialService.cancelWithdrawal(id);
      showToast('Withdrawal cancelled.', 'success');
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-2xl border border-gray-200 bg-white" />
        <div className="h-64 rounded-2xl border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Withdrawals</h1>
          <p className="mt-0.5 text-sm text-gray-500">Request withdrawals and track their status.</p>
        </div>
        {earnings && earnings.available_balance > 0 && (
          <Button variant="primary" size="sm" onClick={() => setShowWithdraw(true)}>
            <ArrowDownRight className="h-4 w-4" /> Withdraw
          </Button>
        )}
      </div>

      {/* Balance Summary */}
      {earnings && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Available for Withdrawal</p>
              <p className="text-3xl font-extrabold text-emerald-900">{formatETB(earnings.available_balance)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-600">Minimum withdrawal: {formatETB(100)} · Fee: 1.5%</p>

          {methods.length === 0 && earnings.available_balance > 0 && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-800">No payment method added yet</p>
                <p className="text-[11px] text-amber-600">Add one to withdraw your earnings.</p>
              </div>
              <Link to="/freelancer/settings/payment-methods">
                <Button variant="outline" size="xs"><Plus className="h-3 w-3" /> Add</Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Withdrawal History */}
      <Card>
        <CardHeader title="Withdrawal History" />
        <CardBody>
          {withdrawals.length === 0 ? (
            <EmptyState icon={ArrowDownRight} title="No withdrawals yet" description="Request a withdrawal when you have available balance." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400">Reference</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400">Amount</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400">Fee</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400">Net</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400">Status</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400">Date</th>
                    <th className="pb-3 text-xs font-bold uppercase text-gray-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {withdrawals.map((w) => {
                    const s = STATUS_MAP[w.status] || { tone: 'neutral', label: w.status };
                    return (
                      <tr key={w.id} className="hover:bg-gray-50/50">
                        <td className="py-3 font-mono text-xs text-gray-600">{w.reference}</td>
                        <td className="py-3 font-semibold text-ink-900">{formatETB(w.amount)}</td>
                        <td className="py-3 text-gray-500">{formatETB(w.fee)}</td>
                        <td className="py-3 font-semibold text-emerald-600">{formatETB(w.net_amount)}</td>
                        <td className="py-3"><Badge tone={s.tone} size="xs">{s.label}</Badge></td>
                        <td className="py-3 text-xs text-gray-400">{formatDate(w.created_at)}</td>
                        <td className="py-3">
                          {w.status === 'requested' && (
                            <Button variant="ghost" size="xs" onClick={() => handleCancel(w.id)}>Cancel</Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {meta.last_page > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">Page {meta.current_page} of {meta.last_page}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-3 w-3" /> Prev
                </Button>
                <Button variant="outline" size="xs" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Withdraw Modal */}
      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Request Withdrawal" size="md">
        <div className="space-y-4">
          {/* Balance */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-5 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Available Balance</p>
            <p className="mt-1 text-3xl font-extrabold text-emerald-700">{formatETB(earnings?.available_balance || 0)}</p>
          </div>

          {/* No payment methods warning */}
          {methods.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-5 text-center">
              <CreditCard className="mx-auto h-8 w-8 text-amber-400" />
              <p className="mt-2 text-sm font-semibold text-amber-800">No Payment Methods</p>
              <p className="mt-1 text-xs text-amber-600">Add a payment method to receive your withdrawals.</p>
              <Link to="/freelancer/settings/payment-methods">
                <Button variant="outline" size="sm" className="mt-3">
                  <Plus className="h-3 w-3" /> Add Payment Method
                </Button>
              </Link>
            </div>
          )}

          <Input label="Amount (ETB)" type="number" min="100" step="0.01" value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder="Minimum 100 ETB" required />

          {methods.length > 0 ? (
            <Select label="Withdraw To" value={methodId} onChange={(e) => setMethodId(e.target.value)}>
              <option value="">Select where to withdraw</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_label || m.nickname || m.bank_name || m.mobile_provider || `Method #${m.id}`}
                </option>
              ))}
            </Select>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
              <p className="text-sm text-gray-500">Please add a payment method first.</p>
            </div>
          )}

          {amount && parseFloat(amount) > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{formatETB(parseFloat(amount) || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fee (1.5%)</span><span className="text-red-600">-{formatETB((parseFloat(amount) || 0) * 0.015)}</span></div>
              <div className="border-t border-gray-200 pt-1.5 flex justify-between font-bold"><span>Net Amount</span><span className="text-emerald-600">{formatETB((parseFloat(amount) || 0) * 0.985)}</span></div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
            <Button variant="primary" loading={submitting} onClick={handleWithdraw}
              disabled={!amount || !methodId || methods.length === 0}>
              <ArrowDownRight className="h-4 w-4" /> Request Withdrawal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

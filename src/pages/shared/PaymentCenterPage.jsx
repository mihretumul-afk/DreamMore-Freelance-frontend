import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Wallet, CreditCard, TrendingUp, TrendingDown, Clock,
  ArrowRight, Search, ChevronLeft, ChevronRight, RefreshCw,
  Plus, Filter, X,
} from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatCard from '../../components/dashboard/StatCard';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { PaymentStatusBadge, PaymentTypeBadge, DirectionBadge } from '../../components/payments/PaymentStatusBadge';
import TransactionDetailModal from '../../components/payments/TransactionDetailModal';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';

function BalanceSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-card border border-gray-200 bg-white p-5 space-y-3">
          <div className="h-3 w-20 rounded bg-gray-200" />
          <div className="h-7 w-32 rounded bg-gray-200" />
          <div className="h-2.5 w-24 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function TxnSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/2 rounded bg-gray-200" />
            <div className="h-3 w-1/3 rounded bg-gray-100" />
          </div>
          <div className="h-5 w-20 rounded bg-gray-100" />
          <div className="h-5 w-24 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

/**
 * PaymentCenterPage — unified payment dashboard for freelancers and employers.
 *
 * Accessible at /freelancer/payments and /employer/payments.
 * Shows balance summary, quick navigation to payment methods, and the
 * user's full transaction history with search + filters.
 */
export default function PaymentCenterPage() {
  usePageTitle('Payment Center');
  const { user } = useAuth();
  const isFreelancer = user?.role === 'freelancer';

  // Balance state
  const [balance, setBalance]       = useState(null);
  const [balanceLoading, setBL]     = useState(true);
  const [balanceError, setBE]       = useState(null);

  // Transactions state
  const [txns, setTxns]             = useState([]);
  const [meta, setMeta]             = useState({ current_page: 1, last_page: 1, total: 0 });
  const [txnLoading, setTL]         = useState(true);
  const [txnError, setTE]           = useState(null);
  const [selectedTxn, setSelected]  = useState(null);

  // Filters
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [typeFilter, setType]       = useState('');
  const [dirFilter, setDir]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [page, setPage]             = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const searchRef = useRef(null);

  // ── Load balance ──────────────────────────────────────────────────
  const loadBalance = useCallback(async () => {
    setBL(true); setBE(null);
    try {
      const res = await paymentService.getBalance();
      setBalance(res.data ?? res);
    } catch (err) {
      setBE(getErrorMessage(err, 'Failed to load balance.'));
    } finally {
      setBL(false);
    }
  }, []);

  // ── Load transactions ─────────────────────────────────────────────
  const loadTxns = useCallback(async () => {
    setTL(true); setTE(null);
    try {
      const params = {
        page,
        search:    search    || undefined,
        status:    statusFilter || undefined,
        type:      typeFilter   || undefined,
        direction: dirFilter    || undefined,
        date_from: dateFrom     || undefined,
        date_to:   dateTo       || undefined,
      };
      const res = await paymentService.getTransactions(params);
      const data = res.data ?? res;
      setTxns(Array.isArray(data) ? data : data.data ?? []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setTE(getErrorMessage(err, 'Failed to load transactions.'));
    } finally {
      setTL(false);
    }
  }, [page, search, statusFilter, typeFilter, dirFilter, dateFrom, dateTo]);

  useEffect(() => { loadBalance(); }, [loadBalance]);
  useEffect(() => { loadTxns(); }, [loadTxns]);
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, dirFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch(''); setStatus(''); setType(''); setDir('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  const hasFilters = search || statusFilter || typeFilter || dirFilter || dateFrom || dateTo;
  const currency = balance?.currency ?? 'ETB';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Payment Center</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {isFreelancer
              ? 'Track your earnings and payment history.'
              : 'Manage your spending and payment history.'}
          </p>
        </div>
        <Button
          as="a"
          href={isFreelancer ? '/freelancer/payment-methods' : '/employer/payment-methods'}
          variant="outline"
          size="sm"
        >
          <CreditCard className="h-4 w-4" />
          Payment Methods
        </Button>
      </div>

      {/* ── Balance cards ────────────────────────────────────────────── */}
      {balanceLoading ? <BalanceSkeleton /> : balanceError ? (
        <ErrorState title="Balance unavailable" description={balanceError} onRetry={loadBalance} />
      ) : balance ? (
        isFreelancer ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Clock}
              label="Pending Earnings"
              value={formatCurrency(balance.pending_earnings ?? 0, currency)}
              hint="In escrow, awaiting release"
              tone="brand"
            />
            <StatCard
              icon={Wallet}
              label="Available Earnings"
              value={formatCurrency(balance.available_earnings ?? 0, currency)}
              hint="Ready to withdraw"
              tone="emerald"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Earned"
              value={formatCurrency(balance.total_earned ?? 0, currency)}
              hint="All time"
              tone="emerald"
            />
            <StatCard
              icon={TrendingDown}
              label="Withdrawn"
              value={formatCurrency(balance.withdrawn ?? 0, currency)}
              hint="Total withdrawn"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={Wallet}
              label="Available Balance"
              value={formatCurrency(balance.available_balance ?? 0, currency)}
              hint="Ready to use"
              tone="emerald"
            />
            <StatCard
              icon={Clock}
              label="Held in Escrow"
              value={formatCurrency(balance.total_held_in_escrow ?? 0, currency)}
              hint="Funded, not yet released"
              tone="brand"
            />
            <StatCard
              icon={TrendingDown}
              label="Total Spent"
              value={formatCurrency(balance.total_spent ?? 0, currency)}
              hint="All time"
              tone="brand"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Refunded"
              value={formatCurrency(balance.total_refunded ?? 0, currency)}
              hint="All time"
            />
          </div>
        )
      ) : null}

      {/* ── Transactions ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader
          title="Transaction History"
          description={`${meta.total} total transaction${meta.total !== 1 ? 's' : ''}`}
          action={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className={cn(
                  'flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                  showFilters || hasFilters
                    ? 'border-brand-300 bg-brand-50 text-brand-700'
                    : 'border-gray-300 bg-white text-ink-700 hover:bg-gray-50',
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {hasFilters && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {[search, statusFilter, typeFilter, dirFilter, dateFrom, dateTo].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={loadTxns}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-ink-700 hover:bg-gray-50"
                aria-label="Refresh"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          }
        />

        {/* Filter panel */}
        {showFilters && (
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchRef}
                  type="search"
                  placeholder="Search by reference or description…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none">
                <option value="">All statuses</option>
                {['pending','processing','completed','failed','refunded','cancelled','disputed'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={e => setType(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none">
                <option value="">All types</option>
                <option value="escrow_funded">Escrow Funded</option>
                <option value="milestone_released">Milestone Released</option>
                <option value="refund">Refund</option>
              </select>
              <select value={dirFilter} onChange={e => setDir(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none">
                <option value="">Both directions</option>
                <option value="credit">Credits only</option>
                <option value="debit">Debits only</option>
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                max={dateTo || undefined}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                aria-label="From date" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                min={dateFrom || undefined}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                aria-label="To date" />
              {hasFilters && (
                <button type="button" onClick={clearFilters}
                  className="flex h-9 items-center gap-1.5 rounded-input border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:text-danger-600">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {txnError ? (
          <CardBody><ErrorState title="Failed to load" description={txnError} onRetry={loadTxns} /></CardBody>
        ) : txnLoading ? (
          <TxnSkeleton />
        ) : txns.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={Wallet}
              title={hasFilters ? 'No transactions match your filters' : 'No transactions yet'}
              description={hasFilters ? 'Try adjusting your filters.' : 'Your transaction history will appear here once payments are made.'}
              action={hasFilters ? <Button variant="outline" size="sm" onClick={clearFilters}><X className="h-4 w-4" />Clear Filters</Button> : null}
            />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Transaction history">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {['Reference', 'Date', 'Type', 'Amount', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {txns.map(txn => {
                    const isCredit = txn.direction === 'credit';
                    return (
                      <tr
                        key={txn.id}
                        className="group cursor-pointer hover:bg-gray-50/70"
                        onClick={() => {
                          paymentService.getTransaction(txn.id)
                            .then(r => setSelected(r.data ?? r))
                            .catch(() => setSelected(txn));
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && setSelected(txn)}
                        aria-label={`View transaction ${txn.reference}`}
                      >
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs font-semibold text-ink-800">{txn.reference}</p>
                          <p className="text-[11px] text-gray-400">{txn.description ? txn.description.slice(0, 45) + (txn.description.length > 45 ? '…' : '') : '—'}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-400" title={formatDate(txn.created_at)}>
                          {timeAgo(txn.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          <PaymentTypeBadge type={txn.type} size="xs" />
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn('font-bold text-sm', isCredit ? 'text-success-600' : 'text-danger-600')}>
                            {isCredit ? '+' : '−'}{formatCurrency(txn.amount, txn.currency ?? 'ETB')}
                          </span>
                          {txn.fee > 0 && (
                            <p className="text-[10px] text-gray-400">fee {formatCurrency(txn.fee, txn.currency ?? 'ETB')}</p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <PaymentStatusBadge status={txn.status} size="xs" />
                        </td>
                        <td className="px-5 py-3">
                          <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
              <CardFooter>
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                  <span>Page {meta.current_page} of {meta.last_page} · {meta.total} total</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(meta.last_page, 5) }, (_, i) => {
                      const p = Math.max(1, meta.current_page - 2) + i;
                      if (p > meta.last_page) return null;
                      return (
                        <button key={p} type="button" onClick={() => setPage(p)}
                          aria-current={p === meta.current_page ? 'page' : undefined}
                          className={cn('flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                            p === meta.current_page
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-gray-300 bg-white text-ink-700 hover:bg-gray-50')}>
                          {p}
                        </button>
                      );
                    })}
                    <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(p => p + 1)} aria-label="Next">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {/* Transaction detail modal */}
      <TransactionDetailModal transaction={selectedTxn} onClose={() => setSelected(null)} />
    </div>
  );
}

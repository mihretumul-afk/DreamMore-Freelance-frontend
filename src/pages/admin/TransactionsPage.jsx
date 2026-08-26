import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeftRight, Search, ChevronLeft, ChevronRight,
  RefreshCw, Download, Filter, X,
} from 'lucide-react';
import Card, { CardBody, CardHeader, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { PaymentStatusBadge, PaymentTypeBadge, DirectionBadge } from '../../components/payments/PaymentStatusBadge';
import TransactionDetailModal from '../../components/payments/TransactionDetailModal';
import paymentService from '../../services/paymentService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency, formatDate, timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
          </div>
          <div className="h-5 w-16 rounded bg-gray-100" />
          <div className="h-5 w-20 rounded bg-gray-200" />
          <div className="h-5 w-20 rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function TransactionsPage() {
  usePageTitle('Transactions — Admin');
  const { can } = useAdminPermissions();
  const { showToast } = useToast();

  const [txns, setTxns]         = useState([]);
  const [meta, setMeta]         = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [typeFilter, setType]     = useState('');
  const [dirFilter, setDir]       = useState('');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [page, setPage]           = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const loadTxns = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await paymentService.getAdminTransactions({
        page,
        search:    search || undefined,
        status:    statusFilter || undefined,
        type:      typeFilter || undefined,
        direction: dirFilter || undefined,
        date_from: dateFrom || undefined,
        date_to:   dateTo || undefined,
      });
      const data = res.data ?? res;
      setTxns(Array.isArray(data) ? data : data.data ?? []);
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load transactions.'));
    } finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter, dirFilter, dateFrom, dateTo]);

  useEffect(() => { if (can('transactions.view')) loadTxns(); }, [loadTxns]);
  useEffect(() => { setPage(1); }, [search, statusFilter, typeFilter, dirFilter, dateFrom, dateTo]);

  const handleExport = async () => {
    if (!can('transactions.export')) {
      showToast('You do not have permission to export transactions.', 'error'); return;
    }
    setExporting(true);
    try {
      const res = await paymentService.exportTransactions({ date_from: dateFrom || undefined, date_to: dateTo || undefined, status: statusFilter || undefined });
      const rows = res.data ?? res ?? [];
      if (!rows.length) { showToast('No transactions to export.', 'warning'); return; }
      const headers = Object.keys(rows[0]);
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g,'""')}"`).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `transactions-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${rows.length} transactions.`, 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Export failed.'), 'error');
    } finally { setExporting(false); }
  };

  if (!can('transactions.view')) {
    return (
      <EmptyState icon={ArrowLeftRight} title="Access Restricted"
        description="You do not have permission to view transactions." />
    );
  }

  const hasFilters = search || statusFilter || typeFilter || dirFilter || dateFrom || dateTo;
  const currency   = 'ETB';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Transactions</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Full double-entry ledger of all money movements on the platform.
          </p>
        </div>
        {can('transactions.export') && (
          <Button variant="outline" size="sm" loading={exporting} onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      <Card>
        <CardHeader
          title="All Transactions"
          description={`${meta.total} total`}
          action={
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowFilters(v => !v)}
                className={cn('flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
                  showFilters || hasFilters ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-gray-300 bg-white text-ink-700 hover:bg-gray-50')}>
                <Filter className="h-3.5 w-3.5" /> Filters
                {hasFilters && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {[search,statusFilter,typeFilter,dirFilter,dateFrom,dateTo].filter(Boolean).length}
                </span>}
              </button>
              <button type="button" onClick={loadTxns}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>
          }
        />

        {showFilters && (
          <div className="border-b border-gray-100 px-5 py-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="search" placeholder="Reference, description, user…" value={search} onChange={e => setSearch(e.target.value)}
                  className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none" />
              </div>
              <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none">
                <option value="">All statuses</option>
                {['pending','processing','completed','failed','refunded','cancelled'].map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={e => setType(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none">
                <option value="">All types</option>
                <option value="escrow_funded">Escrow Funded</option>
                <option value="milestone_released">Milestone Released</option>
                <option value="refund">Refund</option>
              </select>
              <select value={dirFilter} onChange={e => setDir(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none">
                <option value="">Both directions</option>
                <option value="credit">Credits</option>
                <option value="debit">Debits</option>
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none" />
              {hasFilters && (
                <button type="button" onClick={() => { setSearch(''); setStatus(''); setType(''); setDir(''); setDateFrom(''); setDateTo(''); }}
                  className="flex h-9 items-center gap-1.5 rounded-input border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:text-danger-600">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {error ? (
          <CardBody><ErrorState title="Failed to load" description={error} onRetry={loadTxns} /></CardBody>
        ) : loading ? <TableSkeleton /> : txns.length === 0 ? (
          <CardBody>
            <EmptyState icon={ArrowLeftRight} title={hasFilters ? 'No results' : 'No transactions yet'}
              description={hasFilters ? 'Try clearing filters.' : 'Transactions will appear here as payments are made.'} />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {['Reference','User','Type','Direction','Amount','Status','When'].map(h => (
                      <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {txns.map(t => {
                    const isCredit = t.direction === 'credit';
                    return (
                      <tr key={t.id}
                        className="group cursor-pointer hover:bg-gray-50/60"
                        onClick={() => {
                          paymentService.getAdminTransaction(t.id)
                            .then(r => setSelected(r.data ?? r))
                            .catch(() => setSelected(t));
                        }}
                        role="button" tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && setSelected(t)}
                      >
                        <td className="px-5 py-3">
                          <p className="font-mono text-xs font-semibold text-ink-800">{t.reference}</p>
                          <p className="text-[10px] text-gray-400">{t.payment?.reference ?? '—'}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-ink-900">{t.user?.name ?? '—'}</p>
                          <p className="text-xs text-gray-400">{t.user?.email}</p>
                        </td>
                        <td className="px-5 py-3"><PaymentTypeBadge type={t.type} size="xs" /></td>
                        <td className="px-5 py-3"><DirectionBadge direction={t.direction} size="xs" /></td>
                        <td className="px-5 py-3">
                          <span className={cn('font-bold text-sm', isCredit ? 'text-success-600' : 'text-danger-600')}>
                            {isCredit ? '+' : '−'}{formatCurrency(t.amount, t.currency ?? currency)}
                          </span>
                        </td>
                        <td className="px-5 py-3"><PaymentStatusBadge status={t.status} size="xs" /></td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-400" title={formatDate(t.created_at)}>
                          {timeAgo(t.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {meta.last_page > 1 && (
              <CardFooter>
                <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500">
                  <span>Page {meta.current_page} of {meta.last_page} · {meta.total} total</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={meta.current_page<=1} onClick={() => setPage(p=>p-1)}><ChevronLeft className="h-4 w-4"/></Button>
                    <Button variant="outline" size="sm" disabled={meta.current_page>=meta.last_page} onClick={() => setPage(p=>p+1)}><ChevronRight className="h-4 w-4"/></Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>

      <TransactionDetailModal transaction={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

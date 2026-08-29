import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ScrollText, Search, ChevronLeft, ChevronRight, RefreshCw,
  UserPlus, Shield, Key, UserX, UserCheck, Trash2, Edit2,
  AlertTriangle, Settings, CreditCard, FileCheck, FileX,
  MessageSquare, Download, X, Eye, SlidersHorizontal,
  Calendar, User, Filter,
} from 'lucide-react';
import Card, { CardBody, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { rbacService } from '../../services/rbacService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';

// ── Action registry ───────────────────────────────────────────────────────────
// Maps action slugs → human label, badge tone, icon, and module bucket.
const ACTION_REGISTRY = {
  // Admins
  'admin.created':          { label: 'Admin Created',            tone: 'success', icon: UserPlus,    module: 'admins' },
  'admin.deactivated':      { label: 'Admin Deactivated',        tone: 'danger',  icon: UserX,       module: 'admins' },
  'admin.activated':        { label: 'Admin Activated',          tone: 'success', icon: UserCheck,   module: 'admins' },
  'admin.deleted':          { label: 'Admin Deleted',            tone: 'danger',  icon: Trash2,      module: 'admins' },
  'admin.email_changed':    { label: 'Email Changed',            tone: 'warning', icon: Edit2,       module: 'admins' },
  'admin.password_changed': { label: 'Password Changed',         tone: 'warning', icon: Key,         module: 'admins' },
  // Roles
  'role.created':           { label: 'Role Created',             tone: 'info',    icon: Shield,      module: 'roles' },
  'role.updated':           { label: 'Role Updated',             tone: 'info',    icon: Edit2,       module: 'roles' },
  'role.deleted':           { label: 'Role Deleted',             tone: 'danger',  icon: Trash2,      module: 'roles' },
  'role.assigned':          { label: 'Role Assigned',            tone: 'primary', icon: Shield,      module: 'roles' },
  'role.revoked':           { label: 'Role Revoked',             tone: 'warning', icon: Shield,      module: 'roles' },
  // Permissions
  'permission.added':       { label: 'Permission Added',         tone: 'success', icon: Key,         module: 'permissions' },
  'permission.removed':     { label: 'Permission Removed',       tone: 'danger',  icon: Key,         module: 'permissions' },
  'permission.changed':     { label: 'Permissions Changed',      tone: 'warning', icon: Key,         module: 'permissions' },
  // Users
  'user.suspended':         { label: 'User Suspended',           tone: 'danger',  icon: UserX,       module: 'users' },
  'user.activated':         { label: 'User Reactivated',         tone: 'success', icon: UserCheck,   module: 'users' },
  'user.role_changed':      { label: 'User Role Changed',        tone: 'warning', icon: Edit2,       module: 'users' },
  'user.deleted':           { label: 'User Deleted',             tone: 'danger',  icon: Trash2,      module: 'users' },
  // Verifications
  'verification.approved':  { label: 'Verification Approved',    tone: 'success', icon: FileCheck,   module: 'verifications' },
  'verification.rejected':  { label: 'Verification Rejected',    tone: 'danger',  icon: FileX,       module: 'verifications' },
  'credential.approved':    { label: 'Credential Approved',      tone: 'success', icon: FileCheck,   module: 'verifications' },
  'credential.rejected':    { label: 'Credential Rejected',      tone: 'danger',  icon: FileX,       module: 'verifications' },
  // Disputes
  'dispute.resolved':       { label: 'Dispute Resolved',         tone: 'success', icon: MessageSquare, module: 'disputes' },
  'dispute.dismissed':      { label: 'Dispute Dismissed',        tone: 'neutral', icon: MessageSquare, module: 'disputes' },
  'dispute.deleted':        { label: 'Dispute Deleted',          tone: 'danger',  icon: Trash2,      module: 'disputes' },
  // Settings
  'settings.changed':       { label: 'Settings Changed',         tone: 'warning', icon: Settings,    module: 'settings' },

};

const MODULE_LABELS = {
  admins:        'Administrators',
  roles:         'Roles',
  permissions:   'Permissions',
  users:         'Users',
  verifications: 'Verifications',
  disputes:      'Disputes',
  settings:      'Settings',
};

// Group actions by module for the action dropdown
const ACTIONS_BY_MODULE = Object.entries(ACTION_REGISTRY).reduce((acc, [slug, meta]) => {
  if (!acc[meta.module]) acc[meta.module] = [];
  acc[meta.module].push({ slug, label: meta.label });
  return acc;
}, {});

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-gray-100">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/3 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
          </div>
          <div className="h-5 w-28 rounded-full bg-gray-200" />
          <div className="h-4 w-20 rounded bg-gray-100" />
          <div className="h-8 w-8 rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

// ── Context key-value renderer ────────────────────────────────────────────────
const CONTEXT_LABELS = {
  old_status: 'Old Status', new_status: 'New Status',
  old_role: 'Old Role', new_role: 'New Role',
  old_roles: 'Old Roles', new_roles: 'New Roles',
  old_permissions: 'Old Permissions', new_permissions: 'New Permissions',
  reason: 'Reason', resolution: 'Resolution',
  permission: 'Permission', role_slug: 'Role', role_id: 'Role ID',
  credential_title: 'Credential', user_name: 'User', user_id: 'User ID',
  contract_action: 'Contract Action', changed: 'Changed Settings',
  old: 'Previous Values', name: 'Name', email: 'Email',
  type: 'Type', target_type: 'Target Type', target_id: 'Target ID',
  amount: 'Amount', admin_role: 'Initial Role',
};

function ContextValue({ v }) {
  if (v === null || v === undefined) return <span className="text-gray-400">—</span>;
  if (typeof v === 'boolean') return <span>{v ? 'Yes' : 'No'}</span>;
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="text-gray-400">none</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {v.map((item, i) => (
          <span key={i} className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[10px] text-gray-600">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof v === 'object') {
    return (
      <div className="space-y-1">
        {Object.entries(v).slice(0, 5).map(([k, val]) => (
          <div key={k} className="flex gap-1.5 text-xs">
            <span className="shrink-0 font-semibold text-gray-500">{CONTEXT_LABELS[k] ?? k}:</span>
            <span className="truncate text-gray-700">{String(val)}</span>
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(v)}</span>;
}

// ── Details Modal ─────────────────────────────────────────────────────────────
function AuditLogDetailModal({ log, onClose }) {
  if (!log) return null;
  const meta = ACTION_REGISTRY[log.action] ?? { label: log.action, tone: 'neutral', icon: ScrollText };
  const Icon = meta.icon;
  const ctx = log.context ?? {};

  return (
    <Modal open={!!log} onClose={onClose} title="Audit Log Detail" size="lg">
      <div className="space-y-5">
        {/* Description banner */}
        {log.description && (
          <div className="rounded-xl border border-ink-100 bg-ink-50 p-4">
            <p className="text-sm font-semibold text-ink-900">{log.description}</p>
          </div>
        )}

        {/* Action + module */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <Icon className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={meta.tone}>{meta.label}</Badge>
              {log.module && (
                <Badge tone="neutral" size="xs">{MODULE_LABELS[log.module] ?? log.module}</Badge>
              )}
            </div>
            <p className="mt-0.5 font-mono text-xs text-gray-400">{log.action}</p>
          </div>
        </div>

        {/* Core fields */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: 'Log ID',      value: `#${log.id}` },
            { label: 'Timestamp',   value: formatDate(log.created_at) + ' · ' + (timeAgo(log.created_at) ?? '') },
            { label: 'Actor',       value: log.actor ? `${log.actor.name} (${log.actor.email})` : 'System' },
            { label: 'Actor Role',  value: log.actor?.role ?? '—' },
            { label: 'Subject',     value: log.subject_type ? `${log.subject_type} #${log.subject_id}` : '—' },
            { label: 'IP Address',  value: log.ip_address ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-ink-900">{value}</p>
            </div>
          ))}
        </div>

        {/* Context JSON */}
        {Object.keys(ctx).length > 0 && (
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-400">Context Data</p>
            <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              {Object.entries(ctx).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3">
                  <span className="min-w-32 shrink-0 text-xs font-semibold text-gray-500">
                    {CONTEXT_LABELS[k] ?? k}
                  </span>
                  <div className="flex-1 text-xs text-gray-700">
                    <ContextValue v={v} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User agent */}
        {log.user_agent && (
          <p className="truncate text-[10px] text-gray-300" title={log.user_agent}>
            UA: {log.user_agent}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AuditLogsPage() {
  usePageTitle('Audit Logs — Admin');
  const { can } = useAdminPermissions();

  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 25 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch]           = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actorSearch, setActorSearch]   = useState('');
  const [dateFrom, setDateFrom]         = useState('');
  const [dateTo, setDateTo]             = useState('');
  const [page, setPage]                 = useState(1);

  // Debounce search
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = {
        page,
        action:    actionFilter  || undefined,
        module:    moduleFilter  || undefined,
        date_from: dateFrom      || undefined,
        date_to:   dateTo        || undefined,
      };
      const res = await rbacService.getAuditLogs(params);
      const data = res.data ?? res;
      setLogs(Array.isArray(data) ? data : (data.data ?? []));
      if (res.meta) setMeta(res.meta);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load audit logs.'));
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, moduleFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [actionFilter, moduleFilter, dateFrom, dateTo, debouncedSearch]);

  const clearFilters = () => {
    setSearch(''); setActionFilter(''); setModuleFilter('');
    setActorSearch(''); setDateFrom(''); setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = actionFilter || moduleFilter || dateFrom || dateTo || search || actorSearch;

  if (!can('audit_logs.view')) {
    return (
      <EmptyState
        icon={ScrollText}
        title="Access Restricted"
        description="You do not have permission to view audit logs."
      />
    );
  }

  // Client-side filter by actor name / description search (for instant feel)
  const displayed = debouncedSearch || actorSearch
    ? logs.filter((l) => {
        const q = debouncedSearch.toLowerCase();
        const a = actorSearch.toLowerCase();
        const matchDesc = q ? (l.description ?? '').toLowerCase().includes(q) || l.action.includes(q) : true;
        const matchActor = a ? (l.actor?.name ?? '').toLowerCase().includes(a) || (l.actor?.email ?? '').toLowerCase().includes(a) : true;
        return matchDesc && matchActor;
      })
    : logs;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Audit Logs</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Immutable, append-only record of every security-sensitive action on the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors',
              showFilters || hasActiveFilters
                ? 'border-brand-300 bg-brand-50 text-brand-700'
                : 'border-gray-300 bg-white text-ink-700 hover:bg-gray-50',
            )}
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {[actionFilter, moduleFilter, dateFrom, dateTo, search, actorSearch].filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={load}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm text-ink-700 hover:bg-gray-50"
            aria-label="Refresh audit logs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardBody className="space-y-3 py-4">
            <div className="flex flex-wrap gap-3">
              {/* Full-text / description search */}
              <div className="relative min-w-48 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search description or action…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Actor search */}
              <div className="relative min-w-44">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Filter by actor…"
                  value={actorSearch}
                  onChange={(e) => setActorSearch(e.target.value)}
                  className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Module filter */}
              <select
                value={moduleFilter}
                onChange={(e) => { setModuleFilter(e.target.value); setActionFilter(''); }}
                className="h-9 min-w-40 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                aria-label="Filter by module"
              >
                <option value="">All modules</option>
                {Object.entries(MODULE_LABELS).map(([slug, label]) => (
                  <option key={slug} value={slug}>{label}</option>
                ))}
              </select>

              {/* Action filter — scoped to selected module */}
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="h-9 min-w-48 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                aria-label="Filter by action"
              >
                <option value="">All actions</option>
                {(moduleFilter
                  ? ACTIONS_BY_MODULE[moduleFilter] ?? []
                  : Object.entries(ACTION_REGISTRY).map(([slug, m]) => ({ slug, label: m.label }))
                ).map(({ slug, label }) => (
                  <option key={slug} value={slug}>{label}</option>
                ))}
              </select>

              {/* Date range */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={dateTo || undefined}
                    className="h-9 rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                    aria-label="From date"
                  />
                </div>
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
                  aria-label="To date"
                />
              </div>

              {/* Clear */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-9 items-center gap-1.5 rounded-input border border-gray-200 bg-white px-3 text-sm text-gray-500 hover:bg-gray-50 hover:text-danger-600"
                >
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
        {loading ? (
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
        ) : (
          <>
            <span>
              Showing <strong className="text-ink-900">{displayed.length}</strong>
              {meta.total > 0 && <> of <strong className="text-ink-900">{meta.total}</strong></>} entries
            </span>
            {hasActiveFilters && (
              <Badge tone="primary" size="xs">Filtered</Badge>
            )}
          </>
        )}
      </div>

      {/* Table */}
      <Card>
        {error ? (
          <CardBody>
            <ErrorState title="Failed to load audit logs" description={error} onRetry={load} />
          </CardBody>
        ) : loading ? (
          <TableSkeleton />
        ) : displayed.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={ScrollText}
              title={hasActiveFilters ? 'No logs match your filters' : 'No audit logs yet'}
              description={
                hasActiveFilters
                  ? 'Try adjusting the filters or clearing them to see all entries.'
                  : 'RBAC actions will be recorded here as they occur.'
              }
              action={
                hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4" /> Clear Filters
                  </Button>
                ) : null
              }
            />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto" role="region" aria-label="Audit log table">
              <table className="w-full text-sm" aria-label="Audit logs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {['Action', 'Description', 'Actor', 'When', ''].map((h) => (
                      <th
                        key={h}
                        scope="col"
                        className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayed.map((log) => {
                    const m = ACTION_REGISTRY[log.action] ?? { label: log.action, tone: 'neutral', icon: ScrollText };
                    const Icon = m.icon;
                    return (
                      <tr
                        key={log.id}
                        className="group cursor-pointer hover:bg-gray-50/60"
                        onClick={() => setSelectedLog(log)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View details for ${m.label}`}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedLog(log)}
                      >
                        {/* Action */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                              <Icon className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
                            </div>
                            <div>
                              <Badge tone={m.tone} size="xs">{m.label}</Badge>
                              {log.module && (
                                <p className="mt-0.5 text-[10px] text-gray-400">{MODULE_LABELS[log.module] ?? log.module}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Human-readable description */}
                        <td className="max-w-xs px-5 py-3">
                          {log.description ? (
                            <p className="truncate text-sm text-ink-800" title={log.description}>
                              {log.description}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">
                              {log.subject_type
                                ? `${log.subject_type} #${log.subject_id}`
                                : '—'}
                            </p>
                          )}
                        </td>

                        {/* Actor */}
                        <td className="px-5 py-3">
                          {log.actor ? (
                            <div>
                              <p className="text-sm font-semibold text-ink-900">{log.actor.name}</p>
                              <p className="text-xs text-gray-400">{log.actor.email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">System</span>
                          )}
                        </td>

                        {/* When */}
                        <td className="whitespace-nowrap px-5 py-3">
                          <span
                            className="text-xs text-gray-400"
                            title={formatDate(log.created_at)}
                          >
                            {timeAgo(log.created_at)}
                          </span>
                        </td>

                        {/* View button */}
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            aria-label="View log details"
                            className="rounded-lg p-1.5 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-100 hover:text-ink-900"
                            onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
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
                  <span>
                    Page {meta.current_page} of {meta.last_page} · {meta.total} total entries
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm"
                      disabled={meta.current_page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* Page numbers (show ±2 around current) */}
                    {Array.from({ length: meta.last_page }, (_, i) => i + 1)
                      .filter((p) => Math.abs(p - meta.current_page) <= 2)
                      .map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPage(p)}
                          aria-current={p === meta.current_page ? 'page' : undefined}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                            p === meta.current_page
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-gray-300 bg-white text-ink-700 hover:bg-gray-50',
                          )}
                        >
                          {p}
                        </button>
                      ))}

                    <Button
                      variant="outline" size="sm"
                      disabled={meta.current_page >= meta.last_page}
                      onClick={() => setPage((p) => p + 1)}
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {/* Detail modal */}
      <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

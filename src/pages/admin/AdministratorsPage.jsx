import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCog, Plus, Search, ChevronLeft, ChevronRight,
  MoreHorizontal, Shield, CheckCircle, XCircle, Trash2,
  Eye, UserCheck, RefreshCw,
} from 'lucide-react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { rbacService } from '../../services/rbacService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';

const statusTone = { active: 'success', suspended: 'danger', pending_verification: 'warning' };

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-0 divide-y divide-gray-100">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-full bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-40 rounded bg-gray-200" />
            <div className="h-3 w-56 rounded bg-gray-200" />
          </div>
          <div className="h-6 w-24 rounded-full bg-gray-200" />
          <div className="h-6 w-16 rounded-full bg-gray-200" />
          <div className="h-8 w-8 rounded-lg bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export default function AdministratorsPage() {
  usePageTitle('Administrators — Admin');
  const { user: currentUser } = useAuth();
  const { can, isSuperAdmin } = useAdminPermissions();
  const { showToast } = useToast();

  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(null); // admin object
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Create form
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', admin_role: '' });
  const [createErrors, setCreateErrors] = useState({});

  // Assign roles form
  const [selectedRoles, setSelectedRoles] = useState([]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [adminsRes, rolesRes] = await Promise.all([
        rbacService.getAdmins({ page, search: search || undefined, status: statusFilter || undefined, admin_role: roleFilter || undefined }),
        rbacService.getRoles(),
      ]);
      const adminsData = adminsRes.data ?? adminsRes;
      setAdmins(Array.isArray(adminsData) ? adminsData : adminsData.data ?? []);
      if (adminsRes.meta) setMeta(adminsRes.meta);
      setRoles((rolesRes.data ?? rolesRes) ?? []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load administrators.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, roleFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter, roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading(true); setCreateErrors({});
    try {
      await rbacService.createAdmin(createForm);
      showToast('Admin account created successfully.', 'success');
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', admin_role: '' });
      load();
    } catch (err) {
      const fe = getFieldErrors(err);
      if (Object.keys(fe).length) setCreateErrors(fe);
      else showToast(getErrorMessage(err, 'Failed to create admin.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirmDeactivate) return;
    setActionLoading(true);
    const activate = confirmDeactivate.status === 'suspended';
    try {
      await rbacService.toggleAdminStatus(confirmDeactivate.id, activate);
      showToast(`Admin ${activate ? 'activated' : 'deactivated'} successfully.`, 'success');
      setConfirmDeactivate(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to update status.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRoles = async () => {
    if (!assignOpen) return;
    setActionLoading(true);
    try {
      await rbacService.assignRoles(assignOpen.id, selectedRoles);
      showToast('Roles updated successfully.', 'success');
      setAssignOpen(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to assign roles.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await rbacService.deleteAdmin(confirmDelete.id);
      showToast('Admin account deleted.', 'success');
      setConfirmDelete(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete admin.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!can('admins.view')) {
    return (
      <EmptyState
        icon={UserCog}
        title="Access Restricted"
        description="You do not have permission to view administrator accounts."
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Administrators</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage admin accounts and their role assignments.
          </p>
        </div>
        {isSuperAdmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New Admin
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="py-3">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search admins…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
            >
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r.slug} value={r.slug}>{r.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={load}
              className="flex h-9 items-center gap-1.5 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-700 hover:bg-gray-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      <Card>
        {error ? (
          <CardBody><ErrorState title="Failed to load" description={error} onRetry={load} /></CardBody>
        ) : loading ? (
          <TableSkeleton />
        ) : admins.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={UserCog}
              title="No administrators found"
              description={search ? `No results for "${search}".` : 'No admin accounts have been created yet.'}
              action={isSuperAdmin ? <Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Admin</Button> : null}
            />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {['Admin', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {admins.map((admin) => {
                    const isSelf = admin.id === currentUser?.id;
                    const adminRoles = admin.admin_roles ?? [];
                    return (
                      <tr key={admin.id} className="group hover:bg-gray-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                              {(admin.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/admin/administrators/${admin.id}`}
                                  className="font-semibold text-ink-900 hover:text-brand-600"
                                >
                                  {admin.name}
                                </Link>
                                {isSelf && (
                                  <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">You</span>
                                )}
                              </div>
                              <p className="truncate text-xs text-gray-400">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {adminRoles.length === 0 ? (
                              <span className="text-xs text-gray-400">No role</span>
                            ) : adminRoles.slice(0, 2).map((r) => (
                              <Badge key={r.slug} tone={r.slug === 'super_admin' ? 'primary' : 'neutral'} size="xs">
                                {r.name}
                              </Badge>
                            ))}
                            {adminRoles.length > 2 && (
                              <Badge tone="neutral" size="xs">+{adminRoles.length - 2}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge tone={statusTone[admin.status] ?? 'neutral'} size="xs" dot>
                            {admin.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-400">
                          {formatDate(admin.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={`/admin/administrators/${admin.id}`}
                              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-ink-900"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {isSuperAdmin && !isSelf && (
                              <>
                                <button
                                  type="button"
                                  title="Assign roles"
                                  onClick={() => { setAssignOpen(admin); setSelectedRoles((admin.admin_roles ?? []).map(r => r.slug)); }}
                                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-ink-900"
                                >
                                  <Shield className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  title={admin.status === 'active' ? 'Deactivate' : 'Activate'}
                                  onClick={() => setConfirmDeactivate(admin)}
                                  className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-ink-900"
                                >
                                  {admin.status === 'active'
                                    ? <XCircle className="h-4 w-4" />
                                    : <CheckCircle className="h-4 w-4" />}
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={() => setConfirmDelete(admin)}
                                  className="rounded p-1.5 text-gray-400 hover:bg-danger-50 hover:text-danger-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
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
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Page {meta.current_page} of {meta.last_page} · {meta.total} total
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={meta.current_page <= 1} onClick={() => setPage((p) => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => setPage((p) => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </>
        )}
      </Card>

      {/* ── Create Admin Modal ─────────────────────────────────────────── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Admin Account" size="md">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full name" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} error={createErrors.name} required />
          <Input label="Email address" type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} error={createErrors.email} required />
          <Input label="Password" type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} error={createErrors.password} required hint="Min 8 characters, mixed case + numbers" />
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-900">
              Initial role <span className="text-xs text-gray-400">(optional)</span>
            </label>
            <select
              value={createForm.admin_role}
              onChange={(e) => setCreateForm((f) => ({ ...f, admin_role: e.target.value }))}
              className="h-10 w-full rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
            >
              <option value="">No initial role</option>
              {roles.filter((r) => r.slug !== 'super_admin').map((r) => (
                <option key={r.slug} value={r.slug}>{r.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">Super Admin role cannot be assigned during creation.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={actionLoading}>Create Admin</Button>
          </div>
        </form>
      </Modal>

      {/* ── Assign Roles Modal ─────────────────────────────────────────── */}
      <Modal open={!!assignOpen} onClose={() => setAssignOpen(null)} title={`Assign Roles — ${assignOpen?.name}`} size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select the roles this admin should hold. Roles determine their permissions.</p>
          <div className="space-y-2">
            {roles.map((role) => {
              const isSelected = selectedRoles.includes(role.slug);
              const isSuperAdminRole = role.slug === 'super_admin';
              return (
                <label
                  key={role.slug}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    isSelected ? 'border-brand-300 bg-brand-50' : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      setSelectedRoles((prev) =>
                        e.target.checked ? [...prev, role.slug] : prev.filter((s) => s !== role.slug),
                      );
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">{role.name}</span>
                      {role.is_system && <Badge tone="primary" size="xs">System</Badge>}
                      {isSuperAdminRole && <Badge tone="danger" size="xs">⚠ Super Admin</Badge>}
                    </div>
                    {role.description && (
                      <p className="mt-0.5 text-xs text-gray-400">{role.description}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setAssignOpen(null)}>Cancel</Button>
            <Button onClick={handleAssignRoles} loading={actionLoading}>Save Roles</Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Deactivate/Activate ────────────────────────────────── */}
      <Modal
        open={!!confirmDeactivate}
        onClose={() => setConfirmDeactivate(null)}
        title={confirmDeactivate?.status === 'active' ? 'Deactivate Admin' : 'Activate Admin'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            {confirmDeactivate?.status === 'active'
              ? `Are you sure you want to deactivate ${confirmDeactivate?.name}? They will lose access immediately.`
              : `Are you sure you want to activate ${confirmDeactivate?.name}?`}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmDeactivate(null)}>Cancel</Button>
            <Button
              variant={confirmDeactivate?.status === 'active' ? 'danger' : 'success'}
              loading={actionLoading}
              onClick={handleToggleStatus}
            >
              {confirmDeactivate?.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirm Delete ─────────────────────────────────────────────── */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Admin Account" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
            ⚠ This will permanently delete <strong>{confirmDelete?.name}</strong> and cannot be undone.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDelete}>Delete Admin</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

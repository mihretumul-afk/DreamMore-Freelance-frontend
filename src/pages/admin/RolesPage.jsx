import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Plus, Trash2, Edit2, Users, Lock, Star, Eye, ToggleLeft, ToggleRight,
} from 'lucide-react';
import Card, { CardBody, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { rbacService } from '../../services/rbacService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';
import { cn } from '../../utils/cn';

const SYSTEM_ROLE_META = {
  super_admin:   { tone: 'primary',  label: 'Super Admin',   desc: 'Unrestricted access to all platform capabilities.' },
  support_admin: { tone: 'info',     label: 'Support Admin', desc: 'Users, verifications, disputes and job moderation.' },
  finance_admin: { tone: 'success',  label: 'Finance Admin', desc: 'Payments, milestones and transaction management.' },
  dispute_admin: { tone: 'warning',  label: 'Dispute Admin', desc: 'Dispute review, resolution and escalation.' },
};

function RoleSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse rounded-card border border-gray-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="h-3 w-full rounded bg-gray-100" />
          <div className="h-3 w-3/4 rounded bg-gray-100" />
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-16 rounded bg-gray-200" />
            <div className="h-8 w-20 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function RolesPage() {
  usePageTitle('Roles — Admin');
  const { can, isSuperAdmin } = useAdminPermissions();
  const { showToast } = useToast();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await rbacService.getRoles();
      setRoles(res.data ?? res ?? []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load roles.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await rbacService.deleteRole(confirmDelete.id);
      showToast(`Role "${confirmDelete.name}" deleted.`, 'success');
      setConfirmDelete(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete role.'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (!can('roles.view')) {
    return (
      <EmptyState
        icon={Shield}
        title="Access Restricted"
        description="You do not have permission to view roles."
      />
    );
  }

  const systemRoles = roles.filter((r) => r.is_system);
  const customRoles = roles.filter((r) => !r.is_system);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Roles</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            System roles are built-in and cannot be deleted. Custom roles can be created and configured freely.
          </p>
        </div>
        {isSuperAdmin && (
          <Button as={Link} to="/admin/roles/create" size="sm">
            <Plus className="h-4 w-4" /> New Role
          </Button>
        )}
      </div>

      {error && <ErrorState title="Failed to load roles" description={error} onRetry={load} />}

      {loading ? (
        <RoleSkeleton />
      ) : (
        <div className="space-y-8">
          {/* System roles */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">System Roles</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
              {systemRoles.map((role) => {
                const meta = SYSTEM_ROLE_META[role.slug] ?? {};
                const permCount = role.permissions?.length ?? 0;
                const userCount = role.users_count ?? 0;
                return (
                  <Card key={role.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          role.slug === 'super_admin' ? 'bg-brand-500' : 'bg-ink-900',
                        )}>
                          {role.slug === 'super_admin'
                            ? <Star className="h-5 w-5 text-white" />
                            : <Shield className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-ink-900">{role.name}</h3>
                            <Badge tone="neutral" size="xs">System</Badge>
                            {!role.is_active && <Badge tone="danger" size="xs">Inactive</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {permCount} permissions · {userCount} user{userCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                      {role.description || meta.desc}
                    </p>
                    {/* Permission preview */}
                    {role.permissions && role.permissions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {role.permissions.slice(0, 6).map((p) => (
                          <span key={p.slug} className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                            {p.slug}
                          </span>
                        ))}
                        {role.permissions.length > 6 && (
                          <span className="text-[10px] text-gray-400">+{role.permissions.length - 6} more</span>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        to={`/admin/roles/${role.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gray-300 hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Link>
                      {isSuperAdmin && role.slug !== 'super_admin' && (
                        <Link
                          to={`/admin/roles/${role.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gray-300 hover:bg-gray-50"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit Permissions
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Custom roles */}
          <section>
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Custom Roles</h2>
              </div>
              {isSuperAdmin && (
                <Button as={Link} to="/admin/roles/create" variant="ghost" size="xs">
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              )}
            </div>
            {customRoles.length === 0 ? (
              <EmptyState
                icon={Shield}
                title="No custom roles yet"
                description="Create custom roles to give specific sets of permissions to admins."
                action={isSuperAdmin ? (
                  <Button as={Link} to="/admin/roles/create" size="sm">
                    <Plus className="h-4 w-4" /> Create Role
                  </Button>
                ) : null}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {customRoles.map((role) => {
                  const permCount = role.permissions?.length ?? 0;
                  const userCount = role.users_count ?? 0;
                  return (
                    <Card key={role.id} className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-ink-900 truncate">{role.name}</h3>
                            <Badge tone="primary" size="xs">Custom</Badge>
                            {!role.is_active && <Badge tone="danger" size="xs">Inactive</Badge>}
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {permCount} permissions · {userCount} user{userCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      {role.description && (
                        <p className="mt-2 text-sm text-gray-500 line-clamp-2">{role.description}</p>
                      )}
                      {role.permissions && role.permissions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {role.permissions.slice(0, 4).map((p) => (
                            <span key={p.slug} className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">
                              {p.slug}
                            </span>
                          ))}
                          {role.permissions.length > 4 && (
                            <span className="text-[10px] text-gray-400">+{role.permissions.length - 4} more</span>
                          )}
                        </div>
                      )}
                      <div className="mt-4 flex items-center gap-2">
                        <Link
                          to={`/admin/roles/${role.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-gray-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Link>
                        {isSuperAdmin && (
                          <>
                            <Link
                              to={`/admin/roles/${role.id}/edit`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-gray-50"
                            >
                              <Edit2 className="h-3.5 w-3.5" /> Edit
                            </Link>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(role)}
                              className="ml-auto rounded-lg p-1.5 text-gray-300 hover:bg-danger-50 hover:text-danger-500"
                              title="Delete role"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Confirm delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Role" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
            ⚠ Deleting <strong>{confirmDelete?.name}</strong> will remove it from all assigned users. This cannot be undone.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" loading={actionLoading} onClick={handleDelete}>Delete Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

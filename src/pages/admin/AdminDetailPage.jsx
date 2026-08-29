import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, UserCog, Shield, Key, Mail, Clock, CheckCircle, XCircle,
  Calendar,
} from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ErrorState from '../../components/common/ErrorState';
import { rbacService } from '../../services/rbacService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';

const statusTone = { active: 'success', suspended: 'danger', pending_verification: 'warning' };

const GROUP_LABELS = {
  users: 'Users', jobs: 'Jobs', disputes: 'Disputes', admins: 'Administrators',
  roles: 'Roles', audit: 'Audit Logs', settings: 'Settings',
};

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-gray-200" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 h-72 rounded-card border border-gray-200 bg-white" />
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 rounded-card border border-gray-200 bg-white" />
          <div className="h-64 rounded-card border border-gray-200 bg-white" />
        </div>
      </div>
    </div>
  );
}

export default function AdminDetailPage() {
  const { id } = useParams();
  usePageTitle('Admin Detail — Admin');
  const { can, isSuperAdmin } = useAdminPermissions();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await rbacService.getAdminById(id);
      setAdmin(res.data ?? res);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load admin details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton />;
  if (error || !admin) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  const adminRoles = admin.admin_roles ?? [];
  const allPermissions = admin.all_permissions ?? [];
  const isSuperAdminUser = admin.is_super_admin || adminRoles.some((r) => r.slug === 'super_admin');

  // Group permissions
  const grouped = allPermissions.reduce((acc, slug) => {
    const group = slug.split('.')[0];
    if (!acc[group]) acc[group] = [];
    acc[group].push(slug);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/administrators"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-ink-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight text-ink-900">{admin.name}</h1>
          <p className="text-sm text-gray-400">{admin.email}</p>
        </div>
        {isSuperAdmin && (
          <Link to="/admin/administrators">
            <Button variant="outline" size="sm">
              Back to Admins
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Profile card */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="p-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-2xl font-bold text-white">
              {(admin.name || '?').charAt(0).toUpperCase()}
            </div>
            <h2 className="mt-3 text-lg font-bold text-ink-900">{admin.name}</h2>
            <p className="text-sm text-gray-400">{admin.email}</p>
            <div className="mt-3 flex justify-center">
              <Badge tone={statusTone[admin.status] ?? 'neutral'} dot>
                {admin.status}
              </Badge>
            </div>
            {isSuperAdminUser && (
              <div className="mt-2 flex justify-center">
                <Badge tone="primary">Super Admin</Badge>
              </div>
            )}
            <div className="mt-4 space-y-2 text-left text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Joined {formatDate(admin.created_at)}
              </div>
              {admin.last_login_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  Last login {formatDate(admin.last_login_at)}
                </div>
              )}
            </div>
          </Card>

          {/* Assigned roles */}
          <Card>
            <CardHeader title="Assigned Roles" />
            <CardBody className="space-y-2 py-3">
              {adminRoles.length === 0 ? (
                <p className="text-sm text-gray-400">No roles assigned.</p>
              ) : adminRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{role.name}</p>
                    <p className="text-xs text-gray-400">{role.slug}</p>
                  </div>
                  <div className="flex gap-1">
                    {role.is_system && <Badge tone="neutral" size="xs">System</Badge>}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Right: Permissions */}
        <div className="space-y-6 lg:col-span-2">
          {/* Effective permissions */}
          <Card>
            <CardHeader
              title="Effective Permissions"
              description={`${allPermissions.length} permission${allPermissions.length !== 1 ? 's' : ''} across all assigned roles`}
            />
            <CardBody className="space-y-3">
              {isSuperAdminUser ? (
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
                  ⭐ Super Admin — this account has access to every platform capability.
                </div>
              ) : allPermissions.length === 0 ? (
                <p className="text-sm text-gray-400">No permissions currently granted.</p>
              ) : Object.entries(grouped).map(([group, slugs]) => (
                <div key={group}>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-widest text-gray-400">
                    {GROUP_LABELS[group] ?? group}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {slugs.map((s) => (
                      <span
                        key={s}
                        className="rounded border border-success-200 bg-success-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-success-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Role detail summary */}
          {adminRoles.length > 0 && (
            <Card>
              <CardHeader title="Role Details" />
              <CardBody className="space-y-4 py-4">
                {adminRoles.map((role) => (
                  <div key={role.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-ink-900">{role.name}</h4>
                          {role.is_system && <Badge tone="neutral" size="xs">System</Badge>}
                        </div>
                        {role.description && (
                          <p className="mt-0.5 text-sm text-gray-500">{role.description}</p>
                        )}
                      </div>
                      {can('roles.view') && (
                        <Link
                          to={`/admin/roles/${role.id}`}
                          className="shrink-0 text-xs font-semibold text-brand-600 hover:text-brand-700"
                        >
                          View role →
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

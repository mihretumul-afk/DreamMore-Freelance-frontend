import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Filter, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'employer', label: 'Employer' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const ROLE_BADGE_TONE = {
  admin: 'danger',
  employer: 'info',
  freelancer: 'primary',
};

export default function AdminUsersPage() {
  usePageTitle('Manage Users — Admin');
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Toggle modal
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const response = await adminService.getUsers(params);
      const payload = response.data ?? response;
      setUsers(Array.isArray(payload) ? payload : (payload.data ?? []));
      setMeta(response.meta ?? payload.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load users.'));
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await adminService.toggleUserStatus(toggleTarget.id, !toggleTarget.is_active);
      showToast(`User ${toggleTarget.is_active !== false ? 'deactivated' : 'activated'} successfully.`, 'success');
      setToggleTarget(null);
      loadUsers();
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to change user status.'), 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteUser(deleteTarget.id);
      showToast(`User ${deleteTarget.name} deleted successfully.`, 'success');
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to delete user.'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-slate-100">Manage Users</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          View, search, and manage all platform users. {meta.total} total users.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <form onSubmit={handleSearch} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="outline" size="md">
              <Filter className="h-4 w-4" /> Search
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Users table */}
      {error ? (
        <ErrorState title="Unable to load users" description={error} onRetry={loadUsers} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-card border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="No users match your current filters."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Role
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 md:table-cell">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3">
                        <Link
                          to={`/admin/users/${u.id}`}
                          className="text-sm font-bold text-ink-900 hover:text-brand-600 dark:text-slate-100 dark:hover:text-brand-400"
                        >
                          {u.name}
                        </Link>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{u.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={ROLE_BADGE_TONE[u.role] || 'neutral'} size="xs">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          tone={u.is_active !== false ? 'success' : 'danger'}
                          size="xs"
                          dot
                        >
                          {u.is_active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="hidden px-5 py-3 text-xs text-gray-500 dark:text-slate-400 md:table-cell">
                        {formatDate(u.created_at ?? u.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            as={Link}
                            to={`/admin/users/${u.id}`}
                            variant="ghost"
                            size="xs"
                          >
                            View
                          </Button>
                          {!isSelf && (
                            <>
                              <Button
                                variant={u.is_active !== false ? 'outline' : 'success'}
                                size="xs"
                                onClick={() => setToggleTarget(u)}
                              >
                                {u.is_active !== false ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="danger"
                                size="xs"
                                onClick={() => setDeleteTarget(u)}
                                title="Delete user"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </Button>
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Page {meta.current_page} of {meta.last_page}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm toggle modal */}
      <Modal
        open={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.is_active !== false ? 'Deactivate User' : 'Activate User'}
        description={
          toggleTarget?.is_active !== false
            ? `This will prevent ${toggleTarget?.name} from accessing the platform. They can be reactivated later.`
            : `This will restore ${toggleTarget?.name}'s access to the platform.`
        }
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setToggleTarget(null)}>
            Cancel
          </Button>
          <Button
            variant={toggleTarget?.is_active !== false ? 'danger' : 'success'}
            size="sm"
            loading={toggling}
            onClick={handleToggle}
          >
            {toggleTarget?.is_active !== false ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </Modal>

      {/* Confirm delete user modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete User"
        description={`Are you sure you want to permanently delete "${deleteTarget?.name}" (${deleteTarget?.email})? This action cannot be undone.`}
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
          >
            Delete User
          </Button>
        </div>
      </Modal>
    </div>
  );
}

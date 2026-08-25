import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Shield, Search, CheckSquare, Square, ChevronDown, ChevronRight, Save, ArrowLeft,
} from 'lucide-react';
import Card, { CardHeader, CardBody, CardFooter } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { rbacService } from '../../services/rbacService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { cn } from '../../utils/cn';

const GROUP_LABELS = {
  users:        'Users',
  jobs:         'Jobs',
  payments:     'Payments',
  milestones:   'Milestones',
  transactions: 'Transactions',
  disputes:     'Disputes',
  admins:       'Administrators',
  roles:        'Roles',
  audit:        'Audit Logs',
  settings:     'Settings',
};

const GROUP_ORDER = ['users','jobs','payments','milestones','transactions','disputes','admins','roles','audit','settings'];

export default function RoleFormPage() {
  const { id } = useParams(); // undefined = create mode
  const isEdit = Boolean(id);
  usePageTitle(isEdit ? 'Edit Role — Admin' : 'Create Role — Admin');

  const navigate = useNavigate();
  const { isSuperAdmin } = useAdminPermissions();
  const { showToast } = useToast();

  const [role, setRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [permSearch, setPermSearch] = useState('');
  const [openGroups, setOpenGroups] = useState(new Set(GROUP_ORDER));
  const [formErrors, setFormErrors] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [permsRes, roleRes] = await Promise.all([
        rbacService.getPermissions(),
        isEdit ? rbacService.getRoleById(id) : Promise.resolve(null),
      ]);
      const permsData = permsRes.data ?? permsRes;
      setAllPermissions(permsData.grouped ?? {});

      if (roleRes) {
        const r = roleRes.data ?? roleRes;
        setRole(r);
        setName(r.name ?? '');
        setSlug(r.slug ?? '');
        setDescription(r.description ?? '');
        setSelected(new Set((r.permissions ?? []).map((p) => p.slug)));
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load role data.'));
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => { load(); }, [load]);

  if (!isSuperAdmin) {
    return <EmptyState icon={Shield} title="Access Restricted" description="Only Super Admin can create or edit roles." />;
  }

  const isSystemRole = role?.is_system && role?.slug === 'super_admin';

  // Auto-generate slug from name (create mode only)
  const handleNameChange = (v) => {
    setName(v);
    if (!isEdit) setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''));
  };

  const togglePerm = (slug) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const toggleGroup = (group) => {
    const groupPerms = (allPermissions[group] ?? []).map((p) => p.slug);
    const allSelected = groupPerms.every((s) => selected.has(s));
    setSelected((prev) => {
      const next = new Set(prev);
      groupPerms.forEach((s) => (allSelected ? next.delete(s) : next.add(s)));
      return next;
    });
  };

  const selectAll = () => {
    const all = Object.values(allPermissions).flat().map((p) => p.slug);
    setSelected(new Set(all));
  };

  const clearAll = () => setSelected(new Set());

  const hasSensitivePerms = ['admins.create', 'admins.deactivate', 'roles.delete'].some((s) => selected.has(s));

  const doSave = async () => {
    setFormErrors({});
    setSaving(true);
    try {
      const payload = {
        name,
        slug,
        description: description || undefined,
        permissions: [...selected],
      };
      if (isEdit) {
        await rbacService.updateRole(id, { name, description });
        await rbacService.syncRolePermissions(id, [...selected]);
        showToast('Role updated successfully.', 'success');
      } else {
        await rbacService.createRole(payload);
        showToast('Role created successfully.', 'success');
      }
      navigate('/admin/roles');
    } catch (err) {
      const fe = getFieldErrors(err);
      if (Object.keys(fe).length) setFormErrors(fe);
      else showToast(getErrorMessage(err, 'Failed to save role.'), 'error');
    } finally {
      setSaving(false);
      setConfirmSave(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasSensitivePerms) {
      setConfirmSave(true);
    } else {
      doSave();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="h-64 rounded-card border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error) return <ErrorState title="Failed to load" description={error} onRetry={load} />;

  // Filter permissions by search
  const filteredGroups = {};
  GROUP_ORDER.forEach((g) => {
    const perms = (allPermissions[g] ?? []).filter(
      (p) => !permSearch || p.slug.includes(permSearch.toLowerCase()) || (p.name ?? '').toLowerCase().includes(permSearch.toLowerCase()),
    );
    if (perms.length) filteredGroups[g] = perms;
  });

  const totalSelected = selected.size;
  const totalPerms = Object.values(allPermissions).flat().length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/admin/roles')}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-ink-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">
            {isEdit ? `Edit Role: ${role?.name}` : 'Create Custom Role'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEdit ? 'Update this role\'s name and permission assignments.' : 'Define a new custom role and configure its permissions.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role details */}
        <Card>
          <CardHeader title="Role Details" />
          <CardBody className="space-y-4">
            <Input
              label="Role name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={formErrors.name}
              disabled={role?.is_system}
              required
            />
            <Input
              label="Slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              error={formErrors.slug}
              disabled={isEdit}
              hint={isEdit ? 'Slug cannot be changed after creation.' : 'Auto-generated from name. Lowercase, underscores only.'}
              required
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-900">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                disabled={role?.is_system}
                className="w-full rounded-input border border-gray-300 px-3 py-2 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="What is this role responsible for?"
              />
            </div>
            {role?.is_system && role?.slug !== 'super_admin' && (
              <div className="rounded-lg border border-info-200 bg-info-50 px-4 py-3 text-sm text-info-800">
                ℹ System role names and descriptions cannot be changed. You can only modify its permissions.
              </div>
            )}
          </CardBody>
        </Card>

        {/* Permission matrix */}
        <Card>
          <CardHeader
            title="Permissions"
            description={`${totalSelected} of ${totalPerms} permissions selected`}
            action={
              <div className="flex items-center gap-2">
                {!isSystemRole && (
                  <>
                    <button type="button" onClick={selectAll} className="text-xs font-semibold text-brand-600 hover:text-brand-700">Select All</button>
                    <span className="text-gray-300">·</span>
                    <button type="button" onClick={clearAll} className="text-xs font-semibold text-gray-500 hover:text-ink-900">Clear</button>
                  </>
                )}
              </div>
            }
          />
          <CardBody className="space-y-4">
            {/* Permission search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search permissions…"
                value={permSearch}
                onChange={(e) => setPermSearch(e.target.value)}
                className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {/* Groups */}
            {Object.entries(filteredGroups).map(([group, perms]) => {
              const groupSelected = perms.filter((p) => selected.has(p.slug)).length;
              const allGroupSelected = groupSelected === perms.length;
              const isOpen = openGroups.has(group);

              return (
                <div key={group} className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Group header */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenGroups((prev) => {
                        const next = new Set(prev);
                        isOpen ? next.delete(group) : next.add(group);
                        return next;
                      });
                    }}
                    className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      {!isSystemRole && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleGroup(group); }}
                          className="text-gray-400 hover:text-brand-600"
                          aria-label={allGroupSelected ? 'Deselect all' : 'Select all'}
                        >
                          {allGroupSelected
                            ? <CheckSquare className="h-4 w-4 text-brand-600" />
                            : <Square className="h-4 w-4" />}
                        </button>
                      )}
                      <span className="text-sm font-bold text-ink-900">
                        {GROUP_LABELS[group] ?? group}
                      </span>
                      <Badge tone={groupSelected > 0 ? 'primary' : 'neutral'} size="xs">
                        {groupSelected}/{perms.length}
                      </Badge>
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </button>

                  {/* Permission rows */}
                  {isOpen && (
                    <div className="divide-y divide-gray-100 bg-white">
                      {perms.map((perm) => {
                        const isSelected = selected.has(perm.slug);
                        return (
                          <label
                            key={perm.slug}
                            className={cn(
                              'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
                              isSelected ? 'bg-brand-50/50' : 'hover:bg-gray-50',
                              isSystemRole && 'pointer-events-none',
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isSystemRole}
                              onChange={() => togglePerm(perm.slug)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-semibold text-ink-800">{perm.slug}</span>
                              </div>
                              {perm.description && (
                                <p className="text-xs text-gray-400">{perm.description}</p>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {Object.keys(filteredGroups).length === 0 && (
              <p className="py-6 text-center text-sm text-gray-400">No permissions match your search.</p>
            )}
          </CardBody>
          <CardFooter>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-ink-900">{totalSelected}</span> permission{totalSelected !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-3">
                <Button variant="outline" type="button" onClick={() => navigate('/admin/roles')}>
                  Cancel
                </Button>
                {!isSystemRole && (
                  <Button type="submit" loading={saving}>
                    <Save className="h-4 w-4" />
                    {isEdit ? 'Save Changes' : 'Create Role'}
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      </form>

      {/* Sensitive permission confirm */}
      <Modal open={confirmSave} onClose={() => setConfirmSave(false)} title="Confirm Sensitive Permissions" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
            ⚠ This role includes sensitive permissions (admin management, role deletion). Only assign to fully trusted admins.
          </div>
          <p className="text-sm text-gray-600">Are you sure you want to save these permissions?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmSave(false)}>Cancel</Button>
            <Button loading={saving} onClick={doSave}>Yes, Save Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

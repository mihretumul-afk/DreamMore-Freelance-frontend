import { useCallback, useEffect, useState } from 'react';
import { Search, Wrench, Plus, Pencil, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

/** Safely extracts display name from a category (which may be an object, string, null, or undefined). */
function getCategoryName(category) {
  if (!category) return '—';
  if (typeof category === 'object' && category !== null) {
    return category.name || '—';
  }
  if (typeof category === 'string' && category.trim()) {
    return category;
  }
  return '—';
}

export default function AdminSkillsPage() {
  usePageTitle('Skills — Admin');

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', category: '', category_id: '' });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page };
      if (search.trim()) params.search = search.trim();
      const response = await adminService.getSkills(params);
      const payload = response.data ?? response;
      setSkills(Array.isArray(payload) ? payload : (payload.data ?? []));
      setMeta(response.meta ?? payload.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load skills.'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadSkills();
  };

  const openCreate = () => {
    setEditingSkill(null);
    setForm({ name: '', slug: '', category: '', category_id: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (skill) => {
    setEditingSkill(skill);
    const categoryName = typeof skill.category === 'object' && skill.category !== null
      ? (skill.category.name ?? '')
      : (typeof skill.category === 'string' ? skill.category : '');

    setForm({
      name: skill.name ?? '',
      slug: skill.slug ?? '',
      category: categoryName,
      category_id: skill.category_id ?? (typeof skill.category === 'object' ? skill.category?.id : '') ?? '',
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      if (editingSkill) {
        await adminService.updateSkill(editingSkill.id, form);
      } else {
        await adminService.createSkill(form);
      }
      setModalOpen(false);
      loadSkills();
    } catch (err) {
      const errors = err?.response?.data?.errors;
      if (errors) {
        const fieldErrors = {};
        Object.entries(errors).forEach(([field, messages]) => {
          const first = Array.isArray(messages) ? messages[0] : messages;
          if (typeof first === 'string') fieldErrors[field] = first;
        });
        setFormErrors(fieldErrors);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteSkill(deleteTarget.id);
      setDeleteTarget(null);
      loadSkills();
    } catch {
      // non-critical
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-slate-100">Skills</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Manage skills on the platform. {meta.total || skills.length} total.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Skill
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <Input
                icon={Search}
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" variant="outline" size="md">
              <Filter className="h-4 w-4" /> Search
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Skills list */}
      {error ? (
        <ErrorState title="Unable to load skills" description={error} onRetry={loadSkills} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-card border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No skills found"
          description={search ? 'No skills match your search.' : 'Create your first skill to get started.'}
          action={!search ? <Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> Add Skill</Button> : undefined}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-gray-200 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Slug
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 md:table-cell">
                    Category
                  </th>
                  <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 md:table-cell">
                    Freelancers
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {skills.map((skill) => (
                  <tr key={skill.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-bold text-ink-900 dark:text-slate-100">{skill.name}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone="neutral" size="xs">{skill.slug}</Badge>
                    </td>
                    <td className="hidden px-5 py-3 text-xs text-gray-500 dark:text-slate-400 md:table-cell">
                      {getCategoryName(skill.category)}
                    </td>
                    <td className="hidden px-5 py-3 text-sm text-gray-600 dark:text-slate-300 md:table-cell">
                      {skill.freelancers_count ?? skill.freelancersCount ?? 0}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="xs" onClick={() => openEdit(skill)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="xs" onClick={() => setDeleteTarget(skill)}>
                          <Trash2 className="h-3.5 w-3.5 text-danger-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
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

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSkill ? 'Edit Skill' : 'Create Skill'}
        size="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={formErrors.name}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            error={formErrors.slug}
            hint="Auto-generated from name if left empty"
          />
          <Input
            label="Category"
            value={typeof form.category === 'object' && form.category !== null ? (form.category.name ?? '') : (form.category ?? '')}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            error={formErrors.category}
            hint="Optional: group related skills"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {editingSkill ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Skill"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Freelancers using this skill will lose it from their profiles.`}
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

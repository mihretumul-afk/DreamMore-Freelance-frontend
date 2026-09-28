import { useCallback, useEffect, useState } from 'react';
import { FolderTree, Plus, Pencil, Trash2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function AdminCategoriesPage() {
  usePageTitle('Categories — Admin');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getCategories();
      const payload = response.data ?? response;
      setCategories(Array.isArray(payload) ? payload : (payload.data ?? []));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load categories.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setEditingCategory(null);
    setForm({ name: '', slug: '', description: '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setForm({ name: cat.name ?? '', slug: cat.slug ?? '', description: cat.description ?? '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setSaving(true);
    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, form);
      } else {
        await adminService.createCategory(form);
      }
      setModalOpen(false);
      loadCategories();
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
      await adminService.deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      loadCategories();
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
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-slate-100">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Manage job categories on the platform. {categories.length} total.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {error ? (
        <ErrorState title="Unable to load categories" description={error} onRetry={loadCategories} />
      ) : loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-card border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create your first category to organize jobs."
          action={<Button onClick={openCreate} size="sm"><Plus className="h-4 w-4" /> Add Category</Button>}
        />
      ) : (
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
                  Description
                </th>
                <th className="hidden px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400 md:table-cell">
                  Jobs
                </th>
                <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3">
                    <p className="text-sm font-bold text-ink-900 dark:text-slate-100">{cat.name}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone="neutral" size="xs">{cat.slug}</Badge>
                  </td>
                  <td className="hidden px-5 py-3 text-xs text-gray-500 dark:text-slate-400 md:table-cell max-w-xs truncate">
                    {cat.description || '—'}
                  </td>
                  <td className="hidden px-5 py-3 text-sm text-gray-600 dark:text-slate-300 md:table-cell">
                    {cat.jobs_count ?? cat.jobsCount ?? 0}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="xs" onClick={() => openEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => setDeleteTarget(cat)}>
                        <Trash2 className="h-3.5 w-3.5 text-danger-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
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
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={formErrors.description}
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={saving}>
              {editingCategory ? 'Save Changes' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Jobs in this category will become uncategorized.`}
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

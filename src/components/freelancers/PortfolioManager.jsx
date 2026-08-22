import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Edit2, ExternalLink, ArrowUp, ArrowDown, Image as ImageIcon, Briefcase } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Card, { CardHeader, CardBody } from '../ui/Card';
import { portfolioService } from '../../services/portfolioService';
import { categoryService } from '../../services/categoryService';
import { skillService } from '../../services/skillService';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errors';

export default function PortfolioManager() {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    skill_id: '',
    project_url: '',
    image: null,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [portfolioRes, catRes, skillRes] = await Promise.all([
        portfolioService.getPortfolio(),
        categoryService.getCategories(),
        skillService.getSkills(),
      ]);

      if (portfolioRes.success) setItems(portfolioRes.data || []);
      if (catRes.success) setCategories(catRes.data || []);
      if (skillRes.success) setSkills(skillRes.data || []);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to load portfolio items.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm({
      title: '',
      description: '',
      category_id: '',
      skill_id: '',
      project_url: '',
      image: null,
    });
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      title: item.title || '',
      description: item.description || '',
      category_id: item.category_id || '',
      skill_id: item.skill_id || '',
      project_url: item.project_url || '',
      image: null,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('Project title is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      if (form.description) formData.append('description', form.description.trim());
      if (form.category_id) formData.append('category_id', form.category_id);
      if (form.skill_id) formData.append('skill_id', form.skill_id);
      if (form.project_url) formData.append('project_url', form.project_url.trim());
      if (form.image) formData.append('image', form.image);

      if (editingItem) {
        await portfolioService.updatePortfolioItem(editingItem.id, formData);
        showToast('Portfolio item updated successfully!', 'success');
      } else {
        await portfolioService.createPortfolioItem(formData);
        showToast('Portfolio item added successfully!', 'success');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to save portfolio item.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this portfolio item?')) return;
    try {
      await portfolioService.deletePortfolioItem(id);
      showToast('Portfolio item deleted.', 'success');
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to delete portfolio item.'), 'error');
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);

    setItems(newItems);

    const payload = newItems.map((item, idx) => ({ id: item.id, order: idx + 1 }));
    try {
      await portfolioService.reorderPortfolio(payload);
    } catch {
      loadData();
    }
  };

  return (
    <Card>
      <CardHeader
        title="Portfolio & Projects"
        description="Showcase your best work, completed projects, and case studies to employers."
        action={
          <Button size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Project
          </Button>
        }
      />
      <CardBody>
        {loading ? (
          <p className="text-sm text-gray-500">Loading portfolio...</p>
        ) : items.length === 0 ? (
          <div className="py-8 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-gray-700">No portfolio items yet</p>
            <p className="text-xs text-gray-500">Add projects to increase your chances of winning job proposals.</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={openCreateModal}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition hover:border-brand-400 hover:shadow-sm"
              >
                {item.image_url ? (
                  <div className="mb-3 h-36 w-full overflow-hidden rounded-lg bg-gray-100">
                    <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="mb-3 flex h-36 w-full items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}

                <div className="flex-1">
                  <h4 className="font-semibold text-ink-900 line-clamp-1">{item.title}</h4>
                  {item.description && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">{item.description}</p>
                  )}
                  {item.category && (
                    <span className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-brand-700">
                      {item.category.name}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, -1)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, 1)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded p-1 text-brand-600 hover:bg-brand-50"
                        title="Open Project"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-ink-900"
                      title="Edit"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="rounded p-1 text-danger-500 hover:bg-danger-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Portfolio Project' : 'Add Portfolio Project'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Project Title"
            required
            placeholder="e.g. E-Commerce Web App"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          />

          <Textarea
            label="Description"
            rows={4}
            placeholder="Describe your role, technologies used, and outcomes achieved..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Category"
              value={form.category_id}
              onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
            >
              <option value="">Select category (optional)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>

            <Select
              label="Key Skill"
              value={form.skill_id}
              onChange={(e) => setForm((p) => ({ ...p, skill_id: e.target.value }))}
            >
              <option value="">Select skill (optional)</option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </Select>
          </div>

          <Input
            label="Project URL"
            type="url"
            placeholder="https://example.com/project"
            value={form.project_url}
            onChange={(e) => setForm((p) => ({ ...p, project_url: e.target.value }))}
          />

          <div>
            <label className="block text-sm font-medium text-ink-800">Preview Image</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setForm((p) => ({ ...p, image: e.target.files[0] }))}
              className="mt-1 block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingItem ? 'Update Project' : 'Add Project'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

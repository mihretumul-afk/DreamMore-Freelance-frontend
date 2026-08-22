import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { employerService } from '../../services/employerService';
import { categoryService } from '../../services/categoryService';
import { skillService } from '../../services/skillService';
import { normalizeJob } from '../../utils/jobMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

const BUDGET_TYPES = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'hourly', label: 'Hourly Rate' },
];

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

const LOCATION_TYPES = [
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
];

export default function EmployerJobEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  usePageTitle('Edit Job');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [jobRes, catRes] = await Promise.all([
        employerService.getJob(id),
        categoryService.getCategories(),
      ]);

      if (catRes.success) setCategories(catRes.data ?? []);

      if (jobRes.success) {
        const job = normalizeJob(jobRes.data);
        setForm({
          title: job.title ?? '',
          description: job.description ?? '',
          category_id: job.categoryObject?.id?.toString() ?? '',
          budget_type: job.budgetType === 'hourly' ? 'hourly' : 'fixed',
          min_budget: job.minBudget != null ? String(job.minBudget) : '',
          max_budget: job.maxBudget != null ? String(job.maxBudget) : '',
          currency: job.currency ?? 'ETB',
          experience_level: job.experienceLevel?.toLowerCase() ?? 'intermediate',
          location_type: job.locationType ?? 'remote',
          location: job.location === 'Remote' ? '' : (job.location ?? ''),
          deadline: job.deadline ?? '',
          selectedSkillIds: (job.skills ?? []).map((s) => s.id),
        });
      } else {
        setLoadError(jobRes.message || 'Unable to load job details.');
      }
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to load job details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load skills when category changes
  useEffect(() => {
    if (!form?.category_id) {
      setSkills([]);
      return;
    }

    setLoadingSkills(true);
    skillService
      .getSkills({ category_id: form.category_id })
      .then((res) => {
        if (res.success) setSkills(res.data ?? []);
      })
      .catch(() => setSkills([]))
      .finally(() => setLoadingSkills(false));
  }, [form?.category_id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSkillToggle = (skillId) => {
    setForm((prev) => {
      if (!prev) return prev;
      const ids = prev.selectedSkillIds.includes(skillId)
        ? prev.selectedSkillIds.filter((id) => id !== skillId)
        : [...prev.selectedSkillIds, skillId];
      return { ...prev, selectedSkillIds: ids };
    });
  };

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category_id: form.category_id ? Number(form.category_id) : null,
      budget_type: form.budget_type,
      min_budget: form.min_budget ? Number(form.min_budget) : null,
      max_budget: form.max_budget ? Number(form.max_budget) : null,
      currency: form.currency.trim().toUpperCase() || 'ETB',
      experience_level: form.experience_level,
      location_type: form.location_type,
      location: form.location.trim() || null,
      deadline: form.deadline || null,
      skills: form.selectedSkillIds,
    };

    try {
      await employerService.updateJob(id, payload);
      showToast('Job updated successfully!', 'success');
      navigate(`/employer/jobs/${id}`, { replace: true });
    } catch (error) {
      if (error?.response?.status === 422) {
        const errors = getFieldErrors(error);
        setFieldErrors(errors);
        showToast(getErrorMessage(error, 'Unable to update job. Please check your input.'), 'error');
      } else {
        const msg = getErrorMessage(error, 'Unable to update job. Please try again.');
        setGeneralError(msg);
        showToast(msg, 'error');
      }
      setSubmitting(false);
    }
  }, [form, id, navigate, showToast]);

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-card border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }

  if (loadError || !form) {
    return <ErrorState title="Unable to load job" description={loadError} onRetry={loadData} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer"
        title="Edit Job"
        description="Update your job posting details."
      />

      {generalError && (
        <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-6 lg:space-y-0">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Job details" />
            <CardBody className="space-y-4">
              <Input
                label="Job title"
                name="title"
                placeholder="e.g. Senior React Developer"
                maxLength={255}
                value={form.title}
                onChange={handleChange}
                error={fieldErrors.title}
                disabled={submitting}
                required
              />
              <Textarea
                label="Description"
                name="description"
                rows={8}
                maxLength={10000}
                placeholder="Describe the project, requirements, and deliverables..."
                value={form.description}
                onChange={handleChange}
                error={fieldErrors.description}
                disabled={submitting}
                required
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Category & Skills" />
            <CardBody className="space-y-4">
              <Select
                label="Category"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                error={fieldErrors.category_id}
                disabled={submitting}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>

              {form.category_id && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink-800">Required skills</label>
                  {loadingSkills ? (
                    <p className="text-sm text-gray-500">Loading skills...</p>
                  ) : skills.length === 0 ? (
                    <p className="text-sm text-gray-500">No skills available for this category.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => handleSkillToggle(skill.id)}
                          disabled={submitting}
                          className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                            form.selectedSkillIds.includes(skill.id)
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {skill.name}
                        </button>
                      ))}
                    </div>
                  )}
                  {form.selectedSkillIds.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {form.selectedSkillIds.length} skill{form.selectedSkillIds.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                  {fieldErrors.skills && (
                    <p role="alert" className="text-xs font-medium text-danger-600">
                      {fieldErrors.skills}
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Budget" />
            <CardBody className="space-y-4">
              <Select
                label="Budget type"
                name="budget_type"
                value={form.budget_type}
                onChange={handleChange}
                error={fieldErrors.budget_type}
                disabled={submitting}
              >
                {BUDGET_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  type="number"
                  label="Minimum budget (ETB)"
                  name="min_budget"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={form.min_budget}
                  onChange={handleChange}
                  error={fieldErrors.min_budget}
                  disabled={submitting}
                />
                <Input
                  type="number"
                  label="Maximum budget (ETB)"
                  name="max_budget"
                  placeholder="0"
                  min="0"
                  step="1"
                  value={form.max_budget}
                  onChange={handleChange}
                  error={fieldErrors.max_budget}
                  disabled={submitting}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Requirements" />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Experience level"
                  name="experience_level"
                  value={form.experience_level}
                  onChange={handleChange}
                  error={fieldErrors.experience_level}
                  disabled={submitting}
                >
                  {EXPERIENCE_LEVELS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                <Select
                  label="Work mode"
                  name="location_type"
                  value={form.location_type}
                  onChange={handleChange}
                  error={fieldErrors.location_type}
                  disabled={submitting}
                >
                  {LOCATION_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <Input
                label="Location"
                name="location"
                placeholder="e.g. Addis Ababa, Ethiopia"
                maxLength={255}
                value={form.location}
                onChange={handleChange}
                error={fieldErrors.location}
                disabled={submitting}
              />
              <Input
                type="date"
                label="Deadline"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                error={fieldErrors.deadline}
                disabled={submitting}
              />
            </CardBody>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24">
          <Card>
            <CardBody className="space-y-3">
              <Button type="submit" loading={submitting} className="w-full">
                <Save className="h-4 w-4" aria-hidden="true" /> Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/employer/jobs/${id}`)}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Cancel
              </Button>
            </CardBody>
          </Card>
        </aside>
      </form>
    </div>
  );
}

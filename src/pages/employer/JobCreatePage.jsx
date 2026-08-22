import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import { employerService } from '../../services/employerService';
import { categoryService } from '../../services/categoryService';
import { skillService } from '../../services/skillService';
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

const INITIAL_FORM = {
  title: '',
  description: '',
  category_id: '',
  budget_type: 'fixed',
  min_budget: '',
  max_budget: '',
  currency: 'ETB',
  experience_level: 'intermediate',
  location_type: 'remote',
  location: '',
  deadline: '',
  selectedSkillIds: [],
};

export default function EmployerJobCreatePage() {
  usePageTitle('Post a Job');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    categoryService
      .getCategories()
      .then((res) => {
        if (res.success) setCategories(res.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingCategories(false));
  }, []);

  // Load skills when category changes
  useEffect(() => {
    if (!form.category_id) {
      setSkills([]);
      setForm((prev) => ({ ...prev, selectedSkillIds: [] }));
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
  }, [form.category_id]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSkillToggle = (skillId) => {
    setForm((prev) => {
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
      const response = await employerService.createJob(payload);
      if (response.success && response.data) {
        showToast('Job posted successfully!', 'success');
        navigate(`/employer/jobs/${response.data.id}`, { replace: true });
      } else {
        showToast('Job posted successfully!', 'success');
        navigate('/employer/jobs', { replace: true });
      }
    } catch (error) {
      if (error?.response?.status === 422) {
        const errors = getFieldErrors(error);
        setFieldErrors(errors);
        showToast(getErrorMessage(error, 'Unable to create job. Please check your input.'), 'error');
      } else {
        const msg = getErrorMessage(error, 'Unable to create job. Please try again.');
        setGeneralError(msg);
        showToast(msg, 'error');
      }
      setSubmitting(false);
    }
  }, [form, navigate, showToast]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer"
        title="Post a Job"
        description="Describe the work you need done and attract the right talent."
      />

      {generalError && (
        <div role="alert" className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-6 lg:space-y-0">
        <div className="min-w-0 space-y-6">
          {/* Basics */}
          <Card>
            <CardHeader title="Job details" description="Give your job a clear title and detailed description." />
            <CardBody className="space-y-4">
              <Input
                label="Job title"
                name="title"
                placeholder="e.g. Senior React Developer for E-commerce Platform"
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
                placeholder="Describe the project, requirements, deliverables, and any specific skills needed..."
                value={form.description}
                onChange={handleChange}
                error={fieldErrors.description}
                disabled={submitting}
                required
              />
            </CardBody>
          </Card>

          {/* Category & Skills */}
          <Card>
            <CardHeader title="Category & Skills" description="Help talent find your job by selecting the right category and skills." />
            <CardBody className="space-y-4">
              <Select
                label="Category"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                error={fieldErrors.category_id}
                disabled={submitting || loadingCategories}
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>

              {form.category_id && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-ink-800">
                    Required skills
                  </label>
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

              {!form.category_id && (
                <p className="text-sm text-gray-500">Select a category first to choose skills.</p>
              )}
            </CardBody>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader title="Budget" description="Set your budget range to attract the right candidates." />
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

          {/* Requirements */}
          <Card>
            <CardHeader title="Requirements" description="Specify the experience level and work arrangement." />
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
                placeholder="e.g. Addis Ababa, Ethiopia (if not remote)"
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
                hint="Optional. Leave empty for no deadline."
                disabled={submitting}
              />
            </CardBody>
          </Card>
        </div>

        {/* Sidebar actions */}
        <aside className="lg:sticky lg:top-24">
          <Card>
            <CardBody className="space-y-3">
              <Button type="submit" loading={submitting} className="w-full">
                <Save className="h-4 w-4" aria-hidden="true" /> Publish Job
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/employer/jobs')}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Cancel
              </Button>
              <p className="text-center text-xs text-gray-400">
                Your job will be visible to freelancers immediately after publishing.
              </p>
            </CardBody>
          </Card>
        </aside>
      </form>
    </div>
  );
}

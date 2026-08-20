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
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

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
  skills: '',
};

export default function EmployerJobCreatePage() {
  usePageTitle('Post a Job');
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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
      skills: form.skills.trim()
        ? form.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    try {
      const response = await employerService.createJob(payload);
      if (response.success && response.data) {
        navigate(`/employer/jobs/${response.data.id}`, { replace: true });
      } else {
        navigate('/employer/jobs', { replace: true });
      }
    } catch (error) {
      if (error?.response?.status === 422) {
        const errors = getFieldErrors(error);
        setFieldErrors(errors);
      } else {
        setGeneralError(getErrorMessage(error, 'Unable to create job. Please try again.'));
      }
      setSubmitting(false);
    }
  }, [form, navigate]);

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
            <CardHeader title="Category & Skills" description="Help talent find your job by selecting the right category." />
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
              <Input
                label="Required skills"
                name="skills"
                placeholder="e.g. React, Laravel, Tailwind CSS (comma-separated)"
                value={form.skills}
                onChange={handleChange}
                error={fieldErrors.skills}
                hint="Separate skills with commas."
                disabled={submitting}
              />
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

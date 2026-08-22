import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import EmployerProfileSkeleton from '../../components/employers/EmployerProfileSkeleton';
import VerificationCard from '../../components/common/VerificationCard';
import { employerService } from '../../services/employerService';
import {
  normalizeEmployer,
  employerProfileToForm,
  employerFormToPayload,
} from '../../utils/employerMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { isHttpUrl } from '../../utils/validate';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

/** Backend error field name → form state key. */
const ERROR_FIELD_MAP = {
  company_name: 'companyName',
  company_description: 'companyDescription',
  industry: 'industry',
  company_size: 'companySize',
  location: 'location',
  website: 'website',
  phone: 'phone',
  bio: 'bio',
};

export default function EmployerProfileEditPage() {
  usePageTitle('Edit Company Profile');
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await employerService.getMyProfile();
      if (response.success) {
        setForm(employerProfileToForm(normalizeEmployer(response.data)));
      } else {
        setLoadError(response.message || 'Unable to load your company profile.');
      }
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to load your company profile right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /** Light client-side checks; the backend remains the source of truth. */
  const validateForm = () => {
    const errors = {};
    if (!isHttpUrl(form.website)) {
      errors.website = 'Enter a valid URL starting with http:// or https://.';
    }
    if (form.phone.length > 50) {
      errors.phone = 'Phone must be 50 characters or fewer.';
    }
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);
    try {
      await employerService.updateMyProfile(employerFormToPayload(form));
      showToast('Company profile updated successfully!', 'success');
      // phone/bio live on the user record — re-sync the auth session.
      try {
        await refreshUser();
      } catch {
        // Session refresh is best-effort; the profile page still refetches.
      }
      navigate('/employer/profile', { replace: true });
    } catch (error) {
      const errors = getFieldErrors(error);
      const mapped = {};
      Object.entries(errors).forEach(([backendField, message]) => {
        const key = ERROR_FIELD_MAP[backendField];
        if (key) mapped[key] = message;
      });
      setFieldErrors(mapped);
      const hasFieldErrors = Object.keys(mapped).length > 0;
      const msg = hasFieldErrors
        ? null
        : getErrorMessage(error, 'Unable to save your company profile. Please try again.');
      setGeneralError(msg);
      if (msg) showToast(msg, 'error');
      setSubmitting(false);
    }
  };

  if (loading) return <EmployerProfileSkeleton />;

  if (loadError || !form) {
    return (
      <ErrorState
        title="Unable to load your company profile"
        description={loadError}
        onRetry={loadProfile}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer"
        title="Edit Company Profile"
        description="Update how talent sees your company."
      />

      {generalError && (
        <div
          role="alert"
          className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
        >
          {generalError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-6 lg:space-y-0"
      >
        <div className="min-w-0 space-y-6">
          {/* Company */}
          <Card>
            <CardHeader
              title="Company"
              description="The basics of your business, shown to talent."
            />
            <CardBody className="space-y-4">
              <Input
                label="Company name"
                name="companyName"
                placeholder="e.g. Addis Tech Solutions"
                maxLength={255}
                value={form.companyName}
                onChange={handleChange}
                error={fieldErrors.companyName}
                disabled={submitting}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Industry"
                  name="industry"
                  placeholder="e.g. Software, Finance, Construction"
                  maxLength={255}
                  value={form.industry}
                  onChange={handleChange}
                  error={fieldErrors.industry}
                  disabled={submitting}
                />
                <Input
                  label="Company size"
                  name="companySize"
                  placeholder="e.g. 10–50 employees"
                  maxLength={255}
                  value={form.companySize}
                  onChange={handleChange}
                  error={fieldErrors.companySize}
                  disabled={submitting}
                />
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
                type="url"
                label="Website"
                name="website"
                placeholder="https://www.yourcompany.com"
                maxLength={255}
                value={form.website}
                onChange={handleChange}
                error={fieldErrors.website}
                disabled={submitting}
              />
            </CardBody>
          </Card>

          {/* About */}
          <Card>
            <CardHeader title="About" description="Describe what your company does." />
            <CardBody>
              <Textarea
                label="Company description"
                name="companyDescription"
                rows={6}
                maxLength={5000}
                placeholder="Tell talent what your company builds, its mission, and what it is like to work here…"
                value={form.companyDescription}
                onChange={handleChange}
                error={fieldErrors.companyDescription}
                disabled={submitting}
              />
            </CardBody>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader
              title="Contact"
              description="Public contact details — phone and bio also update your account."
            />
            <CardBody className="space-y-4">
              <Input
                type="tel"
                label="Phone (optional)"
                name="phone"
                placeholder="+251 9 00 000 000"
                autoComplete="tel"
                maxLength={50}
                value={form.phone}
                onChange={handleChange}
                error={fieldErrors.phone}
                disabled={submitting}
              />
              <Textarea
                label="Bio (optional)"
                name="bio"
                rows={3}
                maxLength={1000}
                placeholder="A short introduction for your company…"
                value={form.bio}
                onChange={handleChange}
                error={fieldErrors.bio}
                disabled={submitting}
              />
            </CardBody>
          </Card>

          {/* Verification */}
          <VerificationCard userRole="employer" />
        </div>

        {/* Sidebar actions */}
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
                onClick={() => navigate('/employer/profile')}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Cancel
              </Button>
              <p className="text-center text-xs text-gray-400">
                Your company profile updates immediately after saving.
              </p>
            </CardBody>
          </Card>
        </aside>
      </form>
    </div>
  );
}

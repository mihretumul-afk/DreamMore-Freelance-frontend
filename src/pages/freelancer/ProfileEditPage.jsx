import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Search, Plus, Loader2 } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import FreelancerProfileSkeleton from '../../components/freelancers/FreelancerProfileSkeleton';
import { freelancerService } from '../../services/freelancerService';
import { skillService } from '../../services/skillService';
import {
  normalizeFreelancer,
  freelancerProfileToForm,
  freelancerFormToPayload,
} from '../../utils/freelancerMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { isHttpUrl } from '../../utils/validate';
import { usePageTitle } from '../../hooks/usePageTitle';

/** Backend error field name → form state key. */
const ERROR_FIELD_MAP = {
  headline: 'headline',
  overview: 'overview',
  hourly_rate: 'hourlyRate',
  experience_level: 'experienceLevel',
  location: 'location',
  github_url: 'githubUrl',
  linkedin_url: 'linkedinUrl',
  website: 'website',
  availability_status: 'availability',
  skills: 'skills',
};

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'not_available', label: 'Not available' },
];

/**
 * SkillSearch — Debounced search input that queries the skills catalog
 * and shows a dropdown of matching results for selection.
 */
function SkillSearch({ existingSkillIds, onAdd, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const searchSkills = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await skillService.getSkills({ search: searchQuery.trim() });
      if (response.success) {
        setResults(response.data ?? []);
      } else {
        setError('Failed to search skills.');
      }
    } catch {
      setError('Failed to search skills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);

    // Debounce API calls
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSkills(value);
    }, 300);
  };

  const handleAdd = (skill) => {
    onAdd(skill);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      // Add the first non-duplicate result
      const available = results.find((s) => !existingSkillIds.has(s.id));
      if (available) handleAdd(available);
    }
  };

  const filteredResults = results.filter((s) => !existingSkillIds.has(s.id));

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Search skills to add (e.g. React, Laravel, Figma)..."
          disabled={disabled}
          aria-label="Search skills to add"
          aria-expanded={open}
          aria-controls="skill-search-results"
          aria-autocomplete="list"
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-3 text-sm text-ink-900 placeholder-gray-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" aria-hidden="true" />
        )}
      </div>

      {error && (
        <p className="mt-1 text-xs text-danger-600">{error}</p>
      )}

      {open && !loading && filteredResults.length > 0 && (
        <ul
          id="skill-search-results"
          role="listbox"
          aria-label="Available skills"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {filteredResults.slice(0, 10).map((skill) => (
            <li
              key={skill.id}
              role="option"
              tabIndex={0}
              onClick={() => handleAdd(skill)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAdd(skill); } }}
              className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm text-ink-900 cursor-pointer transition-colors hover:bg-brand-50 focus:bg-brand-50 focus:outline-none"
            >
              <div className="min-w-0">
                <span className="font-medium">{skill.name}</span>
                {skill.category?.name && (
                  <span className="ml-2 text-xs text-gray-400">{skill.category.name}</span>
                )}
              </div>
              <Plus className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim() && filteredResults.length === 0 && !error && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-4 text-center shadow-lg">
          <p className="text-sm text-gray-500">No skills found matching &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}

export default function FreelancerProfileEditPage() {
  usePageTitle('Edit Profile');
  const navigate = useNavigate();

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
      const response = await freelancerService.getMyProfile();
      if (response.success) {
        setForm(freelancerProfileToForm(normalizeFreelancer(response.data)));
      } else {
        setLoadError(response.message || 'Unable to load your profile.');
      }
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to load your profile right now. Please try again.'));
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

  const handleSkillYearsChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) =>
        skill.id === id ? { ...skill, yearsOfExperience: value } : skill,
      ),
    }));
  };

  const handleRemoveSkill = (id) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((skill) => skill.id !== id) }));
  };

  const handleAddSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, { id: skill.id, name: skill.name, yearsOfExperience: 1 }],
    }));
    // Clear any skills error
    if (fieldErrors.skills) {
      setFieldErrors((prev) => ({ ...prev, skills: undefined }));
    }
  };

  /** Light client-side checks; the backend remains the source of truth. */
  const validateForm = () => {
    const errors = {};
    if (!isHttpUrl(form.githubUrl)) {
      errors.githubUrl = 'Enter a valid URL starting with http:// or https://.';
    }
    if (!isHttpUrl(form.linkedinUrl)) {
      errors.linkedinUrl = 'Enter a valid URL starting with http:// or https://.';
    }
    if (!isHttpUrl(form.website)) {
      errors.website = 'Enter a valid URL starting with http:// or https://.';
    }
    if (form.hourlyRate !== '') {
      const rate = Number(form.hourlyRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 9999.99) {
        errors.hourlyRate = 'Enter a rate between 0 and 9,999.99.';
      }
    }
    form.skills.forEach((skill) => {
      const years = Number(skill.yearsOfExperience);
      if (
        skill.yearsOfExperience !== '' &&
        (Number.isNaN(years) || years < 0 || years > 50 || !Number.isInteger(years))
      ) {
        errors.skills = 'Years of experience must be a whole number between 0 and 50.';
      }
    });
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
      await freelancerService.updateMyProfile(freelancerFormToPayload(form));
      navigate('/freelancer/profile', { replace: true });
    } catch (error) {
      const errors = getFieldErrors(error);
      const mapped = {};
      Object.entries(errors).forEach(([backendField, message]) => {
        const key = ERROR_FIELD_MAP[backendField];
        if (key) mapped[key] = message;
      });
      setFieldErrors(mapped);
      const hasFieldErrors = Object.keys(mapped).length > 0;
      setGeneralError(
        hasFieldErrors
          ? null
          : getErrorMessage(error, 'Unable to save your profile. Please try again.'),
      );
      setSubmitting(false);
    }
  };

  if (loading) return <FreelancerProfileSkeleton />;

  if (loadError || !form) {
    return (
      <ErrorState
        title="Unable to load your profile"
        description={loadError}
        onRetry={loadProfile}
      />
    );
  }

  const existingSkillIds = new Set(form.skills.map((s) => s.id));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Freelancer"
        title="Edit Profile"
        description="Update how clients see you on the marketplace."
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
          {/* Basics */}
          <Card>
            <CardHeader
              title="Basics"
              description="Your professional headline, rate, and experience level."
            />
            <CardBody className="space-y-4">
              <Input
                label="Headline"
                name="headline"
                placeholder="e.g. Full-stack developer with 5+ years of experience"
                maxLength={255}
                value={form.headline}
                onChange={handleChange}
                error={fieldErrors.headline}
                disabled={submitting}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  type="number"
                  label="Hourly rate (ETB)"
                  name="hourlyRate"
                  placeholder="0.00"
                  min="0"
                  max="9999.99"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  error={fieldErrors.hourlyRate}
                  hint="What you charge per hour."
                  disabled={submitting}
                />
                <Select
                  label="Experience level"
                  name="experienceLevel"
                  value={form.experienceLevel}
                  onChange={handleChange}
                  error={fieldErrors.experienceLevel}
                  disabled={submitting}
                >
                  {EXPERIENCE_LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
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
            </CardBody>
          </Card>

          {/* About */}
          <Card>
            <CardHeader title="About" description="Your professional summary." />
            <CardBody>
              <Textarea
                label="Overview"
                name="overview"
                rows={6}
                maxLength={5000}
                placeholder="Tell clients about your experience, strengths, and the work you love…"
                value={form.overview}
                onChange={handleChange}
                error={fieldErrors.overview}
                disabled={submitting}
              />
            </CardBody>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader
              title="Availability"
              description="Show clients whether you are open to new work."
            />
            <CardBody>
              <Select
                label="Availability status"
                name="availability"
                value={form.availability}
                onChange={handleChange}
                error={fieldErrors.availability}
                disabled={submitting}
              >
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </CardBody>
          </Card>

          {/* Links */}
          <Card>
            <CardHeader title="Links" description="Portfolio links shown on your profile." />
            <CardBody className="space-y-4">
              <Input
                type="url"
                label="GitHub"
                name="githubUrl"
                placeholder="https://github.com/username"
                maxLength={255}
                value={form.githubUrl}
                onChange={handleChange}
                error={fieldErrors.githubUrl}
                disabled={submitting}
              />
              <Input
                type="url"
                label="LinkedIn"
                name="linkedinUrl"
                placeholder="https://www.linkedin.com/in/username"
                maxLength={255}
                value={form.linkedinUrl}
                onChange={handleChange}
                error={fieldErrors.linkedinUrl}
                disabled={submitting}
              />
              <Input
                type="url"
                label="Website"
                name="website"
                placeholder="https://yoursite.com"
                maxLength={255}
                value={form.website}
                onChange={handleChange}
                error={fieldErrors.website}
                disabled={submitting}
              />
            </CardBody>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader
              title="Skills & expertise"
              description="Search the skills catalog to add new skills, or manage your existing ones."
            />
            <CardBody>
              {/* Current skills */}
              {form.skills.length > 0 ? (
                <ul className="space-y-3">
                  {form.skills.map((skill) => (
                    <li
                      key={skill.id}
                      className="flex flex-col gap-3 rounded-xl border border-gray-200 p-3 sm:flex-row sm:items-end sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink-900">{skill.name}</p>
                        <p className="text-xs text-gray-400">
                          {skill.yearsOfExperience === '' || skill.yearsOfExperience == null
                            ? 'Years not set'
                            : `${skill.yearsOfExperience} year${skill.yearsOfExperience === 1 ? '' : 's'} of experience`}
                        </p>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="w-28">
                          <Input
                            type="number"
                            label="Years"
                            min="0"
                            max="50"
                            step="1"
                            value={skill.yearsOfExperience}
                            onChange={(event) =>
                              handleSkillYearsChange(skill.id, event.target.value)
                            }
                            disabled={submitting}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSkill(skill.id)}
                          disabled={submitting}
                          aria-label={`Remove ${skill.name} from your skills`}
                        >
                          <X className="h-4 w-4" aria-hidden="true" /> Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No skills added yet. Search below to add your first skill.</p>
              )}

              {fieldErrors.skills && (
                <p role="alert" className="mt-3 text-xs font-medium text-danger-600">
                  {fieldErrors.skills}
                </p>
              )}

              {/* Skill search / add */}
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-ink-800">
                  Add a skill
                </label>
                <SkillSearch
                  existingSkillIds={existingSkillIds}
                  onAdd={handleAddSkill}
                  disabled={submitting}
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Search the skills catalog and select a skill to add it to your profile.
                </p>
              </div>
            </CardBody>
          </Card>
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
                onClick={() => navigate('/freelancer/profile')}
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Cancel
              </Button>
              <p className="text-center text-xs text-gray-400">
                Your public profile updates immediately after saving.
              </p>
            </CardBody>
          </Card>
        </aside>
      </form>
    </div>
  );
}

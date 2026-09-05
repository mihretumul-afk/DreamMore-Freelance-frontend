import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Settings, ShieldCheck, Plus, X } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { adminService } from '../../services/adminService';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { useToast } from '../../hooks/useToast';
import { usePlatform } from '../../hooks/usePlatform';
import { usePageTitle } from '../../hooks/usePageTitle';

/** Types available for admin-added extra contact entries. */
const EXTRA_TYPE_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'website', label: 'Website' },
  { value: 'social', label: 'Social / Other' },
];

const EXTRA_PLACEHOLDERS = {
  email: 'e.g. hello@example.com',
  phone: 'e.g. +251 911 234 567',
  website: 'e.g. dreammore.et',
  social: 'e.g. Telegram @dreammore',
};

/** Platforms available for the footer social media links. */
const SOCIAL_PLATFORM_OPTIONS = [
  { value: 'github', label: 'GitHub' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Website' },
];

/** Backend stores contact_extras as a JSON string or array — normalise to an array. */
function parseExtras(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Flatten grouped settings from the backend into a single form object.
 * Backend returns: { general: { ... }, payments: { ... }, access: { ... } }
 */
function flattenSettings(grouped) {
  if (!grouped) return {};
  return {
    platform_name:        grouped.general?.platform_name ?? '',
    platform_description: grouped.general?.platform_description ?? '',
    contact_email:        grouped.general?.contact_email ?? '',
    contact_phone:        grouped.general?.contact_phone ?? '',
    contact_location:     grouped.general?.contact_location ?? '',
    contact_hours:        grouped.general?.contact_hours ?? '',
    contact_extras:       parseExtras(grouped.general?.contact_extras),
    social_links:         parseExtras(grouped.general?.social_links),
    default_currency:     grouped.payments?.default_currency ?? 'ETB',
    min_proposal_amount:  grouped.payments?.min_proposal_amount ?? '',
    max_proposal_amount:  grouped.payments?.max_proposal_amount ?? '',
    platform_fee_percent: grouped.platform_fee_percent ?? '8',
    auto_approve_days:    grouped.auto_approve_days ?? '5',
    registration_open:    String(grouped.access?.registration_open ?? 'true'),
    maintenance_mode:     String(grouped.access?.maintenance_mode ?? 'false'),

    // Featured Listing settings
    featured_jobs_enabled:             String(grouped.featured?.featured_jobs_enabled ?? 'false'),
    featured_profiles_enabled:         String(grouped.featured?.featured_profiles_enabled ?? 'false'),
    featured_job_price:                String(grouped.featured?.featured_job_price ?? '150'),
    featured_job_duration_days:        String(grouped.featured?.featured_job_duration_days ?? '7'),
    featured_profile_price:            String(grouped.featured?.featured_profile_price ?? '100'),
    featured_profile_duration_days:    String(grouped.featured?.featured_profile_duration_days ?? '7'),
  };
}

const INITIAL_FORM = {
  platform_name: '',
  platform_description: '',
  contact_email: '',
  contact_phone: '',
  contact_location: '',
  contact_hours: '',
  contact_extras: [],
  social_links: [],
  default_currency: 'ETB',
  min_proposal_amount: '',
  max_proposal_amount: '',
  platform_fee_percent: '8',
  auto_approve_days: '5',
  registration_open: 'true',
  maintenance_mode: 'false',

  // Featured Listing settings
  featured_jobs_enabled: 'false',
  featured_profiles_enabled: 'false',
  featured_job_price: '150',
  featured_job_duration_days: '7',
  featured_profile_price: '100',
  featured_profile_duration_days: '7',
};

export default function AdminSettingsPage() {
  usePageTitle('Platform Settings — Admin');
  const { showToast } = useToast();
  const { refresh: refreshPlatformSettings } = usePlatform();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [savedBadge, setSavedBadge] = useState(false);

  const [form, setForm] = useState(INITIAL_FORM);
  const savedFormRef = useRef(INITIAL_FORM);

  // Dirty check — compare current form to saved snapshot
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedFormRef.current),
    [form],
  );

  // ── Load ──────────────────────────────────────────────────────────────
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getSettings();
      const data = response.data ?? response;
      const flat = flattenSettings(data);
      setForm(flat);
      savedFormRef.current = flat;
      setFieldErrors({});
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load settings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      const response = await adminService.updateSettings(form);
      const data = response.data ?? response;
      const flat = flattenSettings(data);
      setForm(flat);
      savedFormRef.current = flat;
      setFieldErrors({});
      setSavedBadge(true);
      showToast('Settings saved successfully.', 'success');
      // Refresh platform settings across the app
      refreshPlatformSettings();
      setTimeout(() => setSavedBadge(false), 3000);
    } catch (err) {
      if (err?.response?.status === 422) {
        setFieldErrors(getFieldErrors(err));
        showToast('Please fix the validation errors.', 'error');
      } else {
        showToast(getErrorMessage(err, 'Unable to save settings.'), 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────
  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear field error on change
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // ── Additional contact rows ──────────────────────────────────────────
  const updateExtra = (index, patch) => {
    setForm((prev) => {
      const rows = [...(prev.contact_extras ?? [])];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, contact_extras: rows };
    });
    // Clear nested field errors for the edited row
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => delete next[`contact_extras.${index}.${k}`]);
      return next;
    });
  };

  const addExtra = () =>
    setForm((prev) => ({
      ...prev,
      contact_extras: [...(prev.contact_extras ?? []), { type: 'email', label: '', value: '' }],
    }));

  const removeExtra = (index) =>
    setForm((prev) => ({
      ...prev,
      contact_extras: (prev.contact_extras ?? []).filter((_, i) => i !== index),
    }));

  // ── Social media link rows ────────────────────────────────────────
  const updateSocial = (index, patch) => {
    setForm((prev) => {
      const rows = [...(prev.social_links ?? [])];
      rows[index] = { ...rows[index], ...patch };
      return { ...prev, social_links: rows };
    });
    // Clear nested field errors for the edited row
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => delete next[`social_links.${index}.${k}`]);
      return next;
    });
  };

  const addSocial = () =>
    setForm((prev) => ({
      ...prev,
      social_links: [...(prev.social_links ?? []), { platform: 'github', url: '' }],
    }));

  const removeSocial = (index) =>
    setForm((prev) => ({
      ...prev,
      social_links: (prev.social_links ?? []).filter((_, i) => i !== index),
    }));

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-64 animate-pulse rounded-card border border-gray-200 bg-white" />
        <div className="h-48 animate-pulse rounded-card border border-gray-200 bg-white" />
        <div className="h-48 animate-pulse rounded-card border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error && !settings) {
    return <ErrorState title="Unable to load settings" description={error} onRetry={loadSettings} />;
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Platform Settings</h1>
        <p className="text-sm text-gray-500">
          Configure global platform settings and behavior.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── General ────────────────────────────────────────────────── */}
        <Card>
          <CardHeader title="General" description="Basic platform configuration." />
          <CardBody className="space-y-4">
            <Input
              label="Platform name"
              value={form.platform_name}
              onChange={update('platform_name')}
              error={fieldErrors.platform_name}
              required
            />
            <Textarea
              label="Platform description"
              value={form.platform_description}
              onChange={update('platform_description')}
              error={fieldErrors.platform_description}
              rows={3}
            />
            {/* ── Contact page details ─────────────────────────────── */}
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">Contact Information</p>
                <p className="text-xs text-gray-500">
                  Shown on the public Contact page (footer Contact button) — email, phone, location and working hours.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Contact email"
                  type="email"
                  value={form.contact_email}
                  onChange={update('contact_email')}
                  error={fieldErrors.contact_email}
                  placeholder="support@example.com"
                />
                <Input
                  label="Contact phone"
                  value={form.contact_phone}
                  onChange={update('contact_phone')}
                  error={fieldErrors.contact_phone}
                  placeholder="+251 911 234 567"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Location"
                  value={form.contact_location}
                  onChange={update('contact_location')}
                  error={fieldErrors.contact_location}
                  placeholder="Addis Ababa, Ethiopia"
                />
                <Input
                  label="Working hours"
                  value={form.contact_hours}
                  onChange={update('contact_hours')}
                  error={fieldErrors.contact_hours}
                  placeholder="Mon–Fri, 9:00 AM – 6:00 PM (EAT)"
                />
              </div>

              {/* Additional contacts (optional, admin-added) */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Additional contacts</p>
                  <p className="text-xs text-gray-500">
                    Add extra ways for visitors to reach you — e.g. WhatsApp, Telegram, social pages or a second email.
                  </p>
                </div>

                {(form.contact_extras ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-400">
                    No additional contacts yet. Use the button below to add one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(form.contact_extras ?? []).map((extra, i) => (
                      <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <Select
                          label="Type"
                          value={extra.type ?? 'email'}
                          onChange={(e) => updateExtra(i, { type: e.target.value })}
                          error={fieldErrors[`contact_extras.${i}.type`]}
                          className="w-40"
                        >
                          {EXTRA_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </Select>
                        <div className="min-w-40 flex-1">
                          <Input
                            label="Label (optional)"
                            value={extra.label ?? ''}
                            onChange={(e) => updateExtra(i, { label: e.target.value })}
                            error={fieldErrors[`contact_extras.${i}.label`]}
                            placeholder={EXTRA_TYPE_OPTIONS.find((o) => o.value === (extra.type ?? 'email'))?.label}
                          />
                        </div>
                        <div className="min-w-48 flex-1">
                          <Input
                            label="Value"
                            value={extra.value ?? ''}
                            onChange={(e) => updateExtra(i, { value: e.target.value })}
                            error={fieldErrors[`contact_extras.${i}.value`]}
                            placeholder={EXTRA_PLACEHOLDERS[extra.type] ?? 'Value'}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExtra(i)}
                          aria-label="Remove contact"
                          className="mb-1 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button type="button" variant="outline" size="sm" onClick={addExtra}>
                  <Plus className="h-4 w-4" /> Add contact
                </Button>
              </div>

              {/* Social media links (shown in the footer) */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Social media links</p>
                  <p className="text-xs text-gray-500">
                    Shown as icons in the footer — e.g. GitHub, Telegram, Facebook or Instagram. Links with an empty URL are hidden.
                  </p>
                </div>

                {(form.social_links ?? []).length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-400">
                    No social media links yet. Use the button below to add one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(form.social_links ?? []).map((link, i) => (
                      <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <Select
                          label="Platform"
                          value={link.platform ?? 'github'}
                          onChange={(e) => updateSocial(i, { platform: e.target.value })}
                          error={fieldErrors[`social_links.${i}.platform`]}
                          className="w-44"
                        >
                          {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </Select>
                        <div className="min-w-56 flex-1">
                          <Input
                            label="URL"
                            value={link.url ?? ''}
                            onChange={(e) => updateSocial(i, { url: e.target.value })}
                            error={fieldErrors[`social_links.${i}.url`]}
                            placeholder="e.g. github.com/dreammore"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSocial(i)}
                          aria-label="Remove social link"
                          className="mb-1 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button type="button" variant="outline" size="sm" onClick={addSocial}>
                  <Plus className="h-4 w-4" /> Add social link
                </Button>
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select
                label="Default currency"
                value={form.default_currency}
                onChange={update('default_currency')}
                error={fieldErrors.default_currency}
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD (US Dollar)</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* ── Proposal Limits ────────────────────────────────────────── */}
        <Card>
          <CardHeader title="Proposal Limits" description="Control proposal amount boundaries." />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Minimum proposal amount"
                type="number"
                value={form.min_proposal_amount}
                onChange={update('min_proposal_amount')}
                error={fieldErrors.min_proposal_amount}
                hint="Leave empty for no minimum"
              />
              <Input
                label="Maximum proposal amount"
                type="number"
                value={form.max_proposal_amount}
                onChange={update('max_proposal_amount')}
                error={fieldErrors.max_proposal_amount}
                hint="Leave empty for no maximum"
              />
            </div>
          </CardBody>
        </Card>

        {/* ── Access Control ─────────────────────────────────────────── */}
        <Card>
          <CardHeader title="Access Control" description="Control registration and maintenance." />
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">Open Registration</p>
                <p className="text-xs text-gray-500">Allow new users to register on the platform.</p>
              </div>
              <Select
                value={form.registration_open}
                onChange={update('registration_open')}
                error={fieldErrors.registration_open}
                className="w-32"
              >
                <option value="true">Open</option>
                <option value="false">Closed</option>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4">
              <div>
                <p className="text-sm font-semibold text-ink-900">Maintenance Mode</p>
                <p className="text-xs text-gray-500">Temporarily disable public access for maintenance.</p>
              </div>
              <Select
                value={form.maintenance_mode}
                onChange={update('maintenance_mode')}
                error={fieldErrors.maintenance_mode}
                className="w-32"
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* ── Account & Security ─────────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Account & Security"
            description="Manage your admin account email and password."
          />
          <CardBody>
            <Link
              to="/admin/settings/security"
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/30 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <ShieldCheck className="h-5 w-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Account & Security</p>
                  <p className="text-xs text-gray-500">Change your admin email address or password.</p>
                </div>
              </div>
              <span className="text-sm text-brand-600 font-medium">Manage →</span>
            </Link>
          </CardBody>
        </Card>

        {/* ── Featured Listings (Revenue) ────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Featured Listings"
            description="Enable paid listing boosts for jobs and freelancer profiles."
          />
          <CardBody className="space-y-6">
            {/* Featured Jobs */}
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Featured Jobs</p>
                  <p className="text-xs text-gray-500">Allow employers to pay to boost job visibility in search results.</p>
                </div>
                <Select
                  value={form.featured_jobs_enabled}
                  onChange={update('featured_jobs_enabled')}
                  error={fieldErrors.featured_jobs_enabled}
                  className="w-32"
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </Select>
              </div>
              {form.featured_jobs_enabled === 'true' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-brand-200">
                  <Input
                    label="Price per featured job"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.featured_job_price}
                    onChange={update('featured_job_price')}
                    error={fieldErrors.featured_job_price}
                    hint="Amount in ETB"
                  />
                  <Input
                    label="Duration (days)"
                    type="number"
                    min="1"
                    max="90"
                    value={form.featured_job_duration_days}
                    onChange={update('featured_job_duration_days')}
                    error={fieldErrors.featured_job_duration_days}
                    hint="How long the boost lasts"
                  />
                </div>
              )}
            </div>

            {/* Featured Profiles */}
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">Featured Freelancer Profiles</p>
                  <p className="text-xs text-gray-500">Allow freelancers to pay to boost profile visibility in search results.</p>
                </div>
                <Select
                  value={form.featured_profiles_enabled}
                  onChange={update('featured_profiles_enabled')}
                  error={fieldErrors.featured_profiles_enabled}
                  className="w-32"
                >
                  <option value="false">Disabled</option>
                  <option value="true">Enabled</option>
                </Select>
              </div>
              {form.featured_profiles_enabled === 'true' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pl-0 sm:pl-4 border-l-0 sm:border-l-2 sm:border-brand-200">
                  <Input
                    label="Price per featured profile"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.featured_profile_price}
                    onChange={update('featured_profile_price')}
                    error={fieldErrors.featured_profile_price}
                    hint="Amount in ETB"
                  />
                  <Input
                    label="Duration (days)"
                    type="number"
                    min="1"
                    max="90"
                    value={form.featured_profile_duration_days}
                    onChange={update('featured_profile_duration_days')}
                    error={fieldErrors.featured_profile_duration_days}
                    hint="How long the boost lasts"
                  />
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* ── Save Bar ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} disabled={!isDirty}>
            <Save className="h-4 w-4" /> Save Settings
          </Button>
          {savedBadge && (
            <Badge tone="success" size="md">
              Settings saved successfully
            </Badge>
          )}
          {isDirty && !savedBadge && (
            <Badge tone="warning" size="md">
              Unsaved changes
            </Badge>
          )}
        </div>
      </form>
    </div>
  );
}

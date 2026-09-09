import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  Globe,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Lock,
  RotateCcw,
  Plus,
  X,
  Check,
  Building,
  Phone,
  Mail,
  Share2,
  Clock,
  MapPin,
  HelpCircle,
  Percent,
  Calendar,
  AlertCircle
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
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

/** Modern Accessible Toggle Switch */
function ToggleSwitch({ checked, onChange, label, description, disabled }) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all shadow-2xs">
      <div className="space-y-0.5">
        {label && <p className="text-sm font-semibold text-gray-900">{label}</p>}
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
          checked ? 'bg-brand-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

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
 * Backend returns: { general: { ... }, payments: { ... }, access: { ... }, featured: { ... } }
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
    platform_fee_percent: String(grouped.payments?.platform_fee_percent ?? grouped.platform_fee_percent ?? '8'),
    auto_release_days:    String(grouped.payments?.auto_release_days ?? grouped.auto_release_days ?? '14'),
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
  platform_fee_percent: '8',
  auto_release_days: '14',
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

const TABS = [
  { id: 'general', label: 'General & Contact', icon: Globe, description: 'Branding, footer info & social links' },
  { id: 'payments', label: 'Payments & Fees', icon: CreditCard, description: 'Platform fees & auto-release rules' },
  { id: 'access', label: 'Access Control', icon: ShieldCheck, description: 'Registration & maintenance mode' },
  { id: 'featured', label: 'Featured Listings', icon: Sparkles, description: 'Paid job & profile boost options' },
  { id: 'security', label: 'Account Security', icon: Lock, description: 'Admin password & credentials' },
];

export default function AdminSettingsPage() {
  usePageTitle('Platform Settings — Admin');
  const { showToast } = useToast();
  const { refresh: refreshPlatformSettings } = usePlatform();

  const [activeTab, setActiveTab] = useState('general');
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
      setSettings(data);
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
    if (e) e.preventDefault();
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
    const value = e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const toggle = (key) => (checked) => {
    setForm((prev) => ({ ...prev, [key]: checked ? 'true' : 'false' }));
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

  // ── Loading Skeleton ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
          <div className="md:col-span-3 space-y-6">
            <div className="h-96 animate-pulse rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !settings) {
    return <ErrorState title="Unable to load settings" description={error} onRetry={loadSettings} />;
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage global marketplace preferences, fee structures, access controls, and social links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedBadge && (
            <Badge tone="success" size="md" className="flex items-center gap-1.5 py-1 px-3">
              <Check className="h-3.5 w-3.5" /> Saved successfully
            </Badge>
          )}
          <Button
            type="button"
            onClick={handleSave}
            loading={saving}
            disabled={!isDirty}
            className="shadow-xs"
          >
            <Save className="h-4 w-4" /> Save Settings
          </Button>
        </div>
      </div>

      {/* Main Tabbed Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
        {/* Navigation Sidebar Tabs */}
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all shrink-0 md:shrink border ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 border-brand-200 font-semibold shadow-2xs'
                    : 'text-gray-600 border-transparent hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-brand-600' : 'text-gray-400'}`} />
                <div className="hidden md:block overflow-hidden">
                  <p className="text-sm leading-tight truncate">{tab.label}</p>
                  <p className={`text-xs mt-0.5 truncate ${isActive ? 'text-brand-600/80' : 'text-gray-400'}`}>
                    {tab.description}
                  </p>
                </div>
                <span className="md:hidden text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Content Panels */}
        <div className="md:col-span-3 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* ── TAB 1: General Settings ────────────────────────────── */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader
                    title="Platform Identity"
                    description="Configure the primary marketplace name and description displayed across the app."
                  />
                  <CardBody className="space-y-5">
                    <Input
                      label="Platform Name"
                      value={form.platform_name}
                      onChange={update('platform_name')}
                      error={fieldErrors.platform_name}
                      placeholder="Dream More AppWorks"
                      required
                    />
                    <Textarea
                      label="Platform Description"
                      value={form.platform_description}
                      onChange={update('platform_description')}
                      error={fieldErrors.platform_description}
                      placeholder="The premier Ethiopian freelance marketplace connecting top talent with client projects."
                      rows={3}
                    />
                    <div className="w-full sm:w-64 pt-2">
                      <Select
                        label="Default Currency"
                        value={form.default_currency}
                        onChange={update('default_currency')}
                        error={fieldErrors.default_currency}
                      >
                        <option value="ETB">ETB — Ethiopian Birr (Br)</option>
                        <option value="USD">USD — US Dollar ($)</option>
                      </Select>
                    </div>
                  </CardBody>
                </Card>

                {/* Footer & Public Contact Info */}
                <Card>
                  <CardHeader
                    title="Public Contact Information"
                    description="Information shown on the public Contact page (/contact) and platform footer."
                  />
                  <CardBody className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Contact Email"
                        type="email"
                        value={form.contact_email}
                        onChange={update('contact_email')}
                        error={fieldErrors.contact_email}
                        placeholder="support@appworks.et"
                      />
                      <Input
                        label="Contact Phone"
                        value={form.contact_phone}
                        onChange={update('contact_phone')}
                        error={fieldErrors.contact_phone}
                        placeholder="+251 911 234 567"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Location"
                        value={form.contact_location}
                        onChange={update('contact_location')}
                        error={fieldErrors.contact_location}
                        placeholder="Addis Ababa, Ethiopia"
                      />
                      <Input
                        label="Working Hours"
                        value={form.contact_hours}
                        onChange={update('contact_hours')}
                        error={fieldErrors.contact_hours}
                        placeholder="Mon–Fri, 9:00 AM – 6:00 PM (EAT)"
                      />
                    </div>

                    {/* Additional Contact Methods */}
                    <div className="border-t border-gray-100 pt-5 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Additional Contact Channels</p>
                        <p className="text-xs text-gray-500">
                          Add custom communication links such as Telegram support desks, WhatsApp numbers, or secondary emails.
                        </p>
                      </div>

                      {(form.contact_extras ?? []).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400 bg-gray-50/50">
                          No additional contact channels configured. Click below to add one.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(form.contact_extras ?? []).map((extra, i) => (
                            <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                              <Select
                                label="Type"
                                value={extra.type ?? 'email'}
                                onChange={(e) => updateExtra(i, { type: e.target.value })}
                                error={fieldErrors[`contact_extras.${i}.type`]}
                                className="w-36"
                              >
                                {EXTRA_TYPE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </Select>
                              <div className="min-w-36 flex-1">
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
                                  label="Value / Address"
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
                                className="mb-0.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button type="button" variant="outline" size="sm" onClick={addExtra} className="mt-2">
                        <Plus className="h-4 w-4" /> Add Contact Channel
                      </Button>
                    </div>

                    {/* Social Media Links */}
                    <div className="border-t border-gray-100 pt-5 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Social Media Links</p>
                        <p className="text-xs text-gray-500">
                          Configure social media profile links displayed as icons in the footer.
                        </p>
                      </div>

                      {(form.social_links ?? []).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400 bg-gray-50/50">
                          No social profiles added yet. Click below to add your platform handles.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(form.social_links ?? []).map((link, i) => (
                            <div key={i} className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-gray-50/60 p-3.5">
                              <Select
                                label="Platform"
                                value={link.platform ?? 'github'}
                                onChange={(e) => updateSocial(i, { platform: e.target.value })}
                                error={fieldErrors[`social_links.${i}.platform`]}
                                className="w-40"
                              >
                                {SOCIAL_PLATFORM_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </Select>
                              <div className="min-w-56 flex-1">
                                <Input
                                  label="Profile URL"
                                  value={link.url ?? ''}
                                  onChange={(e) => updateSocial(i, { url: e.target.value })}
                                  error={fieldErrors[`social_links.${i}.url`]}
                                  placeholder="e.g. https://telegram.me/dreammore"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSocial(i)}
                                aria-label="Remove social link"
                                className="mb-0.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button type="button" variant="outline" size="sm" onClick={addSocial} className="mt-2">
                        <Plus className="h-4 w-4" /> Add Social Profile
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* ── TAB 2: Payments & Fees ─────────────────────────────── */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader
                    title="Platform Commission & Release Rules"
                    description="Decide the platform percentage fee collected from contract milestones and the auto-release timeframe for unreviewed work."
                  />
                  <CardBody className="space-y-6">
                    {/* Platform Fee Percent Card Input */}
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                            <Percent className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Contract / Milestone Platform Fee</p>
                            <p className="text-xs text-gray-500">
                              Percentage fee automatically deducted from completed contract milestones upon payout.
                            </p>
                          </div>
                        </div>
                        <Badge tone="brand" size="md">
                          Current: {form.platform_fee_percent}%
                        </Badge>
                      </div>

                      <div className="pt-2 max-w-xs">
                        <Input
                          label="Fee Percentage (%)"
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={form.platform_fee_percent}
                          onChange={update('platform_fee_percent')}
                          error={fieldErrors.platform_fee_percent}
                          hint="Allowed range: 0.0% to 50.0%"
                        />
                      </div>
                    </div>

                    {/* Auto-Release Days Input */}
                    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/80 p-5 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <Clock className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Milestone Auto-Release Timeframe</p>
                            <p className="text-xs text-gray-500">
                              If an employer does not approve or request revisions after work is submitted, escrow funds auto-release after this timeframe.
                            </p>
                          </div>
                        </div>
                        <Badge tone="success" size="md">
                          Current: {form.auto_release_days} Days
                        </Badge>
                      </div>

                      <div className="pt-2 max-w-xs">
                        <Input
                          label="Auto-Release Timeframe (Days)"
                          type="number"
                          min="1"
                          max="90"
                          value={form.auto_release_days}
                          onChange={update('auto_release_days')}
                          error={fieldErrors.auto_release_days}
                          hint="Allowed range: 1 to 90 days"
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* ── TAB 3: Access Control ──────────────────────────────── */}
            {activeTab === 'access' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader
                    title="Platform Access & Registration"
                    description="Control account registration policies and toggle global maintenance mode."
                  />
                  <CardBody className="space-y-4">
                    <ToggleSwitch
                      checked={form.registration_open === 'true'}
                      onChange={toggle('registration_open')}
                      label="Open User Registration"
                      description="Allow new freelancers and employers to create accounts on the platform."
                    />

                    <ToggleSwitch
                      checked={form.maintenance_mode === 'true'}
                      onChange={toggle('maintenance_mode')}
                      label="Maintenance Mode"
                      description="Temporarily pause public marketplace access and display a maintenance splash page to non-admin users."
                    />

                    {form.maintenance_mode === 'true' && (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex items-start gap-3 text-amber-800 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                        <div>
                          <p className="font-semibold text-amber-900">Maintenance mode is active</p>
                          <p className="mt-0.5">Only logged-in platform administrators can access administration panels.</p>
                        </div>
                      </div>
                    )}
                  </CardBody>
                </Card>
              </div>
            )}

            {/* ── TAB 4: Featured Listings ───────────────────────────── */}
            {activeTab === 'featured' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader
                    title="Featured Listing Monetization"
                    description="Configure paid listing boosts for job posts and freelancer profile discoverability."
                  />
                  <CardBody className="space-y-6">
                    {/* Featured Jobs */}
                    <div className="space-y-4">
                      <ToggleSwitch
                        checked={form.featured_jobs_enabled === 'true'}
                        onChange={toggle('featured_jobs_enabled')}
                        label="Enable Featured Job Boosts"
                        description="Allow employers to pay a fee to highlight their job postings at the top of search results."
                      />

                      {form.featured_jobs_enabled === 'true' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <Input
                            label="Job Boost Price (ETB)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.featured_job_price}
                            onChange={update('featured_job_price')}
                            error={fieldErrors.featured_job_price}
                            placeholder="150"
                            hint="Price charged to promote a job"
                          />
                          <Input
                            label="Boost Duration (Days)"
                            type="number"
                            min="1"
                            max="90"
                            value={form.featured_job_duration_days}
                            onChange={update('featured_job_duration_days')}
                            error={fieldErrors.featured_job_duration_days}
                            placeholder="7"
                            hint="Number of days the boost remains active"
                          />
                        </div>
                      )}
                    </div>

                    {/* Featured Profiles */}
                    <div className="border-t border-gray-100 pt-5 space-y-4">
                      <ToggleSwitch
                        checked={form.featured_profiles_enabled === 'true'}
                        onChange={toggle('featured_profiles_enabled')}
                        label="Enable Featured Freelancer Profile Boosts"
                        description="Allow freelancers to pay a fee to highlight their profile in talent directory searches."
                      />

                      {form.featured_profiles_enabled === 'true' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
                          <Input
                            label="Profile Boost Price (ETB)"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.featured_profile_price}
                            onChange={update('featured_profile_price')}
                            error={fieldErrors.featured_profile_price}
                            placeholder="100"
                            hint="Price charged to feature a profile"
                          />
                          <Input
                            label="Boost Duration (Days)"
                            type="number"
                            min="1"
                            max="90"
                            value={form.featured_profile_duration_days}
                            onChange={update('featured_profile_duration_days')}
                            error={fieldErrors.featured_profile_duration_days}
                            placeholder="7"
                            hint="Number of days profile boost remains active"
                          />
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* ── TAB 5: Account Security ────────────────────────────── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader
                    title="Admin Account & Credentials"
                    description="Update your administrator login email, password, and security authentication parameters."
                  />
                  <CardBody>
                    <Link
                      to="/admin/settings/security"
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-5 transition-all hover:border-brand-300 hover:bg-brand-50/40 group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                          <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700">
                            Manage Admin Security Settings
                          </p>
                          <p className="text-xs text-gray-500">
                            Change admin email address, reset password, and review active security sessions.
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-brand-600 font-semibold group-hover:translate-x-1 transition-transform">
                        Manage Credentials →
                      </span>
                    </Link>
                  </CardBody>
                </Card>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Floating Sticky Save Bar on Unsaved Changes */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-between gap-4 rounded-2xl bg-gray-900/95 backdrop-blur-md px-6 py-3.5 text-white shadow-2xl border border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-sm font-medium text-gray-200">You have unsaved changes</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setForm(savedFormRef.current);
                setFieldErrors({});
              }}
              className="text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Discard
            </Button>
            <Button
              type="button"
              size="sm"
              loading={saving}
              onClick={handleSave}
              className="bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs"
            >
              <Save className="h-4 w-4" /> Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

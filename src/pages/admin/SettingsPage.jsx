import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Settings, ShieldCheck } from 'lucide-react';
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

/**
 * Flatten grouped settings from the backend into a single form object.
 * Backend returns: { general: { ... }, payments: { ... }, access: { ... } }
 */
function flattenSettings(grouped) {
  if (!grouped) return {};
  return {
    platform_name:        grouped.general?.platform_name ?? '',
    platform_description: grouped.general?.platform_description ?? '',
    support_email:        grouped.general?.support_email ?? '',
    default_currency:     grouped.payments?.default_currency ?? 'ETB',
    min_proposal_amount:  grouped.payments?.min_proposal_amount ?? '',
    max_proposal_amount:  grouped.payments?.max_proposal_amount ?? '',
    platform_fee_percent: grouped.platform_fee_percent ?? grouped.payments?.platform_fee_percent ?? '8',
    auto_approve_days:    grouped.auto_approve_days ?? grouped.payments?.auto_approve_days ?? '5',
    registration_open:    String(grouped.access?.registration_open ?? 'true'),
    maintenance_mode:     String(grouped.access?.maintenance_mode ?? 'false'),
  };
}

const INITIAL_FORM = {
  platform_name: '',
  platform_description: '',
  support_email: '',
  default_currency: 'ETB',
  min_proposal_amount: '',
  max_proposal_amount: '',
  platform_fee_percent: '8',
  auto_approve_days: '5',
  registration_open: 'true',
  maintenance_mode: 'false',
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
            <Input
              label="Support email"
              type="email"
              value={form.support_email}
              onChange={update('support_email')}
              error={fieldErrors.support_email}
            />
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

        {/* ── Escrow & Platform Fee ───────────────────────────────────── */}
        <Card>
          <CardHeader
            title="Escrow & Platform Fee"
            description="Configure the platform commission percentage deducted upon milestone release and auto-approval timer."
          />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Platform Fee Percentage (%)"
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={form.platform_fee_percent}
                onChange={update('platform_fee_percent')}
                error={fieldErrors.platform_fee_percent}
                hint="Deducted automatically from freelancer payout (0% to 50%). Default: 8%"
                required
              />
              <Input
                label="Auto-Approve Submitted Milestones (Days)"
                type="number"
                min="1"
                max="30"
                value={form.auto_approve_days}
                onChange={update('auto_approve_days')}
                error={fieldErrors.auto_approve_days}
                hint="Days before submitted deliverables auto-release if unreviewed. Default: 5 days"
                required
              />
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

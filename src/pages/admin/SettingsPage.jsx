import { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function AdminSettingsPage() {
  usePageTitle('Platform Settings — Admin');

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    platform_name: '',
    platform_description: '',
    support_email: '',
    default_currency: 'ETB',
    min_proposal_amount: '',
    max_proposal_amount: '',
    registration_open: 'true',
    maintenance_mode: 'false',
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await adminService.getSettings();
      const data = response.data ?? response;
      setSettings(data);
      setForm({
        platform_name: data.platform_name ?? data.platformName ?? '',
        platform_description: data.platform_description ?? data.platformDescription ?? '',
        support_email: data.support_email ?? data.supportEmail ?? '',
        default_currency: data.default_currency ?? data.defaultCurrency ?? 'ETB',
        min_proposal_amount: data.min_proposal_amount ?? data.minProposalAmount ?? '',
        max_proposal_amount: data.max_proposal_amount ?? data.maxProposalAmount ?? '',
        registration_open: String(data.registration_open ?? data.registrationOpen ?? 'true'),
        maintenance_mode: String(data.maintenance_mode ?? data.maintenanceMode ?? 'false'),
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load settings.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await adminService.updateSettings(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save settings.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-96 animate-pulse rounded-card border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error && !settings) {
    return <ErrorState title="Unable to load settings" description={error} onRetry={loadSettings} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900">Platform Settings</h1>
        <p className="text-sm text-gray-500">
          Configure global platform settings and behavior.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* General */}
        <Card>
          <CardHeader title="General" description="Basic platform configuration." />
          <CardBody className="space-y-4">
            <Input
              label="Platform name"
              value={form.platform_name}
              onChange={(e) => setForm({ ...form, platform_name: e.target.value })}
            />
            <Textarea
              label="Platform description"
              value={form.platform_description}
              onChange={(e) => setForm({ ...form, platform_description: e.target.value })}
              rows={3}
            />
            <Input
              label="Support email"
              type="email"
              value={form.support_email}
              onChange={(e) => setForm({ ...form, support_email: e.target.value })}
            />
            <div className="w-full sm:w-48">
              <Select
                label="Default currency"
                value={form.default_currency}
                onChange={(e) => setForm({ ...form, default_currency: e.target.value })}
              >
                <option value="ETB">ETB (Ethiopian Birr)</option>
                <option value="USD">USD (US Dollar)</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Proposal limits */}
        <Card>
          <CardHeader title="Proposal Limits" description="Control proposal amount boundaries." />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Minimum proposal amount"
                type="number"
                value={form.min_proposal_amount}
                onChange={(e) => setForm({ ...form, min_proposal_amount: e.target.value })}
                hint="Leave empty for no minimum"
              />
              <Input
                label="Maximum proposal amount"
                type="number"
                value={form.max_proposal_amount}
                onChange={(e) => setForm({ ...form, max_proposal_amount: e.target.value })}
                hint="Leave empty for no maximum"
              />
            </div>
          </CardBody>
        </Card>

        {/* Access control */}
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
                onChange={(e) => setForm({ ...form, registration_open: e.target.value })}
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
                onChange={(e) => setForm({ ...form, maintenance_mode: e.target.value })}
                className="w-32"
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </Select>
            </div>
          </CardBody>
        </Card>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving}>
            <Save className="h-4 w-4" /> Save Settings
          </Button>
          {success && (
            <Badge tone="success" size="md">
              Settings saved successfully
            </Badge>
          )}
        </div>
      </form>
    </div>
  );
}

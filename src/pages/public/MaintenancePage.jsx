import { Settings } from 'lucide-react';
import { usePlatform } from '../../hooks/usePlatform';
import { usePageTitle } from '../../hooks/usePageTitle';

/**
 * Maintenance mode page.
 *
 * Displayed to public users when the platform is under maintenance.
 * Admin users can still access the admin panel to manage settings.
 */
export default function MaintenancePage() {
  usePageTitle('Maintenance Mode');
  const { settings } = usePlatform();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
          <Settings className="h-8 w-8 text-warning-600 animate-spin" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-900">
          Under Maintenance
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          {settings.platform_name || 'Dream More AppWorks'} is currently undergoing scheduled maintenance.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          We'll be back online shortly. Thank you for your patience.
        </p>
        <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Need urgent support? Contact us at{' '}
            <a
              href={`mailto:${settings.contact_email || 'support@appworks.et'}`}
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              {settings.contact_email || 'support@appworks.et'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

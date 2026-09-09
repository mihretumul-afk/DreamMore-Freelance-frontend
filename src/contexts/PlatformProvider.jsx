import { useCallback, useEffect, useState } from 'react';
import { PlatformContext } from './PlatformContext';
import { platformService } from '../services/platformService';
import { setPlatformCurrency } from '../utils/format';

const DEFAULT_SETTINGS = {
  platform_name: 'Dream More AppWorks',
  platform_description: 'The Ethiopian freelance marketplace',
  contact_email: 'support@appworks.et',
  contact_phone: '+251 911 234 567',
  contact_location: 'Addis Ababa, Ethiopia',
  contact_hours: 'Mon–Fri, 9:00 AM – 6:00 PM (EAT)',
  contact_extras: [],
  social_links: [],
  default_currency: 'ETB',
  registration_open: true,
  maintenance_mode: false,
  platform_fee_percent: 8,
  auto_release_days: 14,
};

/**
 * Platform settings provider.
 *
 * Fetches platform configuration on mount and provides it to the entire
 * application via PlatformContext. Falls back to defaults if the request
 * fails.
 */
export function PlatformProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await platformService.getSettings();
      const data = response.data ?? response;
      const currency = data.default_currency ?? DEFAULT_SETTINGS.default_currency;
      setSettings({
        platform_name: data.platform_name ?? DEFAULT_SETTINGS.platform_name,
        platform_description: data.platform_description ?? DEFAULT_SETTINGS.platform_description,
        contact_email: data.contact_email ?? DEFAULT_SETTINGS.contact_email,
        contact_phone: data.contact_phone ?? DEFAULT_SETTINGS.contact_phone,
        contact_location: data.contact_location ?? DEFAULT_SETTINGS.contact_location,
        contact_hours: data.contact_hours ?? DEFAULT_SETTINGS.contact_hours,
        contact_extras: Array.isArray(data.contact_extras) ? data.contact_extras : [],
        social_links: Array.isArray(data.social_links) ? data.social_links : [],
        default_currency: currency,
        registration_open: data.registration_open ?? DEFAULT_SETTINGS.registration_open,
        maintenance_mode: data.maintenance_mode ?? DEFAULT_SETTINGS.maintenance_mode,
        platform_fee_percent: data.platform_fee_percent ?? 8,
        auto_release_days: data.auto_release_days ?? 14,
        featured_jobs_enabled: data.featured_jobs_enabled ?? false,
        featured_profiles_enabled: data.featured_profiles_enabled ?? false,
      });
      // Push currency into the format.js cache so formatETB() uses it everywhere
      setPlatformCurrency(currency);
    } catch {
      // Use defaults on failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <PlatformContext.Provider value={{ settings, loading, refresh: fetchSettings }}>
      {children}
    </PlatformContext.Provider>
  );
}

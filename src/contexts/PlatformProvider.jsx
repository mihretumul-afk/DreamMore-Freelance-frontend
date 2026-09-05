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
  min_proposal_amount: '',
  max_proposal_amount: '',
  registration_open: true,
  maintenance_mode: false,
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
        min_proposal_amount: data.min_proposal_amount ?? DEFAULT_SETTINGS.min_proposal_amount,
        max_proposal_amount: data.max_proposal_amount ?? DEFAULT_SETTINGS.max_proposal_amount,
        registration_open: data.registration_open ?? DEFAULT_SETTINGS.registration_open,
        maintenance_mode: data.maintenance_mode ?? DEFAULT_SETTINGS.maintenance_mode,
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

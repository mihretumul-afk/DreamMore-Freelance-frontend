import { useCallback, useEffect, useState } from 'react';
import { PlatformContext } from './PlatformContext';
import { platformService } from '../services/platformService';

const DEFAULT_SETTINGS = {
  platform_name: 'Dream More AppWorks',
  platform_description: 'The Ethiopian freelance marketplace',
  support_email: 'support@dreammore.com',
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
      setSettings({
        platform_name: data.platform_name ?? DEFAULT_SETTINGS.platform_name,
        platform_description: data.platform_description ?? DEFAULT_SETTINGS.platform_description,
        support_email: data.support_email ?? DEFAULT_SETTINGS.support_email,
        default_currency: data.default_currency ?? DEFAULT_SETTINGS.default_currency,
        min_proposal_amount: data.min_proposal_amount ?? DEFAULT_SETTINGS.min_proposal_amount,
        max_proposal_amount: data.max_proposal_amount ?? DEFAULT_SETTINGS.max_proposal_amount,
        registration_open: data.registration_open ?? DEFAULT_SETTINGS.registration_open,
        maintenance_mode: data.maintenance_mode ?? DEFAULT_SETTINGS.maintenance_mode,
      });
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

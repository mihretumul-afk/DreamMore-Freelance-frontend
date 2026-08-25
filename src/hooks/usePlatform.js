import { useContext } from 'react';
import { PlatformContext } from '../contexts/PlatformContext';

/**
 * Access platform-wide settings (name, description, currency, etc.).
 *
 * Must be used inside <PlatformProvider>.
 */
export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a <PlatformProvider>.');
  }
  return context;
}

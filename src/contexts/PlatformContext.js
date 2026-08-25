import { createContext } from 'react';

/**
 * Platform settings context.
 *
 * Provides platform-wide configuration (name, description, currency,
 * registration status, maintenance mode) to the entire application.
 */
export const PlatformContext = createContext(null);

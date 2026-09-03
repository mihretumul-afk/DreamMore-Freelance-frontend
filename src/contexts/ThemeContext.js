import { createContext } from 'react';

/**
 * Context for managing light / night (dark) theme state across the application.
 */
export const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

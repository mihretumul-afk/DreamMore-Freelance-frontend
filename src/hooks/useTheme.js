import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/**
 * Access light/night theme state and toggle handler.
 * Must be used within <ThemeProvider>.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a <ThemeProvider>.');
  }
  return context;
}

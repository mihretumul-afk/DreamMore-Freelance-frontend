import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n';
import { cn } from '../../utils/cn';

/**
 * Night mode / Light mode toggle button.
 */
export default function ThemeToggle({ className, showLabel = false }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useI18n();

  const label = isDark ? t('nav.themeLight') : t('nav.themeDark');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg p-2 text-slate-600 transition-colors dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-brand-500',
        className,
      )}
      aria-label={t('nav.toggleTheme')}
      title={label}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400 transition-transform hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-slate-600 transition-transform hover:-rotate-12 dark:text-slate-300" aria-hidden="true" />
      )}
      {showLabel && <span className="text-sm font-semibold">{label}</span>}
    </button>
  );
}

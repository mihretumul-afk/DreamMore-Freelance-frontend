import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useI18n, LANGUAGES } from '../../i18n';
import { cn } from '../../utils/cn';

/**
 * Accessible language selector (English / አማርኛ) for the navbar.
 *
 * - Trigger announces itself and its expanded state (aria-haspopup/expanded).
 * - Options are listbox items with aria-selected; the active language is
 *   communicated both by the checkmark and by aria-selected (never color alone).
 * - Escape closes and returns focus to the trigger; outside clicks dismiss.
 * - The selection persists via the I18nProvider (localStorage).
 *
 * @param {'dark' | 'light'} variant Dark renders on the ink navbar; light is
 *   for lighter surfaces.
 */
export default function LanguageSelector({ variant = 'dark', className }) {
  const { language, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const activeLanguage = LANGUAGES[language] ?? LANGUAGES.en;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.label')}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors',
          variant === 'dark'
            ? 'text-slate-200 hover:bg-white/10 hover:text-white'
            : 'text-ink-700 hover:bg-gray-100 hover:text-ink-900',
        )}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        {activeLanguage.short}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          aria-label={t('lang.label')}
          className="absolute right-0 top-full z-50 mt-2 w-44 origin-top-right rounded-card border border-gray-200 bg-white py-1.5 shadow-elevated"
        >
          {Object.entries(LANGUAGES).map(([code, meta]) => {
            const selected = code === language;
            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setLanguage(code);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm font-medium transition-colors',
                  selected ? 'text-brand-600' : 'text-ink-700 hover:bg-gray-50 hover:text-ink-900',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {meta.short}
                  </span>
                  {meta.label}
                </span>
                {selected && (
                  <Check className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

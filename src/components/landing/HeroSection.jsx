import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BadgeCheck, ShieldCheck, Banknote, MapPin } from 'lucide-react';
import Container from '../common/Container';
import Button from '../ui/Button';
import { useI18n } from '../../i18n';
import { cn } from '../../utils/cn';

const TRUST_BULLETS = [
  { icon: BadgeCheck, key: 'hero.verifiedTalent' },
  { icon: ShieldCheck, key: 'hero.secureContracts' },
  { icon: Banknote, key: 'hero.milestonePayments' },
  { icon: MapPin, key: 'hero.globalReach' },
];

/** Dream More brand categories for quick-search pills. */
const CATEGORY_PILLS = [
  { label: 'Web Development', slug: 'web-development' },
  { label: 'Graphics Design', slug: 'graphic-design' },
  { label: 'Video Editing', slug: 'video-editing' },
  { label: 'Content Creation', slug: 'content-creation' },
  { label: 'AI Training', slug: 'ai-training' },
  { label: 'Digital Marketing', slug: 'digital-marketing' },
  { label: 'UI/UX Design', slug: 'ui-ux-design' },
];

/**
 * HeroSection — transparent background so it can sit on top of a video
 * (VideoShowcase). Light/white text for contrast over dark footage.
 * Hire/work mode switch with real navigation, search bar, and category pills.
 * Spacing tightened to keep total height short.
 */
export default function HeroSection() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('hire'); // 'hire' | 'work'

  // ── Search ─────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (event) => {
      event.preventDefault();
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      const qs = params.toString();
      navigate(qs ? `/jobs?${qs}` : '/jobs');
    },
    [query, navigate],
  );

  // ── Mode navigation ────────────────────────────────────────────
  const handleModeChange = useCallback(
    (newMode) => {
      setMode(newMode);
      if (newMode === 'work') {
        navigate('/jobs');
      } else {
        navigate('/freelancers');
      }
    },
    [navigate],
  );

  const handleCategoryClick = useCallback(
    (slug) => {
      navigate(`/jobs?search=${encodeURIComponent(slug)}`);
    },
    [navigate],
  );

  // ── Mode-aware copy ────────────────────────────────────────────
  const searchPlaceholder =
    mode === 'hire'
      ? 'Search for talent, skills, or services...'
      : 'Find jobs in web development, design, AI, video editing...';

  return (
    <section className="relative" aria-label="Hero">
      <Container className="relative py-6 lg:py-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
            {t('hero.badge')}
          </span>

          {/* Headline */}
          <h1 className="mt-4 animate-fade-up text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl" style={{ animationDelay: '80ms' }}>
            {t('hero.title1')}
            <span className="block text-brand-400">{t('hero.title2')}</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-3 max-w-2xl animate-fade-up text-sm leading-relaxed text-white/85 sm:text-base" style={{ animationDelay: '160ms' }}>
            {t('hero.description')}
          </p>

          {/* ── Hire / Work Mode Switch ───────────────────────── */}
          <div
            className="mt-5 inline-flex animate-fade-up rounded-xl border border-white/25 bg-white/10 p-1 backdrop-blur-sm"
            style={{ animationDelay: '240ms' }}
            role="group"
            aria-label="Choose mode"
          >
            <button
              type="button"
              onClick={() => handleModeChange('hire')}
              aria-pressed={mode === 'hire'}
              className={cn(
                'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200',
                mode === 'hire'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/15',
              )}
            >
              {t('hero.findTalent')}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('work')}
              aria-pressed={mode === 'work'}
              className={cn(
                'flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200',
                mode === 'work'
                  ? 'bg-brand-500 text-white shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/15',
              )}
            >
              {t('hero.findJobs')}
            </button>
          </div>

          {/* ── Search Bar (stays solid white — keeps it usable/legible) ── */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-5 max-w-2xl animate-fade-up"
            role="search"
            style={{ animationDelay: '320ms' }}
          >
            <div className="rounded-2xl border border-white/40 bg-white p-2 shadow-2xl transition-shadow duration-200 focus-within:shadow-2xl">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-2 px-2">
                  <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={t('hero.searchAria')}
                    className="w-full bg-transparent py-2 text-sm text-ink-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
                <Button type="submit" className="shrink-0">
                  {t('hero.search')}
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/70">{t('hero.searchHint')}</p>
          </form>

          {/* ── Category Pills ────────────────────────────────── */}
          <div
            className="mt-5 flex animate-fade-up flex-wrap items-center justify-center gap-2"
            style={{ animationDelay: '400ms' }}
          >
            {CATEGORY_PILLS.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                onClick={() => handleCategoryClick(cat.slug)}
                className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/60 hover:bg-white/20"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Trust bullets */}
          <ul
            className="mt-5 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2"
            style={{ animationDelay: '480ms' }}
          >
            {TRUST_BULLETS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.key}
                  className="flex items-center gap-2 text-sm font-medium text-white/85"
                >
                  <Icon className="h-4 w-4 text-brand-400" aria-hidden="true" />
                  {t(item.key)}
                </li>
              );
            })}
          </ul>
        </div>
      </Container>
    </section>
  );
}
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BadgeCheck, ShieldCheck, Banknote, MapPin, ChevronDown } from 'lucide-react';
import Container from '../common/Container';
import Button from '../ui/Button';
import { useI18n } from '../../i18n';

const TRUST_BULLETS = [
  { icon: BadgeCheck, key: 'hero.verifiedTalent' },
  { icon: ShieldCheck, key: 'hero.secureContracts' },
  { icon: Banknote, key: 'hero.milestonePayments' },
  { icon: MapPin, key: 'hero.globalReach' },
];

/** Stable internal value for the "all locations" option (independent of language). */
const ALL_LOCATIONS = '__all__';

export default function HeroSection() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(ALL_LOCATIONS);
  const navigate = useNavigate();

  // Only send query params the job API actually accepts: search + location.
  const handleSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (location !== ALL_LOCATIONS) params.set('location', location);
    const qs = params.toString();
    navigate(qs ? `/jobs?${qs}` : '/jobs');
  };

  const selectClass =
    'appearance-none bg-transparent pr-6 text-sm text-gray-500 focus:outline-none';

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Ambient brand glows (subtle, light) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-500/[0.06] blur-3xl"
      />

      <Container className="relative py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-brand-600">
            {t('hero.badge')}
          </span>

          <h1
            className="mt-6 animate-fade-up text-4xl font-extrabold leading-tight tracking-tight text-ink-900 sm:text-5xl lg:text-6xl"
            style={{ animationDelay: '80ms' }}
          >
            {t('hero.title1')}
            <span className="block text-brand-500">{t('hero.title2')}</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl animate-fade-up text-base leading-relaxed text-gray-500 sm:text-lg"
            style={{ animationDelay: '160ms' }}
          >
            {t('hero.description')}
          </p>

          <div
            className="mt-8 flex animate-fade-up flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: '240ms' }}
          >
            <Button as="a" href="/freelancers" size="lg" className="w-full sm:w-auto">
              {t('hero.findTalent')}
            </Button>
            <Button as="a" href="/jobs" variant="outline" size="lg" className="w-full sm:w-auto">
              {t('hero.findJobs')}
            </Button>
          </div>

          {/* Search — keyword plus visual location control */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 max-w-2xl animate-fade-up"
            role="search"
            style={{ animationDelay: '320ms' }}
          >
            <div className="rounded-2xl border border-gray-200 bg-white p-2 shadow-card transition-shadow duration-200 focus-within:shadow-card-hover">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex flex-1 items-center gap-2 px-2">
                  <Search className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('hero.searchPlaceholder')}
                    aria-label={t('hero.searchAria')}
                    className="w-full bg-transparent py-2 text-sm text-ink-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 border-t border-gray-100 px-2 pt-2 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                  <div className="relative">
                    <select
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      aria-label={t('hero.filterLocation')}
                      className={selectClass}
                    >
                      <option value={ALL_LOCATIONS}>{t('hero.allLocations')}</option>
                      <option>Addis Ababa</option>
                      <option>Hawassa</option>
                      <option>Dire Dawa</option>
                      <option>Bahir Dar</option>
                      <option>Remote</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <Button type="submit" className="shrink-0">
                  {t('hero.search')}
                </Button>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400">{t('hero.searchHint')}</p>
          </form>

          {/* Trust bullets */}
          <ul
            className="mt-10 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-3"
            style={{ animationDelay: '400ms' }}
          >
            {TRUST_BULLETS.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.key}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500"
                >
                  <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
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

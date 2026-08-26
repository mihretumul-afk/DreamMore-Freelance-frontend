import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, X, Search, Briefcase } from 'lucide-react';
import Logo from '../common/Logo';
import Button from '../ui/Button';
import Avatar from '../marketplace/Avatar';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import LanguageSelector from '../common/LanguageSelector';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { categoryService } from '../../services/categoryService';
import { getNavPaths, ROLE_LABELS } from '../../utils/auth';
import { cn } from '../../utils/cn';

// ────────────────────────────────────────────────────────────────────
// Category Dropdown (supports light / dark variant)
// ────────────────────────────────────────────────────────────────────
function CategoryDropdown({ label, toPrefix, variant = 'dark' }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);

  const fetchCategories = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    setError(null);
    try {
      const res = await categoryService.getCategories();
      if (res.success) {
        setCategories(res.data ?? []);
        setLoaded(true);
      } else {
        setError('Failed to load');
      }
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const openMenu = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
    fetchCategories();
  }, [fetchCategories]);

  const closeMenu = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  }, []);

  const cancelClose = useCallback(() => {
    clearTimeout(timeoutRef.current);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          variant === 'light'
            ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            : 'text-slate-300 hover:bg-white/5 hover:text-white',
        )}
      >
        {label}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          onMouseEnter={cancelClose}
          onMouseLeave={closeMenu}
          className="absolute left-0 top-full z-50 mt-1 min-w-[420px] rounded-xl border border-white/10 bg-ink-900 p-3 shadow-xl"
        >
          {loading && (
            <div className="px-3 py-6 text-center text-sm text-gray-400">{t('common.loadingCategories')}</div>
          )}
          {error && (
            <div className="px-3 py-4 text-center text-sm text-red-400">
              {error}
              <button
                type="button"
                onClick={fetchCategories}
                className="ml-2 underline hover:text-red-300"
              >
                {t('common.retry')}
              </button>
            </div>
          )}
          {!loading && !error && categories.length > 0 && (
            <div className="grid grid-cols-2 gap-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`${toPrefix}?category_id=${cat.id}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <span className="font-medium">{cat.name}</span>
                  {cat.skills_count != null && cat.skills_count > 0 && (
                    <span className="ml-1 text-xs opacity-50">({cat.skills_count})</span>
                  )}
                </Link>
              ))}
            </div>
          )}
          {!loading && !error && categories.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-gray-400">{t('categories.noCategories')}</div>
          )}
          {/* View All link */}
          <div className="mt-2 border-t border-white/10 pt-2">
            <Link
              to={toPrefix}
              onClick={() => setOpen(false)}
              className="flex items-center gap-1 text-sm font-semibold text-brand-400 hover:text-brand-300"
            >
              {t('common.viewAll')} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Main Navbar — always black/dark
// ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileJobsOpen, setMobileJobsOpen] = useState(false);
  const [mobileTalentOpen, setMobileTalentOpen] = useState(false);
  const [mobileJobsCats, setMobileJobsCats] = useState([]);
  const [mobileTalentCats, setMobileTalentCats] = useState([]);
  const [mobileJobsLoading, setMobileJobsLoading] = useState(false);
  const [mobileTalentLoading, setMobileTalentLoading] = useState(false);
  const drawerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { dashboardPath, profilePath } = getNavPaths(user?.role, user);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMenuOpen(false);
    setMobileJobsOpen(false);
    setMobileTalentOpen(false);
  }, [location.pathname]);

  // Drawer: Escape to close, focus trap, scroll lock
  useEffect(() => {
    if (!menuOpen) return undefined;
    const drawer = drawerRef.current;
    const focusables = drawer?.querySelectorAll(
      'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusables?.[0];
    const last = focusables?.[focusables.length - 1];
    drawer?.querySelector('[data-close-menu]')?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (event.key === 'Tab' && focusables?.length) {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const loadMobileCategories = async (type) => {
    const setCategories = type === 'jobs' ? setMobileJobsCats : setMobileTalentCats;
    const setLoading = type === 'jobs' ? setMobileJobsLoading : setMobileTalentLoading;
    const categories = type === 'jobs' ? mobileJobsCats : mobileTalentCats;
    const isLoading = type === 'jobs' ? mobileJobsLoading : mobileTalentLoading;
    if (categories.length > 0 || isLoading) return;
    setLoading(true);
    try {
      const res = await categoryService.getCategories();
      if (res.success) setCategories(res.data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const toggleMobileJobs = () => {
    setMobileJobsOpen((v) => !v);
    if (!mobileJobsOpen) loadMobileCategories('jobs');
  };

  const toggleMobileTalent = () => {
    setMobileTalentOpen((v) => !v);
    if (!mobileTalentOpen) loadMobileCategories('talent');
  };

  // ── Landing page detection ──
  const isLanding = location.pathname === '/';

  // ── Desktop link styles ──
  const authLinkClass = ({ isActive }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isLanding
        ? isActive
          ? 'bg-slate-100 text-slate-900'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        : isActive
          ? 'bg-white/10 text-white'
          : 'text-slate-300 hover:bg-white/5 hover:text-white',
    );

  return (
    <header className={cn(
      'sticky top-0 z-50 border-b',
      isLanding
        ? 'border-slate-200 bg-white'
        : 'border-white/10 bg-ink-950',
    )}>
      <nav
        aria-label={t('nav.main')}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8"
      >
        {/* Brand */}
        <Link to="/" aria-label={t('nav.home')} className="shrink-0">
          <Logo variant={isLanding ? 'dark' : 'light'} />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {user ? (
            <>
              <NavLink to="/jobs" className={authLinkClass}>
                {t('nav.findJobs')}
              </NavLink>
              <NavLink to="/freelancers" className={authLinkClass}>
                {t('nav.findTalent')}
              </NavLink>
            </>
          ) : (
            <>
              <CategoryDropdown label={t('nav.findJobs')} toPrefix="/jobs" variant={isLanding ? 'light' : 'dark'} />
              <CategoryDropdown label={t('nav.findTalent')} toPrefix="/freelancers" variant={isLanding ? 'light' : 'dark'} />
            </>
          )}
        </div>

        {/* Desktop right side */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSelector variant={isLanding ? 'light' : 'dark'} />
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Button as={Link} to="/login" variant={isLanding ? 'outline' : 'nav'} size="sm">
                {t('nav.signIn')}
              </Button>
              <Button as={Link} to="/register" size="sm">
                {t('nav.signUp')}
              </Button>
            </>
          )}
        </div>

        {/* Mobile right controls */}
        <div className="flex items-center gap-1.5 md:hidden">
          {user && <NotificationBell />}
          <button
            type="button"
            className={cn(
              'rounded-lg p-2 transition-colors',
              isLanding
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-200 hover:bg-white/10 hover:text-white',
            )}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        id="mobile-menu"
        ref={drawerRef}
        inert={!menuOpen}
        aria-hidden={!menuOpen}
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink-950/60 backdrop-blur-sm transition-opacity duration-200',
            menuOpen ? 'opacity-100' : 'opacity-0',
          )}
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.mobileNav')}
          className={cn(
            'absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto bg-ink-950 shadow-2xl transition-transform duration-200 ease-out',
            menuOpen ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          {/* Mobile drawer header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <Link to="/" onClick={() => setMenuOpen(false)} aria-label={t('nav.home')}>
              <Logo variant="light" markClassName="h-8" />
            </Link>
            <div className="flex items-center gap-1">
              <LanguageSelector variant="dark" />
              <button
                type="button"
                data-close-menu
                onClick={() => setMenuOpen(false)}
                aria-label={t('nav.closeMenu')}
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Mobile nav links */}
          <nav aria-label={t('nav.mobile')} className="flex-1 space-y-1 px-3 py-4">
            {/* Find Jobs — expandable */}
            <div>
              <button
                type="button"
                onClick={toggleMobileJobs}
                aria-expanded={mobileJobsOpen}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 opacity-50" aria-hidden="true" />
                  {t('nav.findJobs')}
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', mobileJobsOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {mobileJobsOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/10 pl-3">
                  <Link
                    to="/jobs"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
                  >
                    All Jobs
                  </Link>
                  {mobileJobsLoading ? (
                    <div className="px-3 py-2 text-xs text-gray-400">Loading…</div>
                  ) : (
                    mobileJobsCats.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/jobs?category_id=${cat.id}`}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                      >
                        {cat.name}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Find Talent — expandable */}
            <div>
              <button
                type="button"
                onClick={toggleMobileTalent}
                aria-expanded={mobileTalentOpen}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4 opacity-50" aria-hidden="true" />
                  {t('nav.findTalent')}
                </span>
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', mobileTalentOpen && 'rotate-180')}
                  aria-hidden="true"
                />
              </button>
              {mobileTalentOpen && (
                <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/10 pl-3">
                  <Link
                    to="/freelancers"
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
                  >
                    All Talent
                  </Link>
                  {mobileTalentLoading ? (
                    <div className="px-3 py-2 text-xs text-gray-400">Loading…</div>
                  ) : (
                    mobileTalentCats.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/freelancers?category_id=${cat.id}`}
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                      >
                        {cat.name}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile drawer footer */}
          <div className="space-y-2 border-t border-white/10 px-3 py-4">
            {user ? (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <Avatar name={user.name} src={user.avatar} size="sm" variant="brand" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{user.name}</p>
                    <p className="truncate text-xs text-slate-400">
                      {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                  </div>
                </div>
                {dashboardPath && (
                  <Button as={Link} to={dashboardPath} className="w-full" size="sm">
                    {t('nav.dashboard')}
                  </Button>
                )}
                {profilePath && (
                  <Button as={Link} to={profilePath} variant="outline" className="w-full" size="sm">
                    {t('nav.profile')}
                  </Button>
                )}
                <Button variant="outline" className="w-full" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" aria-hidden="true" /> {t('nav.signOut')}
                </Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/login" variant="outline" className="w-full" size="sm">
                  {t('nav.signIn')}
                </Button>
                <Button as={Link} to="/register" className="w-full" size="sm">
                  {t('nav.signUp')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

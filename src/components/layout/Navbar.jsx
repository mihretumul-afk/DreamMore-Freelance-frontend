import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import Logo from '../common/Logo';
import Button from '../ui/Button';
import Avatar from '../marketplace/Avatar';
import UserMenu from './UserMenu';
import LanguageSelector from '../common/LanguageSelector';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { PUBLIC_NAV_LINKS, INFO_NAV_LINKS } from '../../constants/navigation';
import { getNavPaths, ROLE_LABELS } from '../../utils/auth';
import { cn } from '../../utils/cn';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { dashboardPath, profilePath } = getNavPaths(user?.role);

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Drawer: Escape to close, focus first control, simple Tab trap, scroll lock.
  useEffect(() => {
    if (!menuOpen) return undefined;

    const drawer = drawerRef.current;
    const focusables = drawer?.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
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

  const desktopLinkClass = ({ isActive }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white',
    );

  const mobileLinkClass =
    'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5 hover:text-white';

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink-950">
      <nav
        aria-label={t('nav.main')}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8"
      >
        {/* Brand */}
        <Link to="/" aria-label={t('nav.home')} className="shrink-0">
          <Logo variant="light" />
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {PUBLIC_NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={desktopLinkClass}>
              {t(link.key)}
            </NavLink>
          ))}
          {INFO_NAV_LINKS.map((link) => (
            <Link key={link.key} to={link.to} className={desktopLinkClass({ isActive: false })}>
              {t(link.key)}
            </Link>
          ))}
        </div>

        {/* Desktop right side: language + auth */}
        <div className="hidden items-center gap-2 md:flex">
          <LanguageSelector variant="dark" />
          {user ? (
            <UserMenu />
          ) : (
            <>
              <Button as={Link} to="/login" variant="nav" size="sm">
                {t('nav.signIn')}
              </Button>
              <Button as={Link} to="/register" size="sm">
                {t('nav.signUp')}
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-slate-200 transition-colors hover:bg-white/10 hover:text-white md:hidden"
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
      </nav>

      {/* Mobile drawer — always mounted so transitions can animate; inert when closed */}
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

          <nav aria-label={t('nav.mobile')} className="flex-1 space-y-1 px-3 py-4">
            {PUBLIC_NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => cn(mobileLinkClass, isActive && 'bg-white/10 text-white')}
              >
                {t(link.key)}
              </NavLink>
            ))}
            {INFO_NAV_LINKS.map((link) => (
              <Link key={link.key} to={link.to} className={mobileLinkClass}>
                {t(link.key)}
              </Link>
            ))}
          </nav>

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

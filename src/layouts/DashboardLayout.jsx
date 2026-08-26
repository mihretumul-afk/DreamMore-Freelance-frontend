import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import Logo from '../components/common/Logo';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import { notificationService } from '../services/notificationService';
import { FREELANCER_NAV_LINKS, EMPLOYER_NAV_LINKS } from '../constants/navigation';
import { cn } from '../utils/cn';

const COLLAPSED_KEY = 'appworks_sidebar_collapsed';

/**
 * DashboardLayout — modern app-shell for authenticated freelancer / employer areas.
 *
 * Desktop  : Fixed dark sidebar (w-64 ↔ w-16 collapsible) + scrollable content pane.
 * Mobile   : Slide-out drawer triggered by hamburger in a sticky top bar.
 * No top Navbar — branding + user info live inside the sidebar.
 */
export default function DashboardLayout({ role }) {
  const { logout, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const navItems = role === 'employer' ? EMPLOYER_NAV_LINKS : FREELANCER_NAV_LINKS;

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const drawerRef = useRef(null);

  // ── Notification polling ─────────────────────────────────────────────
  const fetchUnread = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data?.unread_count ?? 0);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15_000);
    window.addEventListener('focus', fetchUnread);
    window.addEventListener('appworks:notifications-updated', fetchUnread);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchUnread);
      window.removeEventListener('appworks:notifications-updated', fetchUnread);
    };
  }, [fetchUnread]);

  // ── Sidebar collapse persistence ─────────────────────────────────────
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSED_KEY, String(!prev));
      return !prev;
    });
  };

  // ── Mobile drawer keyboard / scroll lock ─────────────────────────────
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    drawerRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const firstName = (user?.name || 'You').split(' ')[0];
  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const notifTo = role === 'employer'
    ? '/employer/notifications'
    : '/freelancer/notifications';

  // ── Sidebar content renderer (shared between desktop + mobile) ───────
  const renderNav = (onNavigate) =>
    navItems.map((item) => {
      const Icon = item.icon;
      const isNotif = item.to.includes('notifications');
      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          title={collapsed ? (item.key ? t(item.key) : item.label) : undefined}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-white/10 text-white before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:rounded-r before:bg-brand-500'
                : 'text-slate-400 hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center px-2',
            )
          }
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && (
            <span className="flex-1 truncate">
              {item.key ? t(item.key) : item.label}
            </span>
          )}
          {isNotif && unreadCount > 0 && (
            <span
              className={cn(
                'flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white',
                collapsed && 'absolute right-1 top-1 h-3.5 min-w-3.5 text-[8px]',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>
      );
    });

  const SidebarInner = ({ onNavigate }) => (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={cn(
          'flex items-center px-4 py-5',
          collapsed ? 'justify-center' : 'gap-3',
        )}
      >
        <Link to="/" className="shrink-0">
          <Logo variant="light" tagline={false} markClassName="h-8 w-auto" />
        </Link>
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {role === 'employer' ? 'Employer' : 'Freelancer'}
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={`${role} navigation`}>
        <div className="space-y-0.5">
          {renderNav(onNavigate)}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            'mb-1 flex items-center gap-3 rounded-xl px-2 py-2',
            collapsed && 'justify-center',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[11px] text-slate-400">
                {role === 'employer' ? 'Employer' : 'Freelancer'}
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? t('nav.signOut') : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white',
            collapsed && 'justify-center px-2',
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          {!collapsed && <span>{t('nav.signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30',
          'bg-[#1a2340] shadow-[4px_0_24px_rgba(0,0,0,0.15)]',
          'transition-[width] duration-300 ease-in-out',
          collapsed ? 'lg:w-16' : 'lg:w-64',
        )}
      >
        <SidebarInner onNavigate={undefined} />

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-ink-900 transition-colors"
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft className="h-3.5 w-3.5" />
          }
        </button>
      </aside>

      {/* ── Mobile backdrop ─────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile slide-out drawer ──────────────────────────────── */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        aria-label={`${role} navigation`}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#1a2340] outline-none',
          'transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <Logo variant="light" tagline={false} markClassName="h-7 w-auto" />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="h-[calc(100%-60px)] overflow-y-auto">
          <SidebarInner onNavigate={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* ── Main content area ────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0',
          'transition-[margin] duration-300 ease-in-out',
          'lg:ml-64',
          collapsed && 'lg:ml-16',
        )}
      >
        {/* Sticky top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop: role label */}
          <span className="hidden text-sm font-semibold text-gray-400 capitalize lg:inline">
            {role} portal
          </span>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <Link
              to={notifTo}
              className="relative rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-ink-900"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Avatar */}
            <Link
              to={role === 'employer' ? '/employer/profile' : '/freelancer/profile'}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {initials}
              </div>
              <span className="hidden sm:inline">{firstName}</span>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

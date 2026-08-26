import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../i18n';
import { notificationService } from '../services/notificationService';
import { FREELANCER_NAV_LINKS, EMPLOYER_NAV_LINKS } from '../constants/navigation';
import { cn } from '../utils/cn';

/**
 * DashboardLayout — app-shell for authenticated freelancer / employer areas.
 *
 * Desktop  : Fixed white/cloud sidebar (w-16 collapsed, w-64 on hover).
 *            Expands when cursor enters, collapses when cursor leaves.
 * Mobile   : Slide-out drawer triggered by a hamburger button.
 * Navbar   : Original top Navbar is preserved and shown as-is.
 */
export default function DashboardLayout({ role }) {
  const { logout, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const navItems = role === 'employer' ? EMPLOYER_NAV_LINKS : FREELANCER_NAV_LINKS;

  // hovered = sidebar is visually expanded on desktop
  const [hovered, setHovered] = useState(false);
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

  const initials = (user?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Nav link renderer ─────────────────────────────────────────────────
  const renderNav = (showLabel, onNavigate) =>
    navItems.map((item) => {
      const Icon = item.icon;
      const isNotif = item.to.includes('notifications');
      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          title={!showLabel ? (item.key ? t(item.key) : item.label) : undefined}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center rounded-xl text-sm font-medium transition-all duration-150',
              showLabel ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
              isActive
                ? 'bg-brand-50 text-brand-700 before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:rounded-r before:bg-brand-500'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0 transition-colors',
                  isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-700',
                )}
                aria-hidden="true"
              />
              {showLabel && (
                <span className="flex-1 truncate">
                  {item.key ? t(item.key) : item.label}
                </span>
              )}
              {isNotif && unreadCount > 0 && (
                <span
                  className={cn(
                    'flex items-center justify-center rounded-full bg-red-500 font-bold text-white',
                    showLabel
                      ? 'h-4 min-w-4 px-1 text-[10px]'
                      : 'absolute right-0.5 top-0.5 h-3 min-w-3 text-[7px]',
                  )}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </>
          )}
        </NavLink>
      );
    });

  // ── Sidebar shared content ────────────────────────────────────────────
  const SidebarContent = ({ showLabel, onNavigate }) => (
    <div className="flex h-full flex-col py-4">
      {/* Nav items */}
      <nav
        className={cn('flex-1 space-y-0.5 overflow-y-auto', showLabel ? 'px-3' : 'px-2')}
        aria-label={`${role} navigation`}
      >
        {renderNav(showLabel, onNavigate)}
      </nav>

      {/* User + logout at bottom */}
      <div className={cn('border-t border-gray-100 pt-3', showLabel ? 'px-3' : 'px-2')}>
        {showLabel && (
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-800">{user?.name}</p>
              <p className="truncate text-[10px] capitalize text-gray-400">{role}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={!showLabel ? t('nav.signOut') : undefined}
          className={cn(
            'flex w-full items-center rounded-xl text-sm font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-900',
            showLabel ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-400" aria-hidden="true" />
          {showLabel && <span>{t('nav.signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* ── Original Navbar — untouched ─────────────────────────────── */}
      <Navbar />

      <div className="flex flex-1">
        {/* ── Desktop sidebar — icon-only by default, expands on hover ── */}
        <aside
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            'hidden lg:flex lg:flex-col',
            'fixed left-0 top-16 bottom-0 z-30',
            'border-r border-gray-200 bg-white shadow-sm',
            'transition-[width] duration-300 ease-in-out overflow-hidden',
            hovered ? 'w-64' : 'w-16',
          )}
        >
          <SidebarContent showLabel={hovered} onNavigate={undefined} />
        </aside>

        {/* ── Mobile backdrop ─────────────────────────────────────────── */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ── Mobile slide-out drawer ──────────────────────────────────── */}
        <aside
          ref={drawerRef}
          tabIndex={-1}
          aria-label={`${role} navigation`}
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl outline-none',
            'transition-transform duration-300 ease-in-out lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <span className="text-sm font-bold capitalize text-gray-800">{role} Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarContent showLabel onNavigate={() => setMobileOpen(false)} />
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col min-w-0 lg:ml-16">
          {/* Mobile top bar */}
          <div className="flex items-center border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="ml-3 text-sm font-semibold capitalize text-gray-700">
              {role} Dashboard
            </span>
          </div>

          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

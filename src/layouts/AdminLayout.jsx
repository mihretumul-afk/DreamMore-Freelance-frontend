import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { useI18n } from '../i18n';
import { adminService } from '../services/adminService';
import { ADMIN_NAV_LINKS, ADMIN_NAV_GROUPS } from '../constants/navigation';
import { cn } from '../utils/cn';

/**
 * AdminLayout — permission-aware shell for the admin section.
 */
export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { can, isSuperAdmin, adminRoleSlugs, loading: permLoading } = useAdminPermissions();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [hovered, setHovered] = useState(false);   // hover-to-expand on desktop
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  // ── Stats polling (badge counts) ─────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await adminService.getDashboardStats();
      setStats(res.data ?? res);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // ── Mobile drawer: Escape + scroll lock ──────────────────────────────
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

  const initials = (user?.name || 'A')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Unlocked Navigation Filtering ─────────────────────────────────────
  // If user is primary 'admin' or 'super_admin', bypass filtering to reveal all links
  const isPrimaryAdmin = user?.role === 'admin' || isSuperAdmin;

  const visibleLinks = ADMIN_NAV_LINKS.filter((item) => {
    if (!item.permission) return true; // Dashboard
    if (isPrimaryAdmin) return true;  // Primary Admin unlocks all
    if (permLoading) return true;     // Show links while loading rather than hiding
    return can(item.permission);
  });

  const grouped = visibleLinks.reduce((acc, item) => {
    const g = item.group ?? 'overview';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  // ── Nav link renderer ─────────────────────────────────────────────────
  const renderNavLink = (item, showLabel, onNavigate) => {
    const Icon = item.icon;
    const badgeCount = item.badgeKey ? (stats?.[item.badgeKey] ?? 0) : 0;
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
              ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:rounded-r before:bg-red-500'
              : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white',
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon
              className={cn(
                'h-[18px] w-[18px] shrink-0 transition-colors',
                isActive ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-200',
              )}
              aria-hidden="true"
            />
            {showLabel && (
              <span className="flex-1 truncate">
                {item.key ? t(item.key) : item.label}
              </span>
            )}
            {badgeCount > 0 && (
              <span
                aria-label={`${badgeCount} pending`}
                className={cn(
                  'flex items-center justify-center rounded-full bg-amber-500 font-bold text-white',
                  showLabel
                    ? 'h-4 min-w-4 px-1 text-[10px]'
                    : 'absolute right-0.5 top-0.5 h-3 min-w-3 text-[7px]',
                )}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  };

  // ── Grouped sidebar content (shared desktop + mobile) ─────────────────
  const SidebarContent = ({ showLabel, onNavigate }) => (
    <div className="flex h-full flex-col py-4">
      {/* Grouped nav */}
      <nav
        className={cn('flex-1 space-y-4 overflow-y-auto', showLabel ? 'px-3' : 'px-2')}
        aria-label="Admin navigation"
      >
        {Object.entries(ADMIN_NAV_GROUPS).map(([groupKey, groupMeta]) => {
          const items = grouped[groupKey];
          if (!items?.length) return null;
          return (
            <div key={groupKey}>
              {/* Group label — only when expanded */}
              {groupMeta.label && showLabel && (
                <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-slate-500">
                  {groupMeta.label}
                </p>
              )}
              {/* Divider when icon-only */}
              {groupMeta.label && !showLabel && (
                <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
              )}
              <div className="space-y-0.5">
                {items.map((item) => renderNavLink(item, showLabel, onNavigate))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User + logout at bottom */}
      <div className={cn('border-t border-gray-100 dark:border-slate-800 pt-3', showLabel ? 'px-3' : 'px-2')}>
        {showLabel && (
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-gray-800 dark:text-slate-200">{user?.name}</p>
              <p className="truncate text-[10px] text-gray-400 dark:text-slate-400">
                {(() => {
                  if (isPrimaryAdmin) return 'Super Admin';
                  const slugs = adminRoleSlugs || [];
                  if (slugs.includes('support_admin')) return 'Support Admin';
                  if (slugs.includes('finance_admin')) return 'Finance Admin';
                  if (slugs.includes('dispute_admin')) return 'Dispute Admin';
                  if (slugs.includes('verification_admin')) return 'Verification Admin';
                  return 'Admin';
                })()}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={!showLabel ? t('nav.signOut') : undefined}
          className={cn(
            'flex w-full cursor-pointer items-center rounded-xl text-sm font-medium text-gray-500 dark:text-slate-400 transition-all hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white',
            showLabel ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 text-gray-400 dark:text-slate-400" aria-hidden="true" />
          {showLabel && <span>{t('nav.signOut')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950 text-ink-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            'hidden lg:flex lg:flex-col',
            'fixed left-0 top-16 bottom-0 z-30',
            'border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm',
            'transition-[width] duration-300 ease-in-out overflow-hidden',
            hovered ? 'w-64' : 'w-16',
          )}
        >
          <SidebarContent showLabel={hovered} onNavigate={undefined} />
        </aside>

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile slide-out drawer */}
        <aside
          ref={drawerRef}
          tabIndex={-1}
          aria-label="Admin navigation"
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-xl outline-none',
            'transition-transform duration-300 ease-in-out lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-4 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800 dark:text-slate-200">Admin Menu</span>
              <span className="rounded-full bg-red-100 dark:bg-red-950/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                {isPrimaryAdmin ? 'Super' : 'Admin'}
              </span>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="cursor-pointer rounded-lg p-1.5 text-gray-400 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarContent showLabel onNavigate={() => setMobileOpen(false)} />
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0 lg:ml-16">
          {/* Mobile top bar */}
          <div className="flex items-center border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 lg:hidden">
            <button
              type="button"
              aria-label="Open admin menu"
              onClick={() => setMobileOpen(true)}
              className="cursor-pointer rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="ml-3 text-sm font-semibold text-gray-700 dark:text-slate-200">Admin Panel</span>
          </div>

          <main id="main-content" className="flex-1 p-3 sm:p-6 lg:p-8 min-w-0" tabIndex={-1}>
            <Outlet />
          </main>
        </div>

      </div>
    </div>
  );
}
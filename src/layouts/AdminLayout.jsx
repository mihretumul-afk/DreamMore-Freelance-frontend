import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LogOut, Menu, X } from 'lucide-react';
import Logo from '../components/common/Logo';
import { useAuth } from '../hooks/useAuth';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { useI18n } from '../i18n';
import { adminService } from '../services/adminService';
import { ADMIN_NAV_LINKS, ADMIN_NAV_GROUPS } from '../constants/navigation';
import { cn } from '../utils/cn';

const COLLAPSED_KEY = 'appworks_admin_sidebar_collapsed';

/**
 * AdminLayout — permission-aware shell for the admin section.
 *
 * Desktop  : Fixed dark sidebar (collapsible) with grouped + labelled nav sections.
 * Mobile   : Slide-out drawer triggered by hamburger in sticky top bar.
 * Matches the DashboardLayout visual style with a red admin identity accent.
 */
export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { can, isSuperAdmin, loading: permLoading } = useAdminPermissions();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  // ── Stats polling ─────────────────────────────────────────────────────
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

  // ── Mobile drawer ─────────────────────────────────────────────────────
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

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      localStorage.setItem(COLLAPSED_KEY, String(!prev));
      return !prev;
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const firstName = (user?.name || 'Admin').split(' ')[0];
  const initials = (user?.name || 'A')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // ── Permission-filtered + grouped nav ─────────────────────────────────
  const visibleLinks = permLoading
    ? []
    : ADMIN_NAV_LINKS.filter(
        (item) => !item.permission || isSuperAdmin || can(item.permission),
      );

  const grouped = visibleLinks.reduce((acc, item) => {
    const g = item.group ?? 'overview';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const renderNavLink = (item, onNavigate) => {
    const Icon = item.icon;
    const badgeCount = item.badgeKey ? (stats?.[item.badgeKey] ?? 0) : 0;
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
              ? 'bg-white/10 text-white before:absolute before:left-0 before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:rounded-r before:bg-red-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-white',
            collapsed && 'justify-center px-2',
          )
        }
      >
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        {!collapsed && (
          <span className="flex-1 truncate">{item.key ? t(item.key) : item.label}</span>
        )}
        {badgeCount > 0 && (
          <span
            aria-label={`${badgeCount} pending`}
            className={cn(
              'flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white',
              collapsed && 'absolute right-1 top-1 h-3 min-w-3 text-[8px]',
            )}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </NavLink>
    );
  };

  const SidebarInner = ({ onNavigate }) => (
    <div className="flex h-full flex-col">
      {/* Brand + role badge */}
      <div
        className={cn(
          'flex items-center px-4 py-5',
          collapsed ? 'flex-col gap-2' : 'gap-3',
        )}
      >
        <Link to="/admin/dashboard" className="shrink-0">
          <Logo variant="light" tagline={false} markClassName="h-8 w-auto" />
        </Link>
        {!collapsed && (
          <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-red-400">
            Admin
          </span>
        )}
      </div>

      {/* Grouped nav */}
      <nav
        className="flex-1 overflow-y-auto px-3 pb-4 space-y-4"
        aria-label="Admin navigation"
      >
        {Object.entries(ADMIN_NAV_GROUPS).map(([groupKey, groupMeta]) => {
          const items = grouped[groupKey];
          if (!items?.length) return null;
          return (
            <div key={groupKey}>
              {groupMeta.label && !collapsed && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {groupMeta.label}
                </p>
              )}
              {collapsed && groupMeta.label && (
                <div className="my-1 border-t border-white/10" />
              )}
              <div className="space-y-0.5">
                {items.map((item) => renderNavLink(item, onNavigate))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div
          className={cn(
            'mb-1 flex items-center gap-3 rounded-xl px-2 py-2',
            collapsed && 'justify-center',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="truncate text-[11px] text-slate-400">
                {isSuperAdmin ? 'Super Admin' : 'Admin'}
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

      {/* ── Desktop sidebar ───────────────────────────────── */}
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

      {/* ── Mobile backdrop ────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────── */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        aria-label="Admin navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-[#1a2340] outline-none',
          'transition-transform duration-300 ease-in-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <Logo variant="light" tagline={false} markClassName="h-7 w-auto" />
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-red-400">
              Admin
            </span>
          </div>
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

      {/* ── Main content ───────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-1 flex-col min-w-0 transition-[margin] duration-300 ease-in-out',
          'lg:ml-64',
          collapsed && 'lg:ml-16',
        )}
      >
        {/* Sticky top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <span className="hidden text-sm font-semibold text-gray-400 lg:inline">
            Admin Panel
          </span>

          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 sm:inline">
              {firstName}
            </span>
          </div>
        </header>

        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

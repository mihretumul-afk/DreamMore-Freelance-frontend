import { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, ChevronRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useAdminPermissions } from '../hooks/useAdminPermissions';
import { useI18n } from '../i18n';
import { adminService } from '../services/adminService';
import { ADMIN_NAV_LINKS, ADMIN_NAV_GROUPS } from '../constants/navigation';
import { cn } from '../utils/cn';

/**
 * AdminLayout — permission-aware shell for the entire admin section.
 *
 * Sidebar:
 *  - Desktop: sticky 240 px sidebar with grouped nav sections.
 *  - Mobile: slide-in drawer triggered by hamburger button.
 *
 * Nav items are filtered by the current admin's effective permissions.
 * Items without a `permission` key (Dashboard) are always shown.
 */
export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { can, isSuperAdmin, loading: permLoading } = useAdminPermissions();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  // ── Stats polling for badge counts ──────────────────────────────────
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

  // ── Mobile drawer keyboard / focus ───────────────────────────────────
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    drawerRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // ── Filter nav items by permission ───────────────────────────────────
  const visibleLinks = permLoading
    ? []
    : ADMIN_NAV_LINKS.filter(
        (item) => !item.permission || isSuperAdmin || can(item.permission),
      );

  // Group them
  const grouped = visibleLinks.reduce((acc, item) => {
    const g = item.group ?? 'overview';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});

  const firstName = (user?.name || 'Admin').split(' ')[0];

  // ── Shared nav renderer ───────────────────────────────────────────────
  const renderNavLink = (item, onNavigate) => {
    const Icon = item.icon;
    const badgeCount = item.badgeKey ? stats?.[item.badgeKey] : null;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            isActive
              ? 'bg-ink-900 text-white'
              : 'text-ink-700 hover:bg-gray-100 hover:text-ink-900',
          )
        }
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">{item.key ? t(item.key) : item.label}</span>
        {badgeCount > 0 && (
          <span
            aria-label={`${badgeCount} pending`}
            className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </NavLink>
    );
  };

  const renderSidebar = (onNavigate) => (
    <nav className="flex h-full flex-col" aria-label="Admin navigation">
      {/* Brand badge */}
      <div className="mb-4 px-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
          {t('nav.admin')}
        </span>
      </div>

      {/* Grouped nav links */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {Object.entries(ADMIN_NAV_GROUPS).map(([groupKey, groupMeta]) => {
          const items = grouped[groupKey];
          if (!items?.length) return null;
          return (
            <div key={groupKey}>
              {groupMeta.label && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {groupMeta.label}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => renderNavLink(item, onNavigate))}
              </div>
            </div>
          );
        })}
      </div>

      {/* User + logout */}
      <div className="border-t border-gray-100 pt-4">
        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{user?.name}</p>
            <p className="truncate text-xs text-gray-400">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('nav.signOut')}
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      {/* Mobile top bar with hamburger */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <span className="text-sm font-bold text-ink-900">Admin Panel</span>
        <button
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-ink-700 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/50 backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile slide-in drawer */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        aria-label="Admin navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white px-4 py-6 shadow-elevated outline-none transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-base font-bold text-ink-900">Dream More Admin</span>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {renderSidebar(() => setMobileOpen(false))}
      </aside>

      {/* Main grid */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-8">

          {/* Desktop sidebar */}
          <aside className="hidden lg:block" aria-label="Admin navigation">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-card border border-gray-200 bg-white p-4 shadow-card">
              {renderSidebar(undefined)}
            </div>
          </aside>

          {/* Content column */}
          <main id="main-content" className="min-w-0" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

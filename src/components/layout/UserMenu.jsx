import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, User } from 'lucide-react';
import Avatar from '../marketplace/Avatar';
import Badge from '../ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { getNavPaths, ROLE_LABELS } from '../../utils/auth';
import { cn } from '../../utils/cn';

const itemClass =
  'flex w-full items-center gap-2.5 px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-gray-50 hover:text-ink-900';

/**
 * Authenticated user menu (avatar, name, role, dashboard, profile, logout).
 *
 * Accessible dropdown: aria-haspopup/expanded on the trigger, role="menu" on
 * the panel, full arrow-key navigation, Escape to close (returns focus to the
 * trigger), and click-outside to dismiss.
 */
export default function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const { dashboardPath, profilePath } = getNavPaths(user?.role);

  // Close the menu when navigating away.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Focus the first item when opened; handle keyboard navigation + outside clicks.
  useEffect(() => {
    if (!open) return undefined;

    const getItems = () =>
      Array.from(panelRef.current?.querySelectorAll('[role="menuitem"]') ?? []).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
      );

    const onKeyDown = (event) => {
      const items = getItems();
      if (items.length === 0) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown': {
          event.preventDefault();
          const current = items.indexOf(document.activeElement);
          items[(current + 1) % items.length]?.focus();
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          const current = items.indexOf(document.activeElement);
          items[(current - 1 + items.length) % items.length]?.focus();
          break;
        }
        case 'Home':
          event.preventDefault();
          items[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          items[items.length - 1]?.focus();
          break;
        default:
          break;
      }
    };

    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    getItems()[0]?.focus();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu"
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-white/10"
      >
        <Avatar name={user.name} src={user.avatar} size="sm" variant="brand" />
        <span className="hidden max-w-[130px] truncate text-xs font-semibold text-slate-200 lg:block">
          {user.name}
        </span>
        <ChevronDown
          className={cn('h-3.5 w-3.5 text-slate-300 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id="user-menu"
          ref={panelRef}
          role="menu"
          aria-label={t('nav.accountMenu')}
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-card border border-gray-200 bg-white py-2 shadow-elevated"
        >
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-ink-900">{user.name}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{user.email}</p>
            <Badge tone="primary" size="xs" className="mt-2">
              {t(`role.${user.role}`) !== `role.${user.role}` ? t(`role.${user.role}`) : (ROLE_LABELS[user.role] ?? user.role)}
            </Badge>
          </div>

          <div className="py-1">
            {dashboardPath && (
              <Link to={dashboardPath} role="menuitem" className={itemClass}>
                <LayoutDashboard className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                {t('nav.dashboard')}
              </Link>
            )}
            {profilePath && (
              <Link to={profilePath} role="menuitem" className={itemClass}>
                <User className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                {t('nav.profile')}
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            <button type="button" role="menuitem" onClick={handleLogout} className={itemClass}>
              <LogOut className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              {t('nav.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

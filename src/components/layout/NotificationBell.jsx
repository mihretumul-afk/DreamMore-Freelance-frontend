import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Trash2 } from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { getEcho } from '../../config/echo';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';

/**
 * NotificationBell — shows unread notification count in the navbar.
 * Supports real-time updates via Reverb when configured.
 */
export default function NotificationBell() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const dropdownRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data?.unread_count ?? 0);
    } catch {
      // non-critical
    }
  }, [user]);

  // Fetch recent notifications for dropdown
  const fetchRecent = useCallback(async () => {
    if (!user) return;
    try {
      const response = await notificationService.getNotifications({ per_page: 5 });
      const data = response.data ?? [];
      setRecentNotifications(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch {
      // non-critical
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    fetchRecent();

    const interval = setInterval(fetchUnreadCount, 15000);
    const onFocus = () => {
      fetchUnreadCount();
      fetchRecent();
    };
    const onUpdate = () => {
      fetchUnreadCount();
      fetchRecent();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('appworks:notifications-updated', onUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('appworks:notifications-updated', onUpdate);
    };
  }, [fetchUnreadCount, fetchRecent]);

  // Real-time notification updates via Reverb
  useEffect(() => {
    if (!user?.id) return;

    const echo = getEcho();
    if (!echo) return;

    const channel = echo.private(`notifications.${user.id}`);

    channel.listen('.notification.created', () => {
      setUnreadCount((prev) => prev + 1);
      fetchRecent();
      window.dispatchEvent(new CustomEvent('appworks:notifications-updated'));
    });

    return () => {
      channel.stopListening('.notification.created');
      echo.leave(`notifications.${user.id}`);
    };
  }, [user?.id, fetchRecent]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getNotificationLink = (notification) => {
    if (notification.link) return notification.link;
    const role = user?.role;
    return role === 'employer' ? '/employer/notifications' : '/freelancer/notifications';
  };

  if (!user) return null;

  const role = user.role;
  const notificationsPath = role === 'employer' ? '/employer/notifications' : role === 'admin' ? '/admin/dashboard' : '/freelancer/notifications';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setDropdownOpen((prev) => !prev);
          if (!dropdownOpen) fetchRecent();
        }}
        className="relative rounded-lg p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-xs sm:w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-bold text-ink-900">{t('notifications.title')}</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={async () => {
                  await notificationService.markAllAsRead();
                  setUnreadCount(0);
                  setRecentNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
                  window.dispatchEvent(new CustomEvent('appworks:notifications-updated'));
                }}
                className="text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          {recentNotifications.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Bell className="mx-auto h-6 w-6 text-gray-300" />
              <p className="mt-1 text-xs text-gray-500">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {recentNotifications.map((notification) => {
                const isUnread = !notification.read_at;
                return (
                  <div
                    key={notification.id}
                    className={`group relative flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 ${
                      isUnread ? 'bg-brand-50/30' : ''
                    }`}
                  >
                    <Link
                      to={getNotificationLink(notification)}
                      onClick={async () => {
                        setDropdownOpen(false);
                        if (isUnread) {
                          try {
                            await notificationService.markAsRead(notification.id);
                            setUnreadCount((c) => Math.max(0, c - 1));
                            setRecentNotifications((prev) =>
                              prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
                            );
                            window.dispatchEvent(new CustomEvent('appworks:notifications-updated'));
                          } catch {}
                        }
                      }}
                      className="flex min-w-0 flex-1 items-start gap-2"
                    >
                      {isUnread && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={`text-xs ${isUnread ? 'font-bold text-ink-900' : 'font-medium text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">{notification.message}</p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await notificationService.deleteNotification(notification.id);
                          setRecentNotifications((prev) => prev.filter((n) => n.id !== notification.id));
                          if (isUnread) setUnreadCount((c) => Math.max(0, c - 1));
                          window.dispatchEvent(new CustomEvent('appworks:notifications-updated'));
                        } catch {}
                      }}
                      title="Delete notification"
                      aria-label="Delete notification"
                      className="ml-2 rounded p-1 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-gray-100 px-4 py-2">
            <Link
              to={notificationsPath}
              onClick={() => setDropdownOpen(false)}
              className="block text-center text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {t('notifications.viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

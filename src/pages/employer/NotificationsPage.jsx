import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Briefcase,
  Clock,
  CheckCheck,
  Star,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { notificationService } from '../../services/notificationService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

const TYPE_ICONS = {
  new_proposal: FileText,
  proposal_shortlisted: FileText,
  proposal_rejected: XCircle,
  proposal_accepted: CheckCircle,
  contract_created: Briefcase,
  milestone_submitted: Clock,
  milestone_approved: CheckCircle,
  message_received: MessageSquare,
  review_received: Star,
};

const TYPE_COLORS = {
  new_proposal: 'text-blue-500 bg-blue-50',
  proposal_shortlisted: 'text-success-500 bg-success-50',
  proposal_rejected: 'text-danger-500 bg-danger-50',
  proposal_accepted: 'text-success-500 bg-success-50',
  contract_created: 'text-brand-500 bg-brand-50',
  milestone_submitted: 'text-warning-500 bg-warning-50',
  milestone_approved: 'text-success-500 bg-success-50',
  message_received: 'text-info-500 bg-info-50',
  review_received: 'text-warning-500 bg-warning-50',
};

export default function EmployerNotificationsPage() {
  usePageTitle('Notifications');
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await notificationService.getNotifications();
      const data = response.data ?? [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationClick = useCallback(async (notification) => {
    if (!notification.read_at) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
      } catch {
        // non-critical
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  }, [navigate]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    } catch {
      // non-critical
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-card border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Unable to load notifications" description={error} onRetry={loadNotifications} />;
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Notifications</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="You'll be notified about new proposals, contract updates, and messages."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell;
            const colorClass = TYPE_COLORS[notification.type] || 'text-gray-500 bg-gray-50';
            const isUnread = !notification.read_at;

            return (
              <Card
                key={notification.id}
                interactive={isUnread}
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer transition-all ${isUnread ? 'border-brand-200 bg-brand-50/30' : ''}`}
              >
                <CardBody className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${isUnread ? 'font-bold text-ink-900' : 'font-medium text-gray-700'}`}>
                        {notification.title}
                      </p>
                      {isUnread && (
                        <span className="h-2 w-2 rounded-full bg-brand-500" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{notification.message}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{formatDate(notification.created_at)}</p>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

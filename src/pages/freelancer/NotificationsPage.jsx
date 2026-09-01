import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  Award,
  Briefcase,
  Clock,
  CheckCheck,
  Check,
  Star,
  AlertTriangle,
  Trash2,
  Shield,
  UserCheck,
  Zap,
  RefreshCw,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { notificationService } from '../../services/notificationService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

const TYPE_ICONS = {
  new_proposal: FileText,
  proposal_shortlisted: FileText,
  proposal_rejected: XCircle,
  proposal_accepted: CheckCircle,
  contract_created: Briefcase,
  milestone_submitted: Clock,
  milestone_approved: CheckCircle,
  milestone_revision: AlertTriangle,
  message_received: MessageSquare,
  credential_approved: Award,
  credential_rejected: XCircle,
  credential_submitted: Award,
  credential_resubmitted: Award,
  credential_resubmission_required: RefreshCw,
  skill_test_required: Zap,
  credential_test_passed: Award,
  freelancer_approved: UserCheck,
  freelancer_rejected: XCircle,
  verification_approved: Shield,
  verification_rejected: XCircle,
  review_received: Star,
  withdrawal_requested: Clock,
  withdrawal_completed: CheckCircle,
  withdrawal_failed: XCircle,
  lms_certificate_verified: Award,
  lms_certificate_revoked: XCircle,
};

const TYPE_COLORS = {
  new_proposal: 'text-blue-500 bg-blue-50',
  proposal_shortlisted: 'text-success-500 bg-success-50',
  proposal_rejected: 'text-danger-500 bg-danger-50',
  proposal_accepted: 'text-success-500 bg-success-50',
  contract_created: 'text-brand-500 bg-brand-50',
  milestone_submitted: 'text-warning-500 bg-warning-50',
  milestone_approved: 'text-success-500 bg-success-50',
  milestone_revision: 'text-warning-500 bg-warning-50',
  message_received: 'text-info-500 bg-info-50',
  credential_approved: 'text-success-500 bg-success-50',
  credential_rejected: 'text-danger-500 bg-danger-50',
  credential_submitted: 'text-blue-500 bg-blue-50',
  credential_resubmitted: 'text-amber-500 bg-amber-50',
  credential_resubmission_required: 'text-amber-500 bg-amber-50',
  skill_test_required: 'text-amber-500 bg-amber-50',
  credential_test_passed: 'text-success-500 bg-success-50',
  freelancer_approved: 'text-success-500 bg-success-50',
  freelancer_rejected: 'text-danger-500 bg-danger-50',
  verification_approved: 'text-success-500 bg-success-50',
  verification_rejected: 'text-danger-500 bg-danger-50',
  review_received: 'text-warning-500 bg-warning-50',
  withdrawal_requested: 'text-blue-500 bg-blue-50',
  withdrawal_completed: 'text-success-500 bg-success-50',
  withdrawal_failed: 'text-danger-500 bg-danger-50',
  lms_certificate_verified: 'text-success-500 bg-success-50',
  lms_certificate_revoked: 'text-danger-500 bg-danger-50',
};

export default function FreelancerNotificationsPage() {
  usePageTitle('Notifications');
  const navigate = useNavigate();
  const { showToast } = useToast();

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
    // Mark as read automatically when opened
    if (!notification.read_at) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
        );
        window.dispatchEvent(new CustomEvent('appworks:notifications-updated'));
      } catch {
        // non-critical
      }
    }

    // Navigate to the link if available
    if (notification.link) {
      navigate(notification.link);
    }
  }, [navigate]);

  const handleMarkAsRead = useCallback(async (e, notification) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      window.dispatchEvent(new CustomEvent('appworks:notifications-updated'));
      showToast('Notification marked as read.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to mark notification as read.'), 'error');
    }
  }, [showToast]);

  const handleDelete = useCallback(async (e, notificationId) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      window.dispatchEvent(new CustomEvent('appworks:notifications-updated'));
      showToast('Notification deleted successfully.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to delete notification.'), 'error');
    }
  }, [showToast]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      window.dispatchEvent(new CustomEvent('appworks:notifications-updated'));
      showToast('All notifications marked as read.', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to mark all notifications as read.'), 'error');
    }
  }, [showToast]);

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
          description="You'll be notified about proposals, contracts, messages, and credential updates."
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
                  <div className="flex items-center gap-1 shrink-0">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(e, notification)}
                        title="Mark as read"
                        aria-label="Mark as read"
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Delete notification"
                      aria-label="Delete notification"
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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

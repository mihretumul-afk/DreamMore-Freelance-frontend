import { useEffect, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Hourglass,
  MessageSquare,
  PlayCircle,
  Send,
  Trash2,
  Wallet,
  AlertTriangle,
  RotateCcw,
  Plus,
  Edit3,
  Activity,
} from 'lucide-react';
import { contractService } from '../../services/contractService';
import { formatDate, formatETB } from '../../utils/format';
import { cn } from '../../utils/cn';

/** Activity type configuration with icons, colors, and labels */
const ACTIVITY_CONFIG = {
  // Contract actions
  'contract.started': {
    icon: PlayCircle,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Contract Started',
  },
  'contract.paused': {
    icon: Clock,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Contract Paused',
  },
  'contract.resumed': {
    icon: PlayCircle,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Contract Resumed',
  },
  'contract.completed': {
    icon: CheckCircle2,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Contract Completed',
  },
  'contract.cancelled': {
    icon: Trash2,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Contract Cancelled',
  },

  // Milestone actions
  'milestone.created': {
    icon: Plus,
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    label: 'Milestone Created',
  },
  'milestone.updated': {
    icon: Edit3,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Milestone Updated',
  },
  'milestone.deleted': {
    icon: Trash2,
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Milestone Deleted',
  },
  'milestone.funded': {
    icon: Wallet,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Milestone Funded',
  },
  'milestone.started': {
    icon: PlayCircle,
    color: 'bg-indigo-500',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    label: 'Work Started',
  },
  'milestone.submitted': {
    icon: Send,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Work Submitted',
  },
  'milestone.approved': {
    icon: CheckCircle2,
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Milestone Approved',
  },
  'milestone.released': {
    icon: CreditCard,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Payment Released',
  },
  'milestone.revision_requested': {
    icon: RotateCcw,
    color: 'bg-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Revision Requested',
  },

  // Payment actions
  'payment.released': {
    icon: CreditCard,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Payment Released',
  },
  'refund.requested': {
    icon: AlertTriangle,
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Refund Requested',
  },
};

/** Default config for unknown actions */
const DEFAULT_CONFIG = {
  icon: Activity,
  color: 'bg-gray-500',
  bgColor: 'bg-gray-50',
  borderColor: 'border-gray-200',
  label: 'Activity',
};

/**
 * Activity log component showing contract events timeline.
 *
 * @param {Object} props
 * @param {number} props.contractId - The contract ID
 */
export default function ActivityLog({ contractId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await contractService.getActivities(contractId);
        if (res.success) {
          setActivities(res.data ?? []);
        } else {
          setError(res.message || 'Failed to load activities.');
        }
      } catch (err) {
        setError('Failed to load activity log.');
      } finally {
        setLoading(false);
      }
    };

    if (contractId) {
      loadActivities();
    }
  }, [contractId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <p className="mt-3 text-sm text-gray-500">Loading activity log...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <p className="mt-3 text-sm font-medium text-gray-700">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <FileText className="h-8 w-8 text-gray-300" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-ink-900">No activity yet</h3>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Activity will appear here as events happen on this contract.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Activity items */}
      <div className="space-y-6">
        {activities.map((activity, index) => {
          const config = ACTIVITY_CONFIG[activity.action] || DEFAULT_CONFIG;
          const Icon = config.icon;
          const actorName = activity.actor?.name || 'System';
          const actorRole = activity.actor?.role || '';
          const isFirst = index === 0;

          return (
            <div key={activity.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-md',
                  config.color,
                  isFirst && 'ring-2 ring-offset-2 ring-brand-500/30',
                )}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div
                className={cn(
                  'flex-1 rounded-xl border p-4 transition-all duration-200',
                  config.bgColor,
                  config.borderColor,
                  isFirst && 'shadow-md',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                        {config.label}
                      </span>
                      {activity.milestone && (
                        <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                          {activity.milestone.title}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(activity.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-medium text-gray-600">{actorName}</span>
                        {actorRole && (
                          <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                            {actorRole}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata display for amounts */}
                {activity.metadata?.amount && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold text-brand-600">
                    <Wallet className="h-3 w-3" />
                    {formatETB(activity.metadata.amount)}
                  </div>
                )}
                {activity.metadata?.net_amount && (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                    <CreditCard className="h-3 w-3" />
                    {formatETB(activity.metadata.net_amount)} released
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  ShieldCheck,
  Ban,
  CheckCircle,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { adminService } from '../../services/adminService';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';

const ROLE_OPTIONS = [
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'employer', label: 'Employer' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_BADGE_TONE = {
  admin: 'danger',
  employer: 'info',
  freelancer: 'primary',
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  usePageTitle('User Details — Admin');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [roleUpdating, setRoleUpdating] = useState(false);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getUserById(id);
      setUser(response.data ?? response);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load user details.'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggling(true);
    try {
      await adminService.toggleUserStatus(id, toggleTarget.is_active === false);
      setToggleTarget(null);
      loadUser();
    } catch {
      // non-critical
    } finally {
      setToggling(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!user || newRole === user.role) return;
    setRoleUpdating(true);
    try {
      await adminService.updateUserRole(id, newRole);
      loadUser();
    } catch {
      // non-critical
    } finally {
      setRoleUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-64 animate-pulse rounded-card border border-gray-200 bg-white" />
      </div>
    );
  }

  if (error || !user) {
    return <ErrorState title="Unable to load user" description={error} onRetry={loadUser} />;
  }

  const isActive = user.is_active !== false;
  const createdAt = formatDate(user.created_at ?? user.createdAt);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main info */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="User Information" />
            <CardBody>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Name</dt>
                    <dd className="text-sm font-semibold text-ink-900">{user.name}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Email</dt>
                    <dd className="text-sm font-semibold text-ink-900">{user.email}</dd>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm font-semibold text-ink-900">{user.phone}</dd>
                    </div>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <dt className="text-xs font-medium text-gray-500">Location</dt>
                      <dd className="text-sm font-semibold text-ink-900">{user.location}</dd>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Joined</dt>
                    <dd className="text-sm font-semibold text-ink-900">{createdAt}</dd>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Role</dt>
                    <dd>
                      <Badge tone={ROLE_BADGE_TONE[user.role] || 'neutral'}>{user.role}</Badge>
                    </dd>
                  </div>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* Bio */}
          {user.bio && (
            <Card>
              <CardHeader title="Bio" />
              <CardBody>
                <p className="text-sm text-gray-700 leading-relaxed">{user.bio}</p>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar — actions */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader title="Status" />
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account status</span>
                <Badge tone={isActive ? 'success' : 'danger'} dot>
                  {isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Button
                variant={isActive ? 'danger' : 'success'}
                size="sm"
                className="w-full"
                onClick={() => setToggleTarget(user)}
              >
                {isActive ? (
                  <><Ban className="h-4 w-4" /> Deactivate</>
                ) : (
                  <><CheckCircle className="h-4 w-4" /> Activate</>
                )}
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Change Role" />
            <CardBody>
              <Select
                value={user.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={roleUpdating}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Verification" />
            <CardBody>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {user.is_verified || user.email_verified_at
                    ? 'Verified'
                    : 'Not verified'}
                </span>
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>

      {/* Confirm toggle modal */}
      <Modal
        open={Boolean(toggleTarget)}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.is_active !== false ? 'Deactivate User' : 'Activate User'}
        description={
          toggleTarget?.is_active !== false
            ? `This will prevent ${toggleTarget?.name} from accessing the platform.`
            : `This will restore ${toggleTarget?.name}'s access.`
        }
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setToggleTarget(null)}>
            Cancel
          </Button>
          <Button
            variant={toggleTarget?.is_active !== false ? 'danger' : 'success'}
            size="sm"
            loading={toggling}
            onClick={handleToggle}
          >
            {toggleTarget?.is_active !== false ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

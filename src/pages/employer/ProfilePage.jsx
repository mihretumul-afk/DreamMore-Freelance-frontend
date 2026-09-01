import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Clock,
  Globe,
  Layers,
  MapPin,
  Mail,
  Pencil,
  Phone,
  Star,
  Users,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import AvatarUpload from '../../components/marketplace/AvatarUpload';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import Badge from '../../components/ui/Badge';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmployerProfileSkeleton from '../../components/employers/EmployerProfileSkeleton';
import { employerService } from '../../services/employerService';
import { normalizeEmployer } from '../../utils/employerMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import apiClient from '../../api/client';

import { useAuth } from '../../hooks/useAuth';

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="flex items-center gap-2 text-sm text-gray-500">
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

export default function EmployerProfilePage() {
  usePageTitle('Company Profile');
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [rawData, setRawData] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const response = await employerService.getMyProfile();
      if (response.success) {
        setRawData(response.data);
        setProfile(normalizeEmployer(response.data));
      } else {
        setError(response.message || 'Unable to load your company profile.');
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setForbidden(true);
        setError(err.response.data?.message || 'You do not have an employer profile.');
      } else if (status === 404) {
        setError('Your company profile could not be found.');
      } else {
        setError(getErrorMessage(err, 'Unable to load your company profile right now. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) return <EmployerProfileSkeleton />;

  if (error || !profile) {
    return (
      <ErrorState
        title={forbidden ? 'Employer profile unavailable' : 'Unable to load your company profile'}
        description={error}
        onRetry={loadProfile}
      />
    );
  }

  const displayName = profile.companyName || profile.name || 'Your company';
  const verificationStatus = rawData?.verification_status;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer"
        title="Company Profile"
        description="How talent sees your company on the marketplace."
        actions={
          <Button as={Link} to="/employer/profile/edit">
            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Profile
          </Button>
        }
      />

      {/* Header */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <AvatarUpload
            name={displayName}
            src={profile.avatar}
            onUpload={async (file) => {
              const formData = new FormData();
              formData.append('avatar', file);
              await apiClient.post('/avatar', formData);
              await loadProfile();
              if (refreshUser) await refreshUser();
            }}
            onRemove={async () => {
              await apiClient.delete('/avatar');
              await loadProfile();
              if (refreshUser) await refreshUser();
            }}
          />
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">{displayName}</h2>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500 sm:justify-start">
              {profile.industry && (
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="h-4 w-4" aria-hidden="true" /> {profile.industry}
                </span>
              )}
              {profile.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" /> {profile.location}
                </span>
              )}
              {profile.rating > 0 ? (
                <RatingDisplay rating={profile.rating} />
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 text-gray-300" aria-hidden="true" /> No ratings yet
                </span>
              )}
              {profile.memberSinceLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" aria-hidden="true" /> Member since{' '}
                  {profile.memberSinceLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats — real API data */}
        <div className="mt-8 grid grid-cols-2 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium text-gray-500">Jobs posted</p>
            <p className="mt-1 text-lg font-extrabold text-brand-500">{profile.postedJobsCount}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total spent</p>
            <p className="mt-1 text-lg font-extrabold text-ink-900">
              {formatETB(profile.totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Rating</p>
            <p className="mt-1 text-lg font-extrabold text-ink-900">
              {profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Company size</p>
            <p className="mt-1 text-lg font-extrabold text-ink-900">
              {profile.companySize ?? '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Verification Status */}
      {verificationStatus && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Badge tone={verificationStatus === 'approved' ? 'success' : verificationStatus === 'rejected' ? 'danger' : 'warning'} dot>
                {verificationStatus === 'approved' ? 'Verified' : verificationStatus === 'rejected' ? 'Verification Rejected' : 'Verification Pending'}
              </Badge>
              <p className="text-sm text-gray-500">
                {verificationStatus === 'approved'
                  ? 'Your company identity has been verified.'
                  : verificationStatus === 'rejected'
                  ? 'Your verification was rejected. Please contact support.'
                  : 'Your verification is being reviewed by our team.'}
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      {/* About */}
      <Card>
        <CardHeader title="About the company" />
        <CardBody>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {profile.companyDescription ||
              'You have not added a company description yet. Tell talent what makes your company great.'}
          </p>
        </CardBody>
      </Card>

      {/* Details */}
      <Card>
        <CardHeader title="Company details" />
        <CardBody>
          <dl className="divide-y divide-gray-100">
            <DetailRow icon={Building2} label="Company name" value={displayName} />
            {profile.industry && <DetailRow icon={Layers} label="Industry" value={profile.industry} />}
            {profile.companySize && (
              <DetailRow icon={Users} label="Company size" value={profile.companySize} />
            )}
            {profile.location && (
              <DetailRow icon={MapPin} label="Location" value={profile.location} />
            )}
            {profile.website && (
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="flex items-center gap-2 text-sm text-gray-500">
                  <Globe className="h-4 w-4 shrink-0" aria-hidden="true" /> Website
                </dt>
                <dd className="min-w-0 truncate text-right text-sm font-medium text-brand-600">
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-brand-700"
                  >
                    {profile.website}
                  </a>
                </dd>
              </div>
            )}
            {profile.phone && <DetailRow icon={Phone} label="Phone" value={profile.phone} />}
            {profile.email && <DetailRow icon={Mail} label="Email" value={profile.email} />}
            {profile.bio && <DetailRow icon={Building2} label="Bio" value={profile.bio} />}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Banknote,
  Briefcase,
  BriefcaseBusiness,
  CheckCircle,
  Clock,
  Code,
  FolderOpen,
  Globe,
  MapPin,
  Pencil,
  Star,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import PageHeader from '../../components/marketplace/PageHeader';
import AvatarUpload from '../../components/marketplace/AvatarUpload';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import SkillBadge from '../../components/marketplace/SkillBadge';
import StatusBadge from '../../components/marketplace/StatusBadge';
import CredentialManager from '../../components/freelancers/CredentialManager';
import ReviewList from '../../components/ui/ReviewList';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FreelancerProfileSkeleton from '../../components/freelancers/FreelancerProfileSkeleton';
import { freelancerService } from '../../services/freelancerService';
import { normalizeFreelancer } from '../../utils/freelancerMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import apiClient from '../../api/client';

import { useAuth } from '../../hooks/useAuth';

export default function FreelancerProfilePage() {
  usePageTitle('My Profile');
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
      const response = await freelancerService.getMyProfile();
      if (response.success) {
        setRawData(response.data);
        setProfile(normalizeFreelancer(response.data));
      } else {
        setError(response.message || 'Unable to load your profile.');
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 403) {
        setForbidden(true);
        setError(err.response.data?.message || 'You do not have a freelancer profile.');
      } else if (status === 404) {
        setError('Your freelancer profile could not be found.');
      } else {
        setError(getErrorMessage(err, 'Unable to load your profile right now. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) return <FreelancerProfileSkeleton />;

  if (error || !profile) {
    return (
      <ErrorState
        title={forbidden ? 'Freelancer profile unavailable' : 'Unable to load your profile'}
        description={error}
        onRetry={loadProfile}
      />
    );
  }

  const links = [
    profile.githubUrl && { href: profile.githubUrl, label: 'GitHub', icon: Code },
    profile.linkedinUrl && { href: profile.linkedinUrl, label: 'LinkedIn', icon: BriefcaseBusiness },
    profile.website && { href: profile.website, label: 'Website', icon: Globe },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Freelancer"
        title="My Profile"
        description="How clients see you on the marketplace."
        actions={
          <Button as={Link} to="/freelancer/profile/edit">
            <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Profile
          </Button>
        }
      />

      {/* Header */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
          <AvatarUpload
            name={profile.name}
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
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink-900">
                {profile.name ?? 'Freelancer'}
              </h2>
              <StatusBadge status={profile.availability} dot />
            </div>
            <p className="mt-1 text-base font-medium text-gray-600">
              {profile.headline ?? 'Professional headline not set yet.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500 sm:justify-start">
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
              {profile.experienceLevelLabel && (
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" aria-hidden="true" />
                  {profile.experienceLevelLabel}
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
            <p className="text-xs font-medium text-gray-500">Hourly rate</p>
            <p className="mt-1 text-lg font-extrabold text-ink-900">
              {profile.hourlyRate != null && profile.hourlyRate > 0
                ? `${formatETB(profile.hourlyRate)}/hr`
                : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Jobs completed</p>
            <p className="mt-1 text-lg font-extrabold text-brand-500">
              {profile.completedJobsCount}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Rating</p>
            <p className="mt-1 text-lg font-extrabold text-ink-900">
              {profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total earnings</p>
            <p className="mt-1 text-lg font-extrabold text-emerald-600">
              {formatETB(profile.totalEarnings)}
            </p>
          </div>
        </div>
      </Card>

      {/* Professional summary */}
      <Card>
        <CardHeader title="Professional summary" />
        <CardBody>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {profile.overview || 'You have not added a professional summary yet.'}
          </p>
        </CardBody>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader
          title="Skills & expertise"
          description="Managed from the edit form — skills you list here appear on your public profile."
        />
        <CardBody>
          {profile.skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <SkillBadge key={skill.id} className="gap-1.5">
                  {skill.name}
                  {skill.yearsOfExperience != null && (
                    <span className="text-[10px] font-semibold text-brand-600">
                      {skill.yearsOfExperience}y
                    </span>
                  )}
                </SkillBadge>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <FolderOpen className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <p className="text-sm text-gray-500">
                No skills listed yet.{' '}
                <Link
                  to="/freelancer/profile/edit"
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Add skills
                </Link>{' '}
                to help clients find you.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Verified Credentials */}
      {rawData?.verified_credentials?.length > 0 && (
        <Card>
          <CardHeader
            title="Verified Credentials"
            description="Your approved certificates and professional qualifications."
          />
          <CardBody>
            <ul className="space-y-3">
              {rawData.verified_credentials.map((cred) => (
                <li key={cred.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50">
                    <Award className="h-4 w-4 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{cred.title}</p>
                    <p className="text-xs text-gray-500">
                      {cred.type === 'dream_more_certificate' ? 'Dream More Certified' : 'Verified Certificate'}
                      {cred.issuing_organization && ` — ${cred.issuing_organization}`}
                    </p>
                  </div>
                  <CheckCircle className="ml-auto h-4 w-4 text-success-500" />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Reviews */}
      <Card>
        <CardHeader
          title="Reviews"
          description={rawData?.review_count > 0 ? `${rawData.review_count} review${rawData.review_count === 1 ? '' : 's'}` : 'No reviews yet'}
        />
        <CardBody>
          <ReviewList
            reviews={rawData?.reviews ?? []}
            averageRating={rawData?.rating ?? null}
            reviewCount={rawData?.review_count ?? 0}
          />
        </CardBody>
      </Card>

      {/* Credentials Manager */}
      <CredentialManager />

      {/* External links */}
      <Card>
        <CardHeader title="Links & portfolio" />
        <CardBody>
          {links.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-brand-200 hover:text-brand-600"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" /> {link.label}
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <Banknote className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <p className="text-sm text-gray-500">
                No external links added yet — add GitHub, LinkedIn, or your website from the edit
                form.
              </p>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

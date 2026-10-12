import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  Mail,
  Globe,
  Code,
  BriefcaseBusiness,
  Send,
  Briefcase,
  Banknote,
  Star,
  Compass,
  ArrowLeft,
  Bookmark,
  Award,
  CheckCircle,
} from 'lucide-react';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import Breadcrumbs from '../../components/marketplace/Breadcrumbs';
import Avatar from '../../components/marketplace/Avatar';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import SkillBadge from '../../components/marketplace/SkillBadge';
import StatusBadge from '../../components/marketplace/StatusBadge';
import PriceDisplay from '../../components/marketplace/PriceDisplay';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import FreelancerProfileSkeleton from '../../components/freelancers/FreelancerProfileSkeleton';
import { freelancerService } from '../../services/freelancerService';
import { savedService } from '../../services/savedService';
import { useAuth } from '../../hooks/useAuth';
import { normalizeFreelancer } from '../../utils/freelancerMapper';
import { getErrorMessage } from '../../utils/errors';
import { formatETB, formatDate } from '../../utils/format';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

export default function FreelancerDetailsPage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  usePageTitle(profile ? `${profile.name} — Freelancer` : 'Freelancer Profile');

  const checkSaved = useCallback(async () => {
    if (!user || !id) return;
    try {
      const res = await savedService.isFreelancerSaved(id);
      if (res.success) setIsSaved(res.data.saved);
    } catch {
      // Silently ignore.
    }
  }, [user, id]);

  useEffect(() => {
    checkSaved();
  }, [checkSaved]);

  const handleToggleSave = async () => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setSaving(true);
    try {
      if (isSaved) {
        await savedService.unsaveFreelancer(id);
        setIsSaved(false);
      } else {
        await savedService.saveFreelancer(id);
        setIsSaved(true);
      }
    } catch {
      checkSaved();
    } finally {
      setSaving(false);
    }
  };

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const response = await freelancerService.getFreelancer(id);
      if (response.success) {
        setProfile(normalizeFreelancer(response.data));
      } else {
        setError(response.message || 'Freelancer profile not found.');
        setNotFound(true);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true);
        setError('This freelancer profile is no longer available or does not exist.');
      } else {
        setError(getErrorMessage(err, 'Unable to load this profile right now. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <Container className="py-8 lg:py-12">
        <FreelancerProfileSkeleton />
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container className="py-8 lg:py-12">
        {notFound ? (
          <div className="flex flex-col items-center rounded-card border border-dashed border-gray-300 bg-gray-50/60 px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-card">
              <Compass className="h-7 w-7 text-brand-500" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-xl font-bold text-ink-900">Freelancer not found</h1>
            <p className="mt-2 max-w-md text-sm text-gray-500">{error}</p>
            <Button as={Link} to="/freelancers" variant="outline" className="mt-6">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to talent
            </Button>
          </div>
        ) : (
          <ErrorState title="Unable to load this profile" description={error} onRetry={loadProfile} />
        )}
      </Container>
    );
  }

  const links = [
    profile.githubUrl && { href: profile.githubUrl, label: 'GitHub', icon: Code },
    profile.linkedinUrl && { href: profile.linkedinUrl, label: 'LinkedIn', icon: BriefcaseBusiness },
    profile.website && { href: profile.website, label: 'Website', icon: Globe },
  ].filter(Boolean);

  // Real verified credentials from API
  const verifiedCredentials = profile.verified_credentials ?? [];
  // Real reviews from API
  const reviews = profile.reviews ?? [];

  return (
    <Container className="py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Find Talent', to: '/freelancers' },
          { label: profile.name ?? 'Freelancer' },
        ]}
        className="mb-4"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Header card */}
          <Card className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col items-center gap-4 sm:gap-5 text-center sm:flex-row sm:items-start sm:text-left">
              <Avatar name={profile.name} size="xl" variant="brand" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-ink-900 break-words">
                    {profile.name ?? 'Freelancer'}
                  </h1>
                  <StatusBadge status={profile.availability} dot />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleToggleSave}
                    disabled={saving}
                    aria-pressed={isSaved}
                    className={cn(
                      'ml-1 font-bold transition-all',
                      isSaved
                        ? 'border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100'
                        : 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600',
                    )}
                  >
                    <Bookmark
                      className={cn('h-4 w-4 mr-1', isSaved ? 'fill-brand-600 text-brand-600' : 'text-gray-400')}
                      aria-hidden="true"
                    />
                    {isSaved ? 'Saved Talent' : 'Save Talent'}
                  </Button>
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
                  <RatingDisplay rating={profile.rating} />
                  {profile.experienceLevelLabel && (
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" aria-hidden="true" />
                      {profile.experienceLevelLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats (real API data) */}
            <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4 border-t border-gray-100 pt-5 sm:pt-6 sm:grid-cols-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Hourly rate</p>
                <p className="mt-1 text-lg font-extrabold text-ink-900">
                  {profile.hourlyRate != null ? formatETB(profile.hourlyRate) : 'Not set'}
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
                <p className="mt-1 flex items-center gap-1 text-lg font-extrabold text-ink-900">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {profile.rating ? profile.rating.toFixed(1) : '—'}
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

          {/* Summary */}
          <Card>
            <CardHeader title="Professional summary" />
            <CardBody>
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-600">
                {profile.overview ||
                  'This freelancer has not added a professional summary yet.'}
              </p>
            </CardBody>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader title="Skills & expertise" />
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
                <p className="text-sm text-gray-500">No skills listed yet.</p>
              )}
            </CardBody>
          </Card>

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
                <p className="text-sm text-gray-500">No external links added yet.</p>
              )}
            </CardBody>
          </Card>

          {/* Verified credentials */}
          {verifiedCredentials.length > 0 && (
            <Card>
              <CardHeader title="Credentials & certifications" description="Verified professional qualifications." />
              <CardBody>
                <div className="space-y-3">
                  {verifiedCredentials.map((cred) => {
                    const isDmCertified = cred.verification_source === 'dream_more_lms' && cred.auto_verified;
                    return (
                      <div
                        key={cred.id}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 p-4"
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isDmCertified ? 'bg-green-50' : 'bg-blue-50'}`}>
                          {isDmCertified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                          ) : (
                            <Award className="h-4 w-4 text-blue-600" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-ink-900">{cred.title}</h3>
                            <Badge tone={isDmCertified ? 'success' : 'info'} size="xs">
                              {isDmCertified ? 'Dream More Certified' : 'Verified Credential'}
                            </Badge>
                            {cred.type && (
                              <Badge tone="neutral" size="xs">
                                {cred.type.replace(/_/g, ' ')}
                              </Badge>
                            )}
                          </div>
                          {cred.issuing_organization && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              Issued by {cred.issuing_organization}
                              {cred.certificate_identifier && ` · ID: ${cred.certificate_identifier}`}
                            </p>
                          )}
                          {cred.description && (
                            <p className="mt-1 text-xs text-gray-400">{cred.description}</p>
                          )}
                          {isDmCertified && cred.lms_course_name && (
                            <p className="mt-1 text-xs text-green-600 font-medium">
                              Verified through Dream More learning records
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                            {cred.issue_date && <span>Issued {formatDate(cred.issue_date)}</span>}
                            {cred.expiry_date && <span>· Expires {formatDate(cred.expiry_date)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Reviews (real data) */}
          {reviews.length > 0 && (
            <Card>
              <CardHeader title="Reviews" description="What clients say about working together." />
              <CardBody>
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-ink-900">{review.reviewer_name}</p>
                        <RatingDisplay rating={review.rating} showValue={false} />
                      </div>
                      {review.contract_title && (
                        <p className="mt-0.5 text-xs text-gray-500">{review.contract_title}</p>
                      )}
                      {review.comment && (
                        <p className="mt-2 text-sm italic text-gray-500">“{review.comment}”</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader title="Hire this freelancer" />
            <CardBody className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-gray-500">Hourly rate</span>
                {profile.hourlyRate != null ? (
                  <PriceDisplay amount={profile.hourlyRate} interval="hr" size="lg" />
                ) : (
                  <span className="text-sm text-gray-400">Not set</span>
                )}
              </div>
              <dl className="space-y-3 border-t border-gray-100 pt-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Availability</dt>
                  <dd>
                    <StatusBadge status={profile.availability} />
                  </dd>
                </div>
                {profile.location && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-gray-500">Location</dt>
                    <dd className="font-medium text-ink-900">{profile.location}</dd>
                  </div>
                )}
                {profile.memberSinceLabel && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-gray-500">
                      <Clock className="h-4 w-4" aria-hidden="true" /> Member since
                    </dt>
                    <dd className="font-medium text-ink-900">{profile.memberSinceLabel}</dd>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center justify-between gap-4">
                    <dt className="flex items-center gap-1.5 text-gray-500">
                      <Mail className="h-4 w-4" aria-hidden="true" /> Email
                    </dt>
                    <dd className="truncate font-medium text-ink-900">{profile.email}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
            <div className="space-y-2 border-t border-gray-100 px-5 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleToggleSave}
                disabled={saving}
                className={cn(
                  'w-full font-bold transition-all',
                  isSaved
                    ? 'border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100'
                    : 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600',
                )}
              >
                <Bookmark
                  className={cn('h-4 w-4 mr-1.5', isSaved ? 'fill-brand-600 text-brand-600' : 'text-gray-500')}
                  aria-hidden="true"
                />
                {isSaved ? 'Saved to Shortlist' : 'Save Talent'}
              </Button>
            </div>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50">
                  <Banknote className="h-4 w-4 text-brand-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Looking to hire?</p>
                  <p className="text-xs text-gray-500">
                    Browse open jobs or post your own.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col">
                <Button as={Link} to="/jobs" variant="outline" size="sm" className="flex-1">
                  Browse jobs
                </Button>
                <Button as={Link} to="/register" variant="ghost" size="sm" className="flex-1">
                  Post a job
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  );
}

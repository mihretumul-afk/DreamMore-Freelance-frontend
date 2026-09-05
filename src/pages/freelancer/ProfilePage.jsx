import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  Banknote,
  Briefcase,
  BriefcaseBusiness,
  CheckCircle,
  Clock,
  Code,
  ExternalLink,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Sparkles,
  Star,
  TrendingUp,
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
import { API_BASE_URL } from '../../config/env';
import { cn } from '../../utils/cn';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { usePlatform } from '../../hooks/usePlatform';
import apiClient from '../../api/client';
import Modal from '../../components/ui/Modal';

import { useAuth } from '../../hooks/useAuth';

/* ═══════════════════════════════════════════════════════════════════════════
   HELPER: Resolve backend asset URLs (relative /storage paths or host
   mismatches between localhost and 127.0.0.1).
   ═══════════════════════════════════════════════════════════════════════════ */
function resolveAssetUrl(src) {
  if (!src) return null;
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  const backendHost = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

  if (src.startsWith('/storage/')) {
    return `${backendHost}${src}`;
  }

  if (
    src.startsWith('http://localhost:8000/storage/') ||
    src.startsWith('http://127.0.0.1:8000/storage/')
  ) {
    const path = src.substring(src.indexOf('/storage/'));
    return `${backendHost}${path}`;
  }

  return src;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Profile Stat (icon tile + label + value)
   ═══════════════════════════════════════════════════════════════════════════ */
function ProfileStat({ icon: Icon, label, value, tone = 'ink' }) {
  const tones = {
    brand: 'bg-brand-100 text-brand-600',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600',
    ink: 'bg-ink-100 text-ink-600',
    violet: 'bg-violet-100 text-violet-600',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white px-3.5 py-3 shadow-sm transition-colors hover:border-gray-300">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-base font-extrabold text-ink-900 sm:text-lg">{value}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Portfolio Tile (image grid card for a saved portfolio item)
   ═══════════════════════════════════════════════════════════════════════════ */
function PortfolioTile({ item }) {
  const imageUrl = resolveAssetUrl(item.image_url);

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card-hover">
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-ink-50 to-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.title ?? 'Portfolio project'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-gray-300">
            <ImageIcon className="h-8 w-8 stroke-1" aria-hidden="true" />
            <span className="text-[10px] font-medium text-gray-400">No preview image</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <h4 className="truncate text-sm font-bold text-ink-900 transition-colors group-hover:text-brand-600">
          {item.title}
        </h4>
        {item.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
        )}
        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-gray-100 pt-2.5">
          {item.category?.name ? (
            <span className="truncate text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {item.category.name}
            </span>
          ) : (
            <span />
          )}
          {item.project_url ? (
            <a
              href={item.project_url}
              target="_blank"
              rel="noreferrer"
              title="Open live project in a new tab"
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-600 transition-colors hover:bg-brand-100 hover:text-brand-700"
            >
              Live Demo <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function FreelancerProfilePage() {
  usePageTitle('My Profile');
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const { showToast } = useToast();
  const { settings: platformSettings } = usePlatform();
  const [rawData, setRawData] = useState(null);
  const [featuredStatus, setFeaturedStatus] = useState(null);
  const [featuring, setFeaturing] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

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

  // Load featured status when profile loads
  useEffect(() => {
    if (!platformSettings?.featured_profiles_enabled) return;
    let cancelled = false;
    freelancerService.getFeaturedStatus().then((res) => {
      if (!cancelled && res.success) {
        setFeaturedStatus({
          is_featured: res.data?.is_featured ?? false,
          expires_at: res.data?.featured_until ?? null,
        });
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [platformSettings?.featured_profiles_enabled]);

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

  const portfolioItems = rawData?.portfolio_items ?? [];
  const verifiedCredentials = rawData?.verified_credentials ?? [];
  const reviewCount = rawData?.review_count ?? 0;

  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    await apiClient.post('/avatar', formData);
    await loadProfile();
    if (refreshUser) await refreshUser();
  };

  const removeAvatar = async () => {
    await apiClient.delete('/avatar');
    await loadProfile();
    if (refreshUser) await refreshUser();
  };

  const chipClass =
    'inline-flex items-center gap-1.5 rounded-full border border-gray-200/70 bg-white/70 px-3 py-1 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Freelancer"
        title="My Profile"
        description="How clients see you on the marketplace."
        actions={
          <div className="flex items-center gap-2">
            {platformSettings?.featured_profiles_enabled && !featuredStatus?.is_featured && (
              <Button
                variant="primary"
                size="sm"
                loading={featuring}
                onClick={() => setShowFeatureModal(true)}
              >
                ⭐ Feature My Profile
              </Button>
            )}
            {featuredStatus?.is_featured && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
                ⭐ Featured until {featuredStatus.expires_at ? new Date(featuredStatus.expires_at).toLocaleDateString() : '—'}
              </span>
            )}
            <Button as={Link} to="/freelancer/profile/edit">
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit Profile
            </Button>
          </div>
        }
      />

      {/* ═══ Identity hero ═══ */}
      <Card className="overflow-hidden p-0">
        {/* Gradient band behind the identity */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-indigo-50/70 px-6 py-8 sm:px-10 sm:py-10">
          <div className="pointer-events-none absolute -top-20 -right-12 h-52 w-52 rounded-full bg-brand-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-brand-400 to-indigo-400" />

          <div className="relative z-10 flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:text-left">
            <AvatarUpload
              overlay
              size="2xl"
              name={profile.name}
              src={profile.avatar}
              onUpload={uploadAvatar}
              onRemove={removeAvatar}
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 sm:justify-start">
                <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
                  {profile.name ?? 'Freelancer'}
                </h2>
                {rawData?.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/90 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> DreamMore Verified
                  </span>
                )}
              </div>

              <p className="mt-2 text-base font-medium text-gray-600 sm:text-lg">
                {profile.headline ?? 'Professional headline not set yet.'}
              </p>

              {/* Meta chips row */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <StatusBadge status={profile.availability} dot />

                {profile.location && (
                  <span className={chipClass}>
                    <MapPin className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" /> {profile.location}
                  </span>
                )}

                {profile.rating > 0 ? (
                  <span className={cn(chipClass, 'px-2.5')}>
                    <RatingDisplay rating={profile.rating} showValue count={reviewCount} />
                  </span>
                ) : (
                  <span className={chipClass}>
                    <Star className="h-3.5 w-3.5 text-gray-300" aria-hidden="true" /> No ratings yet
                  </span>
                )}

                {profile.experienceLevelLabel && (
                  <span className={chipClass}>
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                    {profile.experienceLevelLabel}
                  </span>
                )}

                {profile.memberSinceLabel && (
                  <span className={chipClass}>
                    <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" /> Member since{' '}
                    {profile.memberSinceLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats — real API data */}
        <div className="border-t border-white/60 bg-white/70 px-5 py-4 sm:px-8 sm:py-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ProfileStat
              icon={Banknote}
              tone="violet"
              label="Hourly rate"
              value={
                profile.hourlyRate != null && profile.hourlyRate > 0
                  ? `${formatETB(profile.hourlyRate)}/hr`
                  : 'Not set'
              }
            />
            <ProfileStat
              icon={Briefcase}
              tone="success"
              label="Jobs completed"
              value={profile.completedJobsCount}
            />
            <ProfileStat
              icon={Star}
              tone="warning"
              label="Rating"
              value={profile.rating > 0 ? profile.rating.toFixed(1) : '—'}
            />
            <ProfileStat
              icon={TrendingUp}
              tone="brand"
              label="Total earnings"
              value={formatETB(profile.totalEarnings)}
            />
          </div>
        </div>
      </Card>

      {/* ═══ Professional summary ═══ */}
      <Card>
        <CardHeader title="Professional summary" />
        <CardBody>
          <p className="whitespace-pre-line text-[15px] leading-7 text-gray-600">
            {profile.overview || 'You have not added a professional summary yet.'}
          </p>
        </CardBody>
      </Card>

      {/* ═══ Skills & expertise ═══ */}
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

      {/* ═══ Verified Credentials — platform-seal showcase ═══ */}
      {verifiedCredentials.length > 0 && (
        <Card>
          <CardHeader
            title="Verified Credentials"
            description="Your approved certificates and professional qualifications."
            action={
              <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
                {verifiedCredentials.length} approved
              </span>
            }
          />
          <CardBody>
            <ul className="space-y-3">
              {verifiedCredentials.map((cred) => (
                <li
                  key={cred.id}
                  className="flex items-center gap-3.5 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-white to-white p-3.5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm shadow-emerald-500/30">
                    {cred.type === 'dream_more_certificate' ? (
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Award className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink-900">{cred.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {cred.type === 'dream_more_certificate' ? 'Dream More Certified' : 'Verified Certificate'}
                      {cred.issuing_organization && ` — ${cred.issuing_organization}`}
                    </p>
                  </div>
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
              This is what clients see on your public profile. Add, download, or remove credentials —
              including pending and rejected ones — under Credentials &amp; Certificates below.
            </p>
          </CardBody>
        </Card>
      )}

      {/* ═══ Credentials & Certificates — full management list ═══ */}
      <CredentialManager />

      {/* ═══ Portfolio & links ═══ */}
      <Card>
        <CardHeader
          title="Portfolio & Projects"
          description="Saved work samples — shown to clients alongside your proposals."
          action={
            <Button as={Link} to="/freelancer/profile/edit" variant="outline" size="sm">
              <Pencil className="h-4 w-4" aria-hidden="true" /> Manage
            </Button>
          }
        />
        <CardBody>
          {portfolioItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolioItems.map((item) => (
                <PortfolioTile key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-5 sm:flex-row sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <FolderOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink-900">No portfolio projects yet</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                  Add screenshots, links, or documents from your best work so clients can see what
                  you deliver.
                </p>
              </div>
              <Button as={Link} to="/freelancer/profile/edit" variant="outline" size="sm">
                Add projects
              </Button>
            </div>
          )}

          {/* External links, separate from the visual portfolio pieces */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
            <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Find me on
            </span>
            {links.length > 0 ? (
              links.map((link) => {
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
              })
            ) : (
              <p className="text-sm text-gray-500">
                No external links added yet — add GitHub, LinkedIn, or your website from the edit
                form.
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ═══ Reviews ═══ */}
      <Card>
        <CardHeader
          title="Reviews"
          description={
            reviewCount > 0
              ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}`
              : 'No reviews yet'
          }
          action={
            reviewCount > 0 && rawData?.rating > 0 ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {Number(rawData.rating).toFixed(1)} average
              </span>
            ) : null
          }
        />
        <CardBody>
          <ReviewList
            reviews={rawData?.reviews ?? []}
            averageRating={rawData?.rating ?? null}
            reviewCount={reviewCount}
          />
        </CardBody>
      </Card>

      {/* Feature Profile Modal */}
      <Modal
        open={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        title="Feature My Profile"
        description={`This will deduct ${formatETB(platformSettings?.featured_profile_price ?? 100)} from your wallet and boost your profile's visibility for ${platformSettings?.featured_profile_duration_days ?? 7} days. Continue?`}
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowFeatureModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            loading={featuring}
            onClick={async () => {
              setFeaturing(true);
              try {
                const res = await freelancerService.featureMyProfile();
                if (res.success) {
                  showToast('Profile featured successfully! Your profile is now boosted.', 'success');
                  setFeaturedStatus({ is_featured: true, expires_at: res.data?.featured_profile?.expires_at });
                  setShowFeatureModal(false);
                } else {
                  showToast(res.message || 'Unable to feature your profile.', 'error');
                }
              } catch (err) {
                showToast(getErrorMessage(err, 'Unable to feature your profile. Please try again.'), 'error');
              } finally {
                setFeaturing(false);
              }
            }}
          >
            Confirm Feature
          </Button>
        </div>
      </Modal>
    </div>
  );
}

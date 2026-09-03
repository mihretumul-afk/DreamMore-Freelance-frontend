import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, X, Search, Plus, Loader2, Camera,
  Briefcase, MapPin, DollarSign, Clock, Link2, Award,
  Globe, Code, ExternalLink, Eye, CheckCircle2, Star,
  Zap, Shield, Image as ImageIcon, ChevronRight, Sparkles,
  AlertCircle, Trash2, Upload,
} from 'lucide-react';
import ErrorState from '../../components/common/ErrorState';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import FreelancerProfileSkeleton from '../../components/freelancers/FreelancerProfileSkeleton';
import PortfolioManager from '../../components/freelancers/PortfolioManager';
import { freelancerService } from '../../services/freelancerService';
import { avatarService } from '../../services/avatarService';
import { skillService } from '../../services/skillService';
import {
  normalizeFreelancer,
  freelancerProfileToForm,
  freelancerFormToPayload,
} from '../../utils/freelancerMapper';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { isHttpUrl } from '../../utils/validate';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { getPlatformCurrency } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../utils/cn';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Backend error field name → form state key. */
const ERROR_FIELD_MAP = {
  headline: 'headline',
  overview: 'overview',
  hourly_rate: 'hourlyRate',
  experience_level: 'experienceLevel',
  location: 'location',
  github_url: 'githubUrl',
  linkedin_url: 'linkedinUrl',
  website: 'website',
  availability_status: 'availability',
  skills: 'skills',
};

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level', icon: '🌱', desc: '0-2 years' },
  { value: 'intermediate', label: 'Intermediate', icon: '🌿', desc: '2-5 years' },
  { value: 'expert', label: 'Expert', icon: '🌳', desc: '5+ years' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available for work', color: 'emerald' },
  { value: 'busy', label: 'Busy', color: 'amber' },
  { value: 'not_available', label: 'Not available', color: 'red' },
];

const LINK_FIELDS = [
  { name: 'githubUrl', label: 'GitHub', icon: Code, placeholder: 'https://github.com/username' },
  { name: 'linkedinUrl', label: 'LinkedIn', icon: ExternalLink, placeholder: 'https://www.linkedin.com/in/username' },
  { name: 'website', label: 'Website', icon: Globe, placeholder: 'https://yoursite.com' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Profile Photo Upload
   ═══════════════════════════════════════════════════════════════════════════ */
function ProfilePhotoUpload({ currentAvatar, userName, onAvatarUpdate }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentAvatar);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setPreview(currentAvatar);
  }, [currentAvatar]);

  const handleFile = async (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please upload a JPG, PNG, or WEBP image.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be less than 5MB.', 'error');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    setUploading(true);
    try {
      const res = await avatarService.uploadAvatar(file);
      if (res.success) {
        setPreview(res.data.avatar);
        onAvatarUpdate(res.data.avatar);
        showToast('Profile photo updated!', 'success');
      } else {
        setPreview(currentAvatar);
        showToast(res.message || 'Failed to upload photo.', 'error');
      }
    } catch (err) {
      setPreview(currentAvatar);
      showToast(getErrorMessage(err, 'Failed to upload photo. Please try again.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Remove your profile photo?')) return;
    setUploading(true);
    try {
      const res = await avatarService.removeAvatar();
      if (res.success) {
        setPreview(null);
        onAvatarUpdate(null);
        showToast('Profile photo removed.', 'success');
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to remove photo.'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const initials = (userName || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'group relative mx-auto h-32 w-32 cursor-pointer overflow-hidden rounded-full border-4 transition-all duration-300',
        dragOver
          ? 'border-brand-400 ring-4 ring-brand-100 scale-105'
          : 'border-white shadow-xl hover:ring-4 hover:ring-brand-100 hover:scale-105'
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload profile photo"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
    >
      {/* Avatar */}
      {preview ? (
        <img src={preview} alt="Profile" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600 text-3xl font-extrabold text-white">
          {initials}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {uploading ? (
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        ) : (
          <>
            <Camera className="h-6 w-6 text-white" />
            <span className="mt-1 text-[10px] font-semibold text-white">Change photo</span>
          </>
        )}
      </div>

      {/* Remove button */}
      {preview && !uploading && (
        <button
          type="button"
          onClick={handleRemove}
          className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
          aria-label="Remove profile photo"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        tabIndex={-1}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Profile Strength Meter
   ═══════════════════════════════════════════════════════════════════════════ */
function ProfileStrengthMeter({ form, avatar }) {
  const checks = [
    { label: 'Photo', done: !!avatar, icon: Camera },
    { label: 'Headline', done: !!form.headline?.trim(), icon: Briefcase },
    { label: 'Overview', done: !!form.overview?.trim() && form.overview.trim().length >= 50, icon: Sparkles },
    { label: 'Rate', done: form.hourlyRate !== '' && Number(form.hourlyRate) > 0, icon: DollarSign },
    { label: 'Skills', done: form.skills.length > 0, icon: Zap },
    { label: 'Location', done: !!form.location?.trim(), icon: MapPin },
    { label: 'Links', done: !!(form.githubUrl?.trim() || form.linkedinUrl?.trim() || form.website?.trim()), icon: Link2 },
  ];

  const completed = checks.filter(c => c.done).length;
  const percentage = Math.round((completed / checks.length) * 100);

  const ringColor = percentage === 100
    ? 'stroke-emerald-500'
    : percentage >= 50
      ? 'stroke-amber-500'
      : 'stroke-brand-500';

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Profile Completeness</h3>
            <p className="mt-0.5 text-xs text-white/70">{completed} of {checks.length} sections completed</p>
          </div>
          <div className="relative h-14 w-14">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
              <circle
                cx="28" cy="28" r="24" fill="none"
                className={ringColor}
                strokeWidth="4"
                strokeDasharray={`${(percentage / 100) * 150.8} 150.8`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-px bg-gray-100 sm:grid-cols-7">
        {checks.map((check) => (
          <div
            key={check.label}
            className={cn(
              'flex flex-col items-center gap-1.5 bg-white px-2 py-3 transition-colors',
              check.done ? 'text-emerald-600' : 'text-gray-400'
            )}
          >
            <check.icon className="h-4 w-4" />
            <span className="text-[10px] font-medium leading-tight text-center">{check.label}</span>
            {check.done && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: Section Wrapper
   ═══════════════════════════════════════════════════════════════════════════ */
function Section({ icon: Icon, title, description, badge, children, id }) {
  return (
    <section id={id} className="group/section">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover/section:bg-brand-100">
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink-900">{title}</h3>
              {badge && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> {badge}
                </span>
              )}
            </div>
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
        </div>
        <CardBody className="px-6 py-5">{children}</CardBody>
      </Card>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: SkillSearch
   ═══════════════════════════════════════════════════════════════════════════ */
function SkillSearch({ existingSkillIds, onAdd, disabled }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const searchSkills = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const response = await skillService.getSkills({ search: searchQuery.trim() });
      if (response.success) {
        setResults(response.data ?? []);
      } else {
        setError('Failed to search skills.');
      }
    } catch {
      setError('Failed to search skills. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchSkills(value), 300);
  };

  const handleAdd = (skill) => {
    onAdd(skill);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const available = results.find((s) => !existingSkillIds.has(s.id));
      if (available) handleAdd(available);
    }
  };

  const filteredResults = results.filter((s) => !existingSkillIds.has(s.id));

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query.trim()) setOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder="Type to search skills (e.g. React, Laravel, Figma)..."
          disabled={disabled}
          className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-3 pl-10 pr-4 text-sm text-ink-900 placeholder-gray-400 transition-all focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand-500" />
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-danger-600">{error}</p>}

      {open && !loading && filteredResults.length > 0 && (
        <ul className="absolute z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl" role="listbox">
          {filteredResults.slice(0, 10).map((skill) => (
            <li
              key={skill.id}
              role="option"
              tabIndex={0}
              onClick={() => handleAdd(skill)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAdd(skill); } }}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-ink-900 cursor-pointer transition-colors hover:bg-brand-50 focus:bg-brand-50 focus:outline-none first:rounded-t-xl last:rounded-b-xl"
            >
              <div className="min-w-0">
                <span className="font-semibold">{skill.name}</span>
                {skill.category?.name && (
                  <span className="ml-2 text-xs text-gray-400">{skill.category.name}</span>
                )}
              </div>
              <Plus className="h-4 w-4 shrink-0 rounded-full bg-brand-100 p-0.5 text-brand-600" />
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim() && filteredResults.length === 0 && !error && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-gray-200 bg-white p-6 text-center shadow-xl">
          <Search className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No skills found matching &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: Freelancer Profile Edit Page
   ═══════════════════════════════════════════════════════════════════════════ */
export default function FreelancerProfileEditPage() {
  usePageTitle('Edit Profile');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [avatar, setAvatar] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await freelancerService.getMyProfile();
      if (response.success) {
        const normalized = normalizeFreelancer(response.data);
        setForm(freelancerProfileToForm(normalized));
        setAvatar(normalized?.avatar || user?.avatar || null);
      } else {
        setLoadError(response.message || 'Unable to load your profile.');
      }
    } catch (err) {
      setLoadError(getErrorMessage(err, 'Unable to load your profile right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [user?.avatar]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSkillYearsChange = (id, value) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.map((skill) =>
        skill.id === id ? { ...skill, yearsOfExperience: value } : skill,
      ),
    }));
  };

  const handleRemoveSkill = (id) => {
    setForm((prev) => ({ ...prev, skills: prev.skills.filter((skill) => skill.id !== id) }));
  };

  const handleAddSkill = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: [...prev.skills, { id: skill.id, name: skill.name, yearsOfExperience: 1 }],
    }));
    if (fieldErrors.skills) {
      setFieldErrors((prev) => ({ ...prev, skills: undefined }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!isHttpUrl(form.githubUrl)) errors.githubUrl = 'Enter a valid URL starting with http:// or https://.';
    if (!isHttpUrl(form.linkedinUrl)) errors.linkedinUrl = 'Enter a valid URL starting with http:// or https://.';
    if (!isHttpUrl(form.website)) errors.website = 'Enter a valid URL starting with http:// or https://.';
    if (form.hourlyRate !== '') {
      const rate = Number(form.hourlyRate);
      if (Number.isNaN(rate) || rate < 0 || rate > 9999.99) {
        errors.hourlyRate = 'Enter a rate between 0 and 9,999.99.';
      }
    }
    form.skills.forEach((skill) => {
      const years = Number(skill.yearsOfExperience);
      if (
        skill.yearsOfExperience !== '' &&
        (Number.isNaN(years) || years < 0 || years > 50 || !Number.isInteger(years))
      ) {
        errors.skills = 'Years of experience must be a whole number between 0 and 50.';
      }
    });
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setGeneralError(null);
    setSubmitting(true);
    try {
      await freelancerService.updateMyProfile(freelancerFormToPayload(form));
      showToast('Profile updated successfully!', 'success');
      navigate('/freelancer/profile', { replace: true });
    } catch (error) {
      const errors = getFieldErrors(error);
      const mapped = {};
      Object.entries(errors).forEach(([backendField, message]) => {
        const key = ERROR_FIELD_MAP[backendField];
        if (key) mapped[key] = message;
      });
      setFieldErrors(mapped);
      const hasFieldErrors = Object.keys(mapped).length > 0;
      const msg = hasFieldErrors
        ? null
        : getErrorMessage(error, 'Unable to save your profile. Please try again.');
      setGeneralError(msg);
      if (msg) showToast(msg, 'error');
      setSubmitting(false);
    }
  };

  if (loading) return <FreelancerProfileSkeleton />;

  if (loadError || !form) {
    return (
      <ErrorState
        title="Unable to load your profile"
        description={loadError}
        onRetry={loadProfile}
      />
    );
  }

  const existingSkillIds = new Set(form.skills.map((s) => s.id));
  const hasLinks = !!(form.githubUrl?.trim() || form.linkedinUrl?.trim() || form.website?.trim());

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      {/* ═══════════════════════════════════════════════════════════════════
         HERO HEADER — Gradient background with profile photo
         ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-violet-600 shadow-xl">
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate('/freelancer/profile')}
            className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
          </button>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
            {/* Profile Photo */}
            <ProfilePhotoUpload
              currentAvatar={avatar}
              userName={user?.name || form.headline?.split(' ')[0]}
              onAvatarUpdate={setAvatar}
            />

            {/* Name & headline */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
                {user?.name || 'Your Name'}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {form.headline || 'Add a professional headline to attract clients'}
              </p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                {form.location && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs text-white/80">
                    <MapPin className="h-3 w-3" /> {form.location}
                  </span>
                )}
                {form.experienceLevel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs text-white/80">
                    <Award className="h-3 w-3" /> {EXPERIENCE_LEVELS.find(e => e.value === form.experienceLevel)?.label || form.experienceLevel}
                  </span>
                )}
                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                  form.availability === 'available'
                    ? 'bg-emerald-500/30 text-emerald-100'
                    : form.availability === 'busy'
                      ? 'bg-amber-500/30 text-amber-100'
                      : 'bg-red-500/30 text-red-100'
                )}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {AVAILABILITY_OPTIONS.find(a => a.value === form.availability)?.label || 'Available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
         PROFILE STRENGTH
         ═══════════════════════════════════════════════════════════════════ */}
      <ProfileStrengthMeter form={form} avatar={avatar} />

      {/* Error banner */}
      {generalError && (
        <div role="alert" className="flex items-center gap-3 rounded-xl border border-danger-200 bg-danger-50 px-5 py-3.5 text-sm font-medium text-danger-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {generalError}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
         FORM
         ═══════════════════════════════════════════════════════════════════ */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 lg:grid lg:grid-cols-[1fr_300px] lg:items-start lg:gap-6 lg:space-y-0"
      >
        <div className="min-w-0 space-y-6">
          {/* ── Professional Info ──────────────────────────────────────── */}
          <Section
            icon={Briefcase}
            title="Professional Info"
            description="Your headline, rate, and experience level"
            id="professional"
          >
            <div className="space-y-5">
              <Input
                label="Professional headline"
                name="headline"
                placeholder="e.g. Full-stack developer with 5+ years of experience"
                maxLength={255}
                value={form.headline}
                onChange={handleChange}
                error={fieldErrors.headline}
                disabled={submitting}
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input
                  type="number"
                  label={`Hourly rate (${getPlatformCurrency()})`}
                  name="hourlyRate"
                  placeholder="0.00"
                  min="0"
                  max="9999.99"
                  step="0.01"
                  value={form.hourlyRate}
                  onChange={handleChange}
                  error={fieldErrors.hourlyRate}
                  hint="What you charge per hour"
                  disabled={submitting}
                />
                <Select
                  label="Experience level"
                  name="experienceLevel"
                  value={form.experienceLevel}
                  onChange={handleChange}
                  error={fieldErrors.experienceLevel}
                  disabled={submitting}
                >
                  {EXPERIENCE_LEVELS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label} ({option.desc})
                    </option>
                  ))}
                </Select>
              </div>

              <Input
                label="Location"
                name="location"
                placeholder="e.g. Addis Ababa, Ethiopia"
                maxLength={255}
                value={form.location}
                onChange={handleChange}
                error={fieldErrors.location}
                disabled={submitting}
              />

              <Select
                label="Availability"
                name="availability"
                value={form.availability}
                onChange={handleChange}
                error={fieldErrors.availability}
                disabled={submitting}
              >
                {AVAILABILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </Section>

          {/* ── About ──────────────────────────────────────────────────── */}
          <Section
            icon={Sparkles}
            title="About You"
            description="Tell clients about your experience, strengths, and what you love doing"
            badge={form.overview?.trim().length >= 50 ? 'Complete' : null}
            id="about"
          >
            <Textarea
              label="Professional overview"
              name="overview"
              rows={6}
              maxLength={5000}
              placeholder="Write about your experience, specialties, and the type of work you enjoy. A detailed overview helps clients understand your value and improves your profile visibility..."
              value={form.overview}
              onChange={handleChange}
              error={fieldErrors.overview}
              disabled={submitting}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Tip: Write at least 50 characters for better profile visibility
              </p>
              <span className={cn(
                'text-xs font-medium',
                (form.overview?.length || 0) >= 50 ? 'text-emerald-600' : 'text-gray-400'
              )}>
                {form.overview?.length || 0}/5000
              </span>
            </div>
          </Section>

          {/* ── Skills ─────────────────────────────────────────────────── */}
          <Section
            icon={Zap}
            title="Skills & Expertise"
            description="Add skills to help clients find you in search"
            badge={form.skills.length > 0 ? `${form.skills.length} added` : null}
            id="skills"
          >
            {form.skills.length > 0 ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {form.skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="group/skill inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 py-2 pl-3.5 pr-2 transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{skill.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {skill.yearsOfExperience === '' || skill.yearsOfExperience == null
                          ? 'No experience set'
                          : `${skill.yearsOfExperience} year${skill.yearsOfExperience === '1' ? '' : 's'}`}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={skill.yearsOfExperience}
                      onChange={(event) => handleSkillYearsChange(skill.id, event.target.value)}
                      disabled={submitting}
                      className="h-7 w-12 rounded-lg border border-gray-200 bg-white px-1.5 text-center text-xs font-medium text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400/20"
                      title="Years of experience"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.id)}
                      disabled={submitting}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label={`Remove ${skill.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
                <Zap className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-500">No skills added yet</p>
                <p className="mt-1 text-xs text-gray-400">Search below to add your first skill</p>
              </div>
            )}

            {fieldErrors.skills && (
              <p role="alert" className="mb-4 text-xs font-medium text-danger-600">
                {fieldErrors.skills}
              </p>
            )}

            <SkillSearch
              existingSkillIds={existingSkillIds}
              onAdd={handleAddSkill}
              disabled={submitting}
            />
          </Section>

          {/* ── Links ──────────────────────────────────────────────────── */}
          <Section
            icon={Link2}
            title="Online Presence"
            description="Show clients where they can find your work"
            badge={hasLinks ? 'Added' : null}
            id="links"
          >
            <div className="space-y-4">
              {LINK_FIELDS.map(({ name, label, icon: FieldIcon, placeholder }) => (
                <div key={name} className="flex items-start gap-3">
                  <div className="mt-2.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                    <FieldIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="url"
                      label={label}
                      name={name}
                      placeholder={placeholder}
                      maxLength={255}
                      value={form[name]}
                      onChange={handleChange}
                      error={fieldErrors[name]}
                      disabled={submitting}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Portfolio ──────────────────────────────────────────────── */}
          <PortfolioManager />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
           SIDEBAR — Sticky actions
           ═══════════════════════════════════════════════════════════════ */}
        <aside className="lg:sticky lg:top-24">
          <div className="space-y-4">
            {/* Save card */}
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 p-5 text-center">
                <Shield className="mx-auto h-8 w-8 text-white/80" />
                <p className="mt-2 text-sm font-bold text-white">Ready to save?</p>
                <p className="mt-1 text-xs text-white/60">Your profile updates instantly</p>
              </div>
              <div className="space-y-3 p-4">
                <Button type="submit" loading={submitting} className="w-full" size="lg">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/freelancer/profile')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </Card>

            {/* Quick nav */}
            <Card>
              <CardBody className="p-3">
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Jump to section</p>
                {[
                  { id: 'professional', icon: Briefcase, label: 'Professional Info' },
                  { id: 'about', icon: Sparkles, label: 'About You' },
                  { id: 'skills', icon: Zap, label: 'Skills' },
                  { id: 'links', icon: Link2, label: 'Links' },
                ].map(({ id, icon: NavIcon, label }) => (
                  <a
                    key={id}
                    href={`#${id}`}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-brand-50 hover:text-brand-600"
                  >
                    <NavIcon className="h-3.5 w-3.5" />
                    {label}
                  </a>
                ))}
              </CardBody>
            </Card>

            {/* Preview hint */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center">
              <Eye className="mx-auto h-4 w-4 text-gray-400" />
              <p className="mt-1.5 text-xs text-gray-500">
                Your public profile updates immediately after saving.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

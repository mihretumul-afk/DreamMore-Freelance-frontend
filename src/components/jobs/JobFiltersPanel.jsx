import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShieldAlert, Clock, XCircle } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { categoryService } from '../../services/categoryService';
import { skillService } from '../../services/skillService';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n';
import { ROLES } from '../../constants/app';

/**
 * Job filter form with auth + credential approval guard on the Apply button:
 *   - No account        → redirects to /login
 *   - Freelancer not approved → shows inline status message, disables Apply
 *   - Approved / employer / admin → applies filters normally
 */
export default function JobFiltersPanel({ values = {}, onChange, onApply, onClear, className }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);

  // Credential state (only relevant for freelancers).
  const isFreelancer = user?.role === ROLES.FREELANCER;
  // Must match EnsureVerifiedFreelancer middleware: profile approved + credentials approved.
  const isApproved = user?.is_fully_approved ?? false;
  const verificationStatus = user?.verification_status ?? (isApproved ? 'approved' : 'unverified');

  // null = not blocked; string = reason blocked
  let blockedReason = null;
  if (!user) {
    blockedReason = 'unauthenticated';
  } else if (isFreelancer && !isApproved) {
    blockedReason =
      verificationStatus === 'pending'  ? 'pending'  :
      verificationStatus === 'rejected' ? 'rejected' :
      'unverified';
  }

  useEffect(() => {
    let active = true;
    categoryService.getCategories()
      .then((res) => {
        if (!active) return;
        setCategories(res?.data ?? (Array.isArray(res) ? res : []));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    skillService.getSkills()
      .then((res) => {
        if (!active) return;
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        setSkills(list.filter((s) => s.is_active !== false));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const set = (key, value) => onChange?.(key, value);

  const handleApply = () => {
    // Not logged in → go to login
    if (blockedReason === 'unauthenticated') {
      navigate('/login', { state: { from: location } });
      return;
    }
    // Freelancer not approved → warning shown inline, block the action
    if (blockedReason) return;
    // All good — apply filters
    onApply?.();
  };

  return (
    <Card className={className}>
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">{t('common.filter')}</h2>
        <p className="mt-0.5 text-sm text-gray-500">{t('categories.description')}</p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <Input
          label={t('common.search')}
          icon={Search}
          value={values.search ?? ''}
          onChange={(e) => set('search', e.target.value)}
          placeholder={t('hero.searchPlaceholder')}
        />

        {categories.length > 0 && (
          <Select
            label={t('nav.categories')}
            value={values.category_id ?? ''}
            onChange={(e) => set('category_id', e.target.value)}
          >
            <option value="">{t('common.all')} {t('nav.categories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
        )}

        {skills.length > 0 && (
          <Select
            label={t('nav.skills')}
            value={values.skill_id ?? ''}
            onChange={(e) => set('skill_id', e.target.value)}
          >
            <option value="">{t('common.all')} {t('nav.skills')}</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        )}

        <Select
          label="Sort by"
          value={values.sort ?? ''}
          onChange={(e) => set('sort', e.target.value)}
        >
          <option value="">Newest first</option>
          <option value="budget">Highest budget</option>
          <option value="newest">Most recent</option>
        </Select>

        <Select
          label={t('budgetType.fixed')}
          value={values.budget_type ?? ''}
          onChange={(e) => set('budget_type', e.target.value)}
        >
          <option value="">{t('common.all')}</option>
          <option value="fixed">{t('budgetType.fixed')}</option>
          <option value="hourly">{t('budgetType.hourly')}</option>
        </Select>

        <Select
          label="Experience level"
          value={values.experience_level ?? ''}
          onChange={(e) => set('experience_level', e.target.value)}
        >
          <option value="">{t('common.all')}</option>
          <option value="entry">{t('experience.entry')}</option>
          <option value="intermediate">{t('experience.intermediate')}</option>
          <option value="expert">{t('experience.expert')}</option>
        </Select>

        <Select
          label="Work mode"
          value={values.location_type ?? ''}
          onChange={(e) => set('location_type', e.target.value)}
        >
          <option value="">{t('common.all')}</option>
          <option value="remote">{t('locationType.remote')}</option>
          <option value="onsite">{t('locationType.onsite')}</option>
          <option value="hybrid">{t('locationType.hybrid')}</option>
        </Select>

        <Input
          label="Location"
          value={values.location ?? ''}
          onChange={(e) => set('location', e.target.value)}
          placeholder="e.g. Addis Ababa"
        />

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-ink-800">Budget range (ETB)</span>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number" min="0" step="0.01"
              value={values.min_budget ?? ''}
              onChange={(e) => set('min_budget', e.target.value)}
              placeholder="Min" aria-label="Minimum budget"
            />
            <Input
              type="number" min="0" step="0.01"
              value={values.max_budget ?? ''}
              onChange={(e) => set('max_budget', e.target.value)}
              placeholder="Max" aria-label="Maximum budget"
            />
          </div>
        </div>

        {/* ── Auth / credential inline status ── */}
        {blockedReason === 'pending' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-amber-800">Credentials under review</p>
              <p className="mt-0.5 text-xs text-amber-700">
                Your credentials are being reviewed by admin. You can apply once approved.
              </p>
            </div>
          </div>
        )}

        {blockedReason === 'rejected' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-red-800">Credentials rejected</p>
              <p className="mt-0.5 text-xs text-red-700">
                Your credentials were rejected.{' '}
                <Link to="/freelancer/credentials" className="font-semibold underline hover:text-red-900">
                  Resubmit your documents
                </Link>{' '}
                to get approved by admin.
              </p>
            </div>
          </div>
        )}

        {blockedReason === 'unverified' && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-amber-800">Approval required</p>
              <p className="mt-0.5 text-xs text-amber-700">
                You must be approved by admin first.{' '}
                <Link to="/freelancer/credentials" className="font-semibold underline hover:text-amber-900">
                  Submit your credentials
                </Link>{' '}
                to get started.
              </p>
            </div>
          </div>
        )}

        {/* ── Action buttons ── */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            onClick={handleApply}
            disabled={!!blockedReason && blockedReason !== 'unauthenticated'}
          >
            {t('common.apply')}
          </Button>
          <Button type="button" variant="outline" onClick={onClear}>
            {t('common.clearFilters')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

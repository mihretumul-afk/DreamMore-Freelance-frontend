import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { categoryService } from '../../services/categoryService';
import { skillService } from '../../services/skillService';
import { useI18n } from '../../i18n';

/**
 * Job filter form. Every control maps 1:1 to a query parameter the backend
 * actually accepts (see src/services/jobService.js). Text values are drafts —
 * the parent applies them to the URL; selects change the URL immediately.
 *
 * values: { search, category_id, skill_id, location, min_budget, max_budget,
 *           budget_type, experience_level, location_type, sort }
 */
export default function JobFiltersPanel({ values = {}, onChange, onApply, onClear, className }) {
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    let active = true;
    categoryService
      .getCategories()
      .then((res) => {
        if (!active) return;
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        setCategories(list);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    skillService
      .getSkills()
      .then((res) => {
        if (!active) return;
        const list = res?.data ?? (Array.isArray(res) ? res : []);
        setSkills(list.filter((s) => s.is_active !== false));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const set = (key, value) => onChange?.(key, value);

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
          onChange={(event) => set('search', event.target.value)}
          placeholder={t('hero.searchPlaceholder')}
        />

        {categories.length > 0 && (
          <Select
            label={t('nav.categories')}
            value={values.category_id ?? ''}
            onChange={(event) => set('category_id', event.target.value)}
          >
            <option value="">{t('common.all')} {t('nav.categories')}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        )}

        {skills.length > 0 && (
          <Select
            label={t('nav.skills')}
            value={values.skill_id ?? ''}
            onChange={(event) => set('skill_id', event.target.value)}
          >
            <option value="">{t('common.all')} {t('nav.skills')}</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </Select>
        )}

        <Select
          label="Sort by"
          value={values.sort ?? ''}
          onChange={(event) => set('sort', event.target.value)}
        >
          <option value="">Newest first</option>
          <option value="budget">Highest budget</option>
          <option value="newest">Most recent</option>
        </Select>

        <Select
          label={t('budgetType.fixed')}
          value={values.budget_type ?? ''}
          onChange={(event) => set('budget_type', event.target.value)}
        >
          <option value="">{t('common.all')}</option>
          <option value="fixed">{t('budgetType.fixed')}</option>
          <option value="hourly">{t('budgetType.hourly')}</option>
        </Select>

        <Select
          label="Experience level"
          value={values.experience_level ?? ''}
          onChange={(event) => set('experience_level', event.target.value)}
        >
          <option value="">{t('common.all')}</option>
          <option value="entry">{t('experience.entry')}</option>
          <option value="intermediate">{t('experience.intermediate')}</option>
          <option value="expert">{t('experience.expert')}</option>
        </Select>

        <Select
          label="Work mode"
          value={values.location_type ?? ''}
          onChange={(event) => set('location_type', event.target.value)}
        >
          <option value="">{t('common.all')}</option>
          <option value="remote">{t('locationType.remote')}</option>
          <option value="onsite">{t('locationType.onsite')}</option>
          <option value="hybrid">{t('locationType.hybrid')}</option>
        </Select>

        <Input
          label="Location"
          value={values.location ?? ''}
          onChange={(event) => set('location', event.target.value)}
          placeholder="e.g. Addis Ababa"
        />

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-ink-800">Budget range (ETB)</span>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={values.min_budget ?? ''}
              onChange={(event) => set('min_budget', event.target.value)}
              placeholder="Min"
              aria-label="Minimum budget"
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={values.max_budget ?? ''}
              onChange={(event) => set('max_budget', event.target.value)}
              placeholder="Max"
              aria-label="Maximum budget"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button type="button" onClick={onApply}>
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

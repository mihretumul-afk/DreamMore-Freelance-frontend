import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { categoryService } from '../../services/categoryService';

/**
 * Job filter form. Every control maps 1:1 to a query parameter the backend
 * actually accepts (see src/services/jobService.js). Text values are drafts —
 * the parent applies them to the URL; selects change the URL immediately.
 *
 * values: { search, category_id, location, min_budget, max_budget, budget_type,
 *           experience_level, location_type }
 */
export default function JobFiltersPanel({ values = {}, onChange, onApply, onClear, className }) {
  const [categories, setCategories] = useState([]);

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

  const set = (key, value) => onChange?.(key, value);

  return (
    <Card className={className}>
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-ink-900">Filters</h2>
        <p className="mt-0.5 text-sm text-gray-500">Refine the jobs you see.</p>
      </div>

      <div className="space-y-4 px-5 py-5">
        <Input
          label="Keyword"
          icon={Search}
          value={values.search ?? ''}
          onChange={(event) => set('search', event.target.value)}
          placeholder="Search title or description"
        />

        {categories.length > 0 && (
          <Select
            label="Category"
            value={values.category_id ?? ''}
            onChange={(event) => set('category_id', event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        )}

        <Select
          label="Budget type"
          value={values.budget_type ?? ''}
          onChange={(event) => set('budget_type', event.target.value)}
        >
          <option value="">Any budget</option>
          <option value="fixed">Fixed price</option>
          <option value="hourly">Hourly rate</option>
        </Select>

        <Select
          label="Experience level"
          value={values.experience_level ?? ''}
          onChange={(event) => set('experience_level', event.target.value)}
        >
          <option value="">Any level</option>
          <option value="entry">Entry</option>
          <option value="intermediate">Intermediate</option>
          <option value="expert">Expert</option>
        </Select>

        <Select
          label="Work mode"
          value={values.location_type ?? ''}
          onChange={(event) => set('location_type', event.target.value)}
        >
          <option value="">Any mode</option>
          <option value="remote">Remote</option>
          <option value="onsite">On-site</option>
          <option value="hybrid">Hybrid</option>
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
            Apply
          </Button>
          <Button type="button" variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}

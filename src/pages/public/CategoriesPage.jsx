import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/marketplace/PageHeader';
import CategoryCard from '../../components/marketplace/CategoryCard';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { categoryService } from '../../services/categoryService';
import { getErrorMessage } from '../../utils/errors';
import { useI18n } from '../../i18n';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function CategoriesPage() {
  usePageTitle('Categories');
  const { t } = useI18n();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getCategories();
      const list = response?.data ?? (Array.isArray(response) ? response : []);
      setCategories(list);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load categories. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t('categories.eyebrow')}
        title={t('categories.title')}
        description={t('categories.description')}
        breadcrumbs={[{ label: t('nav.homeShort'), to: '/' }, { label: t('nav.categories') }]}
      />

      {error ? (
        <ErrorState
          title="Unable to load categories"
          description={error}
          onRetry={loadCategories}
        />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-card border border-gray-100 bg-gray-50"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="There are currently no active categories available."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id ?? category.slug}
              category={category}
              to={category.id ? `/jobs?category_id=${category.id}` : null}
              className="h-full"
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">{t('hero.searchHint')}</p>
    </div>
  );
}

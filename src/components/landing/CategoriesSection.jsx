import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import Reveal from '../common/Reveal';
import CategoryCard from '../marketplace/CategoryCard';
import { categoryService } from '../../services/categoryService';
import { useI18n } from '../../i18n';

export default function CategoriesSection() {
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    categoryService
      .getCategories()
      .then((response) => {
        if (!active) return;
        const list = response?.data ?? (Array.isArray(response) ? response : []);
        setCategories(list.slice(0, 8)); // Display top 8 categories on the landing page
      })
      .catch(() => {
        // Graceful error fallback
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-white py-16 lg:py-24" aria-labelledby="categories-heading">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow={t('categories.eyebrow')}
              title={t('categories.title')}
              description={t('categories.description')}
            />
            <Link
              to="/categories"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              {t('categories.viewAll')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </Reveal>

        <h2 id="categories-heading" className="sr-only">
          {t('categories.srHeading')}
        </h2>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-card border border-gray-100 bg-gray-50"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard
                key={category.id ?? category.slug}
                category={category}
                to={category.id ? `/jobs?category_id=${category.id}` : '/categories'}
                className="h-full"
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

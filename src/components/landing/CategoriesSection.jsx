import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import Reveal from '../common/Reveal';
import CategoryCard from '../marketplace/CategoryCard';
import HorizontalScrollRow from '../common/HorizontalScrollRow';
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
        // Display real categories from backend in the horizontal carousel row
        setCategories(list);
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
    <section className="bg-white py-12 lg:py-16 border-b border-gray-100" aria-labelledby="categories-heading">
      <Container>
        <HorizontalScrollRow
          scrollStep={300}
          renderControls={({ controls }) => (
            <Reveal>
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeading
                  eyebrow={t('categories.eyebrow') || 'Marketplace'}
                  title={t('categories.title') || 'Popular DreamMore Services'}
                  description={
                    t('categories.description') ||
                    'Find the right skills for your next project or discover opportunities that match your expertise.'
                  }
                />
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <Link
                    to="/categories"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/60 px-3.5 py-2 text-xs sm:text-sm font-semibold text-brand-600 shadow-2xs transition-all duration-200 hover:border-brand-300 hover:bg-brand-100/70 hover:text-brand-700"
                  >
                    {t('categories.viewAll') || 'View All Categories'}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  {controls}
                </div>
              </div>
            </Reveal>
          )}
        >
          <h2 id="categories-heading" className="sr-only">
            {t('categories.srHeading') || 'Marketplace categories'}
          </h2>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-48 w-[220px] sm:w-[240px] md:w-[260px] shrink-0 animate-pulse rounded-2xl border border-gray-100 bg-gray-50/80 snap-start"
              />
            ))
          ) : categories.length === 0 ? (
            <div className="w-full rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
              <p className="text-sm text-gray-500">No categories found.</p>
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id ?? category.slug}
                className="w-[220px] sm:w-[240px] md:w-[260px] shrink-0 snap-start"
              >
                <CategoryCard
                  category={category}
                  to={category.id ? `/jobs?category_id=${category.id}` : '/jobs'}
                  className="h-full"
                />
              </div>
            ))
          )}
        </HorizontalScrollRow>
      </Container>
    </section>
  );
}

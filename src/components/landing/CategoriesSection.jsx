import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import Reveal from '../common/Reveal';
import CategoryCard from '../marketplace/CategoryCard';
import HorizontalScrollRow from '../common/HorizontalScrollRow';
import { categoryService } from '../../services/categoryService';
import { useI18n } from '../../i18n';

const DEFAULT_CATEGORIES = [
  {
    id: 1,
    slug: 'graphic-design',
    name: 'Graphics Designing',
    subtitle: 'Learn Adobe Photoshop, Illustrator &...',
    avatarText: 'D',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=700&q=80',
    level: 'Beginner',
    duration: '3 Months',
    price: 'ETB 6,000',
  },
  {
    id: 2,
    slug: 'video-editing',
    name: 'Video Editing',
    subtitle: 'Master Premiere Pro & After Effects',
    avatarText: 'Pr',
    image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=700&q=80',
    level: 'Beginner',
    duration: '3 Months',
    price: 'ETB 6,000',
  },
  {
    id: 3,
    slug: 'digital-marketing',
    name: 'Digital Marketing',
    subtitle: 'Master SEO, social media, Google Ads &...',
    avatarText: 'DM',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80',
    level: 'Beginner',
    duration: '3 Months',
    price: 'ETB 6,000',
  },
  {
    id: 4,
    slug: 'cinematography',
    name: 'Cinematography',
    subtitle: 'Master camera operation, lighting &...',
    avatarText: 'C',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=80',
    level: 'Beginner',
    duration: '3 Months',
    price: 'ETB 6,000',
  },
  {
    id: 5,
    slug: 'web-development',
    name: 'Web Development',
    subtitle: 'Build modern React & Full-Stack apps',
    avatarText: 'Wd',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=700&q=80',
    level: 'Intermediate',
    duration: '3 Months',
    price: 'ETB 8,500',
  },
  {
    id: 6,
    slug: 'ui-ux-design',
    name: 'UI/UX & Product Design',
    subtitle: 'Design user experiences & Figma prototypes',
    avatarText: 'Ux',
    image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=700&q=80',
    level: 'Beginner',
    duration: '2 Months',
    price: 'ETB 7,000',
  },
  {
    id: 7,
    slug: 'mobile-app-development',
    name: 'Mobile App Development',
    subtitle: 'Develop iOS & Android apps with Flutter',
    avatarText: 'App',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=700&q=80',
    level: 'Intermediate',
    duration: '4 Months',
    price: 'ETB 9,000',
  },
  {
    id: 8,
    slug: 'data-science-ai',
    name: 'Data Science & AI',
    subtitle: 'Master Machine Learning & Python',
    avatarText: 'AI',
    image: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=700&q=80',
    level: 'Advanced',
    duration: '4 Months',
    price: 'ETB 10,000',
  },
];

export default function CategoriesSection() {
  const { t } = useI18n();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    categoryService
      .getCategories()
      .then((response) => {
        if (!active) return;
        const list = response?.data ?? (Array.isArray(response) ? response : []);
        if (list && list.length > 0) {
          // Merge API categories with defaults to ensure complete visual styling
          const merged = list.map((cat, idx) => ({
            ...DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length],
            ...cat,
          }));
          setCategories(merged);
        }
      })
      .catch(() => {
        // Fallback to default enriched list
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="bg-white py-8 lg:py-10 border-b border-gray-100" aria-labelledby="categories-heading">
      <Container>
        <HorizontalScrollRow
          scrollStep={300}
          renderControls={({ controls }) => (
            <Reveal>
              <div className="mb-6 flex flex-col items-center gap-4 text-center">
                <SectionHeading
                  align="center"
                  eyebrow={t('categories.eyebrow') || 'Marketplace Categories'}
                  title={t('categories.title') || 'Popular Skill & Training Track Categories'}
                  description={
                    t('categories.description') ||
                    'Find top-rated courses and high-demand skill categories to boost your career or hire expert talent.'
                  }
                />
                <div className="flex items-center justify-center gap-3 sm:gap-4 shrink-0">
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
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-80 w-[240px] sm:w-[260px] md:w-[270px] shrink-0 animate-pulse rounded-2xl border border-gray-100 bg-gray-50/80 snap-start"
              />
            ))
          ) : (
            <>
              {categories.map((category, index) => (
                <div
                  key={category.id ?? category.slug ?? index}
                  className="w-[240px] sm:w-[260px] md:w-[270px] shrink-0 snap-start"
                >
                  <CategoryCard
                    category={category}
                    themeIndex={index}
                    to={category.id ? `/jobs?category_id=${category.id}` : '/jobs'}
                    className="h-full"
                  />
                </div>
              ))}

              {/* Student Success Highlight Card (Direct match to reference image) */}
              <div className="w-[240px] sm:w-[260px] md:w-[270px] shrink-0 snap-start flex">
                <div className="w-full flex flex-col items-center justify-center rounded-2xl border border-gray-200/90 bg-white p-6 text-center shadow-xs transition-all duration-300 hover:shadow-md hover:border-orange-200">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                    <Award className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold tracking-widest text-gray-500 uppercase">
                    Student Success
                  </span>
                  <div className="my-2 text-4xl sm:text-5xl font-black tracking-tight text-orange-500">
                    150+
                  </div>
                  <div className="text-xs font-extrabold tracking-wider text-gray-900 uppercase max-w-[180px] leading-snug">
                    Professionals Trained
                  </div>
                  <p className="mt-3 text-[11px] text-gray-400">
                    Empowering top talent across Ethiopia
                  </p>
                </div>
              </div>
            </>
          )}
        </HorizontalScrollRow>
      </Container>
    </section>
  );
}


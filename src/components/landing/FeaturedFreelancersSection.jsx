import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  TrendingUp,
  Palette,
  Code2,
  Megaphone,
  CheckSquare,
  Layers,
  BrainCircuit,
  Clapperboard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Camera,
  Search,
  PenTool,
  ShieldCheck,
  FolderTree,
  Users,
} from 'lucide-react';
import Container from '../common/Container';
import SectionHeading from '../common/SectionHeading';
import FreelancerCard from '../marketplace/FreelancerCard';
import HorizontalScrollRow from '../common/HorizontalScrollRow';
import EmptyState from '../common/EmptyState';
import Button from '../ui/Button';
import { freelancerService } from '../../services/freelancerService';
import { categoryService } from '../../services/categoryService';
import { normalizeFreelancer } from '../../utils/freelancerMapper';
import { useI18n } from '../../i18n';
import { cn } from '../../utils/cn';

// Icon map helper for dynamic backend categories
const ICON_MAP = {
  'web-development': Code2,
  'mobile-app-development': Code2,
  'ui-ux-design': Palette,
  'graphic-design': Palette,
  'video-editing': Clapperboard,
  'digital-marketing': Megaphone,
  'data-science-ai': BrainCircuit,
  'cinematography': Camera,
  'content-creation': PenTool,
  seo: Search,
  cybersecurity: ShieldCheck,
  sales: TrendingUp,
  designers: Palette,
  developers: Code2,
  marketing: Megaphone,
  'project-managers': CheckSquare,
  'product-managers': Layers,
  'ai-data': BrainCircuit,
};

// Skill & title keyword mapping dictionary for category filtering
const CATEGORY_KEYWORDS = {
  sales: ['sales', 'b2b', 'lead', 'crm', 'business development', 'account manager', 'pitch', 'cold call'],
  designers: ['design', 'ui', 'ux', 'figma', 'illustrator', 'photoshop', 'brand', 'user research', 'creative', 'graphic'],
  developers: ['develop', 'software', 'web', 'code', 'react', 'laravel', 'php', 'node', 'full-stack', 'frontend', 'backend', 'python', 'javascript', 'app'],
  marketing: ['marketing', 'seo', 'digital', 'social media', 'content', 'ads', 'campaign', 'growth', 'copywriter'],
  'project-managers': ['project', 'scrum', 'agile', 'jira', 'manager', 'management', 'sprint'],
  'product-managers': ['product', 'roadmap', 'strategy', 'feature', 'management'],
  'ai-data': ['ai', 'data', 'python', 'machine learning', 'ml', 'science', 'analytics', 'model', 'neural'],
  'video-editing': ['video', 'premiere', 'after effects', 'edit', 'editing', 'animation', 'render', 'cut'],
  'graphic-design': ['graphic', 'logo', 'banner', 'vector', 'brand', 'illustrator', 'photoshop', 'design'],
  cinematography: ['camera', 'cinematography', 'video', 'film', 'shoot', 'production', 'director'],
};

// Baseline categories with an "All Talent" option at the start
const BASELINE_CATEGORIES = [
  { id: 'all', slug: 'all', label: 'All Talent', icon: Users },
  { id: 'developers', slug: 'web-development', label: 'Software Developers', icon: Code2 },
  { id: 'designers', slug: 'ui-ux-design', label: 'Designers', icon: Palette },
  { id: 'sales', slug: 'sales', label: 'Sales Experts', icon: TrendingUp },
  { id: 'marketing', slug: 'digital-marketing', label: 'Marketing Experts', icon: Megaphone },
  { id: 'video-editing', slug: 'video-editing', label: 'Video Editors', icon: Clapperboard },
  { id: 'graphic-design', slug: 'graphic-design', label: 'Graphics Designers', icon: Palette },
  { id: 'ai-data', slug: 'data-science-ai', label: 'AI & Data Experts', icon: BrainCircuit },
  { id: 'project-managers', slug: 'project-management', label: 'Project Managers', icon: CheckSquare },
  { id: 'product-managers', slug: 'product-management', label: 'Product Managers', icon: Layers },
  { id: 'cinematography', slug: 'cinematography', label: 'Cinematographers', icon: Camera },
];

export default function FeaturedFreelancersSection() {
  const { t } = useI18n();
  const [categories, setCategories] = useState(BASELINE_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState('all');
  const [realFreelancers, setRealFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navContainerRef = useRef(null);

  // 1. Fetch Dynamic Categories from Laravel API
  useEffect(() => {
    let active = true;
    categoryService
      .getCategories()
      .then((res) => {
        if (!active) return;
        const apiList = res?.data ?? (Array.isArray(res) ? res : []);
        if (apiList && apiList.length > 0) {
          const mappedApiCategories = apiList.map((cat) => ({
            id: String(cat.id),
            slug: cat.slug || String(cat.id),
            label: cat.name,
            icon: ICON_MAP[cat.slug] || FolderTree,
          }));

          // Combine All Talent + API categories + Baseline categories without duplicates
          const combined = [{ id: 'all', slug: 'all', label: 'All Talent', icon: Users }, ...mappedApiCategories];
          BASELINE_CATEGORIES.forEach((base) => {
            if (base.id !== 'all' && !combined.some((c) => c.slug === base.slug || c.id === base.id)) {
              combined.push(base);
            }
          });
          setCategories(combined);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // 2. Fetch Real Registered Database Freelancers ONLY
  useEffect(() => {
    let active = true;
    freelancerService
      .getFreelancers({ page: 1, sort: 'rating' })
      .then((res) => {
        if (!active) return;
        const rawList = res?.data ?? (Array.isArray(res) ? res : []);
        const list = rawList.map(normalizeFreelancer).filter(Boolean);
        setRealFreelancers(list);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Side Arrow Tab Scrolling Functionality
  const scrollTabs = (direction) => {
    if (!navContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    navContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  // Find current active category object details
  const activeCategoryObj = categories.find((c) => c.id === activeCategory || c.slug === activeCategory);

  // Strictly filter real API freelancers by active category tab selection
  const displayTalent = realFreelancers.filter((f) => {
    if (!f) return false;
    if (activeCategory === 'all') return true;

    const catIdStr = String(f.categoryId ?? '');
    const catSlugStr = String(f.categorySlug ?? '').toLowerCase();
    const catNameStr = String(f.categoryName ?? '').toLowerCase();
    const activeLower = activeCategory.toLowerCase();
    const targetSlug = activeCategoryObj?.slug?.toLowerCase() || activeLower;

    // 1. Direct Category ID / Slug / Name match
    if (
      catIdStr === activeCategory ||
      catSlugStr === activeLower ||
      catSlugStr === targetSlug ||
      catNameStr.includes(activeLower) ||
      catNameStr.includes(targetSlug)
    ) {
      return true;
    }

    // 2. Headline or overview keyword match
    const textToSearch = `${f.headline ?? ''} ${f.overview ?? ''}`.toLowerCase();
    if (textToSearch.includes(activeLower) || textToSearch.includes(targetSlug)) {
      return true;
    }

    // 3. Keyword list match for category
    const keywords = CATEGORY_KEYWORDS[activeCategory] || CATEGORY_KEYWORDS[targetSlug] || [activeLower];
    const matchesKeyword = keywords.some((kw) => textToSearch.includes(kw));
    if (matchesKeyword) return true;

    // 4. Skills match against category keywords
    if (f.skills && Array.isArray(f.skills)) {
      return f.skills.some((s) => {
        const sName = (typeof s === 'string' ? s : s?.name ?? '').toLowerCase();
        return keywords.some((kw) => sName.includes(kw));
      });
    }

    return false;
  });

  return (
    <section className="bg-white py-8 lg:py-10 border-b border-gray-100" aria-labelledby="featured-freelancers-heading">
      <Container>
        {/* Section Heading Header */}
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <SectionHeading
            align="center"
            eyebrow={t('featuredFreelancers.eyebrow') || 'Verified Ethiopian Talent'}
            title={t('featuredFreelancers.title') || 'Registered DreamMore Freelancers'}
            description={
              t('featuredFreelancers.description') ||
              'Explore registered and approved freelancers on the DreamMore platform.'
            }
          />
          <Link
            to="/freelancers"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/60 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-brand-600 shadow-2xs transition-all duration-200 hover:border-brand-300 hover:bg-brand-100/70 hover:text-brand-700"
          >
            {t('featuredFreelancers.viewAll') || 'View All Talent'}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Top Category Filter Tab Bar with Left/Right Arrow Scroll Controls */}
        <div className="relative mb-5 rounded-2xl border border-gray-200/80 bg-white p-2 shadow-xs">
          <div className="flex items-center gap-1">
            {/* Scroll Left Side Arrow Button */}
            <button
              onClick={() => scrollTabs('left')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors focus:outline-none shadow-xs"
              aria-label="Scroll categories left"
              title="Scroll categories left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Full Scrollable Category Tab Strip */}
            <div
              ref={navContainerRef}
              className="no-scrollbar flex flex-1 overflow-x-auto gap-1.5 scroll-smooth px-1 py-0.5"
            >
              {categories.map((cat) => {
                const Icon = cat.icon || FolderTree;
                const isActive = activeCategory === cat.id || activeCategory === cat.slug;
                return (
                  <button
                    key={cat.id || cat.slug}
                    onClick={() => setActiveCategory(cat.id || cat.slug)}
                    className={cn(
                      'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200',
                      isActive
                        ? 'bg-blue-900 text-white shadow-sm ring-1 ring-blue-900'
                        : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200',
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-brand-400' : 'text-gray-400')} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scroll Right Side Arrow Button */}
            <button
              onClick={() => scrollTabs('right')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors focus:outline-none shadow-xs"
              aria-label="Scroll categories right"
              title="Scroll categories right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Row for Registered Freelancer Cards */}
        {loading ? (
          <div className="flex gap-4 overflow-hidden py-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-80 w-[280px] sm:w-[320px] shrink-0 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : displayTalent.length === 0 ? (
          <div className="w-full my-6">
            <EmptyState
              icon={Users}
              title={`No Freelancers Registered in ${activeCategoryObj?.label || 'this Category'} Yet`}
              description={`There are currently no approved freelancers registered under "${activeCategoryObj?.label || 'this category'}". Be the first to register in this category!`}
              action={
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button onClick={() => setActiveCategory('all')} variant="outline" size="md">
                    View All Registered Talent ({realFreelancers.length})
                  </Button>
                  <Button as={Link} to="/register" variant="primary" size="md">
                    <Users className="h-4 w-4 mr-2" /> Register as a Freelancer
                  </Button>
                </div>
              }
            />
          </div>
        ) : (
          <HorizontalScrollRow scrollStep={320}>
            <h2 id="featured-freelancers-heading" className="sr-only">
              {t('featuredFreelancers.title') || 'Featured freelancers'}
            </h2>

            {displayTalent.map((freelancer, idx) => (
              <div key={freelancer.id || idx} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
                <FreelancerCard freelancer={freelancer} index={idx} className="h-full" />
              </div>
            ))}

            {/* Rightmost "Discover More Talent" Call-To-Action Card */}
            <div className="w-[280px] sm:w-[320px] shrink-0 snap-start flex">
              <div className="relative w-full flex flex-col justify-between overflow-hidden rounded-2xl bg-blue-950 p-6 text-center text-white shadow-md border border-blue-900">
                {/* Background Glow */}
                <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl pointer-events-none" />

                <div className="my-auto flex flex-col items-center py-4">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-900/80 border border-blue-800 text-brand-400 shadow-inner">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black leading-tight tracking-tight text-white">
                    Discover More Talent
                  </h3>
                  <p className="mt-2 text-xs text-blue-200 font-medium">
                    in the DreamMore Network
                  </p>
                </div>

                <div className="mt-4">
                  <Link
                    to="/freelancers"
                    className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-xs sm:text-sm font-bold text-slate-950 shadow-md transition-all duration-200 hover:bg-emerald-400 hover:shadow-lg focus:outline-none"
                  >
                    Discover DreamMore Talent
                  </Link>
                </div>
              </div>
            </div>
          </HorizontalScrollRow>
        )}
      </Container>
    </section>
  );
}

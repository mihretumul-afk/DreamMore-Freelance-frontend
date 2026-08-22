import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Box,
  BrainCircuit,
  Bug,
  Camera,
  Clapperboard,
  Code2,
  Cpu,
  Database,
  FolderTree,
  Headset,
  Keyboard,
  Languages,
  Layers,
  Megaphone,
  Mic,
  MoreHorizontal,
  Palette,
  PenTool,
  Search,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import Card from '../ui/Card';
import { useI18n } from '../../i18n';
import { cn } from '../../utils/cn';

const ICON_MAP = {
  Code2,
  Smartphone,
  Layers,
  Palette,
  Clapperboard,
  PenTool,
  Megaphone,
  Search,
  Share2,
  Keyboard,
  BarChart3,
  BrainCircuit,
  Bot,
  Terminal,
  Languages,
  Headset,
  Camera,
  Sparkles,
  ShieldCheck,
  Wrench,
  Box,
  Cpu,
  Database,
  TrendingUp,
  Bug,
  Mic,
  MoreHorizontal,
  FolderTree,
  'web-development': Code2,
  'mobile-app-development': Smartphone,
  'ui-ux-design': Layers,
  'graphic-design': Palette,
  'video-editing': Clapperboard,
  'content-creation': PenTool,
  'ai-training': Bot,
  'ai-machine-learning': BrainCircuit,
  'software-development': Terminal,
  'digital-marketing': Megaphone,
  'data-science-ai': Database,
  'data-entry': Keyboard,
  'data-analysis': BarChart3,
  'writing-translation': Languages,
  'virtual-assistance': Headset,
  'photography': Camera,
  'business-consulting': TrendingUp,
  'social-media-management': Share2,
  'animation': Sparkles,
  'animation-motion': Sparkles,
  'seo': Search,
  'cybersecurity': ShieldCheck,
  'mechanical-design': Wrench,
  'cad-modeling': Box,
  'simulation': Cpu,
  'software-testing': Bug,
  'voice-over': Mic,
  '3d-modeling': Box,
  'other-services': MoreHorizontal,
  'other': MoreHorizontal,
};

/**
 * Category-specific visual theme accents:
 * Uses Dream More Sunset Orange (#FF6B35), Dark Blue (#0B132B), and harmonious accents.
 */
const THEME_MAP = {
  'web-development': {
    badge: 'bg-orange-50/90 text-brand-600 border-orange-100',
    hoverGlow: 'group-hover:bg-brand-500 group-hover:text-white',
    ring: 'group-hover:ring-brand-200',
  },
  'mobile-app-development': {
    badge: 'bg-blue-50/90 text-blue-600 border-blue-100',
    hoverGlow: 'group-hover:bg-blue-600 group-hover:text-white',
    ring: 'group-hover:ring-blue-200',
  },
  'ui-ux-design': {
    badge: 'bg-purple-50/90 text-purple-600 border-purple-100',
    hoverGlow: 'group-hover:bg-purple-600 group-hover:text-white',
    ring: 'group-hover:ring-purple-200',
  },
  'graphic-design': {
    badge: 'bg-pink-50/90 text-pink-600 border-pink-100',
    hoverGlow: 'group-hover:bg-pink-600 group-hover:text-white',
    ring: 'group-hover:ring-pink-200',
  },
  'video-editing': {
    badge: 'bg-rose-50/90 text-rose-600 border-rose-100',
    hoverGlow: 'group-hover:bg-rose-600 group-hover:text-white',
    ring: 'group-hover:ring-rose-200',
  },
  'animation': {
    badge: 'bg-amber-50/90 text-amber-600 border-amber-100',
    hoverGlow: 'group-hover:bg-amber-600 group-hover:text-white',
    ring: 'group-hover:ring-amber-200',
  },
  'mechanical-design': {
    badge: 'bg-cyan-50/90 text-cyan-600 border-cyan-100',
    hoverGlow: 'group-hover:bg-cyan-600 group-hover:text-white',
    ring: 'group-hover:ring-cyan-200',
  },
  'cad-modeling': {
    badge: 'bg-teal-50/90 text-teal-600 border-teal-100',
    hoverGlow: 'group-hover:bg-teal-600 group-hover:text-white',
    ring: 'group-hover:ring-teal-200',
  },
  'simulation': {
    badge: 'bg-indigo-50/90 text-indigo-600 border-indigo-100',
    hoverGlow: 'group-hover:bg-indigo-600 group-hover:text-white',
    ring: 'group-hover:ring-indigo-200',
  },
  'digital-marketing': {
    badge: 'bg-emerald-50/90 text-emerald-600 border-emerald-100',
    hoverGlow: 'group-hover:bg-emerald-600 group-hover:text-white',
    ring: 'group-hover:ring-emerald-200',
  },
  'data-entry': {
    badge: 'bg-slate-50/90 text-slate-700 border-slate-200',
    hoverGlow: 'group-hover:bg-slate-800 group-hover:text-white',
    ring: 'group-hover:ring-slate-300',
  },
  'virtual-assistance': {
    badge: 'bg-sky-50/90 text-sky-600 border-sky-100',
    hoverGlow: 'group-hover:bg-sky-600 group-hover:text-white',
    ring: 'group-hover:ring-sky-200',
  },
};

function resolveIcon(icon, slug) {
  if (typeof icon === 'function') return icon;
  if (typeof icon === 'string' && ICON_MAP[icon]) return ICON_MAP[icon];
  if (slug && ICON_MAP[slug]) return ICON_MAP[slug];
  return FolderTree;
}

/**
 * CategoryCard — modern, attractive, compact category card for AppWorks Marketplace.
 *
 * Features:
 * - Rounded corners & subtle shadow
 * - Themed icon badge with AppWorks Sunset Orange & Dark Blue accents
 * - Card lift & icon scale animations on hover (respects prefers-reduced-motion)
 * - Click directly navigates to filtered jobs: /jobs?category_id={categoryId}
 */
export default function CategoryCard({ category, to, className }) {
  const { t } = useI18n();
  const slug = category?.slug || '';
  const Icon = resolveIcon(category?.icon, slug);
  const theme = THEME_MAP[slug] || {
    badge: 'bg-orange-50/90 text-brand-600 border-orange-100',
    hoverGlow: 'group-hover:bg-brand-500 group-hover:text-white',
    ring: 'group-hover:ring-brand-200',
  };

  const keyName = slug ? `category.${slug}.name` : null;
  const translatedName = keyName ? t(keyName) : null;
  const name = translatedName && translatedName !== keyName ? translatedName : (category?.name || 'Category');

  const keyDesc = slug ? `category.${slug}.description` : null;
  const translatedDesc = keyDesc ? t(keyDesc) : null;
  const description = translatedDesc && translatedDesc !== keyDesc ? translatedDesc : (category?.description || '');

  // Category click goes to /jobs?category_id={categoryId} or provided `to`
  const targetHref = to ?? (category?.id ? `/jobs?category_id=${category.id}` : '/jobs');

  return (
    <Card
      as={Link}
      to={targetHref}
      interactive
      className={cn(
        'group relative flex h-full flex-col justify-between rounded-2xl border border-gray-200/90 bg-white p-5 shadow-xs',
        'transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:transform-none',
        'hover:-translate-y-1 hover:border-brand-300 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        className,
      )}
    >
      <div>
        {/* Category Icon Badge */}
        <div className="flex items-center justify-between gap-2">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xs transition-all duration-300',
              'motion-reduce:transition-none',
              theme.badge,
              theme.hoverGlow,
            )}
          >
            <Icon
              className="h-6 w-6 transition-transform duration-300 group-hover:scale-110 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </div>

          {category?.jobs_count != null && category.jobs_count > 0 && (
            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-500 border border-gray-100 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:border-brand-100 transition-colors">
              {category.jobs_count} {category.jobs_count === 1 ? 'job' : 'jobs'}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-4 text-sm font-bold text-ink-900 transition-colors duration-200 group-hover:text-brand-600 line-clamp-1">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-gray-500 line-clamp-2 min-h-[32px]">
            {description}
          </p>
        )}
      </div>

      {/* Explore Link Indicator */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition-colors group-hover:text-brand-700">
          {t('categories.browse') || 'Explore'}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </span>
      </div>
    </Card>
  );
}

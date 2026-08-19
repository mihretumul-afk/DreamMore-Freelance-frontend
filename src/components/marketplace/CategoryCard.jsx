import { Link } from 'react-router-dom';
import {
  Bot,
  Box,
  Bug,
  Camera,
  ChevronRight,
  Clapperboard,
  Code2,
  Database,
  FolderTree,
  Headset,
  Languages,
  Layers,
  Megaphone,
  Mic,
  MoreHorizontal,
  Palette,
  PenTool,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  TrendingUp,
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
  Bot,
  Megaphone,
  Database,
  Languages,
  Headset,
  Camera,
  TrendingUp,
  Share2,
  Sparkles,
  Search,
  Bug,
  Mic,
  Box,
  MoreHorizontal,
  FolderTree,
  'web-development': Code2,
  'mobile-app-development': Smartphone,
  'ui-ux-design': Layers,
  'graphic-design': Palette,
  'video-editing': Clapperboard,
  'content-creation': PenTool,
  'ai-training': Bot,
  'digital-marketing': Megaphone,
  'data-science-ai': Database,
  'writing-translation': Languages,
  'virtual-assistance': Headset,
  'photography': Camera,
  'business-consulting': TrendingUp,
  'social-media-management': Share2,
  'animation-motion': Sparkles,
  'seo': Search,
  'software-testing': Bug,
  'voice-over': Mic,
  '3d-modeling': Box,
  'other-services': MoreHorizontal,
};

function resolveIcon(icon, slug) {
  if (typeof icon === 'function') return icon;
  if (typeof icon === 'string' && ICON_MAP[icon]) return ICON_MAP[icon];
  if (slug && ICON_MAP[slug]) return ICON_MAP[slug];
  return FolderTree;
}

/**
 * Category card. Names/descriptions come from the locale dictionaries via the
 * category slug when available, falling back to the API values.
 */
export default function CategoryCard({ category, to = '/categories', className }) {
  const { t } = useI18n();
  const Icon = resolveIcon(category?.icon, category?.slug);

  const keyName = category?.slug ? `category.${category.slug}.name` : null;
  const translatedName = keyName ? t(keyName) : null;
  const name = translatedName && translatedName !== keyName ? translatedName : (category?.name || 'Category');

  const keyDesc = category?.slug ? `category.${category.slug}.description` : null;
  const translatedDesc = keyDesc ? t(keyDesc) : null;
  const description = translatedDesc && translatedDesc !== keyDesc ? translatedDesc : (category?.description || '');

  const linkable = Boolean(to);

  const content = (
    <div className="p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-brand-500 group-hover:shadow-card-hover">
        <Icon
          className="h-5 w-5 text-brand-500 transition-all duration-200 group-hover:scale-110 group-hover:text-white"
          aria-hidden="true"
        />
      </div>
      <h3 className="mt-4 text-sm font-bold text-ink-900">{name}</h3>
      {description && <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>}
      {category?.jobs_count != null && (
        <p className="mt-2 text-xs font-medium text-brand-600">
          {category.jobs_count} {category.jobs_count === 1 ? 'job' : 'jobs'} available
        </p>
      )}
      {linkable && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 transition-colors group-hover:text-brand-700">
          {t('categories.browse')}
          <ChevronRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      )}
    </div>
  );

  if (linkable) {
    return (
      <Card as={Link} to={to} interactive className={cn('group h-full', className)}>
        {content}
      </Card>
    );
  }

  return (
    <Card className={cn('group h-full', className)}>
      {content}
    </Card>
  );
}

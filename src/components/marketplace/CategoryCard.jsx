import { Link } from 'react-router-dom';
import { getPlatformCurrency } from '../../utils/format';
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
  ChevronRight,
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

// Fallback high quality category banner images matching course themes
const CATEGORY_IMAGES = {
  'graphic-design': 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=700&q=80',
  'video-editing': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=700&q=80',
  'digital-marketing': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80',
  'cinematography': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=700&q=80',
  'photography': 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=700&q=80',
  'web-development': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=700&q=80',
  'mobile-app-development': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=700&q=80',
  'ui-ux-design': 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=700&q=80',
  'data-science-ai': 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=700&q=80',
  'content-creation': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=700&q=80',
  'animation': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=700&q=80',
};

// Theme presets for cards matching reference layout
const THEME_PRESETS = [
  {
    topBorder: 'border-t-amber-700',
    headerBadge: 'bg-amber-950 text-white',
    priceColor: 'text-amber-700',
    btnBg: 'bg-amber-700 hover:bg-amber-800 text-white',
    ring: 'focus-within:ring-amber-500',
    avatarText: 'D',
  },
  {
    topBorder: 'border-t-purple-600',
    headerBadge: 'bg-purple-950 text-white',
    priceColor: 'text-purple-600',
    btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
    ring: 'focus-within:ring-purple-500',
    avatarText: 'Pr',
  },
  {
    topBorder: 'border-t-pink-600',
    headerBadge: 'bg-pink-950 text-white',
    priceColor: 'text-pink-600',
    btnBg: 'bg-pink-600 hover:bg-pink-700 text-white',
    ring: 'focus-within:ring-pink-500',
    avatarText: 'DM',
  },
  {
    topBorder: 'border-t-orange-600',
    headerBadge: 'bg-orange-950 text-white',
    priceColor: 'text-orange-600',
    btnBg: 'bg-orange-600 hover:bg-orange-700 text-white',
    ring: 'focus-within:ring-orange-500',
    avatarText: 'C',
  },
  {
    topBorder: 'border-t-blue-600',
    headerBadge: 'bg-blue-950 text-white',
    priceColor: 'text-blue-600',
    btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
    ring: 'focus-within:ring-blue-500',
    avatarText: 'Wd',
  },
  {
    topBorder: 'border-t-violet-600',
    headerBadge: 'bg-violet-950 text-white',
    priceColor: 'text-violet-600',
    btnBg: 'bg-violet-600 hover:bg-violet-700 text-white',
    ring: 'focus-within:ring-violet-500',
    avatarText: 'Ux',
  },
  {
    topBorder: 'border-t-emerald-600',
    headerBadge: 'bg-emerald-950 text-white',
    priceColor: 'text-emerald-600',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    ring: 'focus-within:ring-emerald-500',
    avatarText: 'App',
  },
  {
    topBorder: 'border-t-cyan-600',
    headerBadge: 'bg-cyan-950 text-white',
    priceColor: 'text-cyan-600',
    btnBg: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    ring: 'focus-within:ring-cyan-500',
    avatarText: 'AI',
  },
];

const THEME_MAP = {
  'graphic-design': THEME_PRESETS[0],
  'video-editing': THEME_PRESETS[1],
  'digital-marketing': THEME_PRESETS[2],
  'cinematography': THEME_PRESETS[3],
  'photography': THEME_PRESETS[3],
  'web-development': THEME_PRESETS[4],
  'ui-ux-design': THEME_PRESETS[5],
  'mobile-app-development': THEME_PRESETS[6],
  'data-science-ai': THEME_PRESETS[7],
};

function resolveIcon(icon, slug) {
  if (typeof icon === 'function') return icon;
  if (typeof icon === 'string' && ICON_MAP[icon]) return ICON_MAP[icon];
  if (slug && ICON_MAP[slug]) return ICON_MAP[slug];
  return FolderTree;
}

/**
 * CategoryCard — Modern, highly attractive category & course card
 * styled directly after the reference visual design.
 */
export default function CategoryCard({ category, to, className, themeIndex = 0 }) {
  const { t } = useI18n();
  const slug = category?.slug || '';
  const Icon = resolveIcon(category?.icon, slug);
  
  const presetTheme = THEME_PRESETS[themeIndex % THEME_PRESETS.length];
  const theme = THEME_MAP[slug] || presetTheme;

  const keyName = slug ? `category.${slug}.name` : null;
  const translatedName = keyName ? t(keyName) : null;
  const name = translatedName && translatedName !== keyName ? translatedName : (category?.name || 'Category');

  const keyDesc = slug ? `category.${slug}.description` : null;
  const translatedDesc = keyDesc ? t(keyDesc) : null;
  const subtitle = translatedDesc && translatedDesc !== keyDesc ? translatedDesc : (category?.subtitle || category?.description || 'Master key skills & industry tools');

  const bannerImage = category?.image || CATEGORY_IMAGES[slug] || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80';

  const level = category?.level || 'Beginner';
  const duration = category?.duration || '3 Months';
  const price = category?.price || (category?.jobs_count != null && category.jobs_count > 0 ? `${category.jobs_count} Jobs` : `${getPlatformCurrency()} 6,000`);

  const targetHref = to ?? (category?.id ? `/jobs?category_id=${category.id}` : '/jobs');

  return (
    <Card
      as={Link}
      to={targetHref}
      interactive
      className={cn(
        'group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-4 shadow-sm transition-all duration-300 border-t-4',
        theme.topBorder,
        'hover:-translate-y-1.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2',
        theme.ring,
        className,
      )}
    >
      <div>
        {/* Top Header: Avatar & Category Title/Subtitle */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-extrabold text-sm shadow-xs transition-transform duration-300 group-hover:scale-105',
              theme.headerBadge,
            )}
          >
            {category?.avatarText || theme.avatarText || <Icon className="h-4 w-4 text-white" />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-brand-600 transition-colors">
              {name}
            </h3>
            <p className="text-[11px] text-gray-400 leading-tight line-clamp-1 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Media Banner Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100 mb-4 shadow-xs">
          <img
            src={bannerImage}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Details Grid */}
        <div className="space-y-1.5 text-xs text-gray-600 font-medium px-1">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-normal">Level:</span>
            <span className="font-semibold text-gray-800">{level}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 font-normal">Duration:</span>
            <span className="font-semibold text-gray-800">{duration}</span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-gray-400 font-normal">Price:</span>
            <span className={cn('font-bold text-xs sm:text-sm', theme.priceColor)}>
              {price}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Circular Action Arrow Button */}
      <div className="mt-4 flex justify-end">
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-300 group-hover:scale-110',
            theme.btnBg,
          )}
        >
          <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Card>
  );
}


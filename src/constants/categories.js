/**
 * Marketplace categories — the full 20-category catalog.
 *
 * Each entry pairs a stable `slug` (used for i18n keys) with a Lucide icon.
 * Names and descriptions live in the locale dictionaries
 * (i18n/en.js + i18n/am.js) under `category.<slug>.name` / `.description`.
 *
 * IMPORTANT: there is no live category API on the backend yet, so no job or
 * service counts are attached — the UI never fabricates numbers.
 */
import {
  Bot,
  Box,
  Bug,
  Camera,
  Clapperboard,
  Code2,
  Database,
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

export const MARKETPLACE_CATEGORIES = [
  { slug: 'video-editing', icon: Clapperboard },
  { slug: 'graphic-design', icon: Palette },
  { slug: 'web-development', icon: Code2 },
  { slug: 'content-creation', icon: PenTool },
  { slug: 'ai-training', icon: Bot },
  { slug: 'digital-marketing', icon: Megaphone },
  { slug: 'mobile-app-development', icon: Smartphone },
  { slug: 'ui-ux-design', icon: Layers },
  { slug: 'data-science-ai', icon: Database },
  { slug: 'writing-translation', icon: Languages },
  { slug: 'virtual-assistance', icon: Headset },
  { slug: 'photography', icon: Camera },
  { slug: 'business-consulting', icon: TrendingUp },
  { slug: 'social-media-management', icon: Share2 },
  { slug: 'animation-motion', icon: Sparkles },
  { slug: 'seo', icon: Search },
  { slug: 'software-testing', icon: Bug },
  { slug: 'voice-over', icon: Mic },
  { slug: '3d-modeling', icon: Box },
  { slug: 'other-services', icon: MoreHorizontal },
];

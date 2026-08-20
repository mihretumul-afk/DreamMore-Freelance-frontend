import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  Handshake,
  MessageSquare,
  Bell,
  Building2,
  PlusCircle,
  ClipboardList,
  Users,
  ShieldCheck,
  BriefcaseBusiness,
  Flag,
  FolderTree,
  Wrench,
  Settings,
  Bookmark,
  Award,
} from 'lucide-react';

/**
 * Primary navigation shown in the navbar (desktop + mobile drawer).
 * Labels render through the i18n dictionaries via their `key`.
 */
/**
 * Primary navigation shown in the navbar (desktop + mobile drawer).
 * Labels render through the i18n dictionaries via their `key`.
 * Categories and section anchors were removed for a cleaner marketplace nav.
 */
export const PUBLIC_NAV_LINKS = [
  { key: 'nav.findJobs', to: '/jobs' },
  { key: 'nav.findTalent', to: '/freelancers' },
];

/** Secondary navbar links — currently unused (reserved for future). */
export const INFO_NAV_LINKS = [];

/** Sidebar navigation for the freelancer dashboard. */
export const FREELANCER_NAV_LINKS = [
  { label: 'Dashboard', to: '/freelancer/dashboard', icon: LayoutDashboard, end: true },
  { label: 'My Profile', to: '/freelancer/profile', icon: User, end: true },
  { label: 'Find Jobs', to: '/freelancer/jobs', icon: Briefcase, end: true },
  { label: 'Saved Jobs', to: '/freelancer/saved-jobs', icon: Bookmark, end: true },
  { label: 'Credentials', to: '/freelancer/credentials', icon: Award, end: true },
  { label: 'Proposals', to: '/freelancer/proposals', icon: FileText, end: false },
  { label: 'Contracts', to: '/freelancer/contracts', icon: Handshake, end: true },
  { label: 'Messages', to: '/freelancer/messages', icon: MessageSquare, end: true },
  { label: 'Notifications', to: '/freelancer/notifications', icon: Bell, end: true },
];

/** Sidebar navigation for the employer dashboard. */
export const EMPLOYER_NAV_LINKS = [
  { label: 'Dashboard', to: '/employer/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Company Profile', to: '/employer/profile', icon: Building2, end: true },
  { label: 'My Jobs', to: '/employer/jobs', icon: ClipboardList, end: false },
  { label: 'Post a Job', to: '/employer/jobs/create', icon: PlusCircle, end: true },
  { label: 'Saved Talent', to: '/employer/saved-freelancers', icon: Bookmark, end: true },
  { label: 'Contracts', to: '/employer/contracts', icon: Handshake, end: true },
  { label: 'Messages', to: '/employer/messages', icon: MessageSquare, end: true },
  { label: 'Notifications', to: '/employer/notifications', icon: Bell, end: true },
];

/** Sidebar navigation for the admin dashboard. */
export const ADMIN_NAV_LINKS = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Users', to: '/admin/users', icon: Users, end: false },
  { label: 'Verifications', to: '/admin/verifications', icon: ShieldCheck, end: true },
  { label: 'Jobs', to: '/admin/jobs', icon: BriefcaseBusiness, end: true },
  { label: 'Reports', to: '/admin/reports', icon: Flag, end: true },
  { label: 'Categories', to: '/admin/categories', icon: FolderTree, end: true },
  { label: 'Skills', to: '/admin/skills', icon: Wrench, end: true },
  { label: 'Settings', to: '/admin/settings', icon: Settings, end: true },
];

/**
 * Footer link columns — i18n key based (labels live in the locale
 * dictionaries). Presentation-only links for now; several anchor to landing
 * sections or future pages and carry no company claims.
 */
export const FOOTER_COLUMNS = [
  {
    headingKey: 'footer.forFreelancers',
    links: [
      { labelKey: 'footer.findJobs', to: '/jobs' },
      { labelKey: 'footer.createProfile', to: '/register' },
      { labelKey: 'footer.howItWorks', to: '/#for-freelancers' },
    ],
  },
  {
    headingKey: 'footer.forEmployers',
    links: [
      { labelKey: 'footer.findTalent', to: '/freelancers' },
      { labelKey: 'footer.postAJob', to: '/#for-employers' },
      { labelKey: 'footer.howItWorks', to: '/#for-employers' },
    ],
  },
  {
    headingKey: 'footer.company',
    links: [
      { labelKey: 'footer.about', to: '/#about' },
      { labelKey: 'footer.contact', to: '/#contact' },
      { labelKey: 'footer.careers', to: '/#careers' },
    ],
  },
  {
    headingKey: 'footer.support',
    links: [
      { labelKey: 'footer.helpCenter', to: '/#help' },
      { labelKey: 'footer.safety', to: '/#safety' },
      { labelKey: 'footer.terms', to: '/#terms' },
      { labelKey: 'footer.privacy', to: '/#privacy' },
    ],
  },
];

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
  { key: 'nav.dashboard', label: 'Dashboard', to: '/freelancer/dashboard', icon: LayoutDashboard, end: true },
  { key: 'nav.myProfile', label: 'My Profile', to: '/freelancer/profile', icon: User, end: true },
  { key: 'nav.findJobs', label: 'Find Jobs', to: '/freelancer/jobs', icon: Briefcase, end: true },
  { key: 'nav.savedJobs', label: 'Saved Jobs', to: '/freelancer/saved-jobs', icon: Bookmark, end: true },
  { key: 'nav.credentials', label: 'Credentials', to: '/freelancer/credentials', icon: Award, end: true },
  { key: 'nav.proposals', label: 'Proposals', to: '/freelancer/proposals', icon: FileText, end: false },
  { key: 'nav.contracts', label: 'Contracts', to: '/freelancer/contracts', icon: Handshake, end: true },
  { key: 'nav.messages', label: 'Messages', to: '/freelancer/messages', icon: MessageSquare, end: true },
  { key: 'nav.notifications', label: 'Notifications', to: '/freelancer/notifications', icon: Bell, end: true },
];

/** Sidebar navigation for the employer dashboard. */
export const EMPLOYER_NAV_LINKS = [
  { key: 'nav.dashboard', label: 'Dashboard', to: '/employer/dashboard', icon: LayoutDashboard, end: true },
  { key: 'nav.companyProfile', label: 'Company Profile', to: '/employer/profile', icon: Building2, end: true },
  { key: 'nav.myJobs', label: 'My Jobs', to: '/employer/jobs', icon: ClipboardList, end: false },
  { key: 'nav.postJob', label: 'Post a Job', to: '/employer/jobs/create', icon: PlusCircle, end: true },
  { key: 'nav.savedTalent', label: 'Saved Talent', to: '/employer/saved-freelancers', icon: Bookmark, end: true },
  { key: 'nav.contracts', label: 'Contracts', to: '/employer/contracts', icon: Handshake, end: true },
  { key: 'nav.messages', label: 'Messages', to: '/employer/messages', icon: MessageSquare, end: true },
  { key: 'nav.notifications', label: 'Notifications', to: '/employer/notifications', icon: Bell, end: true },
];

/** Sidebar navigation for the admin dashboard. */
export const ADMIN_NAV_LINKS = [
  { key: 'nav.dashboard', label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
  { key: 'nav.users', label: 'Users', to: '/admin/users', icon: Users, end: false },
  { key: 'nav.verifications', label: 'Verifications', to: '/admin/verifications', icon: ShieldCheck, end: true },
  { key: 'nav.jobs', label: 'Jobs', to: '/admin/jobs', icon: BriefcaseBusiness, end: true },
  { key: 'nav.reports', label: 'Reports', to: '/admin/reports', icon: Flag, end: true },
  { key: 'nav.categories', label: 'Categories', to: '/admin/categories', icon: FolderTree, end: true },
  { key: 'nav.skills', label: 'Skills', to: '/admin/skills', icon: Wrench, end: true },
  { key: 'nav.settings', label: 'Settings', to: '/admin/settings', icon: Settings, end: true },
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

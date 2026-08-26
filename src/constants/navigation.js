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
  UserCheck,
  ShieldCheck,
  BriefcaseBusiness,
  Flag,
  FolderTree,
  Wrench,
  Settings,
  Bookmark,
  Award,
  Shield,
  Key,
  ScrollText,
  CreditCard,
  Milestone,
  ArrowLeftRight,
  UserCog,
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
  { key: 'nav.payments', label: 'Payments', to: '/freelancer/payments', icon: CreditCard, end: true },
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
  { key: 'nav.payments', label: 'Payments', to: '/employer/payments', icon: CreditCard, end: true },
];

/**
 * Admin sidebar navigation — each item carries a `permission` guard key.
 * The AdminLayout filters this list using useAdminPermissions().can().
 * Items without a `permission` key are visible to all admins (Dashboard).
 *
 * `badgeKey` maps to a field from the dashboard stats object for live counts.
 * `group` visually separates sections in the sidebar.
 */
export const ADMIN_NAV_LINKS = [
  // ── Overview ──────────────────────────────────────────────────────────
  {
    key: 'nav.dashboard', label: 'Dashboard',
    to: '/admin/dashboard', icon: LayoutDashboard, end: true,
    group: 'overview',
  },

  // ── People ────────────────────────────────────────────────────────────
  {
    key: 'nav.users', label: 'Users',
    to: '/admin/users', icon: Users, end: false,
    permission: 'users.view', group: 'people',
  },
  {
    key: 'nav.verifications', label: 'Verifications',
    to: '/admin/verifications', icon: ShieldCheck, end: true,
    permission: 'users.verify', group: 'people',
    badgeKey: 'pending_verifications',
  },

  // ── Marketplace ───────────────────────────────────────────────────────
  {
    key: 'nav.jobs', label: 'Jobs',
    to: '/admin/jobs', icon: BriefcaseBusiness, end: true,
    permission: 'jobs.view', group: 'marketplace',
  },

  // ── Finance ───────────────────────────────────────────────────────────
  {
    key: 'nav.payments', label: 'Payments',
    to: '/admin/payments', icon: CreditCard, end: true,
    permission: 'payments.view', group: 'finance',
  },
  {
    key: 'nav.milestones', label: 'Milestones',
    to: '/admin/milestones', icon: Milestone, end: true,
    permission: 'milestones.view', group: 'finance',
  },
  {
    key: 'nav.transactions', label: 'Transactions',
    to: '/admin/transactions', icon: ArrowLeftRight, end: true,
    permission: 'transactions.view', group: 'finance',
  },

  // ── Moderation ────────────────────────────────────────────────────────
  {
    key: 'nav.reports', label: 'Reports',
    to: '/admin/reports', icon: Flag, end: true,
    permission: 'disputes.view', group: 'moderation',
    badgeKey: 'pending_reports',
  },
  {
    key: 'nav.categories', label: 'Categories',
    to: '/admin/categories', icon: FolderTree, end: true,
    permission: 'jobs.view', group: 'moderation',
  },
  {
    key: 'nav.skills', label: 'Skills',
    to: '/admin/skills', icon: Wrench, end: true,
    permission: 'jobs.view', group: 'moderation',
  },

  // ── Administration ────────────────────────────────────────────────────
  {
    key: 'nav.administrators', label: 'Administrators',
    to: '/admin/administrators', icon: UserCog, end: false,
    permission: 'admins.view', group: 'admin',
  },
  {
    key: 'nav.roles', label: 'Roles',
    to: '/admin/roles', icon: Shield, end: false,
    permission: 'roles.view', group: 'admin',
  },
  {
    key: 'nav.auditLogs', label: 'Audit Logs',
    to: '/admin/audit-logs', icon: ScrollText, end: true,
    permission: 'audit_logs.view', group: 'admin',
  },

  // ── System ────────────────────────────────────────────────────────────
  {
    key: 'nav.settings', label: 'Settings',
    to: '/admin/settings', icon: Settings, end: true,
    permission: 'settings.view', group: 'system',
  },
];

/** Group metadata for sidebar section labels */
export const ADMIN_NAV_GROUPS = {
  overview:     { label: null },           // no label for the first group
  people:       { label: 'People' },
  marketplace:  { label: 'Marketplace' },
  finance:      { label: 'Finance' },
  moderation:   { label: 'Moderation' },
  admin:        { label: 'Administration' },
  system:       { label: 'System' },
};

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

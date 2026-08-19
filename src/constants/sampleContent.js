/**
 * PLACEHOLDER CONTENT — Landing page preview only.
 *
 * These arrays exist so the landing page can demonstrate the intended visual
 * design before live APIs are connected. Every item is explicitly labeled as
 * sample content in the UI and must be replaced by real API data in later
 * phases. Do not treat any value here as real marketplace data.
 */
import {
  Code2,
  Palette,
  PenLine,
  Megaphone,
  Database,
  Wrench,
  Calculator,
  GraduationCap,
} from 'lucide-react';

export const SAMPLE_CATEGORIES = [
  { name: 'Software Development', description: 'Web, mobile, APIs, and custom software.', icon: Code2 },
  { name: 'Design & Creative', description: 'Branding, UI/UX, graphics, and illustration.', icon: Palette },
  { name: 'Writing & Translation', description: 'Content, copywriting, and Amharic/English translation.', icon: PenLine },
  { name: 'Marketing & Sales', description: 'Digital marketing, social media, and growth.', icon: Megaphone },
  { name: 'Data & AI', description: 'Data analysis, machine learning, and AI solutions.', icon: Database },
  { name: 'Engineering & Manufacturing', description: 'CAD, prototyping, and industrial design.', icon: Wrench },
  { name: 'Finance & Accounting', description: 'Bookkeeping, tax, and financial reporting.', icon: Calculator },
  { name: 'Education & Training', description: 'Tutoring, course creation, and workshops.', icon: GraduationCap },
];

export const SAMPLE_JOBS = [
  {
    id: 1,
    title: 'Senior React Developer',
    company: 'Habesha Tech Group',
    category: 'Software Development',
    location: 'Addis Ababa · Remote friendly',
    budget: 120000,
    interval: 'month',
    jobType: 'Full-time',
    experienceLevel: 'Senior',
    postedAt: '2 days ago',
    proposalCount: 14,
    featured: true,
    saved: false,
    skills: ['React', 'Laravel', 'Tailwind CSS'],
  },
  {
    id: 2,
    title: 'UI/UX Designer for Fintech App',
    company: 'Lion Fintech',
    category: 'Design & Creative',
    location: 'Addis Ababa',
    budget: 85000,
    interval: 'month',
    jobType: 'Contract',
    experienceLevel: 'Mid-level',
    postedAt: '5 days ago',
    proposalCount: 9,
    featured: false,
    saved: false,
    skills: ['Figma', 'UI/UX', 'Prototyping'],
  },
  {
    id: 3,
    title: 'Amharic–English Content Writer',
    company: 'Sheba Media',
    category: 'Writing & Translation',
    location: 'Remote',
    budget: 45000,
    interval: 'month',
    jobType: 'Freelance',
    experienceLevel: 'Entry',
    postedAt: '1 week ago',
    proposalCount: 22,
    featured: false,
    saved: false,
    skills: ['Content', 'SEO', 'Translation'],
  },
];

export const SAMPLE_FREELANCERS = [
  {
    id: 1,
    name: 'Sara Tesfaye',
    headline: 'Full-Stack Developer (React & Laravel)',
    location: 'Addis Ababa',
    hourlyRate: 900,
    rating: 4.9,
    reviews: 37,
    skills: ['React', 'Laravel', 'PostgreSQL'],
    availability: 'available',
    verified: true,
    completion: 100,
  },
  {
    id: 2,
    name: 'Yonatan Alemu',
    headline: 'Product Designer',
    location: 'Addis Ababa',
    hourlyRate: 1200,
    rating: 5.0,
    reviews: 24,
    skills: ['Figma', 'UI/UX', 'Design Systems'],
    availability: 'available',
    verified: true,
    completion: 95,
  },
  {
    id: 3,
    name: 'Meron Haile',
    headline: 'Digital Marketing Specialist',
    location: 'Remote',
    hourlyRate: 600,
    rating: 4.8,
    reviews: 18,
    skills: ['SEO', 'Social Media', 'Paid Ads'],
    availability: 'busy',
    verified: false,
    completion: 80,
  },
];

export const FREELANCER_STEPS = [
  { title: 'Create your profile', description: 'Showcase your skills, portfolio, and experience to employers across Ethiopia.' },
  { title: 'Browse & bid on jobs', description: 'Find work that fits your skills and submit proposals with your rate.' },
  { title: 'Deliver milestone work', description: 'Work in clear milestones and keep the employer updated at every step.' },
  { title: 'Get paid & grow', description: 'Get paid per approved milestone and build a trusted reputation.' },
];

export const EMPLOYER_STEPS = [
  { title: 'Post a job', description: 'Describe the work you need and the budget you have in mind.' },
  { title: 'Review proposals', description: 'Compare proposals, shortlist the best fits, and interview candidates.' },
  { title: 'Hire & agree milestones', description: 'Hire the right freelancer and agree on deliverables and payments.' },
  { title: 'Review the work', description: 'Approve milestones as work is delivered and leave fair reviews.' },
];

export const TRUST_FEATURES = [
  {
    title: 'Verified profiles',
    description: 'Identity and skill verification help employers hire with confidence.',
  },
  {
    title: 'Milestone-based payments',
    description: 'Work is broken into milestones so both sides stay protected.',
  },
  {
    title: 'Built for Ethiopia',
    description: 'Local payment support and Ethiopian context, from Addis Ababa to remote teams.',
  },
  {
    title: 'Fair reviews & ratings',
    description: 'Reputation is built through honest, two-sided feedback.',
  },
];

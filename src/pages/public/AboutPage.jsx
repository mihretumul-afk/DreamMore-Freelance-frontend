import { Link } from 'react-router-dom';
import { Target, Users, Globe, Heart, ArrowRight, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { usePageTitle } from '../../hooks/usePageTitle';

const VALUES = [
  {
    icon: Target,
    title: 'Our Mission',
    description: 'To bridge the gap between talented Ethiopian freelancers and global opportunities, creating a thriving digital economy.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'We believe in empowering our community of freelancers and employers with fair, transparent, and secure tools.',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Connecting local talent with international clients while keeping the focus on Ethiopian innovation and craftsmanship.',
  },
  {
    icon: Heart,
    title: 'Built with Care',
    description: 'Every feature is designed with our users in mind — from secure escrow payments to milestone-based project management.',
  },
];

const MILESTONES = [
  { year: '2024', title: 'Founded', description: 'Dream More AppWorks was born from a vision to empower Ethiopian talent.' },
  { year: '2025', title: 'Launch', description: 'Platform launched with core features: jobs, contracts, and secure payments.' },
  { year: '2026', title: 'Growth', description: 'Expanding features, user base, and partnerships across Ethiopia and beyond.' },
];

export default function AboutPage() {
  usePageTitle('About Us — Dream More AppWorks');

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-4xl px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            About <span className="text-brand-200">Dream More</span> AppWorks
          </h1>
          <p className="mt-6 text-lg text-brand-100 leading-relaxed max-w-2xl mx-auto">
            We're on a mission to connect Ethiopian talent with the world — building a platform where freelancers thrive and businesses grow.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-extrabold text-ink-900">Our Story</h2>
          <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
            <p>
              Dream More AppWorks was founded with a simple yet powerful idea: Ethiopian freelancers deserve a platform that
              respects their skills, protects their earnings, and connects them with meaningful opportunities.
            </p>
            <p>
              We saw talented developers, designers, writers, and consultants struggling with unreliable payment systems,
              lack of project structure, and difficulty finding trustworthy clients. We built AppWorks to solve these problems.
            </p>
            <p>
              Today, our platform offers end-to-end project management with milestone-based payments, secure escrow,
              and a marketplace that puts quality first. Whether you're a freelancer looking for your next project or an
              employer seeking top talent, Dream More AppWorks is where great work happens.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-extrabold text-ink-900 text-center">Our Values</h2>
          <p className="mt-3 text-center text-gray-500 max-w-xl mx-auto">
            The principles that guide everything we build.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                  <v.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink-900">{v.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-3xl font-extrabold text-ink-900 text-center">Our Journey</h2>
          <div className="mt-12 space-y-8">
            {MILESTONES.map((m, i) => (
              <div key={m.year} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-extrabold text-sm">
                    {m.year}
                  </div>
                  {i < MILESTONES.length - 1 && <div className="mt-2 h-full w-0.5 bg-brand-200" />}
                </div>
                <div className="pb-8">
                  <h3 className="text-lg font-bold text-ink-900">{m.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-600 to-indigo-600 py-16 text-center">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-3xl font-extrabold text-white">Ready to Get Started?</h2>
          <p className="mt-3 text-brand-100">Join thousands of freelancers and employers building the future together.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/register">
              <Button variant="white" size="lg">
                Sign Up Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline-white" size="lg">
                Learn How It Works
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

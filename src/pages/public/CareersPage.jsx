import { Briefcase, ArrowLeft, MapPin, Clock, Code, Palette, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { usePageTitle } from '../../hooks/usePageTitle';

const OPENINGS = [
  {
    icon: Code,
    title: 'Full-Stack Developer',
    department: 'Engineering',
    location: 'Addis Ababa / Remote',
    type: 'Full-time',
    description: 'Build and maintain our Laravel + React platform. Experience with APIs, databases, and cloud deployment required.',
  },
  {
    icon: Palette,
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Addis Ababa / Remote',
    type: 'Full-time',
    description: 'Design intuitive interfaces for our freelancer marketplace. Proficiency in Figma and modern design systems.',
  },
  {
    icon: BarChart3,
    title: 'Growth & Marketing Lead',
    department: 'Marketing',
    location: 'Addis Ababa',
    type: 'Full-time',
    description: 'Drive user acquisition and retention strategies. Experience in digital marketing and community building.',
  },
];

export default function CareersPage() {
  usePageTitle('Careers — Dream More AppWorks');

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <Briefcase className="mx-auto h-12 w-12 text-brand-200" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Join Our Team</h1>
          <p className="mt-3 text-brand-100 max-w-xl mx-auto">
            Help us build the future of work in Ethiopia. We're looking for passionate people who want to make a difference.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-extrabold text-ink-900">Open Positions</h2>
          <p className="mt-2 text-gray-500">We're growing! Check out our current openings below.</p>

          <div className="mt-8 space-y-4">
            {OPENINGS.map((job) => (
              <div key={job.title} className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <job.icon className="h-6 w-6 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-ink-900">{job.title}</h3>
                      <Badge tone="info" size="xs">{job.department}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.type}</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{job.description}</p>
                    <div className="mt-4">
                      <a href="mailto:careers@appworks.et?subject=Application: {job.title}">
                        <Button variant="outline" size="sm">Apply Now</Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-gray-50 p-8 text-center">
            <h3 className="text-lg font-bold text-ink-900">Don't see your role?</h3>
            <p className="mt-2 text-sm text-gray-500">Send us your resume at <a href="mailto:careers@appworks.et" className="text-brand-600 hover:underline font-medium">careers@appworks.et</a> — we're always looking for great talent.</p>
          </div>
        </div>
      </section>

      <section className="py-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </section>
    </div>
  );
}

import { ShieldCheck, ArrowLeft, Lock, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';

const SAFETY_FEATURES = [
  {
    icon: Lock,
    title: 'Secure Escrow Payments',
    description: 'All payments are held in escrow until work is approved. Neither party loses money.',
  },
  {
    icon: Eye,
    title: 'Identity Verification',
    description: 'Freelancers and employers can verify their identity to build trust on the platform.',
  },
  {
    icon: AlertTriangle,
    title: 'Dispute Resolution',
    description: 'Our admin team mediates disputes fairly, reviewing evidence from both sides.',
  },
  {
    icon: CheckCircle2,
    title: 'Milestone-Based Work',
    description: 'Clear deliverables and deadlines ensure both parties stay aligned throughout the project.',
  },
];

const TIPS = [
  'Always communicate through the platform for a record of conversations.',
  'Fund milestones before the freelancer starts work.',
  'Use detailed milestone descriptions with clear deliverables.',
  'Review submitted work promptly and provide constructive feedback.',
  'Never share personal banking details outside the platform.',
  'Report suspicious activity to our support team immediately.',
];

export default function SafetyPage() {
  usePageTitle('Safety — Dream More AppWorks');

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-ink-900 to-ink-800 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <ShieldCheck className="mx-auto h-12 w-12 text-emerald-400" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Safety & Trust</h1>
          <p className="mt-3 text-gray-400">Your security is our top priority. Learn how we keep you safe.</p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-extrabold text-ink-900 text-center">How We Keep You Safe</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {SAFETY_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <f.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-extrabold text-ink-900 text-center">Safety Tips</h2>
          <p className="mt-2 text-center text-gray-500">Follow these best practices to stay safe on the platform.</p>
          <div className="mt-10 space-y-3">
            {TIPS.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-white p-4 border border-gray-100">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>
      </section>
    </div>
  );
}

import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: `By accessing or using Dream More AppWorks ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. These terms apply to all users, including freelancers, employers, and visitors.`,
  },
  {
    title: '2. User Accounts',
    content: `You must create an account to use certain features of the Platform. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information during registration and keep your account information up to date.`,
  },
  {
    title: '3. Freelancer Responsibilities',
    content: `Freelancers agree to perform work professionally and in accordance with the agreed-upon scope. Freelancers must submit work through the Platform's milestone system. Freelancers are responsible for their own tax obligations and compliance with applicable laws.`,
  },
  {
    title: '4. Employer Responsibilities',
    content: `Employers agree to provide clear project requirements and timely feedback. Employers must fund milestones before freelancers begin work. Employers agree to review and approve submitted work within a reasonable timeframe.`,
  },
  {
    title: '5. Payments & Escrow',
    content: `All payments are processed through our secure escrow system. Employers fund milestones upfront, and funds are released to freelancers upon approval. Platform fees and processing fees apply as outlined in our pricing page. Refunds are handled according to our dispute resolution process.`,
  },
  {
    title: '6. Disputes & Resolution',
    content: `If a dispute arises between a freelancer and employer, either party may open a dispute through the Platform. Our team will review the evidence and make a fair decision. Both parties agree to cooperate with the dispute resolution process.`,
  },
  {
    title: '7. Intellectual Property',
    content: `Freelancers retain ownership of their work until payment is fully released. Upon payment, the employer receives the agreed-upon rights to the deliverables. Both parties must respect intellectual property rights and not infringe on third-party copyrights.`,
  },
  {
    title: '8. Prohibited Activities',
    content: `Users may not engage in fraud, harassment, spam, or any activity that violates applicable laws. Users may not circumvent the Platform's payment system or attempt to conduct off-platform transactions for work sourced through the Platform.`,
  },
  {
    title: '9. Limitation of Liability',
    content: `Dream More AppWorks is not liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed the fees paid by you in the 12 months preceding the claim. We provide the Platform "as is" without warranties of any kind.`,
  },
  {
    title: '10. Changes to Terms',
    content: `We reserve the right to modify these terms at any time. Significant changes will be communicated via email or Platform notification. Continued use of the Platform after changes constitutes acceptance of the updated terms.`,
  },
];

export default function TermsPage() {
  usePageTitle('Terms of Service — Dream More AppWorks');

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-ink-900 to-ink-800 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <FileText className="mx-auto h-12 w-12 text-brand-300" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-gray-400">Last updated: August 2026</p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <div className="prose prose-gray max-w-none space-y-10">
            {SECTIONS.map((s) => (
              <div key={s.title}>
                <h2 className="text-xl font-bold text-ink-900">{s.title}</h2>
                <p className="mt-3 text-gray-600 leading-relaxed">{s.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-500">
              Questions about these terms? <Link to="/contact" className="text-brand-600 hover:underline font-medium">Contact us</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

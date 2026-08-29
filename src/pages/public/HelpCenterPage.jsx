import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, Search, MessageSquare, BookOpen, CreditCard, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import { usePageTitle } from '../../hooks/usePageTitle';

const FAQ_CATEGORIES = [
  {
    icon: User,
    title: 'Getting Started',
    questions: [
      { q: 'How do I create an account?', a: 'Click "Sign Up" on the homepage. Choose whether you want to register as a Freelancer or Employer, fill in your details, and verify your email. You can start using the platform immediately after registration.' },
      { q: 'Is it free to join?', a: 'Yes! Creating a profile and browsing opportunities is completely free. We only charge a small platform fee when payments are processed through the escrow system.' },
      { q: 'How do I set up my profile?', a: 'After registering, go to your dashboard and click "Edit Profile." Add your skills, experience, portfolio items, and a professional photo to attract better opportunities.' },
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments & Escrow',
    questions: [
      { q: 'How does the escrow payment work?', a: 'When an employer creates a milestone, they fund it upfront. The money is held securely in escrow until the freelancer completes the work and the employer approves it. Then the funds are released to the freelancer.' },
      { q: 'What are the fees?', a: 'We charge a platform fee of 8% and a processing fee of 2.5% on each transaction. Freelancers receive the net amount after fees. Withdrawal fees are 1.5%.' },
      { q: 'How do I withdraw my earnings?', a: 'Go to your Withdrawals page, add a payment method (bank account or mobile money), and request a withdrawal. Processing typically takes 1-3 business days.' },
      { q: 'What payment methods are accepted?', a: 'We accept bank transfers (CBE, Dashen, Awash), mobile money (TeleBirr, M-Pesa), and card payments (Stripe). You can manage your payment methods in Settings.' },
    ],
  },
  {
    icon: BookOpen,
    title: 'Projects & Milestones',
    questions: [
      { q: 'How do milestones work?', a: 'Employers break projects into milestones. Each milestone has a title, description, deliverables, amount, and due date. The employer funds each milestone, and the freelancer works on them sequentially.' },
      { q: 'What if I need revisions?', a: 'Either party can request revisions. The freelancer can resubmit work after making changes. This back-and-forth continues until the employer is satisfied and approves the milestone.' },
      { q: 'What happens in a dispute?', a: 'If there\'s a disagreement, either party can open a dispute. Our admin team reviews the evidence from both sides and makes a fair decision. Funds are held in escrow during the dispute process.' },
    ],
  },
  {
    icon: MessageSquare,
    title: 'Account & Support',
    questions: [
      { q: 'How do I contact support?', a: 'Visit our Contact page or email support@appworks.et. Our team responds within 24 hours on business days. You can also reach us via phone during business hours.' },
      { q: 'How do I delete my account?', a: 'Go to Settings > Account > Delete Account. Note that this action is irreversible and all your data will be permanently removed.' },
      { q: 'Can I have both freelancer and employer accounts?', a: 'Currently, each account is assigned one role. You can register a separate account with a different email if you need both roles.' },
    ],
  },
];

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors cursor-pointer">
        <span className="text-sm font-semibold text-ink-900">{question}</span>
        {open ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-gray-100 px-5 py-4">
          <p className="text-sm text-gray-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpCenterPage() {
  usePageTitle('Help Center — Dream More AppWorks');

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <HelpCircle className="mx-auto h-12 w-12 text-brand-200" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Help Center</h1>
          <p className="mt-3 text-brand-100">Find answers to common questions or reach out to our support team.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-extrabold text-ink-900 text-center">Frequently Asked Questions</h2>
          <div className="mt-12 space-y-10">
            {FAQ_CATEGORIES.map((cat) => (
              <div key={cat.title}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100">
                    <cat.icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="text-lg font-bold text-ink-900">{cat.title}</h3>
                </div>
                <div className="space-y-2">
                  {cat.questions.map((faq) => (
                    <FaqItem key={faq.q} question={faq.q} answer={faq.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still need help */}
      <section className="bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h3 className="text-xl font-bold text-ink-900">Still need help?</h3>
          <p className="mt-2 text-sm text-gray-500">Our support team is available Monday to Friday, 9 AM – 6 PM EAT.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/contact"><Button variant="primary">Contact Support</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

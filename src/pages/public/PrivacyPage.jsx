import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: `We collect information you provide directly, including your name, email address, phone number, payment information, and profile details. We also collect usage data such as pages visited, actions taken, and device information to improve our Platform.`,
  },
  {
    title: '2. How We Use Your Information',
    content: `We use your information to provide and improve our services, process transactions, send communications, ensure security, and comply with legal obligations. We do not sell your personal information to third parties.`,
  },
  {
    title: '3. Information Sharing',
    content: `We share your information only as necessary to provide our services — for example, sharing payment details with our payment processor, or sharing your profile with employers/freelancers you choose to work with. We may also share information when required by law.`,
  },
  {
    title: '4. Data Security',
    content: `We implement industry-standard security measures to protect your data, including encryption, access controls, and regular security audits. However, no method of transmission over the Internet is 100% secure.`,
  },
  {
    title: '5. Data Retention',
    content: `We retain your information for as long as your account is active or as needed to provide services. After account deletion, we retain certain data as required by law or for legitimate business purposes.`,
  },
  {
    title: '6. Your Rights',
    content: `You have the right to access, update, or delete your personal information. You can manage most settings through your account dashboard. For additional requests, contact our privacy team.`,
  },
  {
    title: '7. Cookies & Tracking',
    content: `We use cookies and similar technologies to maintain your session, remember preferences, and analyze usage patterns. You can control cookie settings through your browser preferences.`,
  },
  {
    title: '8. Children\'s Privacy',
    content: `Our Platform is not intended for children under 18. We do not knowingly collect information from children. If we learn that we have collected information from a child, we will delete it promptly.`,
  },
  {
    title: '9. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time. We will notify you of significant changes via email or Platform notification. Your continued use of the Platform after changes constitutes acceptance.`,
  },
  {
    title: '10. Contact Us',
    content: `If you have questions about this Privacy Policy or our data practices, please contact us at privacy@appworks.et or visit our Contact page.`,
  },
];

export default function PrivacyPage() {
  usePageTitle('Privacy Policy — Dream More AppWorks');

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-ink-900 to-ink-800 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <Shield className="mx-auto h-12 w-12 text-brand-300" />
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Privacy Policy</h1>
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
              Questions about privacy? <Link to="/contact" className="text-brand-600 hover:underline font-medium">Contact us</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

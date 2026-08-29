import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare, CheckCircle2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'support@appworks.et', href: 'mailto:support@appworks.et' },
  { icon: Phone, label: 'Phone', value: '+251 911 234 567', href: 'tel:+251911234567' },
  { icon: MapPin, label: 'Location', value: 'Addis Ababa, Ethiopia', href: null },
  { icon: Clock, label: 'Hours', value: 'Mon–Fri, 9:00 AM – 6:00 PM (EAT)', href: null },
];

export default function ContactPage() {
  usePageTitle('Contact Us — Dream More AppWorks');
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    showToast('Message sent! We\'ll get back to you within 24 hours.', 'success');
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-800 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center text-white">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Contact Us</h1>
          <p className="mt-4 text-lg text-brand-100">Have a question or need help? We'd love to hear from you.</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-6xl px-4 grid gap-12 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-extrabold text-ink-900">Get in Touch</h2>
            <p className="text-gray-500 leading-relaxed">
              Whether you're a freelancer, employer, or partner — we're here to help. Reach out and our team will respond within 24 hours.
            </p>
            <div className="space-y-4">
              {CONTACT_INFO.map((c) => (
                <div key={c.label} className="flex items-start gap-4 rounded-xl bg-gray-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100">
                    <c.icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-gray-400">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="text-sm font-medium text-ink-900 hover:text-brand-600 transition-colors">{c.value}</a>
                    ) : (
                      <p className="text-sm font-medium text-ink-900">{c.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm">
              {sent ? (
                <div className="text-center py-12">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold text-ink-900">Message Sent!</h3>
                  <p className="mt-2 text-gray-500">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                  <Button variant="primary" className="mt-6" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }); }}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input label="Your Name" placeholder="John Doe" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <Input label="Email Address" type="email" placeholder="john@example.com" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <Input label="Subject" placeholder="How can we help?" value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                  <Textarea label="Message" placeholder="Tell us more..." rows={5} value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" loading={sending}>
                      <Send className="h-4 w-4" /> Send Message
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

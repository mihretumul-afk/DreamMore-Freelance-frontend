import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bookmark,
  Users,
  X,
  MessageSquare,
  Search,
  Star,
  MapPin,
  CheckCircle2,
  Send,
  Sparkles,
  ExternalLink,
  Loader2,
  Check,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import Container from '../../components/common/Container';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/marketplace/PageHeader';
import Pagination from '../../components/marketplace/Pagination';
import Avatar from '../../components/marketplace/Avatar';
import PriceDisplay from '../../components/marketplace/PriceDisplay';
import RatingDisplay from '../../components/marketplace/RatingDisplay';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { savedService } from '../../services/savedService';
import { messageService } from '../../services/messageService';
import { getErrorMessage } from '../../utils/errors';
import { usePageTitle } from '../../hooks/usePageTitle';
import { cn } from '../../utils/cn';

// Pre-written formal business message templates for employers
const FORMAL_TEMPLATES = [
  {
    id: 'project_inquiry',
    label: 'Formal Project Inquiry',
    text: (name) =>
      `Hello ${name}, I reviewed your verified profile on DreamMore and would love to discuss an open project with you. Are you available for a quick discussion?`,
  },
  {
    id: 'availability_check',
    label: 'Availability Check',
    text: (name) =>
      `Hi ${name}, we have an upcoming assignment matching your expertise. Please let me know your current availability and standard turnaround timeline.`,
  },
  {
    id: 'interview_invitation',
    label: 'Interview Invitation',
    text: (name) =>
      `Greetings ${name}, we were impressed by your portfolio and qualifications. We would like to invite you for a brief chat regarding a potential contract.`,
  },
];

export default function SavedFreelancersPage() {
  usePageTitle('Saved Talent');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [freelancers, setFreelancers] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');

  // Undo Toast Notification state
  const [lastRemovedItem, setLastRemovedItem] = useState(null);
  const [undoToast, setUndoToast] = useState(null); // { message: string, profileId: number, item: object }

  // Direct Messaging Modal state
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [messageError, setMessageError] = useState(null);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await savedService.getSavedFreelancers({ page });
      if (response.success) {
        setFreelancers(response.data ?? []);
        setMeta(response.meta ?? null);
      } else {
        setError(response.message || 'Unable to load saved freelancers.');
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load saved freelancers. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // Remove / Delete freelancer from saved list
  const handleRemove = useCallback(
    async (freelancerProfileId) => {
      const targetItem = (freelancers ?? []).find(
        (s) => s.freelancer_profile_id === freelancerProfileId || s.freelancer?.id === freelancerProfileId,
      );
      const name = targetItem?.freelancer?.user?.name || targetItem?.freelancer?.name || 'Talent';

      setRemovingId(freelancerProfileId);

      // Optimistic update — remove immediately from state
      setFreelancers((prev) =>
        (prev ?? []).filter(
          (s) => s.freelancer_profile_id !== freelancerProfileId && s.freelancer?.id !== freelancerProfileId,
        ),
      );

      // Show Undo Toast
      if (targetItem) {
        setLastRemovedItem(targetItem);
        setUndoToast({
          message: `Removed ${name} from your saved shortlist.`,
          profileId: freelancerProfileId,
          item: targetItem,
        });

        // Auto hide toast after 6 seconds
        setTimeout(() => {
          setUndoToast(null);
        }, 6000);
      }

      try {
        await savedService.unsaveFreelancer(freelancerProfileId);
      } catch {
        // Restore on hard error if unsave API call fails
        loadSaved();
      } finally {
        setRemovingId(null);
      }
    },
    [freelancers, loadSaved],
  );

  // Undo Delete Action
  const handleUndo = async () => {
    if (!undoToast?.profileId) return;
    const { profileId, item } = undoToast;

    // Restore item optimistically
    setFreelancers((prev) => (prev ? [item, ...prev] : [item]));
    setUndoToast(null);

    try {
      await savedService.saveFreelancer(profileId);
    } catch {
      loadSaved();
    }
  };

  // Open Messaging Modal for selected freelancer
  const handleOpenMessageModal = (freelancerData) => {
    const freelancer = freelancerData.freelancer || freelancerData;
    const userObj = freelancer.user || {};
    const name = userObj.name || freelancer.name || 'Freelancer';

    setMessageTarget({
      freelancerProfileId: freelancerData.freelancer_profile_id || freelancer.id,
      userId: userObj.id || freelancer.user_id || freelancer.id,
      name,
      avatar: userObj.avatar || freelancer.avatar,
      headline: freelancer.headline || 'Certified Freelance Expert',
      location: freelancer.location || 'Ethiopia',
      hourlyRate: freelancer.hourly_rate || freelancer.hourlyRate || 0,
    });

    setMessageText(FORMAL_TEMPLATES[0].text(name));
    setMessageSuccess(false);
    setMessageError(null);
  };

  // Send Direct Message via API
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageTarget || !messageText.trim() || sendingMessage) return;

    setSendingMessage(true);
    setMessageError(null);

    try {
      const response = await messageService.sendMessage({
        receiver_id: messageTarget.userId,
        content: messageText.trim(),
      });

      if (response.success || response.data) {
        setMessageSuccess(true);
        setTimeout(() => {
          setMessageTarget(null);
          setMessageSuccess(false);
          // Navigate to Employer Messages thread
          navigate(
            `/employer/messages?user_id=${messageTarget.userId}&name=${encodeURIComponent(
              messageTarget.name,
            )}`,
          );
        }, 1200);
      } else {
        setMessageError(response.message || 'Failed to send message.');
      }
    } catch (err) {
      setMessageError(getErrorMessage(err, 'Failed to send message. Please try again.'));
    } finally {
      setSendingMessage(false);
    }
  };

  const goToPage = (nextPage) => setSearchParams({ page: nextPage });
  const totalPages = meta?.last_page ?? 1;

  // Filter saved freelancers client-side
  const filteredFreelancers = (freelancers ?? []).filter((item) => {
    const f = item.freelancer || {};
    const name = (f.user?.name || f.name || '').toLowerCase();
    const headline = (f.headline || '').toLowerCase();
    const skillsText = Array.isArray(f.skills)
      ? f.skills.map((s) => (typeof s === 'string' ? s : s.name)).join(' ').toLowerCase()
      : '';
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return name.includes(q) || headline.includes(q) || skillsText.includes(q);
  });

  return (
    <Container className="py-8 lg:py-12 relative">
      <PageHeader
        eyebrow="Talent Shortlist"
        title="Saved Freelancers & Talent Directory"
        description="Manage your saved top Ethiopian freelancers. Easily contact talent, send formal inquiries, or remove freelancers from your saved shortlist."
        breadcrumbs={[
          { label: 'Dashboard', to: '/employer/dashboard' },
          { label: 'Saved Talent' },
        ]}
      />

      {/* Floating Undo Notification Toast */}
      {undoToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-gray-800 bg-ink-900 px-4 py-3 text-xs text-white shadow-2xl animate-fade-up">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{undoToast.message}</span>
          <button
            type="button"
            onClick={handleUndo}
            className="ml-2 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-brand-500 transition-colors"
          >
            <RotateCcw className="h-3 w-3" /> Undo
          </button>
          <button
            type="button"
            onClick={() => setUndoToast(null)}
            className="text-gray-400 hover:text-white ml-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Search & Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search saved talent by name or skill…"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-9 pr-3 py-2 text-xs sm:text-sm text-ink-900 placeholder:text-gray-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500">
            {filteredFreelancers.length} {filteredFreelancers.length === 1 ? 'Freelancer' : 'Freelancers'} Saved
          </span>
          <Link
            to="/freelancers"
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
          >
            <Users className="h-4 w-4" /> Discover More Talent
          </Link>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Card key={i} className="animate-pulse p-5">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded bg-gray-200" />
                  <div className="h-3 w-48 rounded bg-gray-200" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && error && (
        <ErrorState
          title="Unable to load saved freelancers"
          description={error}
          onRetry={loadSaved}
        />
      )}

      {!loading && !error && filteredFreelancers.length === 0 && (
        <EmptyState
          icon={Bookmark}
          title={searchTerm ? 'No saved talent matches your search' : 'No saved freelancers yet'}
          description={
            searchTerm
              ? `No saved talent matched "${searchTerm}". Try resetting your search filter.`
              : "Save top freelancers while exploring profiles, and reach out whenever you're ready to hire."
          }
          action={
            searchTerm ? (
              <Button onClick={() => setSearchTerm('')} variant="outline" size="sm">
                Clear Search Filter
              </Button>
            ) : (
              <Link
                to="/freelancers"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 shadow-md"
              >
                <Users className="h-4 w-4" /> Explore Ethiopian Freelancers
              </Link>
            )
          }
        />
      )}

      {/* Saved Freelancers Grid */}
      {!loading && !error && filteredFreelancers.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredFreelancers.map((saved) => {
              const f = saved.freelancer || {};
              const userObj = f.user || {};
              const name = userObj.name || f.name || 'Verified Talent';
              const headline = f.headline || 'Certified Freelance Expert';
              const location = f.location || 'Ethiopia';
              const hourlyRate = f.hourly_rate || f.hourlyRate || 0;
              const rating = f.rating || 5.0;
              const completedCount = f.completed_jobs_count || f.completedJobsCount || 0;
              const rawSkills = f.skills || [];
              const skills = Array.isArray(rawSkills)
                ? rawSkills.map((s) => (typeof s === 'string' ? s : s.name)).filter(Boolean)
                : [];

              const targetProfileId = saved.freelancer_profile_id || f.id;

              return (
                <Card
                  key={saved.id}
                  className={cn(
                    'group relative flex flex-col justify-between overflow-hidden border border-gray-200/90 bg-white p-5 shadow-2xs transition-all duration-300 hover:shadow-lg hover:border-brand-300',
                    removingId === targetProfileId && 'opacity-40 pointer-events-none',
                  )}
                >
                  <div>
                    {/* Top Row: Avatar + Name + Filled Bookmark Unsave Button */}
                    <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3.5">
                      <div className="flex items-start gap-3.5 min-w-0">
                        <Avatar
                          name={name}
                          src={userObj.avatar || f.avatar}
                          size="lg"
                          variant="brand"
                          className="shrink-0 rounded-2xl shadow-xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="truncate text-base font-extrabold text-ink-900">
                              {name}
                            </h3>
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600 fill-brand-50" />
                          </div>
                          <p className="truncate text-xs font-medium text-gray-500">{headline}</p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                            <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                            <span>{location}</span>
                          </p>
                        </div>
                      </div>

                      {/* Filled Bookmark Button (Delete / Unsave on Click) */}
                      <button
                        type="button"
                        onClick={() => handleRemove(targetProfileId)}
                        disabled={removingId === targetProfileId}
                        aria-label={`Unsave ${name}`}
                        title="Unsave freelancer"
                        className="rounded-lg p-1.5 text-brand-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        <Bookmark className="h-5 w-5 fill-brand-600 text-brand-600 hover:fill-red-600 hover:text-red-600 transition-colors" />
                      </button>
                    </div>

                    {/* Stats Bar */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-3">
                        {hourlyRate > 0 && (
                          <PriceDisplay
                            amount={hourlyRate}
                            interval="hr"
                            className="font-extrabold text-brand-700"
                          />
                        )}
                        {completedCount > 0 && (
                          <span className="text-gray-500 font-medium">
                            {completedCount} completed jobs
                          </span>
                        )}
                      </div>

                      <RatingDisplay rating={rating} count={completedCount || 5} />
                    </div>

                    {/* Expertise Skill Badges */}
                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {skills.slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-ink-700"
                          >
                            {skill}
                          </span>
                        ))}
                        {skills.length > 4 && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                            +{skills.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Formal Action Controls Bar with explicit Remove button */}
                  <div className="mt-5 border-t border-gray-100 pt-3.5 flex flex-wrap items-center justify-between gap-2">
                    <Button
                      type="button"
                      onClick={() => handleOpenMessageModal(saved)}
                      size="sm"
                      className="bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-xs flex-1 justify-center min-w-[130px]"
                    >
                      <MessageSquare className="mr-1.5 h-4 w-4" /> Message Talent
                    </Button>

                    <Button
                      as={Link}
                      to={`/freelancers/${f.id}`}
                      variant="outline"
                      size="sm"
                      className="text-ink-700 hover:bg-gray-50 font-semibold"
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" /> View Profile
                    </Button>

                    {/* Explicit Delete / Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(targetProfileId)}
                      disabled={removingId === targetProfileId}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                      title="Remove freelancer from saved list"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={goToPage} className="mt-8" />
        </>
      )}

      {/* ── Direct Messaging Modal ── */}
      {messageTarget && (
        <Modal
          open={Boolean(messageTarget)}
          onClose={() => {
            if (!sendingMessage) setMessageTarget(null);
          }}
          title="Formal Direct Message"
          description="Send a message directly to initiate project discussions."
        >
          <div className="space-y-4">
            {/* Recipient Profile Banner */}
            <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
              <Avatar
                name={messageTarget.name}
                src={messageTarget.avatar}
                size="md"
                variant="brand"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="truncate font-bold text-ink-900">{messageTarget.name}</h4>
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                </div>
                <p className="truncate text-xs text-gray-500">{messageTarget.headline}</p>
              </div>
            </div>

            {/* Quick Formal Templates Bar */}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Quick Formal Templates
              </label>
              <div className="flex flex-wrap gap-1.5">
                {FORMAL_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setMessageText(tmpl.text(messageTarget.name))}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Sparkles className="h-3 w-3 text-brand-500" />
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div>
                <label htmlFor="message-text" className="mb-1 block text-xs font-semibold text-ink-800">
                  Message Content
                </label>
                <textarea
                  id="message-text"
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Compose your message..."
                  required
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm text-ink-900 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {messageError && (
                <p role="alert" className="text-xs font-semibold text-red-600">
                  {messageError}
                </p>
              )}

              {messageSuccess && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-2.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <Check className="h-4 w-4" /> Message sent successfully! Opening conversation thread…
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMessageTarget(null)}
                  disabled={sendingMessage}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendingMessage || !messageText.trim()}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold"
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 h-3.5 w-3.5" /> Send Formal Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </Container>
  );
}

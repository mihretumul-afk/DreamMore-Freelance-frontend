import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MessageSquare, Search, ChevronLeft, ChevronRight, ArrowLeft,
  Mail, CheckCircle2, RotateCcw, Trash2,
} from 'lucide-react';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { contactService } from '../../services/contactService';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, timeAgo } from '../../utils/format';

/* ─── Constants ────────────────────────────────────────────────────────── */

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'resolved', label: 'Resolved' },
];

const STATUS_BADGE = { new: 'warning', read: 'info', resolved: 'success' };
const STATUS_LABEL = { new: 'New', read: 'Read', resolved: 'Resolved' };

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-24 rounded-card border border-gray-200 bg-white" />
      ))}
    </div>
  );
}

export default function ContactsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAdminPermissions();
  const { showToast } = useToast();
  usePageTitle(id ? 'Contact Message — Admin' : 'Contacts — Admin');

  // List state
  const [messages, setMessages] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Detail state
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resolveModal, setResolveModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);

  // Debounce search input
  const searchTimer = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const loadList = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = { page };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await contactService.getContacts(params);
      const payload = res.data ?? res;
      setMessages(Array.isArray(payload) ? payload : (payload.data ?? []));
      setMeta(res.meta ?? payload.meta ?? { current_page: 1, last_page: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load contact messages.'));
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  const loadDetail = useCallback(async (messageId) => {
    setDetailLoading(true);
    try {
      const res = await contactService.getContactById(messageId);
      setSelected(res.data ?? res);
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to load this contact message.'), 'error');
      navigate('/admin/contacts');
    } finally {
      setDetailLoading(false);
    }
  }, [navigate, showToast]);

  useEffect(() => {
    if (id) loadDetail(id);
    else setSelected(null);
  }, [id, loadDetail]);

  useEffect(() => { if (!id) loadList(); }, [id, loadList]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const refreshDetail = useCallback(async () => {
    if (!selected) return;
    try {
      const res = await contactService.getContactById(selected.id);
      setSelected(res.data ?? res);
    } catch { /* keep current data */ }
  }, [selected]);

  const handleResolve = async () => {
    setSaving(true);
    try {
      await contactService.updateContactStatus(selected.id, { status: 'resolved', resolution: resolution.trim() || null });
      showToast('Contact message marked as resolved.', 'success');
      setResolveModal(false);
      setResolution('');
      await refreshDetail();
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to resolve this message.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    setSaving(true);
    try {
      await contactService.updateContactStatus(selected.id, { status: 'read' });
      showToast('Contact message reopened.', 'success');
      await refreshDetail();
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to reopen this message.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await contactService.deleteContact(selected.id);
      showToast('Contact message deleted.', 'success');
      setDeleteModal(false);
      navigate('/admin/contacts');
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to delete this message.'), 'error');
      setDeleteModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (!can('contacts.manage')) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Access Restricted"
        description="You do not have permission to manage contact messages."
      />
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────
  if (id) {
    if (detailLoading && !selected) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      );
    }

    if (!selected) {
      return <ErrorState title="Message not found" description="This contact message may have been deleted." onRetry={() => loadDetail(id)} />;
    }

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/admin/contacts')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all messages
        </button>

        {/* Header */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100">
                  <MessageSquare className="h-6 w-6 text-brand-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold text-ink-900">Message #{selected.id}</h2>
                    <Badge tone={STATUS_BADGE[selected.status] ?? 'neutral'} size="xs">
                      {STATUS_LABEL[selected.status] ?? selected.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-ink-800">{selected.subject}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Received {formatDate(selected.created_at)} · {timeAgo(selected.created_at) ?? ''}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {selected.status === 'resolved' ? (
                  <Button variant="outline" size="sm" loading={saving} onClick={handleReopen}>
                    <RotateCcw className="h-3.5 w-3.5" /> Reopen
                  </Button>
                ) : (
                  <Button variant="success" size="sm" onClick={() => setResolveModal(true)}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-danger-600 hover:border-danger-300 hover:bg-danger-50"
                  onClick={() => setDeleteModal(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Sender */}
        <Card>
          <CardBody>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">From</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-ink-700">
                {(selected.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink-900">{selected.name}</p>
                <a
                  href={`mailto:${selected.email}`}
                  className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline"
                >
                  <Mail className="h-3.5 w-3.5" /> {selected.email}
                </a>
                {selected.user && (
                  <p className="mt-0.5 text-xs text-gray-400">
                    Account: {selected.user.name} ({selected.user.email})
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Message */}
        <Card>
          <CardBody>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Message</p>
            <p className="whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
              {selected.message}
            </p>
          </CardBody>
        </Card>

        {/* Resolution info */}
        {selected.status === 'resolved' && (
          <Card>
            <CardBody>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-sm font-bold text-ink-900">Resolved</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    By {selected.resolver?.name ?? 'Admin'} on {selected.resolved_at ? formatDate(selected.resolved_at) : '—'}
                  </p>
                  {selected.resolution && (
                    <p className="mt-2 whitespace-pre-wrap rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
                      {selected.resolution}
                    </p>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Resolve modal */}
        <Modal open={resolveModal} onClose={() => { setResolveModal(false); setResolution(''); }} title="Mark as Resolved" size="md">
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-2 text-sm font-semibold text-emerald-800">Resolve this contact message?</p>
              <p className="mt-1 text-xs text-emerald-600">
                Marking it resolved removes it from the unread/new view. Add a note to keep a record of the outcome.
              </p>
            </div>
            <Textarea
              label="Resolution note (optional)"
              placeholder="e.g. Replied to the customer via email explaining the refund timeline."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setResolveModal(false); setResolution(''); }}>Cancel</Button>
              <Button variant="success" loading={saving} onClick={handleResolve}>
                <CheckCircle2 className="h-4 w-4" /> Mark Resolved
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete modal */}
        <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Message" size="sm">
          <div className="space-y-4">
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
              ⚠ This permanently removes the message from the inbox. This cannot be undone.
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteModal(false)}>Cancel</Button>
              <Button variant="danger" loading={saving} onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> Delete Message
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Contact Messages</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Inquiries submitted through the Contact page (footer Contact button). Newest first.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 min-w-40 rounded-input border border-gray-300 bg-white px-3 text-sm text-ink-900 focus:border-brand-500 focus:outline-none"
              aria-label="Filter by status"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search by name, email, or subject…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-input border border-gray-300 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            {meta.total > 0 && (
              <p className="text-sm text-gray-400">
                {meta.total} message{meta.total !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Messages */}
      {error ? (
        <ErrorState title="Unable to load contact messages" description={error} onRetry={loadList} />
      ) : loading ? (
        <Skeleton />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={statusFilter || debouncedSearch ? 'No messages match your filters' : 'No contact messages yet'}
          description={
            statusFilter || debouncedSearch
              ? 'Try adjusting the filters or clearing them.'
              : 'Messages sent through the Contact page on the public site will appear here.'
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            {messages.map((message) => (
              <Card
                key={message.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/admin/contacts/${message.id}`)}
              >
                <CardBody>
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                      <MessageSquare className="h-5 w-5 text-brand-600" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-ink-900">{message.subject}</p>
                        <Badge tone={STATUS_BADGE[message.status] ?? 'neutral'} size="xs">
                          {STATUS_LABEL[message.status] ?? message.status}
                        </Badge>
                        {message.status === 'new' && (
                          <span className="h-2 w-2 rounded-full bg-amber-500" aria-label="New message" />
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{message.message}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-400">
                        <span className="font-medium text-gray-500">{message.name}</span>
                        <span className="truncate">{message.email}</span>
                        <span>{timeAgo(message.created_at) ?? formatDate(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.last_page} · {meta.total} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={meta.current_page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={meta.current_page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

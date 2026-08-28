import { useEffect, useState } from 'react';
import {
  Send,
  X,
  Briefcase,
  CheckSquare,
  Square,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  ShieldCheck,
  CalendarDays,
  Info,
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { portfolioService } from '../../services/portfolioService';
import { formatDate, formatETB } from '../../utils/format';
import { useI18n } from '../../i18n';
import { useAuth } from '../../hooks/useAuth';

const DURATION_OPTIONS = [
  'Less than 1 week',
  '1 to 4 weeks',
  '1 to 3 months',
  '3 to 6 months',
  'More than 6 months',
];

const ERROR_FIELD_MAP = {
  cover_letter: 'coverLetter',
  bid_amount: 'bidAmount',
  currency: 'currency',
  estimated_duration: 'estimatedDuration',
  proposed_milestones: 'proposedMilestones',
  portfolio_item_ids: 'portfolioItemIds',
};

export default function ProposalForm({
  job,
  initialValues,
  submitLabel,
  submitting = false,
  fieldErrors = {},
  generalError,
  onSubmit,
  onCancel,
}) {
  const { t } = useI18n();
  const { user } = useAuth();
  const isHourly = job?.budgetType === 'hourly' || job?.budget_type === 'hourly';
  const defaultRate = user?.freelancerProfile?.hourly_rate || user?.freelancerProfile?.hourlyRate || '';

  const [form, setForm] = useState(() => ({
    coverLetter: initialValues?.coverLetter || '',
    bidAmount: initialValues?.bidAmount || (isHourly && defaultRate ? String(defaultRate) : (job?.minBudget ? String(job.minBudget) : '')),
    currency: initialValues?.currency || 'ETB',
    estimatedDuration: initialValues?.estimatedDuration || '1 to 4 weeks',
    proposedMilestones: initialValues?.proposedMilestones || [
      { id: '1', title: 'Initial Milestone / Delivery Phase 1', amount: job?.minBudget ? String(job.minBudget) : '1000', dueDate: '', description: '' }
    ],
    portfolioItemIds: initialValues?.portfolioItemIds || [],
  }));

  const [clientErrors, setClientErrors] = useState({});
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    setLoadingPortfolio(true);
    portfolioService
      .getPortfolio()
      .then((res) => {
        if (res.success) {
          setPortfolioItems(res.data || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPortfolio(false));
  }, []);

  // Map backend errors
  const backendErrors = {};
  Object.entries(fieldErrors).forEach(([backendField, message]) => {
    const key = ERROR_FIELD_MAP[backendField];
    if (key) backendErrors[key] = message;
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (clientErrors[name]) {
      setClientErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Milestone builder handlers
  const handleMilestoneChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.proposedMilestones];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, proposedMilestones: updated };
    });
  };

  const handleAddMilestone = () => {
    setForm((prev) => ({
      ...prev,
      proposedMilestones: [
        ...prev.proposedMilestones,
        { id: String(Date.now()), title: '', amount: '', dueDate: '', description: '' },
      ],
    }));
  };

  const handleRemoveMilestone = (index) => {
    setForm((prev) => ({
      ...prev,
      proposedMilestones: prev.proposedMilestones.filter((_, i) => i !== index),
    }));
  };

  // Auto-calculate bid amount from milestones for fixed-price jobs
  const milestonesTotal = form.proposedMilestones.reduce(
    (sum, m) => sum + (parseFloat(m.amount) || 0),
    0
  );

  const handleTogglePortfolio = (itemId) => {
    setForm((prev) => {
      const current = prev.portfolioItemIds || [];
      const updated = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      return { ...prev, portfolioItemIds: updated };
    });
  };

  const validate = () => {
    const errs = {};
    const coverLen = form.coverLetter.trim().length;

    if (!coverLen) {
      errs.coverLetter = 'A cover letter is required.';
    } else if (coverLen < 50) {
      errs.coverLetter = `Cover letter must be at least 50 characters. Currently ${coverLen} characters.`;
    }

    if (!form.bidAmount || Number(form.bidAmount) < 1) {
      errs.bidAmount = 'Enter a valid proposed amount (min 1 ETB).';
    }

    if (!form.estimatedDuration) {
      errs.estimatedDuration = 'Please select an estimated duration.';
    }

    if (!isHourly && form.proposedMilestones.length > 0) {
      const hasEmptyMilestone = form.proposedMilestones.some(m => !m.title.trim() || !m.amount || Number(m.amount) < 1);
      if (hasEmptyMilestone) {
        errs.proposedMilestones = 'All proposed milestones must have a valid title and amount.';
      }
    }

    return errs;
  };

  const handleReviewStep = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      return;
    }
    setShowReviewModal(true);
  };

  const handleConfirmSubmit = () => {
    setShowReviewModal(false);
    onSubmit?.(form);
  };

  const displayError = (key) => clientErrors[key] || backendErrors[key];
  const charCount = form.coverLetter.length;

  return (
    <form onSubmit={handleReviewStep} noValidate className="space-y-8">
      {generalError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3.5 text-sm font-medium text-danger-700 shadow-xs"
        >
          <AlertCircle className="h-5 w-5 text-danger-600 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* SECTION 1: COVER LETTER */}
      <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xs">
              1
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-900">Cover Letter</h3>
              <p className="text-xs text-gray-500">Introduce yourself and explain why you're the right fit.</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${charCount >= 50 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
            {charCount} / 5000 chars {charCount < 50 && '(Min 50)'}
          </span>
        </div>

        <Textarea
          name="coverLetter"
          rows={7}
          maxLength={5000}
          placeholder="Describe your relevant experience, approach to this project, and deliverables you will provide..."
          value={form.coverLetter}
          onChange={handleChange}
          error={displayError('coverLetter')}
          disabled={submitting}
          required
        />
      </div>

      {/* SECTION 2: PROPOSED TERMS & MILESTONES */}
      <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xs">
              2
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-900">
                {isHourly ? 'Hourly Rate & Terms' : 'Proposed Terms & Milestones'}
              </h3>
              <p className="text-xs text-gray-500">Set your pricing terms in ETB.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label={isHourly ? 'Hourly Rate (ETB/hr)' : 'Total Proposal Bid Amount (ETB)'}
            name="bidAmount"
            placeholder="0.00"
            min="1"
            step="1"
            value={form.bidAmount}
            onChange={handleChange}
            error={displayError('bidAmount')}
            disabled={submitting}
            required
          />

          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-xs text-slate-700 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Platform Fee Transparency
            </p>
            <p className="text-gray-500">
              Standard 8% platform fee is deducted upon milestone completion.
            </p>
            <p className="font-semibold text-emerald-700 pt-1">
              You will receive approx: {formatETB((parseFloat(form.bidAmount) || 0) * 0.92)}
            </p>
          </div>
        </div>

        {/* Interactive Milestone Breakdown Builder for Fixed Price jobs */}
        {!isHourly && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-ink-900">Proposed Milestone Breakdown</h4>
                <p className="text-xs text-gray-500">Break your work into paid milestone checkpoints for the client.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddMilestone}>
                <Plus className="h-4 w-4" /> Add Milestone
              </Button>
            </div>

            {displayError('proposedMilestones') && (
              <p className="text-xs font-semibold text-danger-600">{displayError('proposedMilestones')}</p>
            )}

            <div className="space-y-3">
              {form.proposedMilestones.map((milestone, idx) => (
                <div key={milestone.id || idx} className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                      Milestone #{idx + 1}
                    </span>
                    {form.proposedMilestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMilestone(idx)}
                        className="text-gray-400 hover:text-danger-600 p-1"
                        title="Remove milestone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2">
                      <Input
                        label="Milestone Title"
                        placeholder="e.g. Design Wireframes & Architecture"
                        value={milestone.title}
                        onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Amount (ETB)"
                        placeholder="1000"
                        min="1"
                        value={milestone.amount}
                        onChange={(e) => handleMilestoneChange(idx, 'amount', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      type="date"
                      label="Target Due Date (Optional)"
                      value={milestone.dueDate}
                      onChange={(e) => handleMilestoneChange(idx, 'dueDate', e.target.value)}
                    />
                    <Input
                      label="Description (Optional)"
                      placeholder="Key deliverables for this phase..."
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(idx, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Sum validation chip */}
            <div className="flex items-center justify-between rounded-xl bg-brand-50/60 p-3 text-xs border border-brand-100">
              <span className="text-brand-900 font-medium">Milestones Total:</span>
              <span className="font-extrabold text-brand-700 text-sm">
                {formatETB(milestonesTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: ESTIMATED DURATION */}
      <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xs">
            3
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-900">Estimated Duration</h3>
            <p className="text-xs text-gray-500">How long will this project take you to complete?</p>
          </div>
        </div>

        <Select
          name="estimatedDuration"
          value={form.estimatedDuration}
          onChange={handleChange}
          error={displayError('estimatedDuration')}
          required
        >
          {DURATION_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      </div>

      {/* SECTION 4: PORTFOLIO & WORK SAMPLES */}
      <div className="space-y-4 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xs">
            4
          </div>
          <div>
            <h3 className="text-base font-bold text-ink-900">Relevant Work Samples</h3>
            <p className="text-xs text-gray-500">Select portfolio items from your profile to attach.</p>
          </div>
        </div>

        {loadingPortfolio ? (
          <p className="text-xs text-gray-400">Loading your saved portfolio items...</p>
        ) : portfolioItems.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            You haven't saved any portfolio items yet on your profile. You can still submit your proposal!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {portfolioItems.map((item) => {
              const isSelected = (form.portfolioItemIds || []).includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => !submitting && handleTogglePortfolio(item.id)}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-xs transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-sm'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <button
                    type="button"
                    className="mt-0.5 text-brand-600 focus:outline-none"
                    aria-label={isSelected ? 'Deselect project' : 'Select project'}
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4 text-brand-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold line-clamp-1">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            <X className="h-4 w-4" /> Cancel
          </Button>
        )}
        <Button type="submit" size="lg" loading={submitting}>
          <Send className="h-4 w-4" /> Review & Submit Proposal
        </Button>
      </div>

      {/* SECTION 5: REVIEW CONFIRMATION MODAL */}
      <Modal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Your Proposal"
        description="Double-check your terms before submitting to the client."
        size="lg"
      >
        <div className="space-y-5 py-2">
          {/* Notice Banner */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Important:</strong> Terms cannot be edited once the employer accepts or reviews your proposal.
            </span>
          </div>

          {/* Proposal Summary */}
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3 text-xs">
            <div className="flex justify-between border-b border-gray-200/60 pb-2">
              <span className="text-gray-500 font-medium">Proposed Bid Amount</span>
              <span className="font-extrabold text-ink-900 text-sm">
                {formatETB(form.bidAmount)}
              </span>
            </div>

            <div className="flex justify-between border-b border-gray-200/60 pb-2">
              <span className="text-gray-500 font-medium">Estimated Duration</span>
              <span className="font-semibold text-ink-900">{form.estimatedDuration}</span>
            </div>

            {form.proposedMilestones.length > 0 && !isHourly && (
              <div className="space-y-1 pt-1">
                <span className="text-gray-500 font-medium block">Proposed Milestones ({form.proposedMilestones.length})</span>
                <ul className="space-y-1 pl-2 border-l-2 border-brand-300">
                  {form.proposedMilestones.map((m, idx) => (
                    <li key={idx} className="flex justify-between text-[11px]">
                      <span>{m.title || `Milestone ${idx+1}`}</span>
                      <span className="font-bold">{formatETB(m.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cover Letter Snippet */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 space-y-1 text-xs">
            <span className="text-gray-400 font-semibold uppercase text-[10px] tracking-wider block">Cover Letter</span>
            <p className="text-gray-700 whitespace-pre-line leading-relaxed italic line-clamp-4">
              "{form.coverLetter}"
            </p>
          </div>

          {/* Confirm Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Back to Edit
            </Button>
            <Button variant="success" loading={submitting} onClick={handleConfirmSubmit}>
              <CheckCircle2 className="h-4 w-4" /> Confirm & Submit Proposal
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  );
}

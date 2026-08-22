import { useEffect, useState } from 'react';
import { Send, X, Briefcase, CheckSquare, Square, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { portfolioService } from '../../services/portfolioService';
import { useI18n } from '../../i18n';

/** Backend error field name → form state key. */
const ERROR_FIELD_MAP = {
  cover_letter: 'coverLetter',
  bid_amount: 'bidAmount',
  currency: 'currency',
  estimated_duration: 'estimatedDuration',
  portfolio_item_ids: 'portfolioItemIds',
};

const EMPTY_FORM = {
  coverLetter: '',
  bidAmount: '',
  currency: 'ETB',
  estimatedDuration: '',
  portfolioItemIds: [],
};

export default function ProposalForm({
  initialValues,
  submitLabel,
  submitting = false,
  fieldErrors = {},
  generalError,
  onSubmit,
  onCancel,
}) {
  const { t } = useI18n();
  const [form, setForm] = useState(() => ({ ...EMPTY_FORM, ...initialValues }));
  const [clientErrors, setClientErrors] = useState({});
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  const finalSubmitLabel = submitLabel || t('proposals.submitProposal');

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

  // Map backend validation errors (cover_letter, bid_amount, …) to display keys.
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
    if (!form.coverLetter.trim()) {
      errs.coverLetter = 'A cover letter is required.';
    }
    if (!form.bidAmount || Number(form.bidAmount) < 1) {
      errs.bidAmount = 'Enter a bid amount of at least 1.';
    } else if (Number(form.bidAmount) > 99999999.99) {
      errs.bidAmount = 'Bid amount is too large.';
    }
    if (!form.estimatedDuration.trim()) {
      errs.estimatedDuration = 'Estimated duration is required.';
    }
    if (form.currency && form.currency.trim().length !== 3) {
      errs.currency = 'Currency must be a 3-letter code (e.g. ETB).';
    }
    return errs;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting) return;
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      return;
    }
    onSubmit?.(form);
  };

  const displayError = (key) => clientErrors[key] || backendErrors[key];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {generalError && (
        <div
          role="alert"
          className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
        >
          {generalError}
        </div>
      )}

      <Textarea
        label={t('proposals.coverLetter')}
        name="coverLetter"
        rows={6}
        maxLength={5000}
        placeholder={t('proposals.coverLetterPlaceholder')}
        value={form.coverLetter}
        onChange={handleChange}
        error={displayError('coverLetter')}
        disabled={submitting}
        required
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
        <Input
          type="number"
          label={t('proposals.bidAmount')}
          name="bidAmount"
          placeholder="0.00"
          min="1"
          max="99999999.99"
          step="0.01"
          value={form.bidAmount}
          onChange={handleChange}
          error={displayError('bidAmount')}
          hint="Your proposed price for this job."
          disabled={submitting}
          required
        />
        <Input
          label="Currency"
          name="currency"
          placeholder="ETB"
          maxLength={3}
          value={form.currency}
          onChange={handleChange}
          error={displayError('currency')}
          hint="3-letter code"
          disabled={submitting}
        />
      </div>

      <Input
        label={t('proposals.estimatedDuration')}
        name="estimatedDuration"
        placeholder={t('proposals.estimatedDurationPlaceholder')}
        maxLength={255}
        value={form.estimatedDuration}
        onChange={handleChange}
        error={displayError('estimatedDuration')}
        disabled={submitting}
        required
      />

      {/* Portfolio attachment section */}
      <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50/50 p-4">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-brand-600" />
          <h4 className="text-sm font-semibold text-ink-900">{t('proposals.attachPortfolio')}</h4>
        </div>
        <p className="text-xs text-gray-500">
          Select relevant portfolio projects to showcase with your proposal.
        </p>

        {loadingPortfolio ? (
          <p className="text-xs text-gray-400">Loading your portfolio items...</p>
        ) : portfolioItems.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            You have no portfolio items saved yet. You can add them anytime on your Profile page.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {portfolioItems.map((item) => {
              const isSelected = (form.portfolioItemIds || []).includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => !submitting && handleTogglePortfolio(item.id)}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 text-xs transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-xs'
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
                    <p className="font-semibold line-clamp-1">{item.title}</p>
                    {item.description && (
                      <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">{item.description}</p>
                    )}
                    {item.project_url && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-brand-600 hover:underline"
                      >
                        Link <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            <X className="h-4 w-4" aria-hidden="true" /> {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          <Send className="h-4 w-4" aria-hidden="true" /> {finalSubmitLabel}
        </Button>
      </div>
    </form>
  );
}

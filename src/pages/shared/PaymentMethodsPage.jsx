import { useCallback, useEffect, useState } from 'react';
import {
  CreditCard, Building2, Smartphone, Plus, Star, Trash2,
  CheckCircle2, Shield, ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import paymentService from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';
import { getErrorMessage, getFieldErrors } from '../../utils/errors';
import { cn } from '../../utils/cn';

const TYPE_ICONS = {
  card:         CreditCard,
  bank_account: Building2,
  mobile_money: Smartphone,
};

const TYPE_LABELS = {
  card:         'Card',
  bank_account: 'Bank Account',
  mobile_money: 'Mobile Money',
};

function MethodCard({ method, onSetDefault, onRemove }) {
  const Icon    = TYPE_ICONS[method.type] ?? CreditCard;
  const label   = method.display_label || method.nickname || TYPE_LABELS[method.type];

  return (
    <Card className={cn('p-4', method.is_default && 'border-brand-300 ring-1 ring-brand-200')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            method.is_default ? 'bg-brand-500' : 'bg-gray-100',
          )}>
            <Icon className={cn('h-5 w-5', method.is_default ? 'text-white' : 'text-gray-500')} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-ink-900 truncate">{label}</p>
              {method.is_default && (
                <Badge tone="primary" size="xs">
                  <Star className="h-2.5 w-2.5" /> Default
                </Badge>
              )}
              {method.is_verified && (
                <Badge tone="success" size="xs">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {TYPE_LABELS[method.type]}
              {method.card_exp_month && method.card_exp_year
                ? ` · Exp ${method.card_exp_month}/${method.card_exp_year}`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!method.is_default && (
            <button
              type="button"
              onClick={() => onSetDefault(method)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
            >
              Set default
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(method)}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-danger-50 hover:text-danger-500 transition-colors"
            aria-label="Remove payment method"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

const EMPTY_FORM = {
  type: 'card',
  nickname: '',
  card_brand: '',
  card_last_four: '',
  card_exp_month: '',
  card_exp_year: '',
  cardholder_name: '',
  bank_name: '',
  account_name: '',
  masked_account_number: '',
  mobile_provider: '',
  masked_phone: '',
  is_default: false,
};

/**
 * PaymentMethodsPage — manage saved payment instruments.
 * Used at /freelancer/payment-methods and /employer/payment-methods.
 */
export default function PaymentMethodsPage() {
  usePageTitle('Payment Methods');
  const { user }       = useAuth();
  const { showToast }  = useToast();
  const isFreelancer   = user?.role === 'freelancer';
  const backPath       = isFreelancer ? '/freelancer/payments' : '/employer/payments';

  const [methods, setMethods]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [addOpen, setAddOpen]         = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await paymentService.getPaymentMethods();
      setMethods(res.data ?? res ?? []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load payment methods.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true); setFormErrors({});
    try {
      await paymentService.addPaymentMethod(form);
      showToast('Payment method added.', 'success');
      setAddOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      const fe = getFieldErrors(err);
      if (Object.keys(fe).length) setFormErrors(fe);
      else showToast(getErrorMessage(err, 'Failed to add payment method.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (method) => {
    try {
      await paymentService.setDefaultPaymentMethod(method.id);
      showToast('Default payment method updated.', 'success');
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to update default.'), 'error');
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    try {
      await paymentService.removePaymentMethod(confirmRemove.id);
      showToast('Payment method removed.', 'success');
      setConfirmRemove(null);
      load();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to remove payment method.'), 'error');
    }
  };

  const f = (field) => ({
    value: form[field] ?? '',
    onChange: (e) => setForm(prev => ({ ...prev, [field]: e.target.value })),
    error: formErrors[field],
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={backPath}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-ink-900 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">Payment Methods</h1>
            <p className="text-sm text-gray-500">Manage how you pay or receive money.</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Method
        </Button>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-xl border border-info-200 bg-info-50 p-4 text-sm text-info-800">
        <Shield className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          We never store full card numbers or CVV codes. Only the last 4 digits and masked
          identifiers are saved. Real payment processing will be enabled in a future update.
        </p>
      </div>

      {/* Content */}
      {error ? (
        <ErrorState title="Failed to load" description={error} onRetry={load} />
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 rounded-card border border-gray-200 bg-white" />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment methods yet"
          description="Add a card, bank account, or mobile money number to enable payments."
          action={<Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add Method</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map(m => (
            <MethodCard
              key={m.id}
              method={m}
              onSetDefault={handleSetDefault}
              onRemove={setConfirmRemove}
            />
          ))}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center justify-center gap-2 rounded-card border-2 border-dashed border-gray-200 bg-white p-6 text-sm font-semibold text-gray-400 transition-colors hover:border-brand-300 hover:text-brand-600 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            Add Another Method
          </button>
        </div>
      )}

      {/* ── Add Method Modal ──────────────────────────────────────────── */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setForm(EMPTY_FORM); setFormErrors({}); }} title="Add Payment Method" size="md">
        <form onSubmit={handleAdd} className="space-y-4">
          {/* Type selector */}
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-900">Method type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['card', 'bank_account', 'mobile_money']).map(t => {
                const Icon = TYPE_ICONS[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: t }))}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-semibold transition-colors cursor-pointer',
                      form.type === t
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300',
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          <Input label="Nickname (optional)" placeholder="e.g. My main card" {...f('nickname')} />

          {form.type === 'card' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Card brand" placeholder="Visa / Mastercard" {...f('card_brand')} />
                <Input label="Last 4 digits" placeholder="4242" maxLength={4} {...f('card_last_four')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Exp month (MM)" placeholder="12" maxLength={2} {...f('card_exp_month')} />
                <Input label="Exp year (YYYY)" placeholder="2028" maxLength={4} {...f('card_exp_year')} />
              </div>
              <Input label="Cardholder name" placeholder="John Doe" {...f('cardholder_name')} />
            </>
          )}

          {form.type === 'bank_account' && (
            <>
              <Input label="Bank name" placeholder="Commercial Bank of Ethiopia" {...f('bank_name')} />
              <Input label="Account holder name" placeholder="John Doe" {...f('account_name')} />
              <Input label="Masked account number" placeholder="****1234" {...f('masked_account_number')}
                hint="Last 4 digits only — never enter your full account number." />
            </>
          )}

          {form.type === 'mobile_money' && (
            <>
              <Input label="Provider" placeholder="Telebirr / M-PESA" {...f('mobile_provider')} />
              <Input label="Masked phone number" placeholder="+251 9** *** 234" {...f('masked_phone')}
                hint="Partial number only — e.g. last 3 digits visible." />
            </>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={e => setForm(prev => ({ ...prev, is_default: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-brand-500"
            />
            Set as default payment method
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Add Method</Button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Remove ─────────────────────────────────────────────── */}
      <Modal open={!!confirmRemove} onClose={() => setConfirmRemove(null)} title="Remove Payment Method" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Remove <strong>{confirmRemove?.display_label ?? 'this payment method'}</strong>?
            {confirmRemove?.is_default ? ' A new default will be selected automatically.' : ''}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleRemove}>Remove</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

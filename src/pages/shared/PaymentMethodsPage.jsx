import { useCallback, useEffect, useState } from 'react';
import { CreditCard, Plus, Trash2, CheckCircle, Star } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { financialService } from '../../services/financialService';
import { useToast } from '../../hooks/useToast';
import { usePageTitle } from '../../hooks/usePageTitle';

const METHOD_TYPES = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'bank', label: 'Bank Account' },
  { value: 'mobile_money', label: 'Mobile Money' },
];

const PROVIDERS = {
  card: [
    { value: 'stripe', label: 'Stripe' },
    { value: 'telebirr', label: 'TeleBirr' },
  ],
  bank: [
    { value: 'cbe', label: 'CBE (Commercial Bank of Ethiopia)' },
    { value: 'dashen', label: 'Dashen Bank' },
    { value: 'awash', label: 'Awash Bank' },
  ],
  mobile_money: [
    { value: 'telebirr', label: 'TeleBirr' },
    { value: 'mpesa', label: 'M-Pesa' },
  ],
};

function MethodCard({ method, onSetDefault, onRemove }) {
  const typeLabels = { card: 'Card', bank: 'Bank Account', mobile_money: 'Mobile Money' };
  const typeColors = { card: 'primary', bank: 'info', mobile_money: 'success' };

  return (
    <div className={`rounded-xl border ${method.is_default ? 'border-brand-300 bg-brand-50/30' : 'border-gray-200 bg-white'} p-5 transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${method.is_default ? 'bg-brand-100' : 'bg-gray-100'}`}>
            <CreditCard className={`h-5 w-5 ${method.is_default ? 'text-brand-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-ink-900">{method.display_label || method.nickname || 'Payment Method'}</h3>
              {method.is_default && (
                <Badge tone="primary" size="xs">
                  <Star className="mr-0.5 h-2.5 w-2.5" /> Default
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">{typeLabels[method.type]} · {method.provider}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!method.is_default && (
            <Button variant="ghost" size="xs" onClick={() => onSetDefault(method.id)}>
              Set Default
            </Button>
          )}
          <button
            onClick={() => onRemove(method.id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentMethodsPage() {
  usePageTitle('Payment Methods');
  const { showToast } = useToast();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'card', provider: 'stripe', nickname: '', card_last_four: '', bank_name: '', masked_phone: '', masked_account_number: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financialService.getPaymentMethods();
      setMethods(res.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payment methods.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await financialService.addPaymentMethod(form);
      showToast('Payment method added successfully.', 'success');
      setShowAdd(false);
      setForm({ type: 'card', provider: 'stripe', nickname: '', card_last_four: '', bank_name: '', masked_phone: '', masked_account_number: '' });
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add payment method.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await financialService.setDefaultPaymentMethod(id);
      showToast('Default payment method updated.', 'success');
      load();
    } catch (err) {
      showToast('Failed to update default.', 'error');
    }
  };

  const handleRemove = async (id) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    try {
      await financialService.removePaymentMethod(id);
      showToast('Payment method removed.', 'success');
      load();
    } catch (err) {
      showToast('Failed to remove payment method.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Payment Methods</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your payment methods for funding milestones and withdrawals.</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" /> Add Method
        </Button>
      </div>

      {error ? (
        <ErrorState title="Failed to load" description={error} onRetry={load} />
      ) : loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl border border-gray-200 bg-white" />)}
        </div>
      ) : methods.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={CreditCard}
              title="No payment methods"
              description="Add a payment method to fund milestones and receive withdrawals."
              action={<Button variant="primary" size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Add Method</Button>}
            />
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <MethodCard key={m.id} method={m} onSetDefault={handleSetDefault} onRemove={handleRemove} />
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Payment Method" size="md">
        <div className="space-y-4">
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, provider: PROVIDERS[e.target.value]?.[0]?.value || '' })}>
            {METHOD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Select label="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
            {(PROVIDERS[form.type] || []).map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </Select>
          <Input label="Nickname" placeholder="e.g., My Visa Card" value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          {form.type === 'card' && (
            <>
              <Input label="Card Brand" placeholder="e.g., visa, mastercard" value={form.card_brand || ''} onChange={(e) => setForm({ ...form, card_brand: e.target.value })} />
              <Input label="Last 4 digits" placeholder="4242" value={form.card_last_four} onChange={(e) => setForm({ ...form, card_last_four: e.target.value })} />
            </>
          )}
          {form.type === 'bank' && (
            <>
              <Input label="Bank Name" placeholder="e.g., CBE" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
              <Input label="Account Last 4" placeholder="1234" value={form.masked_account_number} onChange={(e) => setForm({ ...form, masked_account_number: e.target.value })} />
            </>
          )}
          {form.type === 'mobile_money' && (
            <>
              <Input label="Mobile Provider" placeholder="e.g., TeleBirr" value={form.mobile_provider || ''} onChange={(e) => setForm({ ...form, mobile_provider: e.target.value })} />
              <Input label="Mobile Number" placeholder="+251911234567" value={form.masked_phone} onChange={(e) => setForm({ ...form, masked_phone: e.target.value })} />
            </>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleAdd}>Add Method</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

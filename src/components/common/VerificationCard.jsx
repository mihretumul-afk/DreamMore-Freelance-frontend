import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Clock, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import Card, { CardHeader, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Modal from '../ui/Modal';
import { verificationService } from '../../services/verificationService';
import { useToast } from '../../hooks/useToast';
import { getErrorMessage } from '../../utils/errors';
import { formatDate } from '../../utils/format';

const EMPLOYER_DOC_TYPES = [
  { value: 'company_registration', label: 'Company Registration / License' },
  { value: 'national_id', label: 'National ID / Passport' },
  { value: 'contact_info', label: 'Official Contact / Tax Document' },
];

const FREELANCER_DOC_TYPES = [
  { value: 'national_id', label: 'National ID / Kebele ID / Passport' },
  { value: 'certificates', label: 'Professional Certificates' },
  { value: 'portfolio', label: 'Proof of Work / Portfolio Document' },
  { value: 'identity', label: 'Government Issued Identity' },
];

export default function VerificationCard({ userRole = 'freelancer' }) {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: userRole === 'employer' ? 'company_registration' : 'national_id',
    notes: '',
    document: null,
  });

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await verificationService.getMyVerificationStatus();
      if (res.success) {
        setData(res.data);
      }
    } catch {
      // Ignore or soft fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.document && !form.notes.trim()) {
      showToast('Please attach a document or provide verification details.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', form.type);
      if (form.notes) formData.append('notes', form.notes.trim());
      if (form.document) formData.append('document', form.document);

      await verificationService.submitVerification(formData);
      showToast('Verification documents submitted for review!', 'success');
      setModalOpen(false);
      setForm({
        type: userRole === 'employer' ? 'company_registration' : 'national_id',
        notes: '',
        document: null,
      });
      loadStatus();
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to submit verification.'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const status = data?.status || 'unverified';
  const latest = data?.latest_verification;
  const docTypes = userRole === 'employer' ? EMPLOYER_DOC_TYPES : FREELANCER_DOC_TYPES;

  return (
    <Card>
      <CardHeader
        title="Identity & Account Verification"
        description="Verify your identity to build trust with clients and unlock full marketplace privileges."
        action={
          status !== 'approved' && (
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" />
              {status === 'pending' ? 'Update Documents' : 'Submit Verification'}
            </Button>
          )
        }
      />
      <CardBody>
        {loading ? (
          <p className="text-sm text-gray-500">Checking verification status...</p>
        ) : status === 'approved' ? (
          <div className="flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 p-4">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-success-900">Verified Account</h4>
              <p className="mt-0.5 text-xs text-success-700">
                Your identity and credentials have been verified by the AppWorks administration.
                {latest?.reviewed_at && ` Verified on ${formatDate(latest.reviewed_at)}.`}
              </p>
            </div>
          </div>
        ) : status === 'pending' ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900">Verification Pending Review</h4>
              <p className="mt-0.5 text-xs text-amber-700">
                Your verification documents have been submitted and are currently in the queue for administrator review.
              </p>
              {latest?.notes && (
                <p className="mt-2 text-xs italic text-amber-800">Submitted notes: &quot;{latest.notes}&quot;</p>
              )}
            </div>
          </div>
        ) : status === 'rejected' ? (
          <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-danger-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-danger-900">Verification Rejected</h4>
              <p className="mt-0.5 text-xs text-danger-700">
                Your previous verification submission was not approved.
              </p>
              {latest?.reason && (
                <div className="mt-2 rounded-lg bg-white/70 p-2.5 text-xs text-danger-800 border border-danger-200">
                  <span className="font-semibold">Reason:</span> {latest.reason}
                </div>
              )}
              <Button size="xs" variant="danger" className="mt-3" onClick={() => setModalOpen(true)}>
                Re-submit Verification
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-ink-900">Not Yet Verified</h4>
              <p className="mt-0.5 text-xs text-gray-600">
                {userRole === 'employer'
                  ? 'Submit your business registration or official ID to get verified as a trusted employer.'
                  : 'Submit your National ID and credentials to earn a verified freelancer badge.'}
              </p>
              <Button size="xs" className="mt-3" onClick={() => setModalOpen(true)}>
                Start Verification
              </Button>
            </div>
          </div>
        )}
      </CardBody>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={userRole === 'employer' ? 'Submit Employer Verification' : 'Submit Freelancer Verification'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Document Type"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          >
            {docTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>

          <div>
            <label className="block text-sm font-medium text-ink-800">
              Attach Document (PDF, JPG, PNG)
            </label>
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={(e) => setForm((p) => ({ ...p, document: e.target.files[0] }))}
              className="mt-1 block w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Private documents remain confidential and are only accessible by platform administrators.
            </p>
          </div>

          <Textarea
            label="Additional Notes / Registration Details"
            rows={3}
            placeholder="Provide any license numbers, tax IDs, or context..."
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Submit for Review
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

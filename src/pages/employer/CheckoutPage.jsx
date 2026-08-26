import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import paymentService from '../../services/paymentService';
import contractService from '../../services/contractService';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { contractId, milestoneId } = useParams();
  const [searchParams] = useSearchParams();
  const [milestone, setMilestone] = useState(null);
  const [contract, setContract] = useState(null);
  const [fees, setFees] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('details'); // details | checkout | redirect | result | failed

  const loadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [contractData, milestoneData] = await Promise.all([
        contractService.getContract(contractId),
        contractService.getMilestone(contractId, milestoneId),
      ]);
      setContract(contractData.data || contractData);
      setMilestone(milestoneData.data || milestoneData);
    } catch (err) {
      setError(err.message || 'Failed to load milestone details');
    } finally {
      setLoading(false);
    }
  }, [contractId, milestoneId]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  useEffect(() => {
    if (milestone && step === 'details') {
      calculateFees();
    }
  }, [milestone, step]);

  const calculateFees = async () => {
    try {
      setCalculating(true);
      const result = await paymentService.calculateFees(
        parseFloat(milestone.amount),
        contract?.currency || 'ETB'
      );
      setFees(result.data || result);
    } catch (err) {
      // Use basic fee calculation as fallback
      const amount = parseFloat(milestone.amount);
      const platformFee = amount * 0.05;
      const processingFee = amount * 0.02;
      setFees({
        amount,
        platform_fee: platformFee,
        processing_fee: processingFee,
        total: amount + platformFee + processingFee,
        currency: contract?.currency || 'ETB',
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setProcessing(true);
      setError(null);
      const result = await paymentService.fundMilestone(
        contractId,
        milestoneId,
        {
          payment_method_id: searchParams.get('method'),
        }
      );
      const payment = result.data || result;
      if (payment.checkout_url || payment.redirect_url) {
        setStep('redirect');
        window.location.href = payment.checkout_url || payment.redirect_url;
      } else if (payment.status === 'funded' || payment.status === 'completed') {
        setStep('result');
      } else {
        setStep('checkout');
        setProcessing(false);
      }
    } catch (err) {
      setStep('failed');
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && step !== 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="p-6 text-center">
            <div className="text-red-500 text-4xl mb-3">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button></CardBody>
          </Card>
      </div>
    );
  }

  // Redirect waiting state
  if (step === 'redirect') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 font-medium">Redirecting to payment...</p>
          <p className="text-gray-500 text-sm">You will be redirected to complete your payment.</p>
        </div>
      </div>
    );
  }

  // Success state
  if (step === 'result') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-2">
              Your milestone has been funded and funds are now held in escrow.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              The freelancer will be notified to begin work.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                Milestone: {milestone?.title}
              </p>
              <p className="text-green-700 text-sm mt-1">
                Amount: {fees?.currency || 'ETB'} {(parseFloat(milestone?.amount) || 0).toLocaleString()}
              </p>
            </div>
            <Button
              onClick={() => navigate(`/contracts/${contractId}`)}
              className="w-full cursor-pointer"
            >
              View Contract
            </Button></CardBody>
          </Card>
      </div>
    );
  }

  // Failed state
  if (step === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardBody className="p-8 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-600 mb-6">
              Your payment could not be completed. Your account has not been charged.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Button onClick={handleConfirmPayment} className="w-full cursor-pointer">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/contracts/${contractId}`)}
                className="w-full cursor-pointer"
              >
                Change Payment Method
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/support')}
                className="w-full cursor-pointer text-gray-500"
              >
                Contact Support
              </Button>
            </div></CardBody>
          </Card>
      </div>
    );
  }

  // Payment processing state
  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 font-medium">Processing payment...</p>
          <p className="text-gray-500 text-sm">Please do not close this page.</p>
        </div>
      </div>
    );
  }

  // Main checkout view
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700 text-sm mb-4 cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Fund Milestone</h1>
          <p className="text-gray-500 mt-1">Complete payment to fund this milestone</p>
        </div>

        {/* Milestone Details */}
        <Card className="mb-4">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Milestone</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="font-medium text-gray-900">{milestone?.title}</p>
              </div>
              {milestone?.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{milestone.description}</p>
                </div>
              )}
              {milestone?.deadline && (
                <div>
                  <p className="text-sm text-gray-500">Deadline</p>
                  <p className="text-gray-700">
                    {new Date(milestone.deadline).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div></CardBody>
          </Card>

        {/* Payment Summary */}
        <Card className="mb-4">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Payment Summary</h2>
          </CardHeader>
          <CardBody>
            {calculating ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500">Calculating fees...</span>
              </div>
            ) : fees ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Milestone Amount</span>
                  <span className="font-medium">
                    {fees.currency} {parseFloat(fees.amount || milestone?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Platform Fee ({((fees.platform_fee / (fees.amount || 1)) * 100).toFixed(0)}%)</span>
                  <span className="text-gray-600">
                    {fees.currency} {parseFloat(fees.platform_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Processing Fee</span>
                  <span className="text-gray-600">
                    {fees.currency} {parseFloat(fees.processing_fee || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-lg text-gray-900">
                    {fees.currency} {parseFloat(fees.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 py-4">Unable to calculate fees</div>
            )}</CardBody>
          </Card>

        {/* What Happens Next */}
        <Card className="mb-6">
          <CardBody className="p-4">
            <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Your payment will be processed and confirmed.</li>
              <li>Funds will be held in escrow until work is completed.</li>
              <li>When you approve the milestone, funds are released to the freelancer.</li>
            </ol></CardBody>
          </Card>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirmPayment}
          className="w-full cursor-pointer py-3 text-lg"
          disabled={!fees || processing}
        >
          {processing ? 'Processing...' : `Confirm Payment — ${fees?.currency || 'ETB'} ${parseFloat(fees?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        </Button>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          By confirming, you agree to fund this milestone. Funds will be held in escrow.
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { SubscriptionPlan } from '../types';
import { CreditCard, Lock } from 'lucide-react';

interface PaymentFormProps {
  plan: SubscriptionPlan;
  onPaymentComplete: () => void;
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const PaymentForm: React.FC<PaymentFormProps> = ({ plan, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.priceId,
        }),
      });

      const session = await response.json();

      // Redirect to Stripe Checkout
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Payment Details</h3>
        <Lock className="text-gray-400" />
      </div>

      <div className="mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Selected Plan</p>
          <p className="font-semibold">{plan.name}</p>
          <p className="text-lg font-bold mt-2">${plan.price}/month</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <CreditCard className="w-5 h-5" />
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
};
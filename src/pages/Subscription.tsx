import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { SubscriptionPlan } from '../types';
import { SubscriptionPlans } from '../components/SubscriptionPlans';
import { PaymentForm } from '../components/PaymentForm';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export const Subscription: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .order('price');

        if (error) throw error;
        setPlans(data || []);
      } catch (err) {
        setError('Failed to load subscription plans');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPayment(true);
  };

  const handlePaymentComplete = () => {
    // Refresh user data and redirect
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
        <p className="mt-4 text-lg text-gray-600">
          Select the plan that best fits your needs
        </p>
      </div>

      {error && (
        <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="ml-3 text-red-700">{error}</p>
          </div>
        </div>
      )}

      {!showPayment ? (
        <SubscriptionPlans
          plans={plans}
          currentPlan={user?.subscriptionStatus}
          onSelectPlan={handlePlanSelect}
        />
      ) : (
        selectedPlan && (
          <PaymentForm
            plan={selectedPlan}
            onPaymentComplete={handlePaymentComplete}
          />
        )
      )}

      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Subscription Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
            <div className="ml-4">
              <h4 className="font-medium">Unlimited Locations</h4>
              <p className="text-sm text-gray-600">
                Track as many locations as you need
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
            <div className="ml-4">
              <h4 className="font-medium">Real-time Updates</h4>
              <p className="text-sm text-gray-600">
                Get instant notifications and updates
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
            <div className="ml-4">
              <h4 className="font-medium">Premium Support</h4>
              <p className="text-sm text-gray-600">
                24/7 priority customer support
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionPlan } from '../types';
import { Check, Star } from 'lucide-react';

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentPlan?: string;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  plans,
  currentPlan,
  onSelectPlan
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`relative bg-white rounded-lg shadow-md overflow-hidden ${
            plan.isPopular ? 'ring-2 ring-indigo-600' : ''
          }`}
        >
          {plan.isPopular && (
            <div className="absolute top-0 right-0 bg-indigo-600 text-white px-3 py-1 text-sm">
              Popular
            </div>
          )}
          <div className="p-6">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <div className="mt-4">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-gray-500">/month</span>
            </div>
            <ul className="mt-6 space-y-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelectPlan(plan)}
              className={`mt-8 w-full px-4 py-2 rounded-md ${
                currentPlan === plan.id
                  ? 'bg-gray-100 text-gray-800 cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              disabled={currentPlan === plan.id}
            >
              {currentPlan === plan.id ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
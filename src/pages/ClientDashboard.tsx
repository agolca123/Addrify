import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { LocationData, SubscriptionPlan } from '../types';
import { LocationMap } from '../components/LocationMap';
import { MapPin, AlertTriangle, Lock } from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [addressLimit, setAddressLimit] = useState(5);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Fetch locations
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (locationError) throw locationError;

        // Fetch subscription plans
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*');

        if (planError) throw planError;

        setLocations(locationData || []);
        setPlans(planData || []);

        // Check if user needs to upgrade
        if (user.subscriptionStatus === 'free' && (locationData?.length || 0) >= 5) {
          setShowUpgradePrompt(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [user]);

  const handleUpgradeClick = () => {
    // Implementation for upgrade process
  };

  return (
    <div className="space-y-8">
      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You've reached the free plan limit of 5 addresses.
                <button
                  onClick={handleUpgradeClick}
                  className="ml-2 font-medium text-yellow-700 underline"
                >
                  Upgrade now
                </button>
                to add more locations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Location Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Locations</p>
              <p className="text-2xl font-bold">{locations.length}</p>
            </div>
            <MapPin className="h-8 w-8 text-indigo-600" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full"
                style={{
                  width: `${(locations.length / addressLimit) * 100}%`
                }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {locations.length} of {addressLimit} addresses used
            </p>
          </div>
        </div>

        {/* Add more stat cards */}
      </div>

      {/* Recent Locations */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Locations</h2>
        </div>
        <div className="p-6">
          {locations.length > 0 ? (
            <div className="space-y-4">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{location.address}</h3>
                      <p className="text-sm text-gray-500">
                        {location.city}, {location.country}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(location.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No locations added yet
            </div>
          )}
        </div>
      </div>

      {/* Subscription Plans */}
      {user?.subscriptionStatus === 'free' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Upgrade Your Plan</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-6 ${
                    plan.isPopular ? 'border-indigo-500 ring-2 ring-indigo-500' : ''
                  }`}
                >
                  {plan.isPopular && (
                    <span className="bg-indigo-500 text-white px-3 py-1 rounded-full text-sm">
                      Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold mt-4">{plan.name}</h3>
                  <p className="text-3xl font-bold mt-2">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </p>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg
                          className="h-5 w-5 text-green-500"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span className="ml-3">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleUpgradeClick}
                    className={`mt-8 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      plan.isPopular
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    Upgrade to {plan.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
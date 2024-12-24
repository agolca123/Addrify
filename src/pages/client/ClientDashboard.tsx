import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { LocationData, SubscriptionPlan } from '../../types';
import { LocationMap } from '../../components/LocationMap';
import { MapPin, AlertTriangle, Lock, Clock, MousePointer, Layout } from 'lucide-react';
import { motion } from 'framer-motion';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [addressLimit, setAddressLimit] = useState(5);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

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

        // Fetch subscription plans.
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

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8">
      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You've reached the free plan limit of 5 addresses.
                <button
                  onClick={() => window.location.href = '/subscription'}
                  className="ml-2 font-medium text-yellow-700 underline"
                >
                  Upgrade now
                </button>
                to add more locations.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Locations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md"
      >
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Locations</h2>
        </div>
        <div className="p-6">
          {locations.length > 0 ? (
            <div className="space-y-4">
              {locations.slice(0, 5).map((location) => (
                <div
                  key={location.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-medium">{location.address}</h3>
                        <p className="text-sm text-gray-500">
                          {location.city}, {location.country}
                        </p>
                      </div>
                      
                      {/* Page URL */}
                      {location.page_url && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Layout className="h-4 w-4 mr-2" />
                          <span>From: {location.page_url}</span>
                        </div>
                      )}

                      {/* Engagement Data */}
                      {location.engagement_data && (
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatTime(location.engagement_data.details.timeSpent)}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <Layout className="h-4 w-4 mr-1" />
                            <span>{location.engagement_data.details.pageViews} pages</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <MousePointer className="h-4 w-4 mr-1" />
                            <span>{location.engagement_data.details.clicks} clicks</span>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-400">
                        {new Date(location.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col items-end">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      {location.engagement_data && (
                        <span className={`mt-2 font-semibold ${getEngagementColor(location.engagement_data.total)}`}>
                          Score: {location.engagement_data.total}
                        </span>
                      )}
                    </div>
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
      </motion.div>

      {/* Selected Location Map */}
      {selectedLocation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Location Details</h2>
          <LocationMap
            latitude={selectedLocation.latitude}
            longitude={selectedLocation.longitude}
            showStreetView={true}
          />
        </motion.div>
      )}
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { EngagementChart } from '../../components/EngagementChart';
import { EngagementDetails } from '../../components/EngagementDetails';
import { EngagementSummary } from '../../components/EngagementSummary';
import { Activity, TrendingUp, Users } from 'lucide-react';

interface EngagementData {
  page_url: string;
  visit_count: number;
  avg_engagement: number;
  engagement_color: string;
  first_visit: string;
  last_visit: string;
  engagement_trend: 'High' | 'Medium' | 'Low';
  engagement_details: {
    timeSpent: number;
    timeScore: number;
    pageViews: number;
    pageViewScore: number;
    clicks: number;
    clickScore: number;
  };
}

export const ClientAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const [engagementData, setEngagementData] = useState<EngagementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchEngagementData = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_engagement_summary', { p_user_id: user.id });

        if (error) throw error;

        setEngagementData(data || []);
        if (data && data.length > 0) {
          setSelectedPage(data[0].page_url);
        }
      } catch (error) {
        console.error('Error fetching engagement data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEngagementData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedPageData = engagementData.find(d => d.page_url === selectedPage);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pages Tracked</p>
              <p className="text-2xl font-bold">{engagementData.length}</p>
            </div>
            <Activity className="h-8 w-8 text-indigo-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Visits</p>
              <p className="text-2xl font-bold">
                {engagementData.reduce((sum, item) => sum + item.visit_count, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Engagement</p>
              <p className="text-2xl font-bold">
                {(engagementData.reduce((sum, item) => sum + item.avg_engagement, 0) / engagementData.length).toFixed(1)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </motion.div>
      </div>

      {/* Engagement Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h2 className="text-lg font-semibold mb-4">Engagement Overview</h2>
        <EngagementChart data={engagementData} />
      </motion.div>

      {/* Page Details */}
      {selectedPageData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-lg shadow-md"
        >
          <h2 className="text-lg font-semibold mb-4">Page Details</h2>
          <EngagementDetails details={selectedPageData.engagement_details} />
        </motion.div>
      )}

      {/* Engagement Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white p-6 rounded-lg shadow-md"
      >
        <h2 className="text-lg font-semibold mb-4">Page Analysis</h2>
        <EngagementSummary
          data={engagementData}
        />
      </motion.div>
    </div>
  );
};
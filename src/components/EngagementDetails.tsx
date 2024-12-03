import React from 'react';
import { motion } from 'framer-motion';
import { Clock, MousePointer, Layout } from 'lucide-react';

interface EngagementDetailsProps {
  details: {
    timeSpent: number;
    timeScore: number;
    pageViews: number;
    pageViewScore: number;
    clicks: number;
    clickScore: number;
  };
}

export const EngagementDetails: React.FC<EngagementDetailsProps> = ({ details }) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-4 rounded-lg shadow-md"
      >
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-green-700" />
          <h3 className="font-medium">Time Spent</h3>
        </div>
        <p className="text-2xl font-bold">{formatTime(details.timeSpent)}</p>
        <div className="mt-2 flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-700 h-2 rounded-full"
              style={{ width: `${(details.timeScore / 10) * 100}%` }}
            />
          </div>
          <span className="ml-2 text-sm text-gray-600">Score: {details.timeScore}/10</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-lg shadow-md"
      >
        <div className="flex items-center gap-2 mb-2">
          <Layout className="h-5 w-5 text-green-600" />
          <h3 className="font-medium">Page Views</h3>
        </div>
        <p className="text-2xl font-bold">{details.pageViews}</p>
        <div className="mt-2 flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-700 h-2 rounded-full"
              style={{ width: `${(details.pageViewScore / 10) * 100}%` }}
            />
          </div>
          <span className="ml-2 text-sm text-gray-600">Score: {details.pageViewScore}/10</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-4 rounded-lg shadow-md"
      >
        <div className="flex items-center gap-2 mb-2">
          <MousePointer className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium">Clicks</h3>
        </div>
        <p className="text-2xl font-bold">{details.clicks}</p>
        <div className="mt-2 flex items-center">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${(details.clickScore / 10) * 100}%` }}
            />
          </div>
          <span className="ml-2 text-sm text-gray-600">Score: {details.clickScore}/10</span>
        </div>
      </motion.div>
    </div>
  );
};
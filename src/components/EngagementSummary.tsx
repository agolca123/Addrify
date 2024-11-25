import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface EngagementSummaryProps {
  data: {
    page_url: string;
    visit_count: number;
    avg_engagement: number;
    engagement_color: string;
    first_visit: string;
    last_visit: string;
    engagement_trend: 'High' | 'Medium' | 'Low';
  }[];
}

export const EngagementSummary: React.FC<EngagementSummaryProps> = ({ data }) => {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'High':
        return <ArrowUp className="h-5 w-5 text-green-500" />;
      case 'Medium':
        return <Minus className="h-5 w-5 text-yellow-500" />;
      case 'Low':
        return <ArrowDown className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <motion.div
          key={item.page_url}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white rounded-lg shadow-md p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{item.page_url}</h3>
              <p className="text-sm text-gray-500">
                {item.visit_count} visits • Last visit: {new Date(item.last_visit).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getTrendIcon(item.engagement_trend)}
              <span
                className="px-2 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: item.engagement_color, color: 'white' }}
              >
                {item.avg_engagement.toFixed(1)}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${(item.avg_engagement / 10) * 100}%`,
                  backgroundColor: item.engagement_color,
                }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
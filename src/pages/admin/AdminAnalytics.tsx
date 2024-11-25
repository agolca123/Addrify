import React from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export const AdminAnalytics: React.FC = () => {
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [3000, 3500, 4200, 4800, 5200, 6000],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.4
      }
    ]
  };

  const userActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Active Users',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: 'rgba(99, 102, 241, 0.5)'
      }
    ]
  };

  const subscriptionDistributionData = {
    labels: ['Free', 'Premium', 'Enterprise'],
    datasets: [
      {
        data: [30, 50, 20],
        backgroundColor: [
          'rgba(107, 114, 128, 0.5)',
          'rgba(99, 102, 241, 0.5)',
          'rgba(139, 92, 246, 0.5)'
        ],
        borderColor: [
          'rgb(107, 114, 128)',
          'rgb(99, 102, 241)',
          'rgb(139, 92, 246)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
        <Line
          data={revenueData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: 'Monthly Revenue'
              }
            }
          }}
        />
      </motion.div>

      {/* User Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-lg font-semibold mb-4">User Activity</h2>
        <Bar
          data={userActivityData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: 'Daily Active Users'
              }
            }
          }}
        />
      </motion.div>

      {/* Subscription Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Subscription Distribution</h2>
        <div className="w-full max-w-md mx-auto">
          <Pie
            data={subscriptionDistributionData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'User Subscription Types'
                }
              }
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};
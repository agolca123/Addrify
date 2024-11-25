import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface EngagementChartProps {
  data: {
    page_url: string;
    avg_engagement: number;
    engagement_color: string;
    visit_count: number;
  }[];
}

export const EngagementChart: React.FC<EngagementChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.page_url),
    datasets: [
      {
        label: 'Engagement Score',
        data: data.map(item => item.avg_engagement),
        backgroundColor: data.map(item => item.engagement_color),
        borderColor: data.map(item => item.engagement_color),
        borderWidth: 1,
      },
      {
        label: 'Visit Count',
        data: data.map(item => item.visit_count),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Page Engagement Analysis',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};
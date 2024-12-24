import React, { useState } from 'react';
import { Play, Pause, Settings } from 'lucide-react';

interface AutomationConfig {
  region: string;
  minEngagementScore: number;
  dateRange: {
    start: string;
    end: string;
  };
  includeNewAddresses: boolean;
}

interface ReverseAutomationProps {
  onStart: (config: AutomationConfig) => void;
  onStop: () => void;
  isRunning: boolean;
  pendingAddressCount: number;
}

export const ReverseAutomation: React.FC<ReverseAutomationProps> = ({
  onStart,
  onStop,
  isRunning,
  pendingAddressCount
}) => {
  const [config, setConfig] = useState<AutomationConfig>({
    region: '',
    minEngagementScore: 0,
    dateRange: {
      start: '',
      end: ''
    },
    includeNewAddresses: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(config);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Reverse Address Automation</h2>
          <p className="text-sm text-gray-500 mt-1">
            {pendingAddressCount} addresses pending processing
          </p>
        </div>
        
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
          >
            <Pause className="h-5 w-5" />
            Stop Automation
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
          >
            <Play className="h-5 w-5" />
            Start Automation
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region Filter
            </label>
            <input
              type="text"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value })}
              placeholder="Leave empty for all regions"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Engagement Score
            </label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={config.minEngagementScore}
              onChange={(e) => setConfig({ ...config, minEngagementScore: Number(e.target.value) })}
              placeholder="Minimum score (0-10)"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={config.dateRange.start}
              onChange={(e) => setConfig({
                ...config,
                dateRange: { ...config.dateRange, start: e.target.value }
              })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={config.dateRange.end}
              onChange={(e) => setConfig({
                ...config,
                dateRange: { ...config.dateRange, end: e.target.value }
              })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="includeNewAddresses"
            checked={config.includeNewAddresses}
            onChange={(e) => setConfig({ ...config, includeNewAddresses: e.target.checked })}
            className="h-4 w-4 text-green-700 focus:ring-green-600 border-gray-300 rounded"
          />
          <label htmlFor="includeNewAddresses" className="ml-2 text-sm text-gray-700">
            Include future addresses
          </label>
        </div>
      </form>
    </div>
  );
};
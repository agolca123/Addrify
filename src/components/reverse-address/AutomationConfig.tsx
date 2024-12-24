import React, { useState } from 'react';
import { Play, Pause, Settings } from 'lucide-react';

interface AutomationConfigProps {
  onStart: (config: AutomationSettings) => void;
  onStop: () => void;
  isRunning: boolean;
  pendingCount: number;
}

interface AutomationSettings {
  region: string;
  minEngagement: number;
  dateRange: {
    start: string;
    end: string;
  };
  processNewAddresses: boolean;
}

export const AutomationConfig: React.FC<AutomationConfigProps> = ({
  onStart,
  onStop,
  isRunning,
  pendingCount
}) => {
  const [settings, setSettings] = useState<AutomationSettings>({
    region: '',
    minEngagement: 0,
    dateRange: {
      start: '',
      end: ''
    },
    processNewAddresses: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(settings);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold">Automation Settings</h3>
          <p className="text-sm text-gray-500">{pendingCount} addresses pending</p>
        </div>

        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500"
          >
            <Pause className="h-5 w-5" />
            Stop
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-600"
          >
            <Play className="h-5 w-5" />
            Start
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Region Filter
            </label>
            <input
              type="text"
              value={settings.region}
              onChange={(e) => setSettings({ ...settings, region: e.target.value })}
              placeholder="Filter by region"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
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
              value={settings.minEngagement}
              onChange={(e) => setSettings({ ...settings, minEngagement: Number(e.target.value) })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={settings.dateRange.start}
              onChange={(e) => setSettings({
                ...settings,
                dateRange: { ...settings.dateRange, start: e.target.value }
              })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={settings.dateRange.end}
              onChange={(e) => setSettings({
                ...settings,
                dateRange: { ...settings.dateRange, end: e.target.value }
              })}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="processNewAddresses"
            checked={settings.processNewAddresses}
            onChange={(e) => setSettings({ ...settings, processNewAddresses: e.target.checked })}
            className="h-4 w-4 text-green-700 focus:ring-green-600 border-gray-300 rounded"
          />
          <label htmlFor="processNewAddresses" className="ml-2 text-sm text-gray-700">
            Process new addresses automatically
          </label>
        </div>
      </form>
    </div>
  );
};
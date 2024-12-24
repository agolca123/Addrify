import React from 'react';
import { Search, Calendar, TrendingUp, MapPin, Building } from 'lucide-react';

interface AddressFiltersProps {
  region: string;
  setRegion: (value: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (value: { start: string; end: string }) => void;
  minEngagement: number;
  setMinEngagement: (value: number) => void;
  selectedTypes: string[];
  setSelectedTypes: (value: string[]) => void;
  availableTypes: string[];
}

export const AddressFilters: React.FC<AddressFiltersProps> = ({
  region,
  setRegion,
  dateRange,
  setDateRange,
  minEngagement,
  setMinEngagement,
  selectedTypes,
  setSelectedTypes,
  availableTypes
}) => {
  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <h2 className="text-lg font-semibold mb-4">Filter Addresses</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="Filter by region"
              className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
              />
            </div>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min. Engagement Score
          </label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={minEngagement}
              onChange={(e) => setMinEngagement(Number(e.target.value))}
              placeholder="Minimum score"
              className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600 focus:border-green-600"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address Types
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeToggle(type)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                selectedTypes.includes(type)
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              } border hover:bg-opacity-80 transition-colors`}
            >
              <Building className="h-4 w-4 mr-1" />
              {type}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
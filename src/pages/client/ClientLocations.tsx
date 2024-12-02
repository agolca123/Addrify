import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../config/supabase';
import { LocationData } from '../../types';
import { LocationMap } from '../../components/LocationMap';
import { 
  MapPin, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Clock,
  MapPinOff,
  ChevronDown,
  ChevronUp,
  Layout,
  MousePointer
} from 'lucide-react';

export const ClientLocations: React.FC = () => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'timestamp' | 'address' | 'engagement'>('timestamp');

  useEffect(() => {
    if (!user) return;

    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        setLocations(data || []);
        if (data && data.length > 0) {
          setSelectedLocation(data[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLoading(false);
      }
    };

    fetchLocations();
  }, [user]);

  const handleSort = (field: 'timestamp' | 'address' | 'engagement') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

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

  const sortedAndFilteredLocations = locations
    .filter(location => {
      const matchesSearch = 
        location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.page_url && location.page_url.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDate = !filterDate || location.timestamp.startsWith(filterDate);
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'timestamp':
          return multiplier * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        case 'address':
          return multiplier * a.address.localeCompare(b.address);
        case 'engagement':
          const scoreA = a.engagement_data?.total || 0;
          const scoreB = b.engagement_data?.total || 0;
          return multiplier * (scoreA - scoreB);
        default:
          return 0;
      }
    });

  const handleExport = () => {
    const csv = [
      ['Address', 'City', 'Country', 'Page URL', 'Engagement Score', 'Time Spent', 'Page Views', 'Clicks', 'Timestamp'],
      ...sortedAndFilteredLocations.map(location => [
        location.address,
        location.city,
        location.country,
        location.page_url || '',
        location.engagement_data?.total || '',
        location.engagement_data?.details.timeSpent || '',
        location.engagement_data?.details.pageViews || '',
        location.engagement_data?.details.clicks || '',
        new Date(location.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `locations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search locations, pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-600"
            >
              <Download className="h-5 w-5" />
              Export
            </button>
          </div>
        </div>
      </motion.div>

      {/* Map and Location List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold mb-4">Location Map</h3>
          {selectedLocation ? (
            <LocationMap
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              mapContainerClassName="w-full h-[600px] rounded-lg"
              showStreetView={true}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px] bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <MapPinOff className="h-12 w-12 mx-auto mb-2" />
                <p>Select a location to view on map</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white rounded-lg shadow-md"
        >
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Location History</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {sortedAndFilteredLocations.length} locations found
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleSort('timestamp')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <Clock className="h-4 w-4" />
                  Date
                  {sortField === 'timestamp' && (
                    sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('engagement')}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <MousePointer className="h-4 w-4" />
                  Engagement
                  {sortField === 'engagement' && (
                    sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {sortedAndFilteredLocations.map((location) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedLocation?.id === location.id
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedLocation(location)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">{location.address}</p>
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
                        <div className="grid grid-cols-3 gap-4">
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

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-xs text-gray-400">
                          {new Date(location.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <MapPin className={`h-5 w-5 ${
                        selectedLocation?.id === location.id
                          ? 'text-green-700'
                          : 'text-gray-400'
                      }`} />
                      {location.engagement_data && (
                        <span className={`mt-2 font-semibold ${getEngagementColor(location.engagement_data.total)}`}>
                          Score: {location.engagement_data.total}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
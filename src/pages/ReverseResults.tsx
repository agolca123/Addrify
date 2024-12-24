import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { ReverseAddressResult, LocationData } from '../types';
import { ReverseResults as ReverseResultsComponent } from '../components/reverse-address/ReverseResults';
import { Search, Calendar, MapPin, User } from 'lucide-react';

interface EnrichedReverseResult extends ReverseAddressResult {
  location?: LocationData;
}

export const ReverseResults: React.FC = () => {
  const { user } = useAuthStore();
  const [results, setResults] = useState<EnrichedReverseResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<EnrichedReverseResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchResults();
  }, [user]);

  const fetchResults = async () => {
    try {
      if (!user) return;

      // Fetch reverse address results with related location data
      const { data, error } = await supabase
        .from('reverse_address_results')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.street_line_1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = (!dateRange.start || new Date(result.created_at) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(result.created_at) <= new Date(dateRange.end));

    return matchesSearch && matchesDate;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Reverse Address Results</h1>
        <p className="text-gray-600 mt-2">
          View enriched location data and resident information
        </p>
      </motion.div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-green-600"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredResults.map((result) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium">{result.street_line_1}</h3>
                </div>
                <p className="text-sm text-gray-500">
                  {result.city}, {result.state_code} {result.postal_code}
                </p>
                {result.current_residents.name && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{result.current_residents.name}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedResult(result)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500"
              >
                View Details
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <ReverseResultsComponent
              result={selectedResult}
              onClose={() => setSelectedResult(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
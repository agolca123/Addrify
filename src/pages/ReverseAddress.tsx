import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { LocationData, ReverseAddressResult } from '../types';
import { getReverseAddressInfo } from '../services/api/trestle';
import { AddressFilters } from '../components/reverse-address/AddressFilters';
import { AddressList } from '../components/reverse-address/AddressList';
import { ReverseAddressResults } from '../components/reverse-address/ReverseAddressResults';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const ReverseAddress: React.FC = () => {
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState<LocationData[]>([]);
  const [processedAddresses, setProcessedAddresses] = useState<Set<string>>(new Set());
  const [selectedResult, setSelectedResult] = useState<ReverseAddressResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [region, setRegion] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [minEngagement, setMinEngagement] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const locationsPerPage = 5;
  const [totalCount, setTotalCount] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
    fetchAddressTypes();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      if (!user) return;
      setLoading(true);

      // Temel sorgu oluştur
      let query = supabase
        .from('locations')
        .select('*', { count: 'exact' }) // Toplam sayı için count ekle
        .eq('user_id', user.id);

      // Filtreleri uygula
      if (region) {
        query = query.or(`city.ilike.%${region}%,country.ilike.%${region}%`);
      }

      if (dateRange.start) {
        query = query.gte('timestamp', `${dateRange.start}T00:00:00`);
      }

      if (dateRange.end) {
        query = query.lte('timestamp', `${dateRange.end}T23:59:59`);
      }

      if (minEngagement > 0) {
        query = query.gte('engagement_data->total', minEngagement);
      }

      if (selectedTypes.length > 0) {
        query = query.in('address_type', selectedTypes);
      }

      // Sayfalama için range ekle
      const from = (currentPage - 1) * locationsPerPage;
      const to = from + locationsPerPage - 1;

      // Sıralama ekle
      query = query
        .order('timestamp', { ascending: false })
        .range(from, to);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAddresses(data || []);
      setTotalCount(count || 0);

      // Processed addresses'i getir
      const { data: processedData } = await supabase
        .from('reverse_address_results')
        .select('location_id')
        .eq('user_id', user.id);

      if (processedData) {
        setProcessedAddresses(new Set(processedData.map(item => item.location_id)));
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setError('Adresleri getirirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAddressTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('address_type')
        .eq('user_id', user.id)
        .not('address_type', 'is', null);

      if (error) throw error;

      const types = [...new Set(data.map(item => item.address_type))];
      setAvailableTypes(types);
    } catch (error) {
      console.error('Error fetching address types:', error);
    }
  };

  const handleGetInfo = async (address: LocationData) => {
    try {
      // Önce bu adres için daha önce sonuç var mı kontrol et
      const { data: existingResult } = await supabase
        .from('reverse_address_results')
        .select('*')
        .eq('location_id', address.id)
        .single();

      // Eğer varsa, mevcut sonucu kullan
      if (existingResult) {
        setProcessedAddresses(prev => new Set([...prev, address.id]));
        setSelectedResult(existingResult);
        return;
      }

      // Yoksa yeni sorgu yap
      const result = await getReverseAddressInfo(address);
      
      const { error: saveError } = await supabase
        .from('reverse_address_results')
        .insert([{
          ...result,
          location_id: address.id,
          user_id: user?.id
        }]);

      if (saveError) throw saveError;

      setProcessedAddresses(prev => new Set([...prev, address.id]));
      setSelectedResult(result);
    } catch (error) {
      console.error('Error getting reverse address info:', error);
      setError('Adres bilgileri alınırken bir hata oluştu');
    }
  };

  const handleViewInfo = async (address: LocationData) => {
    try {
      const { data, error } = await supabase
        .from('reverse_address_results')
        .select('*')
        .eq('location_id', address.id)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedResult(data as ReverseAddressResult);
      }
    } catch (error) {
      console.error('Error viewing reverse address info:', error);
      setError('Failed to view address information');
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    fetchAddresses();
  };

  // Filtre değişikliklerinde fetchAddresses'i çağır ve sayfa 1'e dön
  useEffect(() => {
    setCurrentPage(1);
    fetchAddresses();
  }, [region, dateRange.start, dateRange.end, minEngagement, selectedTypes]);

  // Sayfa değişikliğinde fetchAddresses'i çağır
  useEffect(() => {
    fetchAddresses();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  const filteredAddresses = addresses.filter(address => {
    const matchesRegion = !region || 
      address.city.toLowerCase().includes(region.toLowerCase()) ||
      address.country.toLowerCase().includes(region.toLowerCase());
    
    const matchesDate = (!dateRange.start || new Date(address.timestamp) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(address.timestamp) <= new Date(dateRange.end));
    
    const matchesEngagement = !minEngagement || 
      (address.engagement_data?.total || 0) >= minEngagement;

    const matchesType = selectedTypes.length === 0 || 
      selectedTypes.includes(address.address_type || '');

    return matchesRegion && matchesDate && matchesEngagement && matchesType;
  });

  const totalPages = Math.ceil(totalCount / locationsPerPage);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Reverse Address Search</h1>
        <p className="text-gray-600 mt-2">
          Search and analyze location data
        </p>
      </motion.div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <AddressFilters
        region={region}
        setRegion={setRegion}
        dateRange={dateRange}
        setDateRange={setDateRange}
        minEngagement={minEngagement}
        setMinEngagement={setMinEngagement}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
        availableTypes={availableTypes}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AddressList
            addresses={filteredAddresses}
            onGetInfo={handleGetInfo}
            onViewInfo={handleViewInfo}
            processedAddresses={processedAddresses}
          />
          
          {/* Pagination */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>

              {totalPages <= 7 ? (
                Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-green-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => handlePageChange(1)}
                    className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'bg-green-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    1
                  </button>

                  {currentPage > 3 && <span className="px-2 text-gray-400">...</span>}

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      if (currentPage <= 4) return page > 1 && page < 6;
                      if (currentPage >= totalPages - 3) return page > totalPages - 5 && page < totalPages;
                      return page >= currentPage - 1 && page <= currentPage + 1;
                    })
                    .map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-green-600 text-white font-medium'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                  {currentPage < totalPages - 2 && <span className="px-2 text-gray-400">...</span>}

                  <button
                    onClick={() => handlePageChange(totalPages)}
                    className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'bg-green-600 text-white font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {selectedResult && (
            <ReverseAddressResults
              result={selectedResult}
              onClose={() => setSelectedResult(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
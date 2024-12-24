import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { LocationData, ReverseAddressResult } from '../types';
import { getReverseAddressInfo } from '../services/api/trestle';
import { AddressFilters } from '../components/reverse-address/AddressFilters';
import { AddressList } from '../components/reverse-address/AddressList';
import { ReverseAddressResults } from '../components/reverse-address/ReverseAddressResults';
import { ChevronLeft, ChevronRight, Search, MapPin, User, Info, Home, Users, CheckCircle } from 'lucide-react';

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

  const leftColumnRef = useRef<HTMLDivElement>(null);
  const [leftColumnHeight, setLeftColumnHeight] = useState<number>(0);

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

  // Sol sütun yüksekliğini izle
  useEffect(() => {
    const updateHeight = () => {
      if (leftColumnRef.current) {
        setLeftColumnHeight(leftColumnRef.current.offsetHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    return () => window.removeEventListener('resize', updateHeight);
  }, [addresses, currentPage]); // addresses veya sayfa değiştiğinde yeniden hesapla

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
        <div ref={leftColumnRef} className="space-y-6">
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
        
        <div style={{ minHeight: leftColumnHeight ? `${leftColumnHeight}px` : 'auto' }}>
          {!selectedResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-lg shadow-lg p-8 flex flex-col items-center justify-between h-full"
            >
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                      scale: [1, 1.02, 1],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="relative"
                  >
                    <div className="relative inline-flex items-center justify-center">
                      <MapPin className="h-14 w-14 text-green-500 relative z-10" />
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.2, 0.4, 0.2],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 rounded-full bg-green-100"
                        style={{ 
                          width: '45px', 
                          height: '45px',
                          margin: 'auto'
                        }}
                      />
                    </div>
                  </motion.div>
                </div>

                <div className="space-y-3">
                  <motion.h3 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-semibold text-gray-800"
                  >
                    Address Information
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-gray-500 max-w-md mx-auto"
                  >
                    Discover detailed information about locations and their residents
                  </motion.p>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-2 gap-4 w-full max-w-2xl my-8"
              >
                {[
                  {
                    icon: Search,
                    title: "Address Lookup",
                    description: "Search and verify addresses",
                    bgColor: "bg-blue-50",
                    textColor: "text-blue-600",
                    borderColor: "border-blue-200",
                    iconColor: "text-blue-500"
                  },
                  {
                    icon: User,
                    title: "Resident Data",
                    description: "View current residents",
                    bgColor: "bg-purple-50",
                    textColor: "text-purple-600",
                    borderColor: "border-purple-200",
                    iconColor: "text-purple-500"
                  },
                  {
                    icon: MapPin,
                    title: "Location Info",
                    description: "Get geographic details",
                    bgColor: "bg-green-50",
                    textColor: "text-green-600",
                    borderColor: "border-green-200",
                    iconColor: "text-green-500"
                  },
                  {
                    icon: Info,
                    title: "Property Details",
                    description: "Access property information",
                    bgColor: "bg-orange-50",
                    textColor: "text-orange-600",
                    borderColor: "border-orange-200",
                    iconColor: "text-orange-500"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ 
                      scale: 1.02,
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                    className={`${item.bgColor} border ${item.borderColor} p-6 rounded-xl shadow-sm cursor-pointer`}
                  >
                    <item.icon className={`h-8 w-8 ${item.iconColor} mb-3`} />
                    <h4 className={`${item.textColor} font-medium mb-1`}>{item.title}</h4>
                    <p className={`${item.textColor} text-sm opacity-80`}>{item.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-2xl"
              >
                <div className="border-t pt-6">
                  <div className="grid grid-cols-3 gap-6">
                    {[
                      { label: "Addresses", value: "10M+", icon: Home },
                      { label: "Residents", value: "25M+", icon: Users },
                      { label: "Accuracy", value: "99.9%", icon: CheckCircle }
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.5 }}
                        className="text-center"
                      >
                        <stat.icon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-700">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-center mt-6"
                >
                  <p className="text-sm text-gray-400">
                    Click "View Info" or "Get Info" on any address to start exploring
                  </p>
                  <motion.div
                    animate={{
                      x: [0, 10, 0]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="inline-block mt-2"
                  >
                    <ChevronRight className="h-5 w-5 text-green-500" />
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {selectedResult && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              style={{ minHeight: leftColumnHeight ? `${leftColumnHeight}px` : 'auto' }}
            >
              <ReverseAddressResults
                result={selectedResult}
                onClose={() => setSelectedResult(null)}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
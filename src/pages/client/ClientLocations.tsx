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
  MousePointer,
  ChevronLeft,
  ChevronRight
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
  const [currentPage, setCurrentPage] = useState(1);
  const locationsPerPage = 5;
  const [totalCount, setTotalCount] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Toplam kayıt sayısını al
        const { count } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setTotalCount(count || 0);
        
        // İlk sayfa verilerini al
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .range(0, locationsPerPage - 1);

        if (error) throw error;

        setLocations(data || []);
        if (data && data.length > 0) {
          setSelectedLocation(data[0]);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  // Sayfa, sıralama veya filtre değiştiğinde sadece listeyi güncelle
  useEffect(() => {
    if (!user) return;

    const fetchLocationsList = async () => {
      try {
        setListLoading(true);
        const from = (currentPage - 1) * locationsPerPage;
        const to = from + locationsPerPage - 1;

        // Engagement sıralaması için özel sorgu
        if (sortField === 'engagement') {
          const { data: allData, error: allError } = await supabase
            .from('locations')
            .select('*')
            .eq('user_id', user.id);

          if (allError) throw allError;

          // Client-side sıralama
          const sortedData = (allData || []).sort((a, b) => {
            const scoreA = a.engagement_data?.total || 0;
            const scoreB = b.engagement_data?.total || 0;
            return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
          });

          // Toplam sayıyı güncelle
          setTotalCount(sortedData.length);

          // Doğru pagination aralığını hesapla
          const startIndex = (currentPage - 1) * locationsPerPage;
          const endIndex = startIndex + locationsPerPage;
          
          // Pagination uygula ve state'i güncelle
          setLocations(sortedData.slice(startIndex, endIndex));
          return;
        }

        // Diğer alanlar için normal sorgu
        let query = supabase
          .from('locations')
          .select('*')
          .eq('user_id', user.id)
          .order(sortField, { ascending: sortOrder === 'asc' })
          .range(from, to);

        if (searchTerm) {
          query = query.or(`address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%,page_url.ilike.%${searchTerm}%`);
        }

        if (filterDate) {
          query = query.gte('timestamp', filterDate).lt('timestamp', filterDate + 'T23:59:59');
        }

        const { data, error } = await query;

        if (error) throw error;
        setLocations(data || []);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setListLoading(false);
      }
    };

    fetchLocationsList();
  }, [user, currentPage, sortField, sortOrder, searchTerm, filterDate]);

  const handleSort = (field: 'timestamp' | 'address' | 'engagement') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Sıralama değiştiğinde ilk sayfaya dön
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

  const handleExport = () => {
    const csv = [
      ['Address', 'City', 'Country', 'Page URL', 'Engagement Score', 'Time Spent', 'Page Views', 'Clicks', 'Timestamp'],
      ...locations.map(location => [
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

  const totalPages = Math.ceil(totalCount / locationsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // Yeni sayfa yüklendiğinde ilk lokasyonu seç
    if (locations.length > 0) {
      setSelectedLocation(locations[0]);
    } else {
      setSelectedLocation(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Arama yapıldığında ilk sayfaya dön
  };

  const handleDateFilter = (value: string) => {
    setFilterDate(value);
    setCurrentPage(1); // Tarih filtrelendiğinde ilk sayfaya dön
  };

  // Ayrıca locations listesi güncellendiğinde de ilk lokasyonu seçmek için useEffect ekleyelim
  useEffect(() => {
    if (locations.length > 0) {
      setSelectedLocation(locations[0]);
    }
  }, [locations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => handleDateFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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
              mapContainerClassName="w-full h-[540px] rounded-lg"
              showStreetView={true}
            />
          ) : (
            <div className="flex items-center justify-center h-[540px] bg-gray-50 rounded-lg">
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
          className="bg-white rounded-lg shadow-md flex flex-col"
        >
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Location History</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {totalCount} locations found
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
          
          {/* Locations listesi */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 p-6 overflow-y-auto">
              {listLoading ? ( // Sadece liste yüklenirken loading göster
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {locations.map((location) => (
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
                              ? 'text-indigo-600'
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
              )}
            </div>

            {/* Pagination */}
            <div className="p-4 border-t">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>

                {totalPages <= 7 ? (
                  // 7 veya daha az sayfa varsa hepsini göster
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  // 7'den fazla sayfa varsa akıllı pagination göster
                  <>
                    {/* İlk sayfa */}
                    <button
                      onClick={() => handlePageChange(1)}
                      className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                        currentPage === 1
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      1
                    </button>

                    {/* Sol taraftaki üç nokta */}
                    {currentPage > 3 && <span className="px-2 text-gray-400">...</span>}

                    {/* Ortadaki sayfalar */}
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
                              ? 'bg-indigo-600 text-white font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                    {/* Sağ taraftaki üç nokta */}
                    {currentPage < totalPages - 2 && <span className="px-2 text-gray-400">...</span>}

                    {/* Son sayfa */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className={`min-w-[40px] h-10 rounded-lg transition-colors ${
                        currentPage === totalPages
                          ? 'bg-indigo-600 text-white font-medium'
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
        </motion.div>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { ReverseAddressResult } from '../types';
import { reverseAddressLookup } from '../services/api';
import { LocationMap } from '../components/LocationMap';
import { 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Briefcase,
  GraduationCap,
  Users,
  Heart,
  DollarSign,
  Target
} from 'lucide-react';

export const ReverseAddress: React.FC = () => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<ReverseAddressResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ReverseAddressResult | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchLocations = async () => {
      try {
        // Önce lokasyonları getir
        const { data: locationData, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false });

        if (locationError) throw locationError;

        // Her lokasyon için reverse lookup yap
        const enrichedLocations = await Promise.all(
          (locationData || []).map(async (location) => {
            try {
              const reverseData = await reverseAddressLookup(
                location.latitude,
                location.longitude
              );

              return {
                id: location.id,
                address: location.address,
                streetAddress: reverseData.street_address,
                city: location.city,
                country: location.country,
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: location.timestamp,
                userData: reverseData.user_data
              };
            } catch (error) {
              console.error('Error enriching location:', error);
              return null;
            }
          })
        );

        setLocations(enrichedLocations.filter(Boolean) as ReverseAddressResult[]);
        if (enrichedLocations.length > 0) {
          setSelectedLocation(enrichedLocations[0] as ReverseAddressResult);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setError('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold">Reverse Address Analizi</h1>
        <p className="text-gray-600 mt-2">
          Konum verilerine göre detaylı kullanıcı analizi
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Harita ve Konum Detayları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {selectedLocation && (
            <>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Konum Detayları</h2>
                <LocationMap
                  latitude={selectedLocation.latitude}
                  longitude={selectedLocation.longitude}
                  showStreetView={true}
                />
              </div>
            </>
          )}
        </motion.div>

        {/* Kullanıcı Bilgileri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {selectedLocation?.userData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Kullanıcı Profili</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">İsim</p>
                    <p className="font-medium">{selectedLocation.userData.name || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">E-posta</p>
                    <p className="font-medium">{selectedLocation.userData.email || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Telefon</p>
                    <p className="font-medium">{selectedLocation.userData.phone || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Meslek</p>
                    <p className="font-medium">{selectedLocation.userData.occupation || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Eğitim</p>
                    <p className="font-medium">{selectedLocation.userData.education || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Gelir Seviyesi</p>
                    <p className="font-medium">{selectedLocation.userData.income_level || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Heart className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Medeni Durum</p>
                    <p className="font-medium">{selectedLocation.userData.marital_status || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Hane Büyüklüğü</p>
                    <p className="font-medium">{selectedLocation.userData.household_size || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                {selectedLocation.userData.interests && (
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">İlgi Alanları</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedLocation.userData.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Konum Listesi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg shadow-md"
      >
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Tüm Konumlar</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedLocation?.id === location.id
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedLocation(location)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{location.address}</p>
                    <p className="text-sm text-gray-500">
                      {location.city}, {location.country}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(location.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <MapPin className={`h-5 w-5 ${
                    selectedLocation?.id === location.id
                      ? 'text-green-700'
                      : 'text-gray-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
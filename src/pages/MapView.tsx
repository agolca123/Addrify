import React, { useEffect, useState } from 'react';
import { LocationMap } from '../components/LocationMap';
import { supabase } from '../config/supabase';
import { useAuthStore } from '../store/authStore';
import { LocationData } from '../types';

export const MapView: React.FC = () => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Lokasyonlar yüklenirken hata:', error);
        return;
      }

      setLocations(data);
      if (data.length > 0) {
        setSelectedLocation(data[0]);
      }
    };

    fetchLocations();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Harita Görünümü</h2>
        {selectedLocation && (
          <LocationMap
            key={`${selectedLocation.latitude}-${selectedLocation.longitude}`}
            latitude={selectedLocation.latitude}
            longitude={selectedLocation.longitude}
            showStreetView={true}
            mapContainerClassName="w-full h-[500px] rounded-lg shadow-md mb-4"
          />
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Konum Geçmişi</h2>
        <div className="space-y-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedLocation?.id === location.id
                  ? 'bg-indigo-50 border border-indigo-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => setSelectedLocation(location)}
            >
              <p className="font-medium">{location.address}</p>
              <p className="text-sm text-gray-500">
                {new Date(location.timestamp).toLocaleString('tr-TR')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

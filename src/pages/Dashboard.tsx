import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LocationMap } from '../components/LocationMap';
import { PixelCodeGenerator } from '../components/PixelCodeGenerator';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { LocationData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    if (!user) return;

    // Initial fetch
    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching locations:', error);
        return;
      }

      // Transform snake_case to camelCase
      const transformedData = (data || []).map(location => ({
        id: location.id,
        userId: location.user_id,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        city: location.city,
        country: location.country,
        timestamp: location.timestamp,
        deviceInfo: location.device_info
      }));

      setLocations(transformedData);
    };

    fetchLocations();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('locations_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'locations',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newLocation = {
            id: payload.new.id,
            userId: payload.new.user_id,
            latitude: payload.new.latitude,
            longitude: payload.new.longitude,
            address: payload.new.address,
            city: payload.new.city,
            country: payload.new.country,
            timestamp: payload.new.timestamp,
            deviceInfo: payload.new.device_info
          };
          setLocations(current => [newLocation, ...current]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const dates = [...new Set(locations.map(loc => 
    new Date(loc.timestamp).toLocaleDateString()
  ))].sort();

  const visitCounts = dates.map(date => 
    locations.filter(loc => 
      new Date(loc.timestamp).toLocaleDateString() === date
    ).length
  );

  const chartData = {
    labels: dates,
    datasets: [{
      label: 'Daily Visits',
      data: visitCounts,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Visitor Count'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Active Locations</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`p-4 border rounded cursor-pointer transition-colors ${
                  selectedLocation?.id === location.id
                    ? 'bg-indigo-50 border-indigo-300'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedLocation(location)}
              >
                <p className="font-medium">{location.address}</p>
                <p className="text-sm text-gray-500">
                  {new Date(location.timestamp).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  Device: {JSON.stringify(location.deviceInfo)}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Visitor Statistics</h2>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {selectedLocation && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Location Details</h2>
          <div className="mb-4">
            <p className="font-medium">Address:</p>
            <p className="text-gray-700">{selectedLocation.address}</p>
            <p className="text-sm text-gray-500 mt-2">
              Coordinates: {selectedLocation.latitude}, {selectedLocation.longitude}
            </p>
          </div>
          <LocationMap
            key={`${selectedLocation.latitude}-${selectedLocation.longitude}`}
            latitude={selectedLocation.latitude}
            longitude={selectedLocation.longitude}
            showStreetView={true}
          />
        </div>
      )}

      <PixelCodeGenerator userId={user?.id || ''} />
    </div>
  );
};
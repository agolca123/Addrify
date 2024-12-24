import { useState, useRef, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { LocationData } from '../types';
import { getReverseAddressInfo } from '../services/api/trestle';

interface AutomationConfig {
  region: string;
  minEngagement: number;
  dateRange: {
    start: string;
    end: string;
  };
  processNewAddresses: boolean;
}

export const useReverseAutomation = (userId: string) => {
  const [isRunning, setIsRunning] = useState(false);
  const [pendingAddresses, setPendingAddresses] = useState<LocationData[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const configRef = useRef<AutomationConfig | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const filterAddresses = (addresses: LocationData[], config: AutomationConfig) => {
    return addresses.filter(address => {
      if (processedIds.has(address.id)) return false;

      const matchesRegion = !config.region || 
        address.city.toLowerCase().includes(config.region.toLowerCase());

      const matchesDate = (!config.dateRange.start || new Date(address.timestamp) >= new Date(config.dateRange.start)) &&
        (!config.dateRange.end || new Date(address.timestamp) <= new Date(config.dateRange.end));

      const matchesEngagement = !config.minEngagement || 
        (address.engagement_data?.total || 0) >= config.minEngagement;

      return matchesRegion && matchesDate && matchesEngagement;
    });
  };

  const processNextAddress = async () => {
    if (!configRef.current || pendingAddresses.length === 0) return;

    const address = pendingAddresses[0];
    try {
      const { data: existingResult } = await supabase
        .from('reverse_address_results')
        .select('*')
        .eq('location_id', address.id)
        .single();

      if (existingResult) {
        setProcessedIds(prev => new Set([...prev, address.id]));
        setPendingAddresses(prev => prev.slice(1));
        return;
      }

      const result = await getReverseAddressInfo(address);
      
      await supabase.from('reverse_address_results').insert([{
        location_id: address.id,
        user_id: userId,
        ...result
      }]);

      setProcessedIds(prev => new Set([...prev, address.id]));
      setPendingAddresses(prev => prev.slice(1));
    } catch (error) {
      console.error('Error processing address:', error);
    }
  };

  const startAutomation = async (config: AutomationConfig) => {
    configRef.current = config;
    setIsRunning(true);

    // Initial fetch
    const { data: locations } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId);

    if (locations) {
      setPendingAddresses(filterAddresses(locations, config));
    }

    // Start processing
    intervalRef.current = setInterval(processNextAddress, 1000);

    // Set up real-time subscription if needed
    if (config.processNewAddresses) {
      const subscription = supabase
        .channel('locations_channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'locations', filter: `user_id=eq.${userId}` },
          async (payload) => {
            const newLocation = payload.new as LocationData;
            if (filterAddresses([newLocation], config).length > 0) {
              setPendingAddresses(prev => [...prev, newLocation]);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  };

  const stopAutomation = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    configRef.current = null;
  };

  return {
    isRunning,
    pendingCount: pendingAddresses.length,
    startAutomation,
    stopAutomation
  };
};
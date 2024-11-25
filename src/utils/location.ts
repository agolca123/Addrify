import { supabase } from '../config/supabase';

export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
};

export const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<{
  fullAddress: string;
  streetAddress: string;
  city: string;
  country: string;
}> => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&language=tr&result_type=street_address|premise`
    );
    const data = await response.json();
    
    if (!data.results?.[0]) {
      throw new Error('No address found');
    }

    const result = data.results[0];
    let streetAddress = '';
    let city = '';
    let country = '';

    // Parse address components
    result.address_components.forEach((component: any) => {
      if (component.types.includes('street_number')) {
        streetAddress = component.long_name + ' ' + streetAddress;
      }
      if (component.types.includes('route')) {
        streetAddress = streetAddress + component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        city = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
      }
    });

    return {
      fullAddress: result.formatted_address,
      streetAddress: streetAddress.trim(),
      city,
      country
    };
  } catch (error) {
    console.error('Error getting address:', error);
    throw error;
  }
};

export const saveLocation = async (
  userId: string,
  latitude: number,
  longitude: number,
  address: string,
  city: string,
  country: string,
  deviceInfo: any
) => {
  try {
    const { error } = await supabase.from('locations').insert([
      {
        user_id: userId,
        latitude,
        longitude,
        address,
        city,
        country,
        device_info: deviceInfo,
        timestamp: new Date().toISOString()
      }
    ]);

    if (error) throw error;
  } catch (error) {
    console.error('Error saving location:', error);
    throw error;
  }
};
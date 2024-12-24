import { APIError } from '../../utils/errors';
import { LocationData, ReverseAddressResult } from '../../types';

const TRESTLE_API_KEY = 'jo3OkMJARR26gIU8Ebd5r8eLfwP8tWsa3gcFejUM';

export const getReverseAddressInfo = async (location: LocationData): Promise<ReverseAddressResult> => {
  try {
    // Build query string with available address data
    const queryParams = new URLSearchParams({
      street_line_1: location.address || '',
      city: location.city || '',
      state_code: location.state || 'US',
      postal_code: location.postal_code || ''
    });

    const response = await fetch(
      `https://api.trestleiq.com/3.1/location?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-api-key': TRESTLE_API_KEY
        }
      }
    );

    if (!response.ok) {
      throw new APIError('Failed to get address details', response.status.toString());
    }

    const data = await response.json();
    return transformResponse(data, location);
  } catch (error) {
    console.error('Error in getReverseAddressInfo:', error);
    throw error;
  }
};

const transformResponse = (data: any, location: LocationData): ReverseAddressResult => {
  // Tüm residents verilerini işle
  const residents = data.current_residents || [];
  
  const transformedResidents = residents.map((resident: any) => ({
    name: resident.name || '',
    age_range: resident.age_range || '',
    gender: resident.gender || '',
    link_to_address_start_date: resident.link_to_address_start_date || '',
    phones: Array.isArray(resident.phones) 
      ? resident.phones.map((p: any) => p.phone_number).join(', ') 
      : '',
    emails: Array.isArray(resident.emails) 
      ? resident.emails.join(', ') 
      : '',
    historical_addresses: Array.isArray(resident.historical_addresses) 
      ? resident.historical_addresses.map((addr: any) => 
          `${addr.street_line_1}, ${addr.city}, ${addr.state_code} ${addr.postal_code}`
        ).join('; ') 
      : '',
    associated_people: Array.isArray(resident.associated_people) 
      ? resident.associated_people.map((person: any) => person.name).join(', ') 
      : ''
  }));

  return {
    location_id: location.id,
    user_id: location.user_id,
    is_valid: data.is_valid?.toString() || 'false',
    street_line_1: data.street_line_1 || location.address || '',
    city: data.city || location.city || '',
    postal_code: data.postal_code || location.postal_code || '',
    zip4: data.zip4 || '',
    state_code: data.state_code || location.state || '',
    lat_long: data.lat_long ? `${data.lat_long.latitude},${data.lat_long.longitude}` : `${location.latitude},${location.longitude}`,
    is_active: data.is_active === null ? 'null' : data.is_active?.toString(),
    is_commercial: data.is_commercial === null ? 'null' : data.is_commercial?.toString(),
    delivery_point: data.delivery_point || '',
    current_residents: transformedResidents,
    error: data.error || '',
    warnings: Array.isArray(data.warnings) ? data.warnings.join(', ') : ''
  };
};
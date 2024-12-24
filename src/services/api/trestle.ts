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
  return {
    location_id: location.id,
    user_id: location.user_id,
    is_valid: data.is_valid?.toString() || 'false',
    street_line_1: data.street_line_1 || location.address || '',
    city: data.city || location.city || '',
    postal_code: data.postal_code || location.postal_code || '',
    zip4: data.zip4 || '',
    state_code: data.state_code || location.state || '',
    lat_long: `${location.latitude},${location.longitude}`,
    is_active: data.is_active?.toString() || 'false',
    is_commercial: data.is_commercial?.toString() || 'false',
    delivery_point: data.delivery_point || '',
    current_residents: {
      name: data.current_residents?.name || '',
      age_range: data.current_residents?.age_range || '',
      gender: data.current_residents?.gender || '',
      link_to_address_start_date: data.current_residents?.link_to_address_start_date || '',
      phones: Array.isArray(data.current_residents?.phones) ? data.current_residents.phones.join(', ') : '',
      emails: Array.isArray(data.current_residents?.emails) ? data.current_residents.emails.join(', ') : '',
      historical_addresses: Array.isArray(data.current_residents?.historical_addresses) ? data.current_residents.historical_addresses.join(', ') : '',
      associated_people: Array.isArray(data.current_residents?.associated_people) ? data.current_residents.associated_people.join(', ') : ''
    },
    error: data.error || '',
    warnings: Array.isArray(data.warnings) ? data.warnings.join(', ') : ''
  };
};
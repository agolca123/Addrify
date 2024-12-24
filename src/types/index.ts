// Add address_type to LocationData interface
export interface LocationData {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  address: string;
  street_line?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  address_type?: string;
  timestamp: string;
  device_info?: any;
  engagement_data?: {
    total: number;
    details: {
      timeSpent: number;
      timeScore: number;
      pageViews: number;
      pageViewScore: number;
      clicks: number;
      clickScore: number;
    };
  };
}

// Rest of the types remain the same...

export interface ReverseAddressResult {
  location_id: string;
  user_id: string;
  is_valid: string;
  street_line_1: string;
  city: string;
  postal_code: string;
  zip4: string;
  state_code: string;
  lat_long: string;
  is_active: string;
  is_commercial: string;
  delivery_point: string;
  current_residents: {
    name: string;
    age_range: string;
    gender: string;
    link_to_address_start_date: string;
    phones: string;
    emails: string;
    historical_addresses: string;
    associated_people: string;
  };
  error: string;
  warnings: string;
}
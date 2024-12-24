interface LocationData {
    id: string;
    user_id: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    state?: string;
    postal_code?: string;
    timestamp: string;
    page_url?: string;
    address_type?: string;
    engagement_data?: {
        total: number;
        details: {
            timeSpent: number;
            pageViews: number;
            clicks: number;
        };
    };
} 

export type { LocationData };

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
  current_residents: Array<{
    name: string;
    age_range: string;
    gender: string;
    link_to_address_start_date: string;
    phones: string;
    emails: string;
    historical_addresses: string;
    associated_people: string;
  }>;
  error: string;
  warnings: string;
} 
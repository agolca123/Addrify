// TrestleIQ API Types
export interface TrestleAPIConfig {
  apiKey: string;
  baseUrl: string;
}

export interface TrestleAPIError {
  code: string;
  message: string;
  details?: any;
}

export interface TrestleAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: TrestleAPIError;
}

export interface ReverseAddressRequest {
  latitude: number;
  longitude: number;
  include_residents?: boolean;
  include_demographics?: boolean;
}

export interface CurrentResidents {
  name: string;
  age_range: string;
  gender: string;
  link_to_address_start_date: string;
  phones: string[];
  emails: string[];
  historical_addresses: string[];
  associated_people: string[];
}

export interface ReverseAddressResponse {
  id: string;
  is_valid: boolean;
  street_line_1: string;
  city: string;
  postal_code: string;
  zip4: string;
  state_code: string;
  lat_long: string;
  is_active: boolean;
  is_commercial: boolean;
  delivery_point: string;
  current_residents?: CurrentResidents;
  error?: string;
  warnings?: string[];
}
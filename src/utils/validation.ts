import { APIError } from './errors';

interface AddressValidation {
  streetLine1: string;
  city: string;
  postalCode: string;
  stateCode: string;
}

export const validateAddress = (address: AddressValidation): void => {
  if (!address.streetLine1?.trim()) {
    throw new APIError('Street address is required');
  }

  if (!address.city?.trim()) {
    throw new APIError('City is required');
  }

  if (!address.postalCode?.trim()) {
    throw new APIError('Postal code is required');
  }

  if (!address.stateCode?.trim()) {
    throw new APIError('State code is required');
  }

  // Validate postal code format (US)
  const postalCodeRegex = /^\d{5}(-\d{4})?$/;
  if (!postalCodeRegex.test(address.postalCode)) {
    throw new APIError('Invalid postal code format');
  }

  // Validate state code format (US)
  const stateCodeRegex = /^[A-Z]{2}$/;
  if (!stateCodeRegex.test(address.stateCode)) {
    throw new APIError('Invalid state code format (should be 2 uppercase letters)');
  }
};
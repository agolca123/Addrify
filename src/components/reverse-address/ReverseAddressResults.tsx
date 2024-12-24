import React from 'react';
import { motion } from 'framer-motion';
import { LocationMap } from '../LocationMap';
import { ReverseAddressResult } from '../../types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Building,
  CheckCircle,
  Users
} from 'lucide-react';

interface ReverseAddressResultsProps {
  result: ReverseAddressResult;
  onClose: () => void;
}

export const ReverseAddressResults: React.FC<ReverseAddressResultsProps> = ({
  result,
  onClose
}) => {
  const [lat, long] = result.lat_long.split(',').map(Number);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-lg shadow-lg p-6 space-y-6 relative"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
      >
        ×
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Address Details */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Address Details</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Street Address</p>
                <p className="font-medium">{result.street_line_1}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">
                  {result.city}, {result.state_code} {result.postal_code}
                  {result.zip4 && `-${result.zip4}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    result.is_valid === 'true' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {result.is_valid === 'true' ? 'Valid' : 'Invalid'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    result.is_active === 'true'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {result.is_active === 'true' ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    result.is_commercial === 'true'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.is_commercial === 'true' ? 'Commercial' : 'Residential'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Residents */}
        <div className="space-y-4">
          <h4 className="font-medium text-lg">Current Residents</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{result.current_residents.name || 'N/A'}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {result.current_residents.age_range}
                  </span>
                  <span className="text-xs text-gray-500">
                    {result.current_residents.gender}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Phone Numbers</p>
                <p className="font-medium">{result.current_residents.phones || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email Addresses</p>
                <p className="font-medium">{result.current_residents.emails || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">At Address Since</p>
                <p className="font-medium">
                  {result.current_residents.link_to_address_start_date || 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Associated People</p>
                <p className="font-medium">
                  {result.current_residents.associated_people || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold">Address Information</h3>
      </div>

      {lat && long && (
        <LocationMap
          latitude={lat}
          longitude={long}
          showStreetView={true}
        />
      )}



      {/* Errors and Warnings */}
      {(result.error || result.warnings) && (
        <div className="mt-4 space-y-2">
          {result.error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-red-700">{result.error}</p>
            </div>
          )}
          {result.warnings && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-700">{result.warnings}</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
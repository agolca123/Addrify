import React from 'react';
import { motion } from 'framer-motion';
import { ReverseAddressResult } from '../../types';
import { LocationMap } from '../LocationMap';
import { User, MapPin, Calendar, Building, Phone, Mail } from 'lucide-react';

interface ReverseResultsProps {
  result: ReverseAddressResult;
  onClose: () => void;
}

export const ReverseResults: React.FC<ReverseResultsProps> = ({ result, onClose }) => {
  const [lat, lng] = result.lat_long.split(',').map(Number);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Address Details</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {lat && lng && (
            <LocationMap
              latitude={lat}
              longitude={lng}
              showStreetView={true}
              mapContainerClassName="w-full h-[300px] rounded-lg mb-4"
            />
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{result.street_line_1}</p>
                <p className="text-sm text-gray-500">
                  {result.city}, {result.state_code} {result.postal_code}
                  {result.zip4 && `-${result.zip4}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Property Type</p>
                <p className="font-medium">
                  {result.is_commercial === 'true' ? 'Commercial' : 'Residential'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="text-md font-medium mb-3">Current Residents</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{result.current_residents.name || 'N/A'}</p>
                  {result.current_residents.age_range && (
                    <p className="text-sm text-gray-500">
                      {result.current_residents.age_range}, {result.current_residents.gender}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Phone Numbers</p>
                  <p className="font-medium">{result.current_residents.phones || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email Addresses</p>
                  <p className="font-medium">{result.current_residents.emails || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">At Address Since</p>
                  <p className="font-medium">
                    {result.current_residents.link_to_address_start_date || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(result.error || result.warnings) && (
            <div className="space-y-2">
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
        </div>
      </div>
    </motion.div>
  );
};
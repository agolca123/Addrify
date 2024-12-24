import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ReverseAddressResult } from '../../types';
import { LocationMap } from '../LocationMap';
import { 
  User, 
  MapPin, 
  Calendar, 
  Building, 
  Phone, 
  Mail, 
  CheckCircle,
  Users,
  ChevronDown
} from 'lucide-react';

interface ReverseResultsProps {
  result: ReverseAddressResult;
  onClose: () => void;
}

export const ReverseResults: React.FC<ReverseResultsProps> = ({ result, onClose }) => {
  const [lat, lng] = result.lat_long?.split(',').map(Number) || [null, null];
  const [expandedResidents, setExpandedResidents] = useState<number[]>([]);

  const toggleResident = (index: number) => {
    setExpandedResidents(current => 
      current.includes(index) 
        ? current.filter(i => i !== index)
        : [...current, index]
    );
  };

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
        <div className="space-y-4">
          {Boolean(lat && lng) && (
            <LocationMap
              latitude={lat}
              longitude={lng}
              showStreetView={true}
              mapContainerClassName="w-full h-[300px] rounded-lg mb-4"
            />
          )}
        </div>

        <div className="space-y-4">
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
              <div className="w-full">
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Is Valid:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.is_valid === 'true'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.is_valid === 'true' ? 'Valid' : 'Invalid'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Is Active:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.is_active === 'true'
                        ? 'bg-green-100 text-green-800'
                        : result.is_active === 'false'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.is_active === 'true' 
                        ? 'Active' 
                        : result.is_active === 'false' 
                          ? 'Inactive' 
                          : 'Unknown'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Is Commercial:</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      result.is_commercial === 'true'
                        ? 'bg-blue-100 text-blue-800'
                        : result.is_commercial === 'false'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                    }`}>
                      {result.is_commercial === 'true' 
                        ? 'Commercial' 
                        : result.is_commercial === 'false'
                          ? 'Not Commercial'
                          : 'Unknown'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Delivery Point:</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {result.delivery_point || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Location Accuracy:</span>
                    <span className="px-2 py-1 text-xs rounded-full bg-teal-100 text-teal-800">
                      {result.lat_long?.includes('RoofTop') ? 'Rooftop Accuracy' : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          <h4 className="font-medium text-lg">Current Residents ({result.current_residents.length})</h4>
          {result.current_residents.length > 0 ? (
            result.current_residents.map((resident, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleResident(index)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div className="text-left">
                      <p className="font-medium">{resident.name || 'N/A'}</p>
                      <p className="text-sm text-gray-500">
                        {[resident.age_range, resident.gender].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                  </div>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedResidents.includes(index) ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedResidents.includes(index) && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3 border-t">
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Phone Numbers</p>
                            <p className="font-medium">{resident.phones || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Email Addresses</p>
                            <p className="font-medium">{resident.emails || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">At Address Since</p>
                            <p className="font-medium">
                              {resident.link_to_address_start_date || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600">Associated People</p>
                            <p className="font-medium">
                              {resident.associated_people || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No resident information available</p>
          )}
        </div>
      </div>

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
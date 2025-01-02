import React, { useState } from 'react';
import { MapPin, TrendingUp, Calendar, Eye, Search } from 'lucide-react';
import { LocationData } from '../../types';

interface AddressListProps {
  addresses: LocationData[];
  onGetInfo: (address: LocationData) => void;
  onViewInfo: (address: LocationData) => void;
  processedAddresses: Set<string>;
}

export const AddressList: React.FC<AddressListProps> = ({
  addresses,
  onGetInfo,
  onViewInfo,
  processedAddresses
}) => {
  const [loadingAddress, setLoadingAddress] = useState<string | null>(null);

  const handleGetInfo = async (address: LocationData) => {
    setLoadingAddress(address.id);
    await onGetInfo(address);
    setLoadingAddress(null);
  };

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div
          key={address.id}
          className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-700" />
                <h3 className="font-medium">{address.address}</h3>
              </div>
              
              <p className="text-sm text-gray-500">
                {address.city}, {address.country}
              </p>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(address.timestamp).toLocaleDateString()}
                </div>
                
                {address.engagement_data && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Score: {address.engagement_data.total}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              {processedAddresses.has(address.id) ? (
                <button
                  onClick={() => onViewInfo(address)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200 ease-in-out shadow-sm whitespace-nowrap w-[110px] justify-center"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Info
                </button>
              ) : (
                <button
                  onClick={() => handleGetInfo(address)}
                  disabled={loadingAddress === address.id}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200 ease-in-out shadow-sm whitespace-nowrap w-[110px] justify-center"
                >
                  {loadingAddress === address.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Get Info
                    </div>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Get Info
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  showStreetView?: boolean;
  mapContainerClassName?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  showStreetView = false,
  mapContainerClassName = "w-full h-[400px] rounded-lg shadow-md"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const [streetViewAvailable, setStreetViewAvailable] = useState(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    const initializeMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places', 'geometry'],
        language: 'tr'
      });

      try {
        await loader.load();

        if (!mapRef.current) return;

        const location = { lat: latitude, lng: longitude };
        
        // Initialize map.
        const map = new google.maps.Map(mapRef.current, {
          center: location,
          zoom: 15,
          mapTypeControl: true,
          streetViewControl: showStreetView,
          fullscreenControl: true,
          zoomControl: true
        });

        mapInstanceRef.current = map;

        // Add marker
        const marker = new google.maps.Marker({
          position: location,
          map,
          title: 'Konum'
        });

        // Get address information
        const geocoder = new google.maps.Geocoder();
        const response = await geocoder.geocode({
          location: location,
          language: 'tr'
        });

        if (response.results?.[0]) {
          const addressInfo = response.results[0];
          
          // Create info window
          const infoWindow = new google.maps.InfoWindow({
            content: `<div class="p-2">${addressInfo.formatted_address}</div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });
        }

        // Initialize Street View
        if (showStreetView && streetViewRef.current) {
          const streetViewService = new google.maps.StreetViewService();

          try {
            const streetViewResponse = await streetViewService.getPanorama({
              location: location,
              radius: 50,
              source: google.maps.StreetViewSource.OUTDOOR
            });

            if (streetViewRef.current && streetViewResponse.data) {
              const panorama = new google.maps.StreetViewPanorama(
                streetViewRef.current,
                {
                  position: streetViewResponse.data.location.latLng,
                  pov: {
                    heading: google.maps.geometry.spherical.computeHeading(
                      streetViewResponse.data.location.latLng,
                      new google.maps.LatLng(latitude, longitude)
                    ),
                    pitch: 0
                  },
                  zoom: 1
                }
              );

              // Street View'a pin marker ekleme
              const streetViewMarker = new google.maps.Marker({
                position: { lat: latitude, lng: longitude },
                map: panorama,
                title: 'Hedef Konum'
              });

              panoramaRef.current = panorama;
              map.setStreetView(panorama);
              setStreetViewAvailable(true);
            }
          } catch (error) {
            console.error('Street View yüklenirken hata:', error);
            setStreetViewAvailable(false);
          }
        }
      } catch (error) {
        console.error('Harita yüklenirken hata:', error);
      }
    };

    initializeMap();

    return () => {
      if (panoramaRef.current) {
        panoramaRef.current.setVisible(false);
        panoramaRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      setStreetViewAvailable(false);
    };
  }, [latitude, longitude, showStreetView]);

  return (
    <div className="w-full space-y-4">
      <div
        ref={mapRef}
        className={mapContainerClassName}
      />
      {showStreetView && (
        <div className="w-full">
          <div
            ref={streetViewRef}
            className={`${mapContainerClassName} ${!streetViewAvailable ? 'hidden' : ''}`}
          />
          {!streetViewAvailable && (
            <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${mapContainerClassName}`}>
              <p className="text-red-500 text-sm">
                Bu konum için Street View kullanılamıyor.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
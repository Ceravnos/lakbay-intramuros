import { useCallback, useState, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';
import { INTRAMUROS_LOCATIONS, getCategoryConfig } from '../../data/locations';

// Intramuros bounds and center
const INTRAMUROS_CENTER = {
    lat: 14.59097751580539, 
    lng: 120.97563107436508,
};

const INTRAMUROS_BOUNDS = {
    north: 14.606,
    south: 14.578,
    west: 120.963,
    east: 120.982,
};

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

const mapOptions = {
    restriction: {
        latLngBounds: INTRAMUROS_BOUNDS,
        strictBounds: false,
    },
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControl: true,
    styles: [
        {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
        },
        {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
        },
    ],
};

// IMPORTANT: libraries array must be defined outside component to prevent re-renders
const libraries = ['places', 'marker'];

const IntramurosMap = ({ 
    markers = [], 
    onMarkerClick,
    onMapClick,
    showDirections = false,
    showNumberedPins = false,
    selectedMarkerId = null,
    interactive = true,
    className = '',
    directionsResult = null,
}) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    const mapRef = useRef(null);
    const [selectedMarker, setSelectedMarker] = useState(null);

    const onLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    const handleMarkerClick = (marker) => {
        setSelectedMarker(marker);
        if (onMarkerClick) {
            onMarkerClick(marker);
        }
    };

    const handleMapClick = (e) => {
        setSelectedMarker(null);
        if (onMapClick && interactive) {
            onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
            });
        }
    };

    if (loadError) {
        return (
            <div className={`flex items-center justify-center bg-stone-100 ${className}`}>
                <div className="text-center p-8">
                    <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    <p className="text-stone-500">Failed to load map</p>
                    <p className="text-stone-400 text-sm mt-1">Please check your API key</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className={`flex items-center justify-center bg-stone-100 ${className}`}>
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-stone-400 animate-spin mx-auto mb-3" />
                    <p className="text-stone-500 text-sm">Loading map...</p>
                </div>
            </div>
        );
    }

    //marker icons

    const getMarkerIcon = (location) => {
        const category = getCategoryConfig(location.category);

        if (!category.markerIcon) return undefined;

        return {
            url: category.markerIcon,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40),
        };
    };

    return (
        <GoogleMap
            mapContainerStyle={mapContainerStyle}
            mapContainerClassName={className}
            center={INTRAMUROS_CENTER}
            zoom={16}
            options={mapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleMapClick}
        >
            {/* Render directions if available (passed from parent) */}
            {directionsResult && (
                <DirectionsRenderer
                    directions={directionsResult}
                    options={{
                        suppressMarkers: true,
                        polylineOptions: {
                            strokeColor: '#B45309',
                            strokeWeight: 4,
                            strokeOpacity: 0.8,
                        },
                    }}
                />
            )}

            {/* Render markers with sequential numbers */}
            {INTRAMUROS_LOCATIONS.map((location) => (
                <Marker
                    key={location.id}
                    position={{ lat: location.lat, lng: location.lng }}
                    icon={getMarkerIcon(location)}
                    onClick={() => handleMarkerClick(location)}
                />
            ))}
            
            {/* Info window for selected marker */}
            {selectedMarker && (
                <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                >
                    <div className="w-64">
                        {selectedMarker.image && (
                            <img
                                src={selectedMarker.image}
                                alt={selectedMarker.name}
                                className="w-full h-28 object-cover rounded-md mb-2"
                            />
                        )}

                        <h3 className="font-semibold text-stone-800 text-sm">
                            {selectedMarker.name}
                        </h3>

                        {selectedMarker.description && (
                            <p className="text-stone-500 text-xs mt-1 leading-snug">
                                {selectedMarker.description}
                            </p>
                        )}
                    </div>

                </InfoWindow>
            )}
        </GoogleMap>
    );
};

export { IntramurosMap, INTRAMUROS_CENTER, INTRAMUROS_BOUNDS };
export default IntramurosMap;

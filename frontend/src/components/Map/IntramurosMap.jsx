import { useCallback, useState, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';

// Intramuros bounds and center
const INTRAMUROS_CENTER = {
    lat: 14.5876,
    lng: 120.9726,
};

const INTRAMUROS_BOUNDS = {
    north: 14.598,
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
const libraries = ['places'];

const IntramurosMap = ({ 
    markers = [], 
    onMarkerClick,
    onMapClick,
    showDirections = false,
    selectedMarkerId = null,
    interactive = true,
    className = '',
}) => {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    const mapRef = useRef(null);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [directions, setDirections] = useState(null);

    const onLoad = useCallback((map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = useCallback(() => {
        mapRef.current = null;
    }, []);

    // Calculate directions when markers change
    useEffect(() => {
        if (!showDirections || markers.length < 2 || !isLoaded) {
            setDirections(null);
            return;
        }

        const directionsService = new window.google.maps.DirectionsService();
        
        const origin = { lat: markers[0].lat, lng: markers[0].lng };
        const destination = { lat: markers[markers.length - 1].lat, lng: markers[markers.length - 1].lng };
        const waypoints = markers.slice(1, -1).map(marker => ({
            location: { lat: marker.lat, lng: marker.lng },
            stopover: true,
        }));

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: window.google.maps.TravelMode.WALKING,
                optimizeWaypoints: false,
            },
            (result, status) => {
                if (status === 'OK') {
                    setDirections(result);
                } else {
                    console.error('Directions request failed:', status);
                    setDirections(null);
                }
            }
        );
    }, [markers, showDirections, isLoaded]);

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
            {/* Render directions if available */}
            {directions && (
                <DirectionsRenderer
                    directions={directions}
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

            {/* Render markers */}
            {markers.map((marker, index) => (
                <Marker
                    key={marker.id || marker.placeId || index}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    onClick={() => handleMarkerClick(marker)}
                    label={showDirections ? {
                        text: String(index + 1),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '12px',
                    } : undefined}
                    icon={showDirections ? {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: selectedMarkerId === marker.id ? '#B45309' : '#78716C',
                        fillOpacity: 1,
                        strokeColor: 'white',
                        strokeWeight: 2,
                    } : undefined}
                />
            ))}

            {/* Info window for selected marker */}
            {selectedMarker && (
                <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    onCloseClick={() => setSelectedMarker(null)}
                >
                    <div className="p-1 min-w-[150px]">
                        <h3 className="font-semibold text-stone-800 text-sm">
                            {selectedMarker.name}
                        </h3>
                        {selectedMarker.address && (
                            <p className="text-stone-500 text-xs mt-1">
                                {selectedMarker.address}
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

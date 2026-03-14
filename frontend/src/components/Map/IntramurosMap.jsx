import { Fragment, useCallback, useState, useRef, useEffect } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, DirectionsRenderer, OverlayView } from '@react-google-maps/api';
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
    tripStarted = false,
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

    useEffect(() => {
        if (!selectedMarkerId) {
            return;
        }

        const matchedMarker = markers.find(marker =>
            marker.id === selectedMarkerId || marker.placeId === selectedMarkerId
        );

        if (matchedMarker) {
            const locationData = INTRAMUROS_LOCATIONS.find(l =>
                l.id === matchedMarker.id || l.placeId === matchedMarker.placeId
            ) || matchedMarker;

            setSelectedMarker({ ...locationData, ...matchedMarker });
        }
    }, [markers, selectedMarkerId]);

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

    const selectedPlaceIds = new Set(
        markers.flatMap((marker) => [marker.id, marker.placeId]).filter(Boolean)
    );

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
                            strokeOpacity: 0,
                            icons: [{
                                icon: {
                                    path: 'M 0,-1 0,1',
                                    strokeColor: '#B45309',
                                    strokeOpacity: 1,
                                    scale: 3,
                                },
                                offset: '0',
                                repeat: '15px',
                            }],
                        },
                    }}
                />
            )}

            {/* Render selected markers with numbered pins */}
            {markers.map((location, index) => {
                // Get full location data for InfoWindow
                const locationData = INTRAMUROS_LOCATIONS.find(l => 
                    l.id === location.id || l.placeId === location.placeId
                ) || location;
                
                return (
                    <Fragment key={`selected-group-${location.id || location.placeId || index}`}>
                        <Marker
                            key={`selected-${location.id || location.placeId || index}`}
                            position={{ lat: location.lat, lng: location.lng }}
                            icon={showNumberedPins ? {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                fillColor: '#B45309',
                                fillOpacity: 1,
                                strokeColor: '#FFFFFF',
                                strokeWeight: 2,
                                scale: 14,
                            } : getMarkerIcon(locationData)}
                            label={showNumberedPins ? {
                                text: String(index + 1),
                                color: '#FFFFFF',
                                fontSize: '12px',
                                fontWeight: 'bold',
                            } : undefined}
                            zIndex={1000 + index}
                            onClick={() => handleMarkerClick({ ...locationData, ...location })}
                        />
                        {showNumberedPins && locationData.name && (
                            <OverlayView
                                key={`selected-label-${location.id || location.placeId || index}`}
                                position={{ lat: location.lat, lng: location.lng }}
                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                            >
                                <div
                                    className="pointer-events-none"
                                    style={{ transform: 'translate(-50%, -42px)' }}
                                >
                                    <div className="inline-flex items-center rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 shadow-sm whitespace-nowrap">
                                        {locationData.name}
                                    </div>
                                </div>
                            </OverlayView>
                        )}
                    </Fragment>
                );
            })}

            {selectedMarker && (
                <InfoWindow
                    position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                    options={{ pixelOffset: new window.google.maps.Size(0, -20) }}
                    onCloseClick={() => setSelectedMarker(null)}
                >
                    <div className="min-w-[140px]">
                        <p className="font-semibold text-stone-800 text-sm">
                            {selectedMarker.name}
                        </p>
                        {selectedMarker.address && (
                            <p className="text-stone-500 text-xs mt-1">
                                {selectedMarker.address}
                            </p>
                        )}
                    </div>
                </InfoWindow>
            )}
            
            {/* Render unselected location markers (hidden when trip starts) */}
            {!tripStarted && INTRAMUROS_LOCATIONS
                .filter(loc => !selectedPlaceIds.has(loc.id) && !selectedPlaceIds.has(loc.placeId))
                .map((location) => (
                    <Marker
                        key={`unselected-${location.id}`}
                        position={{ lat: location.lat, lng: location.lng }}
                        icon={getMarkerIcon(location)}
                        zIndex={100}
                        onClick={() => handleMarkerClick(location)}
                    />
                ))
            }
            
        </GoogleMap>
    );
};

export { IntramurosMap, INTRAMUROS_CENTER, INTRAMUROS_BOUNDS };
export default IntramurosMap;

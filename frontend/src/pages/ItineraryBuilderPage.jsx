import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { 
    MapPin, Plus, X, Navigation, Trash2, Save, GripVertical, 
    Calendar, Users, ChevronLeft, Loader2, Route, Clock, Sparkles, 
    Filter, Play, Settings, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import IntramurosMap from '../components/Map/IntramurosMap';
import { 
    INTRAMUROS_LOCATIONS, 
    LOCATION_CATEGORIES, 
    generateSmartItinerary, 
    calculateTotalTime 
} from '../data/locations';

const ItineraryBuilderPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
    const [itinerary, setItinerary] = useState({
        name: 'My Intramuros Trip',
        description: '',
        locations: [],
        preferredDate: '',
        numberOfPeople: 1,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    
    // Magic Generate uses saved preferences directly (no modal needed)
    
    // Directions state (only for authenticated users)
    const [directionsResult, setDirectionsResult] = useState(null);
    const [tripStarted, setTripStarted] = useState(false);
    const [calculatingRoute, setCalculatingRoute] = useState(false);
    
    // Personalization modal
    const [showPersonalization, setShowPersonalization] = useState(false);
    const [userPreferences, setUserPreferences] = useState({
        preferredCategories: [],
        maxLocationsPerTrip: 5,
    });
    
    // Drag and drop state
    const [draggedItem, setDraggedItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    
    // Read-only mode for ongoing tours
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [activeBooking, setActiveBooking] = useState(null);

    // Load existing itinerary or session data
    useEffect(() => {
        if (id) {
            fetchItinerary(id);
            checkIfOngoingTour(id);
        } else if (location.state?.sessionItinerary) {
            // Convert session itinerary to proper format
            const sessionLocations = location.state.sessionItinerary.map((item, index) => ({
                placeId: item.placeId || item.id,
                name: item.name,
                address: item.address || '',
                lat: item.lat,
                lng: item.lng,
                order: index,
                notes: '',
            }));
            setItinerary(prev => ({ ...prev, locations: sessionLocations }));
        }
    }, [id, location.state]);

    const fetchItinerary = async (itineraryId) => {
        setLoading(true);
        try {
            const res = await api.get(`/itineraries/${itineraryId}`);
            setItinerary(res.data);
        } catch (error) {
            toast.error('Failed to load itinerary');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const checkIfOngoingTour = async (itineraryId) => {
        try {
            const res = await api.get('/bookings/my-bookings');
            const activeBookingFound = res.data.find(
                b => {
                    const bookingItineraryId = b.itineraryId?._id || b.itineraryId;
                    return bookingItineraryId === itineraryId && (b.status === 'accepted' || b.status === 'pending');
                }
            );
            if (activeBookingFound) {
                setIsReadOnly(true);
                setActiveBooking(activeBookingFound);
            } else {
                // Reset read-only state if no active booking
                setIsReadOnly(false);
                setActiveBooking(null);
            }
        } catch (error) {
            console.error('Failed to check ongoing tour:', error);
        }
    };

    const handleSave = async () => {
        if (!itinerary.name.trim()) {
            toast.error('Please enter an itinerary name');
            return;
        }

        setSaving(true);
        try {
            if (id) {
                await api.put(`/itineraries/${id}`, itinerary);
                toast.success('Itinerary updated!');
            } else {
                const res = await api.post('/itineraries', itinerary);
                toast.success('Itinerary saved!');
                navigate(`/itinerary/${res.data._id}`, { replace: true });
            }
            // Clear session storage after saving
            sessionStorage.removeItem('lakbay_session_itinerary');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save itinerary');
        } finally {
            setSaving(false);
        }
    };

    const addLocation = useCallback((landmark) => {
        const exists = itinerary.locations.find(loc => loc.placeId === landmark.placeId);
        if (exists) {
            toast.error('Location already added');
            return;
        }

        const newLocation = {
            placeId: landmark.placeId,
            name: landmark.name,
            address: landmark.address || '',
            lat: landmark.lat,
            lng: landmark.lng,
            order: itinerary.locations.length,
            notes: '',
        };

        setItinerary(prev => ({
            ...prev,
            locations: [...prev.locations, newLocation],
        }));
    }, [itinerary.locations]);

    const removeLocation = useCallback((placeId) => {
        setItinerary(prev => ({
            ...prev,
            locations: prev.locations
                .filter(loc => loc.placeId !== placeId)
                .map((loc, index) => ({ ...loc, order: index })),
        }));
    }, []);

    const updateLocationNotes = useCallback((placeId, notes) => {
        setItinerary(prev => ({
            ...prev,
            locations: prev.locations.map(loc =>
                loc.placeId === placeId ? { ...loc, notes } : loc
            ),
        }));
    }, []);

    // Drag and drop handlers
    const handleDragStart = (e, index) => {
        setDraggedItem(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedItem === null) return;
        if (index !== dragOverItem) {
            setDragOverItem(index);
        }
    };

    const handleDragEnd = () => {
        if (draggedItem === null || dragOverItem === null || draggedItem === dragOverItem) {
            setDraggedItem(null);
            setDragOverItem(null);
            return;
        }

        // Reorder locations
        const sortedLocations = [...itinerary.locations].sort((a, b) => a.order - b.order);
        const [removed] = sortedLocations.splice(draggedItem, 1);
        sortedLocations.splice(dragOverItem, 0, removed);

        // Update order values
        const reorderedLocations = sortedLocations.map((loc, idx) => ({
            ...loc,
            order: idx,
        }));

        setItinerary(prev => ({
            ...prev,
            locations: reorderedLocations,
        }));

        setDraggedItem(null);
        setDragOverItem(null);
    };

    // Filter locations by search and category
    const filteredLandmarks = INTRAMUROS_LOCATIONS.filter(landmark => {
        const matchesSearch = landmark.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || landmark.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Load user preferences on mount (for authenticated users)
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserPreferences();
        }
    }, [isAuthenticated]);

    const fetchUserPreferences = async () => {
        try {
            const res = await api.get('/users/personalization');
            setUserPreferences(res.data);
        } catch {
            console.log('Could not fetch preferences');
        }
    };

    const saveUserPreferences = async () => {
        try {
            await api.put('/users/personalization', userPreferences);
            toast.success('Preferences saved!');
            setShowPersonalization(false);
        } catch (error) {
            toast.error('Failed to save preferences');
        }
    };

    // Magic Generate - Direct generation using saved preferences
    const handleMagicGenerate = () => {
        // Use saved preferences if available, otherwise use defaults
        const categoryToUse = userPreferences.preferredCategories?.length > 0 
            ? userPreferences.preferredCategories[0] 
            : 'all';
        const countToUse = userPreferences.maxLocationsPerTrip || 5;
        
        const generated = generateSmartItinerary(categoryToUse, countToUse);
        setItinerary(prev => ({
            ...prev,
            locations: generated.map((loc, index) => ({
                placeId: loc.placeId,
                name: loc.name,
                address: loc.address,
                lat: loc.lat,
                lng: loc.lng,
                order: index,
                notes: '',
                category: loc.category,
                estimatedTime: loc.estimatedTime,
            })),
        }));
        // Clear any existing route when generating new itinerary
        setDirectionsResult(null);
        setTripStarted(false);
        toast.success(`Generated ${generated.length} stops!`);
    };

    // Start Trip - Calculate directions (authenticated only)
    const handleStartTrip = useCallback(async () => {
        if (!isAuthenticated) {
            toast.error('Please login to see routes');
            return;
        }
        
        if (itinerary.locations.length < 2) {
            toast.error('Add at least 2 locations to start trip');
            return;
        }

        setCalculatingRoute(true);
        
        try {
            const directionsService = new window.google.maps.DirectionsService();
            const sortedLocations = [...itinerary.locations].sort((a, b) => a.order - b.order);
            
            const origin = { lat: sortedLocations[0].lat, lng: sortedLocations[0].lng };
            const destination = { lat: sortedLocations[sortedLocations.length - 1].lat, lng: sortedLocations[sortedLocations.length - 1].lng };
            const waypoints = sortedLocations.slice(1, -1).map(loc => ({
                location: { lat: loc.lat, lng: loc.lng },
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
                        setDirectionsResult(result);
                        setTripStarted(true);
                        toast.success('Route calculated!');
                    } else {
                        toast.error('Could not calculate route');
                    }
                    setCalculatingRoute(false);
                }
            );
        } catch (error) {
            toast.error('Failed to calculate route');
            setCalculatingRoute(false);
        }
    }, [isAuthenticated, itinerary.locations]);

    // Clear route when locations change
    useEffect(() => {
        if (tripStarted) {
            setDirectionsResult(null);
            setTripStarted(false);
        }
    }, [itinerary.locations.length]);

    // Calculate total estimated time
    const totalTime = calculateTotalTime(itinerary.locations);

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-73px)]">
                    <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            
            {/* Read-only Banner for Booked/Ongoing Tours */}
            {isReadOnly && activeBooking && (
                <div className="bg-sage-100 border-b border-sage-200 px-4 py-3">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-sage-200 rounded-full flex items-center justify-center">
                                <Lock className="w-4 h-4 text-sage-700" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-sage-800">
                                    {activeBooking.status === 'accepted' ? 'Tour in Progress' : 'Booking Pending'}
                                </p>
                                <p className="text-xs text-sage-600">
                                    {activeBooking.status === 'accepted'
                                        ? `This itinerary is currently being used for an active tour with ${activeBooking.guideId?.fullName || 'your guide'}`
                                        : `This itinerary has a pending booking request with ${activeBooking.guideId?.fullName || 'a guide'}`
                                    }
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-sage-200 text-sage-700 text-xs font-medium rounded-full">
                            View Only
                        </span>
                    </div>
                </div>
            )}

            {/* Main Content - Two Column Layout (stacked on mobile) */}
            <div className="flex-1 flex flex-col lg:flex-row">
                {/* Left - Map */}
                <div className="flex-1 relative bg-stone-100 min-h-[50vh] lg:min-h-0">
                    {/* Google Map */}
                    <IntramurosMap
                        markers={itinerary.locations
                            .sort((a, b) => a.order - b.order)
                            .map(loc => ({
                                id: loc.placeId,
                                placeId: loc.placeId,
                                name: loc.name,
                                lat: loc.lat,
                                lng: loc.lng,
                                address: loc.address,
                            }))}
                        showNumberedPins={itinerary.locations.length > 0}
                        directionsResult={directionsResult}
                        className="absolute inset-0"
                    />

                    {/* Route Preview Overlay */}
                    {itinerary.locations.length > 0 && (
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-stone-200 p-3 z-10">
                            <div className="flex items-center gap-2 text-sm text-stone-600">
                                <Route className="w-4 h-4 text-sage-600" />
                                <span>{itinerary.locations.length} stops</span>
                                <span className="text-stone-400">•</span>
                                <Clock className="w-4 h-4 text-stone-400" />
                                <span>~{Math.round(totalTime / 60 * 10) / 10}h</span>
                            </div>
                        </div>
                    )}

                    {/* Search & Add Locations - Hidden in read-only mode */}
                    {!isReadOnly && (
                    <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-10">
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-stone-200 overflow-hidden">
                            {/* Smart Generate Button */}
                            <div className="p-3 border-b border-stone-200 bg-gradient-to-r from-terracotta-50 to-sand-50">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleMagicGenerate}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-terracotta-600 to-terracotta-500 hover:from-terracotta-700 hover:to-terracotta-600 text-white font-medium rounded-lg transition-all shadow-sm"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Auto-suggest
                                    </button>
                                    {/* Preferences Button - next to Magic Generate */}
                                    {isAuthenticated && (
                                        <button
                                            onClick={() => setShowPersonalization(true)}
                                            className="p-2.5 rounded-lg border bg-white border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
                                            title="Preferences"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* Search Input */}
                            <div className="p-3 border-b border-stone-200">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search landmarks..."
                                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500 focus:border-transparent"
                                />
                            </div>
                            <div className="max-h-40 overflow-y-auto p-2">
                                {filteredLandmarks.map((landmark) => {
                                    const isAdded = itinerary.locations.find(loc => loc.placeId === landmark.placeId);
                                    return (
                                        <button
                                            key={landmark.id}
                                            onClick={() => !isAdded && addLocation(landmark)}
                                            disabled={isAdded}
                                            className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                                                isAdded
                                                    ? 'bg-sage-50 cursor-default'
                                                    : 'hover:bg-stone-50'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                isAdded ? 'bg-sage-200' : 'bg-terracotta-100'
                                            }`}>
                                                <MapPin className={`w-4 h-4 ${
                                                    isAdded ? 'text-sage-600' : 'text-terracotta-600'
                                                }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-stone-800 text-sm truncate">
                                                    {landmark.name}
                                                </p>
                                                <p className="text-xs text-stone-500 truncate">
                                                    {landmark.address}
                                                </p>
                                            </div>
                                            {isAdded ? (
                                                <span className="text-xs text-sage-600 font-medium">Added</span>
                                            ) : (
                                                <Plus className="w-4 h-4 text-stone-400" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    )}
                </div>

                {/* Right - Itinerary Panel (full width on mobile, fixed width on desktop) */}
                <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-stone-200 flex flex-col bg-white">
                    {/* Sticky Header - Itinerary Name, Actions, Back & Save */}
                    <div className="p-4 border-b border-stone-200 bg-white sticky top-0 z-10">
                        {/* Back button and Save */}
                        <div className="flex items-center justify-between mb-3">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                            {!isReadOnly && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )}
                                Save
                            </button>
                            )}
                        </div>
                        
                        {/* Itinerary Name Input */}
                        <input
                            type="text"
                            value={itinerary.name}
                            onChange={(e) => !isReadOnly && setItinerary(prev => ({ ...prev, name: e.target.value }))}
                            readOnly={isReadOnly}
                            className={`w-full text-lg font-serif font-semibold text-stone-800 bg-transparent border-b border-transparent ${isReadOnly ? '' : 'hover:border-stone-200 focus:border-terracotta-500'} focus:outline-none transition-colors mb-2 pb-1`}
                            placeholder="Name your itinerary..."
                        />
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {/* Start Trip Button */}
                            {isAuthenticated ? (
                                <button
                                    onClick={handleStartTrip}
                                    disabled={calculatingRoute || itinerary.locations.length < 2}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all ${
                                        tripStarted
                                            ? 'bg-sage-100 text-sage-700 border border-sage-300'
                                            : 'bg-sage-600 hover:bg-sage-700 text-white'
                                    }`}
                                >
                                    {calculatingRoute ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                    {tripStarted ? 'Route Active' : 'Start Trip'}
                                </button>
                            ) : (
                                <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-stone-100 text-stone-500 rounded-lg text-sm">
                                    <Lock className="w-4 h-4" />
                                    Login to see routes
                                </div>
                            )}
                        </div>
                        
                        {/* Trip Stats */}
                        <div className="flex items-center gap-3 mt-3 text-xs text-stone-500">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {itinerary.locations.length} stops
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                ~{Math.round(totalTime / 60 * 10) / 10}h
                            </span>
                            {tripStarted && (
                                <span className="flex items-center gap-1 text-sage-600">
                                    <Route className="w-3.5 h-3.5" />
                                    Route ready
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Trip Details - Collapsible */}
                    <div className="p-4 border-b border-stone-200 space-y-3">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-stone-500 mb-1">
                                    Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <input
                                        type="date"
                                        value={itinerary.preferredDate ? itinerary.preferredDate.split('T')[0] : ''}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => !isReadOnly && setItinerary(prev => ({ ...prev, preferredDate: e.target.value }))}
                                        disabled={isReadOnly}
                                        className={`w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-medium text-stone-500 mb-1">
                                    People
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <input
                                        type="number"
                                        min="1"
                                        max="15"
                                        value={itinerary.numberOfPeople}
                                        onChange={(e) => !isReadOnly && setItinerary(prev => ({ ...prev, numberOfPeople: Math.min(15, Math.max(1, parseInt(e.target.value) || 1)) }))}
                                        disabled={isReadOnly}
                                        className={`w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stops List */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-4">
                            <h3 className="font-medium text-stone-800 mb-3">
                                Stops ({itinerary.locations.length})
                            </h3>
                            
                            {itinerary.locations.length === 0 ? (
                                <div className="text-center py-12">
                                    <Navigation className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500 text-sm mb-1">No stops added yet</p>
                                    <p className="text-stone-400 text-xs">
                                        Search and add landmarks from the map
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {itinerary.locations
                                        .sort((a, b) => a.order - b.order)
                                        .map((location, index) => (
                                            <div
                                                key={location.placeId}
                                                draggable={!isReadOnly}
                                                onDragStart={(e) => !isReadOnly && handleDragStart(e, index)}
                                                onDragOver={(e) => !isReadOnly && handleDragOver(e, index)}
                                                onDragEnd={!isReadOnly ? handleDragEnd : undefined}
                                                className={`bg-stone-50 rounded-xl border overflow-hidden transition-all ${
                                                    draggedItem === index 
                                                        ? 'opacity-50 border-terracotta-400 scale-[0.98]' 
                                                        : dragOverItem === index 
                                                            ? 'border-terracotta-500 border-2 bg-terracotta-50' 
                                                            : 'border-stone-200'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3 p-3">
                                                    <div className="flex items-center gap-2">
                                                        {!isReadOnly && (
                                                        <GripVertical className="w-4 h-4 text-stone-400 cursor-grab active:cursor-grabbing hover:text-stone-600" />
                                                        )}
                                                        <div className="w-7 h-7 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                                            {index + 1}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-stone-800 text-sm">
                                                            {location.name}
                                                        </p>
                                                        <p className="text-xs text-stone-500 truncate">
                                                            {location.address}
                                                        </p>
                                                    </div>
                                                    {!isReadOnly && (
                                                    <button
                                                        onClick={() => removeLocation(location.placeId)}
                                                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    )}
                                                </div>
                                                <div className="px-3 pb-3">
                                                    <input
                                                        type="text"
                                                        value={location.notes}
                                                        onChange={(e) => !isReadOnly && updateLocationNotes(location.placeId, e.target.value)}
                                                        readOnly={isReadOnly}
                                                        placeholder={isReadOnly ? '' : 'Add notes...'}
                                                        className={`w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-terracotta-500 ${isReadOnly ? 'cursor-default' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Book Guide Button - Hidden in read-only mode */}
                    {itinerary.locations.length > 0 && id && !isReadOnly && (
                        <div className="p-4 border-t border-stone-200">
                            <button
                                onClick={() => {
                                    // Validate date is set before booking
                                    if (!itinerary.preferredDate) {
                                        toast.error('Please select a date before booking a guide');
                                        return;
                                    }
                                    // Navigate with date and numberOfPeople pre-filled
                                    navigate(`/book/${id}`, {
                                        state: {
                                            preferredDate: itinerary.preferredDate,
                                            numberOfPeople: itinerary.numberOfPeople || 1
                                        }
                                    });
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                Book a Guide
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Personalization Modal */}
            {showPersonalization && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="p-6 border-b border-stone-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-sage-100 rounded-full flex items-center justify-center">
                                        <Settings className="w-5 h-5 text-sage-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-serif font-semibold text-stone-800">Personalization</h2>
                                        <p className="text-xs text-stone-500">Customize your Magic Generate</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPersonalization(false)}
                                    className="p-2 text-stone-400 hover:text-stone-600 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="font-medium text-stone-800 mb-2">Preferred Categories</h3>
                                <p className="text-sm text-stone-500 mb-3">Select your interests for smarter suggestions</p>
                                <div className="flex flex-wrap gap-2">
                                    {LOCATION_CATEGORIES.filter(c => c.id !== 'all').map((cat) => (
                                        <button
                                            key={cat.id}
                                            onClick={() => {
                                                const current = userPreferences.preferredCategories || [];
                                                const updated = current.includes(cat.id)
                                                    ? current.filter(c => c !== cat.id)
                                                    : [...current, cat.id];
                                                setUserPreferences(prev => ({ ...prev, preferredCategories: updated }));
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                                userPreferences.preferredCategories?.includes(cat.id)
                                                    ? 'bg-sage-100 text-sage-700 border-2 border-sage-300'
                                                    : 'bg-stone-100 text-stone-600 border-2 border-transparent'
                                            }`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-medium text-stone-800 mb-2">Default Location Count</h3>
                                <p className="text-sm text-stone-500 mb-3">Preferred number of stops per trip</p>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={userPreferences.maxLocationsPerTrip || 5}
                                        onChange={(e) => setUserPreferences(prev => ({ ...prev, maxLocationsPerTrip: parseInt(e.target.value) }))}
                                        className="flex-1 accent-sage-600"
                                    />
                                    <span className="font-semibold text-sage-600 w-8 text-center">
                                        {userPreferences.maxLocationsPerTrip || 5}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-stone-200 flex gap-3">
                            <button
                                onClick={() => setShowPersonalization(false)}
                                className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveUserPreferences}
                                className="flex-1 px-4 py-3 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ItineraryBuilderPage;

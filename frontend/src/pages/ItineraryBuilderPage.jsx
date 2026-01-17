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
    
    // Magic Generate modal state
    const [showMagicModal, setShowMagicModal] = useState(false);
    const [magicStep, setMagicStep] = useState(1);
    const [magicCount, setMagicCount] = useState(5);
    const [magicCategory, setMagicCategory] = useState('all');
    
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

    // Load existing itinerary or session data
    useEffect(() => {
        if (id) {
            fetchItinerary(id);
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
            setMagicCount(res.data.maxLocationsPerTrip || 5);
            if (res.data.preferredCategories?.length > 0) {
                setMagicCategory(res.data.preferredCategories[0]);
            }
        } catch (error) {
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

    // Magic Generate - Step by step flow
    const openMagicModal = () => {
        setMagicStep(1);
        setShowMagicModal(true);
    };

    const handleMagicGenerate = () => {
        const generated = generateSmartItinerary(magicCategory, magicCount);
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
        setShowMagicModal(false);
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
            
            {/* Sub Header */}
            <div className="border-b border-stone-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <input
                                type="text"
                                value={itinerary.name}
                                onChange={(e) => setItinerary(prev => ({ ...prev, name: e.target.value }))}
                                className="text-lg font-serif font-semibold text-stone-800 bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                                placeholder="Itinerary Name"
                            />
                            <p className="text-xs text-stone-500">
                                {itinerary.locations.length} {itinerary.locations.length === 1 ? 'stop' : 'stops'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save
                    </button>
                </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="flex-1 flex">
                {/* Left - Map */}
                <div className="flex-1 relative bg-stone-100">
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

                    {/* Search & Add Locations */}
                    <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 z-10">
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-stone-200 overflow-hidden">
                            {/* Smart Generate Button */}
                            <div className="p-3 border-b border-stone-200 bg-gradient-to-r from-terracotta-50 to-sand-50">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={openMagicModal}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-terracotta-600 to-terracotta-500 hover:from-terracotta-700 hover:to-terracotta-600 text-white font-medium rounded-lg transition-all shadow-sm"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        Magic Generate
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                                            className={`p-2.5 rounded-lg border transition-colors ${
                                                selectedCategory !== 'all' 
                                                    ? 'bg-sage-100 border-sage-300 text-sage-700' 
                                                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                            }`}
                                        >
                                            <Filter className="w-4 h-4" />
                                        </button>
                                        {showCategoryFilter && (
                                            <div className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-20">
                                                {LOCATION_CATEGORIES.map((cat) => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => {
                                                            setSelectedCategory(cat.id);
                                                            setShowCategoryFilter(false);
                                                        }}
                                                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                                            selectedCategory === cat.id
                                                                ? 'bg-terracotta-50 text-terracotta-700'
                                                                : 'hover:bg-stone-50 text-stone-700'
                                                        }`}
                                                    >
                                                        {cat.name}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {selectedCategory !== 'all' && (
                                    <p className="text-xs text-stone-500 mt-2 text-center">
                                        Filtering: {LOCATION_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                                    </p>
                                )}
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
                </div>

                {/* Right - Itinerary Panel */}
                <div className="w-96 border-l border-stone-200 flex flex-col bg-white">
                    {/* Sticky Header - Itinerary Name, Actions */}
                    <div className="p-4 border-b border-stone-200 bg-white sticky top-0 z-10">
                        {/* Itinerary Name Input */}
                        <input
                            type="text"
                            value={itinerary.name}
                            onChange={(e) => setItinerary(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full text-lg font-serif font-semibold text-stone-800 bg-transparent border-none focus:outline-none focus:ring-0 mb-2"
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
                            
                            {/* Manage Personalization */}
                            {isAuthenticated && (
                                <button
                                    onClick={() => setShowPersonalization(true)}
                                    className="p-2.5 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                                    title="Manage Personalization"
                                >
                                    <Settings className="w-5 h-5" />
                                </button>
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
                                    Preferred Date
                                </label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                    <input
                                        type="date"
                                        value={itinerary.preferredDate ? itinerary.preferredDate.split('T')[0] : ''}
                                        onChange={(e) => setItinerary(prev => ({ ...prev, preferredDate: e.target.value }))}
                                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500"
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
                                        value={itinerary.numberOfPeople}
                                        onChange={(e) => setItinerary(prev => ({ ...prev, numberOfPeople: parseInt(e.target.value) || 1 }))}
                                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500"
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
                                                className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden"
                                            >
                                                <div className="flex items-start gap-3 p-3">
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="w-4 h-4 text-stone-300 cursor-grab" />
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
                                                    <button
                                                        onClick={() => removeLocation(location.placeId)}
                                                        className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div className="px-3 pb-3">
                                                    <input
                                                        type="text"
                                                        value={location.notes}
                                                        onChange={(e) => updateLocationNotes(location.placeId, e.target.value)}
                                                        placeholder="Add notes..."
                                                        className="w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-terracotta-500"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Book Guide Button */}
                    {itinerary.locations.length > 0 && id && (
                        <div className="p-4 border-t border-stone-200">
                            <button
                                onClick={() => navigate(`/book/${id}`)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <Users className="w-4 h-4" />
                                Book a Guide
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Magic Generate Modal */}
            {showMagicModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                        <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-terracotta-50 to-sand-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-terracotta-100 rounded-full flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-terracotta-600" />
                                    </div>
                                    <div>
                                        <h2 className="font-serif font-semibold text-stone-800">Magic Generate</h2>
                                        <p className="text-xs text-stone-500">Step {magicStep} of 2</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowMagicModal(false)}
                                    className="p-2 text-stone-400 hover:text-stone-600 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            {magicStep === 1 ? (
                                <>
                                    <h3 className="font-medium text-stone-800 mb-2">How many locations?</h3>
                                    <p className="text-sm text-stone-500 mb-4">Choose the number of stops for your itinerary</p>
                                    
                                    <div className="space-y-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={magicCount}
                                            onChange={(e) => setMagicCount(parseInt(e.target.value))}
                                            className="w-full accent-terracotta-600"
                                        />
                                        <div className="flex justify-between text-sm text-stone-500">
                                            <span>1</span>
                                            <span className="font-semibold text-terracotta-600 text-lg">{magicCount}</span>
                                            <span>10</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={() => setMagicStep(2)}
                                        className="w-full mt-6 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-lg transition-colors"
                                    >
                                        Next: Choose Category
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h3 className="font-medium text-stone-800 mb-2">Category Preference</h3>
                                    <p className="text-sm text-stone-500 mb-4">What type of places interest you?</p>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        {LOCATION_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setMagicCategory(cat.id)}
                                                className={`p-3 rounded-lg border-2 text-left transition-all ${
                                                    magicCategory === cat.id
                                                        ? 'border-terracotta-500 bg-terracotta-50'
                                                        : 'border-stone-200 hover:border-stone-300'
                                                }`}
                                            >
                                                <p className="font-medium text-stone-800 text-sm">{cat.name}</p>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={() => setMagicStep(1)}
                                            className="flex-1 px-4 py-3 border border-stone-300 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleMagicGenerate}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-lg transition-colors"
                                        >
                                            <Sparkles className="w-4 h-4" />
                                            Generate
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

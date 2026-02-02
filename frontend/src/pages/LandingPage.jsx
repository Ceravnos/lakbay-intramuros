import { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { MapPin, Plus, X, Navigation, LogIn, ChevronRight, Trash2, Save, Sparkles, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import IntramurosMap from '../components/Map/IntramurosMap';
import { 
    INTRAMUROS_LOCATIONS, 
    LOCATION_CATEGORIES, 
    generateSmartItinerary,
    calculateTotalTime 
} from '../data/locations';

const LandingPage = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [sessionItinerary, setSessionItinerary] = useState([]);
    const [showPanel, setShowPanel] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);

    // Load session itinerary from sessionStorage
    useEffect(() => {
        const saved = sessionStorage.getItem('lakbay_session_itinerary');
        if (saved) {
            setSessionItinerary(JSON.parse(saved));
            setShowPanel(true);
        }
    }, []);

    // Save to sessionStorage whenever itinerary changes
    useEffect(() => {
        if (sessionItinerary.length > 0) {
            sessionStorage.setItem('lakbay_session_itinerary', JSON.stringify(sessionItinerary));
        } else {
            sessionStorage.removeItem('lakbay_session_itinerary');
        }
    }, [sessionItinerary]);

    const addToItinerary = useCallback((landmark) => {
        if (!sessionItinerary.find(item => item.id === landmark.id)) {
            setSessionItinerary(prev => [...prev, { ...landmark, order: prev.length }]);
            setShowPanel(true);
        }
    }, [sessionItinerary]);

    // Smart Generate for landing page
    const handleSmartGenerate = useCallback(() => {
        const generated = generateSmartItinerary(selectedCategory, 5);
        setSessionItinerary(generated);
        setShowPanel(true);
    }, [selectedCategory]);

    // Filter locations by category
    const filteredLocations = selectedCategory === 'all' 
        ? INTRAMUROS_LOCATIONS 
        : INTRAMUROS_LOCATIONS.filter(loc => loc.category === selectedCategory);

    // Calculate total time
    const totalTime = calculateTotalTime(sessionItinerary);

    const removeFromItinerary = useCallback((id) => {
        setSessionItinerary(prev => prev.filter(item => item.id !== id));
    }, []);

    const clearItinerary = useCallback(() => {
        setSessionItinerary([]);
        sessionStorage.removeItem('lakbay_session_itinerary');
    }, []);

    const handleSaveOrBook = () => {
        if (isAuthenticated) {
            // Transfer session itinerary to the builder
            navigate('/itinerary', { state: { sessionItinerary } });
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-stone-200 z-20">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-6 h-6 text-terracotta-600" />
                        <span className="text-xl font-serif font-semibold text-stone-800">
                            Lakbay Intramuros
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                Go to Dashboard
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="px-4 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    className="px-4 py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex relative">
                {/* Map Container */}
                <div className="flex-1 relative bg-stone-100">
                    {/* Google Map - No directions for guests (unauthenticated) */}
                    <IntramurosMap
                        markers={sessionItinerary.length > 0 
                            ? sessionItinerary.map(l => ({
                                id: l.id,
                                name: l.name,
                                lat: l.lat,
                                lng: l.lng,
                                address: l.address,
                                description: l.description,
                                image: l.image,
                            }))
                            : filteredLocations.map(l => ({
                                id: l.id,
                                name: l.name,
                                lat: l.lat,
                                lng: l.lng,
                                address: l.address,
                                description: l.description,
                                image: l.image,
                            }))
                        }
                        onMarkerClick={(marker) => {
                            const landmark = INTRAMUROS_LOCATIONS.find(l => l.id === marker.id);
                            if (landmark) addToItinerary(landmark);
                        }}
                        showNumberedPins={sessionItinerary.length > 0}
                        className="absolute inset-0"
                    />

                    {/* Landmark Cards Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-10">
                        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-stone-200 overflow-hidden">
                            {/* Smart Generate Section */}
                            <div className="p-3 border-b border-stone-200 bg-gradient-to-r from-terracotta-50 to-sand-50">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleSmartGenerate}
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
                                        Showing: {LOCATION_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                                    </p>
                                )}
                            </div>
                            
                            {/* Landmarks List */}
                            <div className="p-3">
                                <h3 className="font-serif font-semibold text-stone-800 mb-2 text-sm">
                                    Explore Landmarks ({filteredLocations.length})
                                </h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {filteredLocations.map((landmark) => {
                                        const isAdded = sessionItinerary.find(item => item.id === landmark.id);
                                        return (
                                            <div
                                                key={landmark.id}
                                                className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                                                    isAdded 
                                                        ? 'bg-sage-50 border-sage-200' 
                                                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-stone-800 text-sm truncate">
                                                        {landmark.name}
                                                    </p>
                                                    <p className="text-xs text-stone-500 truncate">
                                                        {landmark.description}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => isAdded ? removeFromItinerary(landmark.id) : addToItinerary(landmark)}
                                                    className={`ml-2 p-1.5 rounded-lg transition-colors ${
                                                        isAdded
                                                            ? 'bg-sage-200 text-sage-700 hover:bg-sage-300'
                                                            : 'bg-terracotta-100 text-terracotta-600 hover:bg-terracotta-200'
                                                    }`}
                                                >
                                                    {isAdded ? (
                                                        <X className="w-4 h-4" />
                                                    ) : (
                                                        <Plus className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Side Panel - Session Itinerary */}
                {showPanel && (
                    <div className="w-80 bg-white border-l border-stone-200 flex flex-col">
                        <div className="p-4 border-b border-stone-200">
                            <div className="flex items-center justify-between mb-1">
                                <h2 className="font-serif font-semibold text-stone-800">
                                    Your Itinerary
                                </h2>
                                <button
                                    onClick={() => setShowPanel(false)}
                                    className="p-1 text-stone-400 hover:text-stone-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-xs text-stone-500">
                                {sessionItinerary.length} {sessionItinerary.length === 1 ? 'stop' : 'stops'} • ~{Math.round(totalTime / 60 * 10) / 10}h
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {sessionItinerary.length === 0 ? (
                                <div className="text-center py-8">
                                    <Navigation className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500 text-sm">
                                        Add landmarks to start planning
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sessionItinerary.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 p-3 bg-stone-50 rounded-lg border border-stone-200"
                                        >
                                            <div className="w-6 h-6 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-stone-800 text-sm">
                                                    {item.name}
                                                </p>
                                                <p className="text-xs text-stone-500 line-clamp-2">
                                                    {item.description}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFromItinerary(item.id)}
                                                className="p-1 text-stone-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {sessionItinerary.length > 0 && (
                            <div className="p-4 border-t border-stone-200 space-y-2">
                                {/* Login to see routes tooltip for guests */}
                                {!isAuthenticated && sessionItinerary.length > 1 && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-stone-100 rounded-lg text-xs text-stone-500 mb-2">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span>Login to see routes & distances</span>
                                    </div>
                                )}
                                <button
                                    onClick={handleSaveOrBook}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    {isAuthenticated ? (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Save & Continue
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-4 h-4" />
                                            Sign in to Save
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={clearItinerary}
                                    className="w-full px-4 py-2 text-stone-600 hover:text-stone-800 text-sm font-medium transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Toggle Panel Button (when closed) */}
                {!showPanel && sessionItinerary.length > 0 && (
                    <button
                        onClick={() => setShowPanel(true)}
                        className="absolute right-4 top-4 flex items-center gap-2 px-4 py-2 bg-white shadow-lg rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors"
                    >
                        <Navigation className="w-4 h-4 text-terracotta-600" />
                        <span className="text-sm font-medium text-stone-700">
                            {sessionItinerary.length} stops
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default LandingPage;

import { useState, useCallback, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { MapPin, Plus, X, Navigation, LogIn, ChevronRight, Trash2, Save,
  Sparkles, Filter, ChevronDown, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import IntramurosMap from '../components/Map/IntramurosMap';
import Navbar from '../components/Navbar';
import {
  INTRAMUROS_LOCATIONS, 
  LOCATION_CATEGORIES, 
  generateSmartItinerary,
  calculateTotalTime 
} from '../data/locations';
import bg1 from './assets/login-bg-1.jpg';
import bg2 from './assets/login-bg-2.jpg';
import bg3 from './assets/login-bg-3.jpg';

const backgrounds = [bg1, bg2, bg3];

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [sessionItinerary, setSessionItinerary] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showMobileItinerary, setShowMobileItinerary] = useState(false);
  const mapSectionRef = useRef(null);

  // Ken Burns slideshow
  const [bgIndex, setBgIndex] = useState(
    Math.floor(Math.random() * backgrounds.length)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  const scrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
    setShowMobileItinerary(true);
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
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-800 via-amber-900 to-stone-900 relative overflow-hidden min-h-screen flex items-center">
        {backgrounds.map((bg, index) => (
          <img
            key={index}
            src={bg}
            alt=""
            className={`
              absolute inset-0 h-full w-full object-cover
              motion-safe:animate-kenburns
              transition-opacity duration-[2000ms] ease-in-out
              ${index === bgIndex ? "opacity-100" : "opacity-0"}
            `}
          />
        ))}
        <div className="absolute inset-0 bg-stone-900/60" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23d4a574%22 fill-opacity=%220.08%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 pt-20 text-center">
          {/* <img src="/favicon_v3.png" alt="Lakbay Intramuros Logo" className="w-14 h-14 sm:w-20 sm:h-20 text-amber-400 mx-auto mb-6" /> */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-amber-100 mb-4 sm:mb-6">
            Lakbay Intramuros
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-amber-200/80 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10 px-4">
            Begin your adventure through the historic walled city. 
            Create an account to save your favorite spots and plan your journey.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToMap}
              className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold rounded-xl shadow-lg shadow-amber-900/30 transition-all duration-200 text-base sm:text-lg"
            >
              <Map className="w-5 h-5" />
              Explore Intramuros
            </button>
            {!isAuthenticated && (
              <Link
                to="/signup"
                className="flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-transparent border-2 border-amber-400/50 hover:border-amber-400 text-amber-200 hover:text-amber-100 font-semibold rounded-xl transition-all duration-200 text-base sm:text-lg"
              >
                Create Account
              </Link>
            )}
          </div>
          <div className="mt-10 sm:mt-12 flex items-center justify-center gap-2 text-amber-300/60">
            <div className="w-12 sm:w-16 h-px bg-amber-300/40"></div>
            <span className="text-xs sm:text-sm font-medium tracking-wider">EST. 1571</span>
            <div className="w-12 sm:w-16 h-px bg-amber-300/40"></div>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-amber-400/60" />
        </div>
      </section>

      {/* Map Section */}
      <section ref={mapSectionRef} className="py-6 sm:py-8 lg:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-800 mb-2">
              Discover Intramuros
            </h2>
            <p className="text-stone-500 text-sm sm:text-base">
              Click on landmarks to add them to your itinerary
            </p>
          </div>

    {/* Map + Itinerary Layout */}
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Map Container */}
        <div className="flex-1 order-1">
            <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
              {/* Map */}
                <div className="relative h-[400px] sm:h-[500px] lg:h-[600px]">
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
                </div>

                {/* Controls Bar */}
                <div className="p-3 sm:p-4 border-t border-stone-200 bg-gradient-to-r from-terracotta-50 to-sand-50">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {/* Magic Generate Button */}
                    <button
                      onClick={handleSmartGenerate}
                      className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r 
                      from-terracotta-600 to-terracotta-500 hover:from-terracotta-700 hover:to-terracotta-600 
                      text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-sm sm:text-base"
                    >
                      <Sparkles className="w-5 h-5" />
                      Auto-suggest
                    </button>
                    
                    {/* Category Filter */}
                    <div className="relative">
                      <button
                        onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm sm:text-base ${
                          selectedCategory !== 'all' 
                            ? 'bg-sage-100 border-sage-300 text-sage-700' 
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                        }`}
                      >
                        <Filter className="w-4 h-4" />
                        <span className="sm:hidden">
                          {selectedCategory === 'all' ? 'Filter' : LOCATION_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                        </span>
                        <span className="hidden sm:inline">
                          {selectedCategory === 'all' ? 'All Categories' : LOCATION_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                        </span>
                      </button>
                      {showCategoryFilter && (
                        <div className="absolute right-0 sm:left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-20">
                          {LOCATION_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSelectedCategory(cat.id);
                                setShowCategoryFilter(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                                selectedCategory === cat.id
                                  ? 'bg-terracotta-50 text-terracotta-700 font-medium'
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
                </div>
              </div>

              {/* Landmarks Grid - Below Map on Mobile */}
              <div className="mt-4 sm:mt-6 bg-white rounded-2xl shadow-lg border border-stone-200 p-4 sm:p-5">
                <h3 className="font-serif font-semibold text-stone-800 mb-3 text-base sm:text-lg">
                  Explore Landmarks ({filteredLocations.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-[300px] overflow-y-auto">
                  {filteredLocations.map((landmark) => {
                    const isAdded = sessionItinerary.find(item => item.id === landmark.id);
                    return (
                      <div
                        key={landmark.id}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                          isAdded 
                            ? 'bg-sage-50 border-sage-300' 
                            : 'bg-stone-50 border-stone-200 hover:border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-medium text-stone-800 text-sm truncate">
                            {landmark.name}
                          </p>
                          <p className="text-xs text-stone-500 truncate">
                            {landmark.description}
                          </p>
                        </div>
                        <button
                          onClick={() => isAdded ? removeFromItinerary(landmark.id) : addToItinerary(landmark)}
                          className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
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

            {/* Itinerary Panel - Desktop */}
            <div className="hidden lg:block w-80 xl:w-96 order-2">
              <div className="bg-white rounded-2xl shadow-lg border border-stone-200 sticky top-24 overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-serif font-semibold text-stone-800 text-lg">
                      Your Itinerary
                    </h2>
                    {sessionItinerary.length > 0 && (
                      <span className="px-2.5 py-1 bg-terracotta-100 text-terracotta-700 text-xs font-semibold rounded-full">
                        {sessionItinerary.length} stops
                      </span>
                    )}
                  </div>
                  {sessionItinerary.length > 0 && (
                    <p className="text-xs text-stone-500">
                      Estimated time: ~{Math.round(totalTime / 60 * 10) / 10}h
                    </p>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto p-4">
                  {sessionItinerary.length === 0 ? (
                    <div className="text-center py-10">
                      <Navigation className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                      <p className="text-stone-500 text-sm">
                        Add landmarks to start planning
                      </p>
                      <p className="text-stone-400 text-xs mt-1">
                        Click on map markers or use Magic Generate
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessionItinerary.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200"
                        >
                          <div className="w-7 h-7 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
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
                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {sessionItinerary.length > 0 && (
                  <div className="p-4 border-t border-stone-200 space-y-3 bg-stone-50">
                    {!isAuthenticated && sessionItinerary.length > 1 && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Sign in to see routes & distances</span>
                      </div>
                    )}
                    <button
                      onClick={handleSaveOrBook}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold rounded-xl transition-colors shadow-md"
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
                      className="w-full px-4 py-2 text-stone-500 hover:text-red-600 text-sm font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Itinerary Panel */}
          {sessionItinerary.length > 0 && (
            <div className="lg:hidden mt-4">
              <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">
                <button
                  onClick={() => setShowMobileItinerary(!showMobileItinerary)}
                  className="w-full p-4 flex items-center justify-between bg-stone-50 border-b border-stone-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-terracotta-100 rounded-full flex items-center justify-center">
                      <Navigation className="w-4 h-4 text-terracotta-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-stone-800">Your Itinerary</p>
                      <p className="text-xs text-stone-500">
                        {sessionItinerary.length} stops • ~{Math.round(totalTime / 60 * 10) / 10}h
                      </p>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${showMobileItinerary ? 'rotate-180' : ''}`} />
                </button>

                {showMobileItinerary && (
                  <>
                    <div className="max-h-[300px] overflow-y-auto p-4 space-y-3">
                      {sessionItinerary.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200"
                        >
                          <div className="w-7 h-7 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-800 text-sm">
                              {item.name}
                            </p>
                            <p className="text-xs text-stone-500 line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromItinerary(item.id)}
                            className="p-1.5 text-stone-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-stone-200 space-y-3 bg-stone-50">
                      {!isAuthenticated && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Sign in to see routes & distances</span>
                        </div>
                      )}
                      <button
                        onClick={handleSaveOrBook}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold rounded-xl transition-colors"
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
                        className="w-full px-4 py-2 text-stone-500 hover:text-red-600 text-sm font-medium transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

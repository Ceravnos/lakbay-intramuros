import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router"
import { PlusIcon, LogOut, Compass, Shield, MapPin, ChevronDown, ToggleLeft, ToggleRight, Loader2, User, Bell } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "../context/AuthContext"
import api from "../lib/axios"
import { buildPostAuthRedirectState, clearPostAuthItineraryHandoff, persistPostAuthItineraryHandoff } from "../lib/utils"

const Navbar = ({ guestAuthSessionItinerary = [] }) => {
  const { user, isAuthenticated, logout, isApprovedGuide, isGuideMode, toggleGuideMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [togglingMode, setTogglingMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const guestAuthRedirectState = buildPostAuthRedirectState(guestAuthSessionItinerary);

  // Fetch notifications
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, isGuideMode]);

  // Listen for real-time booking updates
  useEffect(() => {
    const handleBookingUpdate = (event) => {
      const { type } = event.detail;
      // Refresh notifications on relevant updates
      if (type) {
        fetchNotifications();
      }
    };

    window.addEventListener('booking-update', handleBookingUpdate);
    return () => {
      window.removeEventListener('booking-update', handleBookingUpdate);
    };
  }, [isGuideMode]);

  const fetchNotifications = async () => {
    try {
      if (isGuideMode) {
        // For guides: fetch pending booking requests
        const res = await api.get('/bookings/pending');
        setNotifications(res.data);
      } else {
        // For tourists: fetch bookings with revision requests
        const res = await api.get('/bookings/my-bookings');
        const revisionBookings = res.data.filter(b => b.revisionRequested && b.status === 'pending');
        setNotifications(revisionBookings);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleGuestAuthNavigation = () => {
    if (Array.isArray(guestAuthSessionItinerary) && guestAuthSessionItinerary.length > 0) {
      persistPostAuthItineraryHandoff(guestAuthSessionItinerary);
      return;
    }

    clearPostAuthItineraryHandoff();
  };

  const handleToggleGuideMode = async () => {
    setTogglingMode(true);
    try {
      const result = await toggleGuideMode();
      toast.success(result.message);
      if (result.isGuideMode) {
        navigate("/guide/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error("Failed to toggle mode");
    } finally {
      setTogglingMode(false);
    }
  };

  return (
    <header className="bg-white border-b border-stone-200">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group"> 
            <img src="/favicon_v3.png" alt="Lakbay Intramuros Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-xl sm:text-2xl font-serif font-semibold text-stone-800 tracking-tight group-hover:text-terracotta-600 transition-colors">
              Lakbay Intramuros
            </span>
          </Link>
          <div className="flex gap-3 items-center">
            {isAuthenticated ? (
              <>
                {/* Prominent Mode Toggle Button for Approved Guides */}
                {isApprovedGuide && (
                  <button
                    onClick={handleToggleGuideMode}
                    disabled={togglingMode}
                    className={`hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${
                      isGuideMode 
                        ? "bg-sage-50 text-sage-700 border-sage-200 hover:bg-sage-100" 
                        : "bg-terracotta-50 text-terracotta-700 border-terracotta-200 hover:bg-terracotta-100"
                    }`}
                  >
                    {togglingMode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isGuideMode ? (
                      <MapPin className="w-4 h-4" />
                    ) : (
                      <Compass className="w-4 h-4" />
                    )}
                    {isGuideMode ? "Guide Mode" : "Tourist Mode"}
                  </button>
                )}

                {/* Tourist Dashboard Button */}
                {!isGuideMode && location.pathname !== "/dashboard" && location.pathname !== "/profile" && (
                  <Link 
                    to="/dashboard" 
                    className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-sage-50 text-sage-700 border border-sage-200 hover:bg-sage-100"
                  >
                    <Compass className="w-4 h-4" />
                    Dashboard
                  </Link>
                )}

                {/* Notification Bell */}
                <div className="relative">
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className="relative p-2 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <Bell className="w-5 h-5 text-stone-600" />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-terracotta-500 text-white text-xs rounded-full flex items-center justify-center">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-stone-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="text-sm font-medium text-stone-800">Notifications</p>
                        </div>
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-stone-500 text-sm">
                            No new notifications
                          </div>
                        ) : (
                          <div className="max-h-64 overflow-y-auto">
                            {notifications.map((booking) => (
                              isGuideMode ? (
                                <Link
                                  key={booking._id}
                                  to="/guide/dashboard"
                                  onClick={() => setShowNotifications(false)}
                                  className="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0"
                                >
                                  <p className="text-sm font-medium text-stone-800">
                                    New Booking: {booking.tripDetails?.title || 'Itinerary'}
                                  </p>
                                  <p className="text-xs text-stone-500 mt-1">
                                    {booking.touristId?.fullName || 'Tourist'} requested a tour
                                  </p>
                                </Link>
                              ) : (
                                <button
                                  key={booking._id}
                                  onClick={() => {
                                    setShowNotifications(false);
                                    const itineraryId = booking.itineraryId?._id || booking.itineraryId;
                                    if (!itineraryId) {
                                      toast.error('Could not open this itinerary');
                                      return;
                                    }

                                    navigate(`/itinerary/${itineraryId}`, {
                                      state: {
                                        revisionBookingId: booking._id,
                                        openRevisionModal: true,
                                      },
                                    });
                                  }}
                                  className="w-full text-left block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0"
                                >
                                  <p className="text-sm font-medium text-stone-800">
                                    Revision Requested: {booking.tripDetails?.title || 'Itinerary'}
                                  </p>
                                  <p className="text-xs text-stone-500 mt-1">
                                    {booking.guideId?.fullName || 'Guide'} suggested changes
                                  </p>
                                  {booking.revisionNote && (
                                    <p className="text-xs text-terracotta-600 mt-1 italic">
                                      "{booking.revisionNote}"
                                    </p>
                                  )}
                                </button>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* User dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-sage-100 border border-sage-300 flex items-center justify-center overflow-hidden">
                      {user?.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sage-700 font-medium text-sm">
                          {user?.fullName?.charAt(0).toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-stone-700">
                      {user?.fullName?.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-stone-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-800">{user?.fullName}</p>
                      <p className="text-xs text-stone-500 capitalize">{user?.role}</p>
                    </div>
                    
                    {user?.role === "admin" && (
                      <Link 
                        to="/admin/dashboard" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <Shield className="w-4 h-4 text-stone-500" />
                        Admin Dashboard
                      </Link>
                    )}
                    
                    {isApprovedGuide && (
                      <button 
                        onClick={handleToggleGuideMode}
                        disabled={togglingMode}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors w-full"
                      >
                        {togglingMode ? (
                          <Loader2 className="w-4 h-4 text-stone-500 animate-spin" />
                        ) : isGuideMode ? (
                          <ToggleRight className="w-4 h-4 text-sage-600" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-stone-500" />
                        )}
                        {isGuideMode ? "Switch to Tourist Mode" : "Switch to Guide Mode"}
                      </button>
                    )}
                    
                    {isGuideMode && (
                      <Link 
                        to="/guide/dashboard" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <Compass className="w-4 h-4 text-stone-500" />
                        Guide Dashboard
                      </Link>
                    )}
                    
                    {!isGuideMode && (
                      <Link 
                        to="/itinerary" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors sm:hidden"
                      >
                        <PlusIcon className="w-4 h-4 text-stone-500" />
                        New Itinerary
                      </Link>
                    )}
                    
                    <Link 
                      to="/profile" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-stone-500" />
                      Profile
                    </Link>
                    
                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  state={guestAuthRedirectState}
                  onClick={handleGuestAuthNavigation}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
                >
                  Sign in
                </Link>
                <Link 
                  to="/signup" 
                  state={guestAuthRedirectState}
                  onClick={handleGuestAuthNavigation}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
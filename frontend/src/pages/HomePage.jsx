import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { MapPin, Plus, Calendar, Clock, ChevronRight, Loader2, Navigation, Users, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

import Navbar from '../components/Navbar'
import RateLimitedUI from '../components/RateLimitedUI'

const HomePage = () => {
    const { user, isAuthenticated, isGuideMode } = useAuth();
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [itineraries, setItineraries] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [isAuthenticated, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch user's itineraries
            const itinerariesRes = await api.get("/itineraries");
            setItineraries(itinerariesRes.data);
            setIsRateLimited(false);

            // Fetch user's bookings
            try {
                const bookingsRes = await api.get("/bookings/my-bookings");
                setMyBookings(bookingsRes.data);
            } catch (err) {
                console.log("Could not fetch bookings");
            }
        } catch (error) {
            console.log("Error fetching data");
            if (error.response?.status === 429) {
                setIsRateLimited(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteItinerary = async (id) => {
        if (!window.confirm("Are you sure you want to delete this itinerary?")) return;
        
        try {
            await api.delete(`/itineraries/${id}`);
            toast.success("Itinerary deleted");
            setItineraries(prev => prev.filter(item => item._id !== id));
        } catch (error) {
            toast.error("Failed to delete itinerary");
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-sand-100 text-sand-700 border-sand-300';
            case 'accepted': return 'bg-sage-100 text-sage-700 border-sage-300';
            case 'completed': return 'bg-stone-100 text-stone-600 border-stone-300';
            default: return 'bg-stone-100 text-stone-600 border-stone-300';
        }
    };

    return (
        <div className='min-h-screen bg-stone-50'>
            <Navbar />

            {isRateLimited && <RateLimitedUI />}

            {/* Dashboard Header */}
            <section className="bg-white border-b border-stone-200">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-serif font-semibold text-stone-800">
                                Welcome back, {user?.fullName?.split(' ')[0]}
                            </h1>
                            <p className="text-stone-500 mt-1">
                                Manage your Intramuros itineraries and bookings
                            </p>
                        </div>
                        <Link 
                            to="/itinerary" 
                            className="flex items-center gap-2 px-4 py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            New Itinerary
                        </Link>
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Bookings Section */}
                {myBookings.length > 0 && (
                    <section className="mb-10">
                        <h2 className="text-lg font-serif font-semibold text-stone-800 mb-4">
                            Your Bookings
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myBookings.map((booking) => (
                                <div 
                                    key={booking._id} 
                                    className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-medium text-stone-800">
                                            {booking.tripDetails?.title}
                                        </h4>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-sm text-stone-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(booking.tripDetails?.preferredDate)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            {booking.tripDetails?.numberOfPeople} {booking.tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}
                                        </div>
                                        {booking.guideId && (
                                            <p className="text-sage-600">
                                                Guide: {booking.guideId.fullName}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Itineraries Section */}
                <section>
                    <h2 className="text-lg font-serif font-semibold text-stone-800 mb-4">
                        Your Itineraries
                    </h2>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                        </div>
                    ) : itineraries.length === 0 ? (
                        <div className="text-center py-16 bg-white border-2 border-dashed border-stone-200 rounded-xl">
                            <Navigation className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-stone-700 mb-2">
                                No Itineraries Yet
                            </h3>
                            <p className="text-stone-500 mb-6 max-w-sm mx-auto">
                                Create your first itinerary to start planning your Intramuros adventure.
                            </p>
                            <Link 
                                to="/itinerary" 
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Create Itinerary
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {itineraries.map((itinerary) => (
                                <div 
                                    key={itinerary._id} 
                                    className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all"
                                >
                                    <Link to={`/itinerary/${itinerary._id}`} className="block p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center">
                                                <Navigation className="w-5 h-5 text-terracotta-600" />
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                itinerary.status === 'booked' 
                                                    ? 'bg-sage-100 text-sage-700' 
                                                    : itinerary.status === 'planned'
                                                    ? 'bg-sand-100 text-sand-700'
                                                    : 'bg-stone-100 text-stone-600'
                                            }`}>
                                                {itinerary.status}
                                            </span>
                                        </div>
                                        <h3 className="font-serif text-lg font-semibold text-stone-800 mb-2 group-hover:text-terracotta-600 transition-colors">
                                            {itinerary.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-stone-500 mb-3">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" />
                                                {itinerary.locations?.length || 0} stops
                                            </span>
                                            {itinerary.preferredDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(itinerary.preferredDate)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-stone-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            Updated {formatDate(itinerary.updatedAt)}
                                        </div>
                                    </Link>
                                    <div className="px-5 pb-4 flex items-center justify-between border-t border-stone-100 pt-3">
                                        <Link 
                                            to={`/itinerary/${itinerary._id}`}
                                            className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium"
                                        >
                                            Edit →
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteItinerary(itinerary._id)}
                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default HomePage
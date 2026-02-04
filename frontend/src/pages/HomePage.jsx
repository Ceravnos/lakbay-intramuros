import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { MapPin, Plus, Calendar, Clock, ChevronRight, Loader2, Navigation, Users, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'
import { socket } from '../lib/socket'

import Navbar from '../components/Navbar'
import RateLimitedUI from '../components/RateLimitedUI'

// ⭐ Rating Modal Component
const RatingModal = ({ booking, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    if (!booking) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
                <h3 className="text-lg font-serif font-semibold text-stone-800 mb-2">
                    Rate your guide
                </h3>

                <p className="text-sm text-stone-500 mb-4">
                    How was your experience with {booking.guideId?.fullName}?
                </p>

                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(star)}
                            className="text-3xl"
                        >
                            <span className={
                                star <= (hover || rating)
                                    ? "text-yellow-400"
                                    : "text-stone-300"
                            }>
                                ★
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm border rounded-lg text-stone-600 hover:bg-stone-50"
                    >
                        Skip
                    </button>
                    <button
                        disabled={rating === 0}
                        onClick={() => onSubmit(rating)}
                        className="flex-1 px-4 py-2 text-sm bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 disabled:opacity-50"
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};


const HomePage = () => {
    const { user, isAuthenticated, isGuideMode } = useAuth();
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [itineraries, setItineraries] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRatingPrompt, setShowRatingPrompt] = useState(false);
    const [ratingBooking, setRatingBooking] = useState(null);


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const itinerariesRes = await api.get("/itineraries");
            setItineraries(itinerariesRes.data);

            const bookingsRes = await api.get("/bookings/my-bookings");
            setMyBookings(bookingsRes.data);

            setIsRateLimited(false);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 429) {
                setIsRateLimited(true);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const submitRating = async (rating) => {
        try {
            await api.post(`/ratings`, {
                bookingId: ratingBooking._id,
                guideId: ratingBooking.guideId._id,
                rating
            });

            toast.success("Thanks for your feedback!");
            setShowRatingPrompt(false);
            setRatingBooking(null);
        } catch (error) {
            toast.error("Failed to submit rating");
        }
    };


    useEffect(() => {
        fetchData();
    }, [isAuthenticated, user, fetchData]);

    useEffect(() => {
        if (!user) return;

        const handleAcceptedBooking = (data) => {
            toast.success(data.message); // green toast for acceptance
            fetchData();
        };

        const handleRejectedBooking = (data) => {
            toast.error(data.message);
            fetchData(); // refresh bookings
        };

        const handleCompletedBooking = (data) => {
            toast.success(data.message);
            fetchData();
            //activate review prompt here
            setRatingBooking(data.booking);
            setShowRatingPrompt(true);
        }

        socket.on("booking:accepted", handleAcceptedBooking);
        socket.on("booking:rejected", handleRejectedBooking);
        socket.on("booking:completed", handleCompletedBooking);

        return () => {
            socket.off("booking:accepted", handleAcceptedBooking);
            socket.off("booking:rejected", handleRejectedBooking);
            socket.off("booking:completed", handleCompletedBooking);
        };
    }, [user, fetchData]);


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

    const handleCancelBooking = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this booking?")) return;
        
        try {
            await api.put(`/bookings/${id}/cancel`);
            toast.success("Booking cancelled");
            setMyBookings(prev => prev.filter(item => item._id !== id));
            fetchData();
        } catch (error) {
            toast.error("Failed to cancel booking");
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        })
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return 'bg-orange-500 text-white border-sand-300';
            case "accepted": return 'bg-lime-600 text-white border-sage-300';
            case "completed": return 'bg-stone-100 text-stone-600 border-stone-300';
            case "cancelled": return 'bg-red-600 text-white border-stone-300';
            case "rejected": return 'bg-red-800 text-white border-stone-300';
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
                                    className="relative bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-medium text-stone-800">
                                            {booking.tripDetails?.title}
                                        </h4>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}
                                        >
                                            {booking.status}
                                            {booking.status?.toLowerCase() === "accepted" && " - ongoing"}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-stone-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(booking.tripDetails?.preferredDate)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            {formatTime(booking.tripDetails?.preferredDate)}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            {booking.tripDetails?.numberOfPeople}{' '}
                                            {booking.tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}
                                        </div>
                                        {booking.guideId && (
                                            <p className="text-sage-600">
                                                Guide: {booking.guideId.fullName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Cancel button */}
                                    {booking.status === "pending" && (
                                        <button
                                            onClick={() => handleCancelBooking(booking._id)}
                                            className="absolute bottom-4 right-4 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                                        >
                                            Cancel
                                        </button>
                                    )}
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
        {showRatingPrompt && (
            <RatingModal
                booking={ratingBooking}
                onClose={() => {
                    setShowRatingPrompt(false);
                    setRatingBooking(null);
                }}
                onSubmit={submitRating}
            />
        )}

        </div>
    );
};

export default HomePage
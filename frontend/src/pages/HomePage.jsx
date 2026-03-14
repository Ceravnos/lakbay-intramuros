import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { MapPin, Plus, Calendar, Clock, ChevronRight, Loader2, Navigation, Users, Trash2, XCircle, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/axios'
import { useAuth } from '../context/AuthContext'

import Navbar from '../components/Navbar'
import RateLimitedUI from '../components/RateLimitedUI'
import ConfirmationModal from '../components/ConfirmationModal'
import RevisionReviewModal from '../components/RevisionReviewModal'

const TRIP_PROGRESS_STORAGE_KEY = 'lakbay_itinerary_trip_progress';

const readTripProgressMap = () => {
    if (typeof window === 'undefined') return {};

    try {
        return JSON.parse(window.localStorage.getItem(TRIP_PROGRESS_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

// ⭐ Rating Modal Component
const RatingModal = ({ booking, onClose, onSubmit, submitting }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    if (!booking) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm text-center">
                <h3 className="text-lg font-serif font-semibold text-stone-800 mb-4">
                    Rate Your Guide
                </h3>

                {/* Guide Profile */}
                <div className="flex flex-col items-center mb-4">
                    <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center overflow-hidden mb-2">
                        {booking.guideId?.profilePicture ? (
                            <img 
                                src={booking.guideId.profilePicture} 
                                alt={booking.guideId.fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-sage-700 font-semibold text-xl">
                                {booking.guideId?.fullName?.charAt(0).toUpperCase() || 'G'}
                            </span>
                        )}
                    </div>
                    <p className="font-medium text-stone-800">
                        {booking.guideId?.fullName || 'Your Guide'}
                    </p>
                </div>

                <p className="text-sm text-stone-500 mb-4">
                    How was your experience?
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
                        disabled={submitting}
                        className="flex-1 px-4 py-2 text-sm border rounded-lg text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                    >
                        Skip
                    </button>
                    <button
                        disabled={rating === 0 || submitting}
                        onClick={() => onSubmit(rating)}
                        className="flex-1 px-4 py-2 text-sm bg-terracotta-600 text-white rounded-lg hover:bg-terracotta-700 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const HomePage = () => {
    const { user, isAuthenticated, isGuideMode } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [itineraries, setItineraries] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showRatingPrompt, setShowRatingPrompt] = useState(false);
    const [ratingBooking, setRatingBooking] = useState(null);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelBookingId, setCancelBookingId] = useState(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [deleteBookingModalOpen, setDeleteBookingModalOpen] = useState(false);
    const [deleteBookingId, setDeleteBookingId] = useState(null);
    const [deleteBookingLoading, setDeleteBookingLoading] = useState(false);
    const [deleteItineraryModalOpen, setDeleteItineraryModalOpen] = useState(false);
    const [deleteItineraryId, setDeleteItineraryId] = useState(null);
    const [deleteItineraryLoading, setDeleteItineraryLoading] = useState(false);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(null);
    
    // Revision review modal state
    const [revisionModalOpen, setRevisionModalOpen] = useState(false);
    const [revisionBooking, setRevisionBooking] = useState(null);
    const [acceptRevisionLoading, setAcceptRevisionLoading] = useState(false);
    const [cancelRevisionLoading, setCancelRevisionLoading] = useState(false);
    const [showAllBookings, setShowAllBookings] = useState(false);
    const [showAllItineraries, setShowAllItineraries] = useState(false);


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
        setRatingSubmitting(true);
        try {
            await api.post(`/ratings`, {
                bookingId: ratingBooking._id,
                guideId: ratingBooking.guideId?._id || ratingBooking.guideId,
                rating
            });

            toast.success("Thanks for your feedback!");
            setShowRatingPrompt(false);
            setRatingBooking(null);
            fetchData();
        } catch (error) {
            console.error("Rating submission error:", error);
            toast.error(error.response?.data?.message || "Failed to submit rating");
        } finally {
            setRatingSubmitting(false);
        }
    };


    useEffect(() => {
        fetchData();
    }, [isAuthenticated, user, fetchData]);

    // Handle payment return from PayMongo checkout
    useEffect(() => {
        const paymentStatus = searchParams.get('payment');
        const bookingId = searchParams.get('bookingId');

        if (paymentStatus && bookingId) {
            if (paymentStatus === 'success') {
                // Verify payment with backend (toast handled by socket event)
                const verifyPayment = async () => {
                    try {
                        await api.post(`/payments/verify/${bookingId}`);
                    } catch (error) {
                        // Silent - socket event will handle notification
                    }
                    fetchData();
                };
                verifyPayment();
            } else if (paymentStatus === 'cancelled') {
                toast('Payment was cancelled. You can try again anytime.', { icon: '⚠️' });
            }
            // Clear URL params
            setSearchParams({});
        }
    }, [searchParams]);

    // Listen for real-time booking updates via WebSocket
    useEffect(() => {
        const handleBookingUpdate = (event) => {
            const { type, booking } = event.detail;
            // Refresh bookings on any update
            fetchData();
            
            // Show rating prompt when tour is completed
            if (type === 'completed' && booking && !booking.isRated) {
                setRatingBooking(booking);
                setShowRatingPrompt(true);
            }
            
            // Show revision review modal when guide requests revision
            if (type === 'revision' && booking) {
                setRevisionBooking(booking);
                setRevisionModalOpen(true);
            }
        };

        window.addEventListener('booking-update', handleBookingUpdate);
        return () => {
            window.removeEventListener('booking-update', handleBookingUpdate);
        };
    }, [fetchData]);

    // Open revision modal for a specific booking (called from notification click)
    const openRevisionModal = (booking) => {
        setRevisionBooking(booking);
        setRevisionModalOpen(true);
    };

    // Listen for open-revision-modal event from Navbar
    useEffect(() => {
        const handleOpenRevisionModal = (event) => {
            const { booking } = event.detail;
            if (booking) {
                openRevisionModal(booking);
            }
        };

        window.addEventListener('open-revision-modal', handleOpenRevisionModal);
        return () => {
            window.removeEventListener('open-revision-modal', handleOpenRevisionModal);
        };
    }, []);

    // Handle accepting guide's revision
    const handleAcceptRevision = async (bookingId) => {
        setAcceptRevisionLoading(true);
        try {
            await api.put(`/bookings/${bookingId}/accept-revision`);
            toast.success("Revision accepted! Your itinerary has been updated.");
            setRevisionModalOpen(false);
            setRevisionBooking(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept revision");
        } finally {
            setAcceptRevisionLoading(false);
        }
    };

    // Handle cancelling booking due to revision
    const handleCancelRevisionBooking = async (bookingId) => {
        setCancelRevisionLoading(true);
        try {
            await api.put(`/bookings/${bookingId}/cancel`);
            toast.success("Booking cancelled");
            setRevisionModalOpen(false);
            setRevisionBooking(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to cancel booking");
        } finally {
            setCancelRevisionLoading(false);
        }
    };



    const openDeleteItineraryModal = (id) => {
        setDeleteItineraryId(id);
        setDeleteItineraryModalOpen(true);
    };

    const handleDeleteItinerary = async () => {
        if (!deleteItineraryId) return;

        setDeleteItineraryLoading(true);
        try {
            await api.delete(`/itineraries/${deleteItineraryId}`);
            toast.success("Itinerary deleted");
            setItineraries(prev => prev.filter(item => item._id !== deleteItineraryId));
            setDeleteItineraryModalOpen(false);
            setDeleteItineraryId(null);
        } catch (error) {
            toast.error("Failed to delete itinerary");
        } finally {
            setDeleteItineraryLoading(false);
        }
    };

    const openCancelModal = (id) => {
        setCancelBookingId(id);
        setCancelModalOpen(true);
    };

    const handleCancelBooking = async () => {
        if (!cancelBookingId) return;
        
        setCancelLoading(true);
        try {
            await api.put(`/bookings/${cancelBookingId}/cancel`);
            toast.success("Booking cancelled");
            setMyBookings(prev => prev.filter(item => item._id !== cancelBookingId));
            setCancelModalOpen(false);
            setCancelBookingId(null);
            fetchData();
        } catch (error) {
            toast.error("Failed to cancel booking");
        } finally {
            setCancelLoading(false);
        }
    };

    const openDeleteBookingModal = (id) => {
        setDeleteBookingId(id);
        setDeleteBookingModalOpen(true);
    };

    const handleDeleteBooking = async () => {
        if (!deleteBookingId) return;

        setDeleteBookingLoading(true);
        try {
            await api.delete(`/bookings/${deleteBookingId}`);
            toast.success("Booking deleted");
            setMyBookings(prev => prev.filter(item => item._id !== deleteBookingId));
            setDeleteBookingModalOpen(false);
            setDeleteBookingId(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete booking");
        } finally {
            setDeleteBookingLoading(false);
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

    const handlePayNow = async (booking) => {
        const PRICE_PER_PERSON = 150;
        const amount = (booking.tripDetails?.numberOfPeople || 1) * PRICE_PER_PERSON;

        setPaymentLoading(booking._id);
        try {
            const res = await api.post('/payments/create', {
                bookingId: booking._id,
                amount,
            });

            if (res.data.checkoutUrl) {
                window.location.href = res.data.checkoutUrl;
            } else {
                toast.error('Failed to get checkout URL');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to initiate payment');
        } finally {
            setPaymentLoading(null);
        }
    };

    const handleOpenBookingItinerary = (booking) => {
        const itineraryId = booking.itineraryId?._id || booking.itineraryId;
        if (!itineraryId) return;
        navigate(`/itinerary/${itineraryId}`);
    };

    const bookingStatusPriority = {
        paid: 0,
        accepted: 1,
        active: 2,
        scheduled: 3,
        awaiting_payment: 4,
        pending: 5,
        completed: 6,
        rejected: 7,
        cancelled: 8,
    };

    const archivedBookingStatuses = ['completed', 'rejected', 'cancelled'];

    const sortedBookings = [...myBookings].sort((a, b) => {
        const priorityDifference =
            (bookingStatusPriority[a.status] ?? 99) - (bookingStatusPriority[b.status] ?? 99);

        if (priorityDifference !== 0) {
            return priorityDifference;
        }

        const aDate = new Date(a.tripDetails?.preferredDate || a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.tripDetails?.preferredDate || b.updatedAt || b.createdAt || 0).getTime();

        if (archivedBookingStatuses.includes(a.status) && archivedBookingStatuses.includes(b.status)) {
            return bDate - aDate;
        }

        return aDate - bDate;
    });

    const bookedItineraryIds = new Set(
        myBookings
            .map(b => b.itineraryId?._id || b.itineraryId)
            .filter(Boolean)
    );

    const unbookedItineraries = itineraries.filter(
        it => !bookedItineraryIds.has(it._id)
    );

    const visibleBookings = showAllBookings ? sortedBookings : sortedBookings.slice(0, 3);
    const visibleItineraries = showAllItineraries ? unbookedItineraries : unbookedItineraries.slice(0, 3);
    const tripProgressMap = readTripProgressMap();

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return 'bg-orange-500 text-white border-sand-300';
            case "accepted": return 'bg-lime-600 text-white border-sage-300';
            case "awaiting_payment": return 'bg-amber-500 text-white border-amber-300';
            case "paid": return 'bg-emerald-600 text-white border-emerald-300';
            case "scheduled": return 'bg-sky-600 text-white border-sky-300';
            case "active": return 'bg-blue-600 text-white border-blue-300';
            case "completed": return 'bg-stone-100 text-stone-600 border-stone-300';
            case "cancelled": return 'bg-red-600 text-white border-stone-300';
            case "rejected": return 'bg-red-800 text-white border-stone-300';
            default: return 'bg-stone-100 text-stone-600 border-stone-300';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "pending": return 'Pending';
            case "accepted": return 'Active';
            case "awaiting_payment": return 'Awaiting Payment';
            case "paid": return 'Paid';
            case "scheduled": return 'Scheduled';
            case "active": return 'Ongoing';
            case "completed": return 'Completed';
            case "cancelled": return 'Cancelled';
            case "rejected": return 'Rejected';
            default: return status;
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
{/* Only show New Itinerary button if user has at least one itinerary */}
                        {unbookedItineraries.length > 0 && (
                            <Link 
                                to="/itinerary" 
                                className="flex items-center gap-2 px-4 py-2 bg-terracotta-600 hover:bg-terracotta-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                New Itinerary
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Bookings Section */}
                {sortedBookings.length > 0 && (
                    <section className="mb-10">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <h2 className="text-lg font-serif font-semibold text-stone-800">
                                Your Bookings
                            </h2>
                            {sortedBookings.length > 3 && (
                                <button
                                    onClick={() => setShowAllBookings(prev => !prev)}
                                    className="inline-flex items-center gap-1 text-sm font-medium text-terracotta-600 hover:text-terracotta-700"
                                >
                                    {showAllBookings ? 'View less' : 'View more'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {visibleBookings.map((booking) => (
                                <div 
                                    key={booking._id} 
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleOpenBookingItinerary(booking)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            handleOpenBookingItinerary(booking);
                                        }
                                    }}
                                    className="relative bg-white border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="font-medium text-stone-800">
                                            {booking.tripDetails?.title}
                                        </h4>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}
                                        >
                                            {getStatusLabel(booking.status)}
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
                                            <div className="flex items-center gap-2 text-sage-600">
                                                <div className="w-5 h-5 bg-sage-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {booking.guideId.profilePicture ? (
                                                        <img 
                                                            src={booking.guideId.profilePicture} 
                                                            alt={booking.guideId.fullName}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-sage-700 text-xs font-medium">
                                                            {booking.guideId.fullName?.charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm">{booking.guideId.fullName}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Pay Now button */}
                                    {booking.status === "awaiting_payment" && (
                                        <div className="mt-4 pt-3 border-t border-stone-100">
                                            <button
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handlePayNow(booking);
                                                }}
                                                disabled={paymentLoading === booking._id}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {paymentLoading === booking._id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CreditCard className="w-4 h-4" />
                                                        Pay Now — ₱{(booking.tripDetails?.numberOfPeople || 1) * 150}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* Cancel button */}
                                    {(booking.status === "pending" || booking.status === "awaiting_payment") && (
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openCancelModal(booking._id);
                                            }}
                                            className={`${booking.status === "awaiting_payment" ? "w-full mt-2 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition" : "absolute bottom-4 right-4 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"}`}
                                        >
                                            Cancel Booking
                                        </button>
                                    )}

                                    {["completed", "rejected", "cancelled"].includes(booking.status) && (
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                openDeleteBookingModal(booking._id);
                                            }}
                                            className="absolute bottom-4 right-4 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Itineraries Section */}
                <section>
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="text-lg font-serif font-semibold text-stone-800">
                            Your Itineraries
                        </h2>
                        {unbookedItineraries.length > 3 && (
                            <button
                                onClick={() => setShowAllItineraries(prev => !prev)}
                                className="inline-flex items-center gap-1 text-sm font-medium text-terracotta-600 hover:text-terracotta-700"
                            >
                                {showAllItineraries ? 'View less' : 'View more'}
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                        </div>
                    ) : unbookedItineraries.length === 0 ? (
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
                            {visibleItineraries.map((itinerary) => {
                                const tripProgress = tripProgressMap[itinerary._id];
                                const totalStops = itinerary.locations?.length || tripProgress?.totalStops || 0;
                                const completedStops = Math.min(tripProgress?.completedStopCount || 0, totalStops);
                                const hasTripProgress = Boolean(tripProgress) && (completedStops > 0 || tripProgress?.tripStarted);
                                const progressPercentage = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;
                                const isTripOngoing = Boolean(tripProgress?.tripStarted) && completedStops < totalStops;

                                return (
                                <div 
                                    key={itinerary._id} 
                                    className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-stone-300 transition-all"
                                >
                                    <Link to={`/itinerary/${itinerary._id}`} className="block p-5">
                                        <div className="mb-3">
                                            <div className="w-10 h-10 bg-terracotta-100 rounded-lg flex items-center justify-center">
                                                <Navigation className="w-5 h-5 text-terracotta-600" />
                                            </div>
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
                                        {hasTripProgress && (
                                            <div className="mb-3 rounded-lg border border-sage-200 bg-sage-50 p-3">
                                                <div className="flex items-center justify-between text-xs font-medium text-sage-700">
                                                    <span>{completedStops} of {totalStops} stops completed</span>
                                                    <span>
                                                        {completedStops >= totalStops
                                                            ? 'Completed'
                                                            : tripProgress?.tripStarted
                                                                ? 'In progress'
                                                                : 'Paused'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 h-1.5 rounded-full bg-white overflow-hidden">
                                                    <div
                                                        className="h-full bg-sage-600 transition-all duration-300"
                                                        style={{ width: `${progressPercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-stone-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            Updated {formatDate(itinerary.updatedAt)}
                                        </div>
                                    </Link>
                                    <div className="px-5 pb-4 flex items-center justify-between border-t border-stone-100 pt-3">
                                        {isTripOngoing ? (
                                            <span className="text-sm text-stone-400 font-medium">
                                                Trip ongoing
                                            </span>
                                        ) : (
                                            <Link 
                                                to={`/itinerary/${itinerary._id}`}
                                                className="text-sm text-terracotta-600 hover:text-terracotta-700 font-medium"
                                            >
                                                Edit →
                                            </Link>
                                        )}
                                        <button
                                            onClick={() => openDeleteItineraryModal(itinerary._id)}
                                            className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )})}
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
                submitting={ratingSubmitting}
            />
        )}

        {/* Cancel Booking Confirmation Modal */}
        <ConfirmationModal
            isOpen={cancelModalOpen}
            onClose={() => {
                setCancelModalOpen(false);
                setCancelBookingId(null);
            }}
            onConfirm={handleCancelBooking}
            title="Cancel Booking"
            message="Are you sure you want to cancel this booking request? This action cannot be undone."
            confirmText="Yes, Cancel Booking"
            cancelText="Keep Booking"
            loading={cancelLoading}
            icon={XCircle}
        />

        <ConfirmationModal
            isOpen={deleteBookingModalOpen}
            onClose={() => {
                setDeleteBookingModalOpen(false);
                setDeleteBookingId(null);
            }}
            onConfirm={handleDeleteBooking}
            title="Delete Booking"
            message="Are you sure you want to permanently delete this booking? You will not be able to retrieve it anymore."
            confirmText="Yes, Delete Booking"
            cancelText="Keep Booking"
            loading={deleteBookingLoading}
            icon={Trash2}
        />

        <ConfirmationModal
            isOpen={deleteItineraryModalOpen}
            onClose={() => {
                setDeleteItineraryModalOpen(false);
                setDeleteItineraryId(null);
            }}
            onConfirm={handleDeleteItinerary}
            title="Delete Itinerary"
            message="Are you sure you want to permanently delete this itinerary? You will not be able to retrieve it anymore."
            confirmText="Yes, Delete Itinerary"
            cancelText="Keep Itinerary"
            loading={deleteItineraryLoading}
            icon={Trash2}
        />

        {/* Revision Review Modal */}
        <RevisionReviewModal
            isOpen={revisionModalOpen}
            onClose={() => {
                setRevisionModalOpen(false);
                setRevisionBooking(null);
            }}
            booking={revisionBooking}
            onAccept={handleAcceptRevision}
            onCancel={handleCancelRevisionBooking}
            acceptLoading={acceptRevisionLoading}
            cancelLoading={cancelRevisionLoading}
        />

        </div>
    );
};

export default HomePage
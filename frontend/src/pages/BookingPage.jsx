import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { 
    MapPin, Calendar, Users, Clock, ChevronLeft, Loader2, 
    CheckCircle, User, Phone, Star, CalendarDays, Sun, Sunset,
    Accessibility, Baby, Heart, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../lib/axios';

const BookingPage = () => {
    const { itineraryId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [itinerary, setItinerary] = useState(null);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bookingDetails, setBookingDetails] = useState({
        preferredDate: '',
        preferredTime: '',
        numberOfPeople: 1,
        notes: '',
        priorityAssistance: [],
        meetingPoint: '',
    });

    // Constants
    const MAX_PEOPLE = 15;
    const PRICE_PER_PERSON = 150;

    // Meeting points within Intramuros
    const MEETING_POINTS = [
        'Fort Santiago Main Gate',
        'Manila Cathedral Front Steps',
        'Plaza Roma',
        'Puerta Real Gardens',
        'San Agustin Church Entrance',
        'Baluarte de San Diego',
        'Revellin de Recoletos',
        'Intramuros Visitor Center',
    ];

    // Priority assistance options
    const PRIORITY_OPTIONS = [
        { id: 'pwd', label: 'Person with Disability (PWD)', icon: Accessibility },
        { id: 'pregnant', label: 'Pregnant Woman', icon: Baby },
        { id: 'senior', label: 'Senior Citizen (60+)', icon: Heart },
        { id: 'locomotive', label: 'Locomotive Limitations', icon: AlertCircle },
    ];
    const [allGuides, setAllGuides] = useState([]);

    // Helper to convert any date to YYYY-MM-DD string format
    const toDateInputValue = (date) => {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Reusable function to format date for display
    const formatDisplayDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
        if (isNaN(d.getTime())) return 'Invalid Date';
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };


    useEffect(() => {
        fetchData();
    }, [itineraryId]);

    // Pre-fill from navigation state (from ItineraryBuilderPage)
    useEffect(() => {
        if (location.state?.preferredDate || location.state?.numberOfPeople) {
            const dateValue = toDateInputValue(location.state.preferredDate);
            setBookingDetails(prev => ({
                ...prev,
                preferredDate: dateValue || prev.preferredDate,
                numberOfPeople: Math.min(location.state.numberOfPeople || prev.numberOfPeople, MAX_PEOPLE),
            }));
        }
    }, [location.state]);

    // Also pre-fill from itinerary data after fetch
    useEffect(() => {
        if (itinerary?.preferredDate && !bookingDetails.preferredDate) {
            const dateValue = toDateInputValue(itinerary.preferredDate);
            setBookingDetails(prev => ({
                ...prev,
                preferredDate: dateValue,
            }));
        }
    }, [itinerary]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch itinerary details
            const itineraryRes = await api.get(`/itineraries/${itineraryId}`);
            setItinerary(itineraryRes.data);
            
            // Pre-fill number of people from itinerary
            if (itineraryRes.data.numberOfPeople) {
                setBookingDetails(prev => ({
                    ...prev,
                    numberOfPeople: itineraryRes.data.numberOfPeople || 1,
                }));
            }

            // Fetch all guides
            try {
                const guidesRes = await api.get('/users/guides');
                setAllGuides(guidesRes.data);
            } catch (err) {
                console.log('Could not fetch guides');
            }
        } catch (error) {
            toast.error('Failed to load itinerary');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Filter guides based on selected date availability
    const availableGuides = useMemo(() => {
        if (!bookingDetails.preferredDate || allGuides.length === 0) return [];
        
        return allGuides.filter(guide => {
            if (!guide.unavailableDates || guide.unavailableDates.length === 0) return true;
            
            // Check if the selected date is in the guide's unavailable dates
            const selectedDateStr = bookingDetails.preferredDate;
            const isUnavailable = guide.unavailableDates.some(d => {
                const unavailDate = new Date(d);
                const dateStr = `${unavailDate.getFullYear()}-${String(unavailDate.getMonth() + 1).padStart(2, '0')}-${String(unavailDate.getDate()).padStart(2, '0')}`;
                return dateStr === selectedDateStr;
            });
            
            return !isUnavailable;
        });
    }, [bookingDetails.preferredDate, allGuides]);

    // Reset selected guide when date changes and guide becomes unavailable
    useEffect(() => {
        if (selectedGuide && bookingDetails.preferredDate) {
            const isStillAvailable = availableGuides.some(g => g._id === selectedGuide._id);
            if (!isStillAvailable) {
                setSelectedGuide(null);
                toast('Selected guide is not available on this date', { icon: '📅' });
            }
        }
    }, [bookingDetails.preferredDate, availableGuides]);

    const handleSubmitBooking = async () => {
        if (!bookingDetails.preferredDate || !bookingDetails.preferredTime) {
            toast.error('Please select a preferred date and time');
            return;
        }

        if (!selectedGuide) {
            toast.error('Please select a guide');
            return;
        }

        if (!bookingDetails.meetingPoint) {
            toast.error('Please select a meeting point');
            return;
        }

        // Convert AM/PM to actual time for the booking
        // Morning: 8am-12pm, Afternoon: 1pm-5pm
        const timeHour = bookingDetails.preferredTime === 'AM' ? '08:00' : '13:00';
        const preferredDateTime = new Date(`${bookingDetails.preferredDate}T${timeHour}`);

        setSubmitting(true);
        try {
            await api.post('/bookings', {
                itineraryId,
                guideId: selectedGuide._id,
                tripDetails: {
                    title: itinerary.name,
                    preferredDate: preferredDateTime,
                    numberOfPeople: bookingDetails.numberOfPeople,
                    notes: bookingDetails.notes,
                    priorityAssistance: bookingDetails.priorityAssistance,
                    meetingPoint: bookingDetails.meetingPoint,
                },
            });

            toast.success('Booking request sent!');
            navigate('/dashboard');
        } catch (error) {
            // Detect if backend returned 409
            if (error.response?.status === 409) {
                toast.error(error.response.data.message);

                // Trigger refresh function
                fetchData(); // or whatever function you use to reload guides
            } else {
                toast.error(error.response?.data?.message || "Failed to create booking");
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-73px)]">
                    <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50">
            <Navbar />
            
            {/* Header */}
            <div className="bg-white border-b border-stone-200">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-4"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>
                    <h1 className="text-2xl font-serif font-semibold text-stone-800">
                        Book a Guide
                    </h1>
                    <p className="text-stone-500 mt-1">
                        Connect with a local guide for your Intramuros tour
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left - Booking Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Itinerary Summary */}
                        <div className="bg-white rounded-xl border border-stone-200 p-6">
                            <h2 className="font-semibold text-stone-800 mb-4">
                                Itinerary: {itinerary?.name}
                            </h2>
                            <div className="flex items-center gap-4 text-sm text-stone-500 mb-4">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {itinerary?.locations?.length || 0} stops
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    ~{(itinerary?.locations?.length || 0) * 30} min
                                </span>
                            </div>
                            <div className="space-y-2">
                                {itinerary?.locations?.map((loc, index) => (
                                    <div key={loc.placeId} className="flex items-center gap-3 text-sm">
                                        <div className="w-6 h-6 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center text-xs font-semibold">
                                            {index + 1}
                                        </div>
                                        <span className="text-stone-700">{loc.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Trip Details */}
                        <div className="bg-white rounded-xl border border-stone-200 p-6">
                            <h2 className="font-semibold text-stone-800 mb-4">
                                Trip Details
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Number of People <span className="text-stone-400 font-normal">(max {MAX_PEOPLE})</span>
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                        <input
                                            type="number"
                                            min="1"
                                            max={MAX_PEOPLE}
                                            value={bookingDetails.numberOfPeople}
                                            onChange={(e) => setBookingDetails(prev => ({ ...prev, numberOfPeople: Math.min(Math.max(parseInt(e.target.value) || 1, 1), MAX_PEOPLE) }))}
                                            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Meeting Point
                                    </label>
                                    <select
                                        value={bookingDetails.meetingPoint}
                                        onChange={(e) => setBookingDetails(prev => ({ ...prev, meetingPoint: e.target.value }))}
                                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                                    >
                                        <option value="">Select meeting point...</option>
                                        {MEETING_POINTS.map(point => (
                                            <option key={point} value={point}>{point}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Priority Assistance */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Priority Assistance <span className="text-stone-400 font-normal">(optional)</span>
                                </label>
                                <p className="text-xs text-stone-500 mb-3">Let the guide know if anyone in your group needs special assistance</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {PRIORITY_OPTIONS.map(option => {
                                        const Icon = option.icon;
                                        const isSelected = bookingDetails.priorityAssistance.includes(option.id);
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => {
                                                    setBookingDetails(prev => ({
                                                        ...prev,
                                                        priorityAssistance: isSelected
                                                            ? prev.priorityAssistance.filter(id => id !== option.id)
                                                            : [...prev.priorityAssistance, option.id]
                                                    }));
                                                }}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-left text-sm ${
                                                    isSelected
                                                        ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                                                        : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                                                }`}
                                            >
                                                <Icon className="w-4 h-4 flex-shrink-0" />
                                                <span>{option.label}</span>
                                                {isSelected && <CheckCircle className="w-4 h-4 ml-auto text-terracotta-600" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-stone-700 mb-2">
                                    Additional Notes (optional)
                                </label>
                                <textarea
                                    value={bookingDetails.notes}
                                    onChange={(e) => setBookingDetails(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Any special requests or information for the guide..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* Select Date & Time */}
                        <div className="bg-white rounded-xl border border-stone-200 p-6">
                            <h2 className="font-semibold text-stone-800 mb-4">
                                Select Date & Time
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Preferred Date
                                    </label>
                                    <div className="relative">
                                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                        <input
                                            type="date"
                                            value={bookingDetails.preferredDate}
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredDate: e.target.value }))}
                                            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Preferred Time
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setBookingDetails(prev => ({ ...prev, preferredTime: 'AM' }))}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                                                bookingDetails.preferredTime === 'AM'
                                                    ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                                                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                                            }`}
                                        >
                                            <Sun className="w-4 h-4" />
                                            <span className="font-medium">Morning</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBookingDetails(prev => ({ ...prev, preferredTime: 'PM' }))}
                                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                                                bookingDetails.preferredTime === 'PM'
                                                    ? 'border-terracotta-500 bg-terracotta-50 text-terracotta-700'
                                                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                                            }`}
                                        >
                                            <Sunset className="w-4 h-4" />
                                            <span className="font-medium">Afternoon</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Select Guide */}
                        <div className="bg-white rounded-xl border border-stone-200 p-6">
                            <h2 className="font-semibold text-stone-800 mb-2">
                                Select a Guide
                            </h2>
                            <p className="text-sm text-stone-500 mb-4">
                                {bookingDetails.preferredDate 
                                    ? `Showing guides available on ${formatDisplayDate(bookingDetails.preferredDate)}`
                                    : 'Please select a date first to see available guides'
                                }
                            </p>
                            {!bookingDetails.preferredDate ? (
                                <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                                    <CalendarDays className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500">Select a date above to see available guides</p>
                                </div>
                            ) : availableGuides.length === 0 ? (
                                <div className="text-center py-8">
                                    <User className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500">No guides available on this date</p>
                                    <p className="text-sm text-stone-400 mt-1">Try selecting a different date</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {availableGuides.map((guide) => (
                                        <button
                                            key={guide._id}
                                            onClick={() => setSelectedGuide(guide)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                                                selectedGuide?._id === guide._id
                                                    ? 'border-terracotta-500 bg-terracotta-50'
                                                    : 'border-stone-200 hover:border-stone-300 bg-white'
                                            }`}
                                        >
                                            <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {guide.profilePicture ? (
                                                    <img 
                                                        src={guide.profilePicture} 
                                                        alt={guide.fullName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sage-700 font-semibold text-lg">
                                                        {guide.fullName?.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="flex items-center gap-2 font-medium text-stone-800">
                                                    <span>{guide.fullName}</span>
                                                    {guide.totalStars > 0 && guide.totalRatings > 0 && (
                                                        <span className="flex items-center gap-1 text-sm text-stone-600">
                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                            <span>{(guide.totalStars / guide.totalRatings).toFixed(1)}</span>
                                                            <span className="text-stone-400">
                                                                ({guide.totalRatings})
                                                            </span>
                                                        </span>
                                                    )}
                                                </p>
                                                {guide.contactNumber && (
                                                    <p className="text-sm text-stone-500 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {guide.contactNumber}
                                                    </p>
                                                )}
                                            </div>

                                            {/* RIGHT SIDE */}
                                            <div className="flex items-center gap-2 ml-auto">
                                                {selectedGuide?._id === guide._id ? (
                                                    <CheckCircle className="w-5 h-5 text-terracotta-600 flex-shrink-0" />
                                                ) : (
                                                    <div className="w-5 h-5 border-2 border-stone-300 rounded-full flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right - Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-stone-200 p-6 sticky top-4">
                            <h3 className="font-semibold text-stone-800 mb-4">
                                Booking Summary
                            </h3>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Itinerary</span>
                                    <span className="text-stone-800 font-medium">{itinerary?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-stone-500">Stops</span>
                                    <span className="text-stone-800">{itinerary?.locations?.length || 0}</span>
                                </div>
                                {bookingDetails.preferredDate && (
                                    <div className="flex justify-between gap-2">
                                        <span className="text-stone-500 flex-shrink-0">Date</span>
                                        <span className="text-stone-800 text-right truncate">
                                            {formatDisplayDate(bookingDetails.preferredDate)}
                                        </span>
                                    </div>
                                )}
                                {bookingDetails.preferredTime && (
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">Time</span>
                                        <span className="text-stone-800">
                                            {bookingDetails.preferredTime === 'AM' ? 'Morning' : 'Afternoon'}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-stone-500">People</span>
                                    <span className="text-stone-800">{bookingDetails.numberOfPeople}</span>
                                </div>
                                {selectedGuide && (
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">Guide</span>
                                        <span className="text-stone-800">{selectedGuide.fullName}</span>
                                    </div>
                                )}
                                {bookingDetails.meetingPoint && (
                                    <div className="flex justify-between gap-2">
                                        <span className="text-stone-500 flex-shrink-0">Meeting Point</span>
                                        <span className="text-stone-800 text-right">{bookingDetails.meetingPoint}</span>
                                    </div>
                                )}
                            </div>

                            {/* Pricing Section */}
                            <div className="border-t border-stone-200 mt-4 pt-4 space-y-2">
                                <h4 className="font-medium text-stone-800 mb-2">Pricing</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">
                                        {bookingDetails.numberOfPeople} {bookingDetails.numberOfPeople === 1 ? 'person' : 'people'} × ₱{PRICE_PER_PERSON}
                                    </span>
                                    <span className="text-stone-800">
                                        ₱{bookingDetails.numberOfPeople * PRICE_PER_PERSON}
                                    </span>
                                </div>
                                <div className="flex justify-between font-semibold text-base pt-2 border-t border-stone-100">
                                    <span className="text-stone-700">Total</span>
                                    <span className="text-terracotta-600">
                                        ₱{bookingDetails.numberOfPeople * PRICE_PER_PERSON}
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-stone-200 mt-4 pt-4">
                                <button
                                    onClick={handleSubmitBooking}
                                    disabled={submitting || !selectedGuide || !bookingDetails.preferredDate || !bookingDetails.preferredTime || !bookingDetails.meetingPoint}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'Send Booking Request'
                                    )}
                                </button>
                                <p className="text-xs text-stone-500 text-center mt-2">
                                    The guide will review and accept your request
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default BookingPage;

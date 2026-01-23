import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { 
    MapPin, Calendar, Users, Clock, ChevronLeft, Loader2, 
    CheckCircle, User, Phone, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../lib/axios';

const BookingPage = () => {
    const { itineraryId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [itinerary, setItinerary] = useState(null);
    const [availableGuides, setAvailableGuides] = useState([]);
    const [selectedGuide, setSelectedGuide] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [bookingDetails, setBookingDetails] = useState({
        preferredDate: '',
        numberOfPeople: 1,
        notes: '',
    });

    useEffect(() => {
        fetchData();
    }, [itineraryId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch itinerary details
            const itineraryRes = await api.get(`/itineraries/${itineraryId}`);
            setItinerary(itineraryRes.data);
            
            // Pre-fill booking details from itinerary
            if (itineraryRes.data.preferredDate) {
                setBookingDetails(prev => ({
                    ...prev,
                    preferredDate: itineraryRes.data.preferredDate.split('T')[0],
                    numberOfPeople: itineraryRes.data.numberOfPeople || 1,
                }));
            }

            // Fetch available guides
            try {
                const guidesRes = await api.get('/users/guides');
                setAvailableGuides(guidesRes.data);
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

    const handleSubmitBooking = async () => {
        if (!bookingDetails.preferredDate) {
            toast.error('Please select a preferred date');
            return;
        }

        if (!selectedGuide) {
            toast.error('Please select a guide');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/bookings', {
                itineraryId,
                guideId: selectedGuide._id,
                tripDetails: {
                    title: itinerary.name,
                    preferredDate: bookingDetails.preferredDate,
                    numberOfPeople: bookingDetails.numberOfPeople,
                    notes: bookingDetails.notes,
                },
            });

            toast.success('Booking request sent!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
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
                                        Preferred Date
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                        <input
                                            type="date"
                                            value={bookingDetails.preferredDate}
                                            onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredDate: e.target.value }))}
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-2">
                                        Number of People
                                    </label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={bookingDetails.numberOfPeople}
                                            onChange={(e) => setBookingDetails(prev => ({ ...prev, numberOfPeople: parseInt(e.target.value) || 1 }))}
                                            className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-500"
                                        />
                                    </div>
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

                        {/* Select Guide */}
                        <div className="bg-white rounded-xl border border-stone-200 p-6">
                            <h2 className="font-semibold text-stone-800 mb-4">
                                Select a Guide
                            </h2>
                            {availableGuides.length === 0 ? (
                                <div className="text-center py-8">
                                    <User className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                    <p className="text-stone-500">No guides available at the moment</p>
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
                                        <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-sage-700 font-semibold text-lg">
                                                {guide.fullName?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-stone-800">
                                                {guide.fullName}
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
                                            <span className="w-3 h-3 rounded-full bg-green-500" />
                                            {selectedGuide?._id === guide._id && (
                                                <CheckCircle className="w-5 h-5 text-terracotta-600 flex-shrink-0" />
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
                                    <div className="flex justify-between">
                                        <span className="text-stone-500">Date</span>
                                        <span className="text-stone-800">
                                            {formatDate(bookingDetails.preferredDate)}
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
                            </div>

                            <div className="border-t border-stone-200 mt-4 pt-4">
                                <button
                                    onClick={handleSubmitBooking}
                                    disabled={submitting || !selectedGuide || !bookingDetails.preferredDate}
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

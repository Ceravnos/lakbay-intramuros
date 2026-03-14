import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { 
    MapPin, Plus, X, Navigation, Trash2, Save, GripVertical, 
    Calendar, Users, ChevronLeft, Loader2, Route, Clock, Sparkles, 
    Filter, Play, Settings, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import api from '../lib/axios';
import { clearPostAuthItineraryHandoff, getTransferredSessionItinerary } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import IntramurosMap from '../components/Map/IntramurosMap';
import ConfirmationModal from '../components/ConfirmationModal';
import RevisionReviewModal from '../components/RevisionReviewModal';
import { 
    INTRAMUROS_LOCATIONS, 
    LOCATION_CATEGORIES, 
    generateSmartItinerary, 
    calculateTotalTime 
} from '../data/locations';

const TRIP_PROGRESS_STORAGE_KEY = 'lakbay_itinerary_trip_progress';

const readTripProgressMap = () => {
    if (typeof window === 'undefined') return {};

    try {
        return JSON.parse(window.localStorage.getItem(TRIP_PROGRESS_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

const writeTripProgress = (itineraryId, progress) => {
    if (typeof window === 'undefined' || !itineraryId) return;

    const currentProgress = readTripProgressMap();

    window.localStorage.setItem(
        TRIP_PROGRESS_STORAGE_KEY,
        JSON.stringify({
            ...currentProgress,
            [itineraryId]: progress,
        })
    );
};

const clearTripProgress = (itineraryId) => {
    if (typeof window === 'undefined' || !itineraryId) return;

    const currentProgress = readTripProgressMap();

    if (!(itineraryId in currentProgress)) return;

    delete currentProgress[itineraryId];
    window.localStorage.setItem(TRIP_PROGRESS_STORAGE_KEY, JSON.stringify(currentProgress));
};

const getTodayDateInputValue = () => new Date().toISOString().split('T')[0];
const getBookingItineraryId = (booking) => booking?.itineraryId?._id || booking?.itineraryId;
const normalizeLocations = (locations = []) =>
    locations.map((location, index) => ({
        ...location,
        order: typeof location.order === 'number' ? location.order : index,
        notes: location.notes || '',
    }));

const ItineraryBuilderPage = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    
    const [itinerary, setItinerary] = useState({
        name: 'My Intramuros Trip',
        description: '',
        locations: [],
        preferredDate: getTodayDateInputValue(),
        numberOfPeople: 1,
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [bookingRedirectLoading, setBookingRedirectLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    
    // Magic Generate uses saved preferences directly (no modal needed)
    
    // Directions state (only for authenticated users)
    const [directionsResult, setDirectionsResult] = useState(null);
    const [tripStarted, setTripStarted] = useState(false);
    const [calculatingRoute, setCalculatingRoute] = useState(false);
    const [completedStopCount, setCompletedStopCount] = useState(0);
    const [finishModalOpen, setFinishModalOpen] = useState(false);
    
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
    const [revisionBooking, setRevisionBooking] = useState(null);
    const [revisionModalOpen, setRevisionModalOpen] = useState(false);
    const [revisionPreviewApplied, setRevisionPreviewApplied] = useState(false);
    const [acceptRevisionLoading, setAcceptRevisionLoading] = useState(false);
    const [cancelRevisionLoading, setCancelRevisionLoading] = useState(false);
    const [backWarningModalOpen, setBackWarningModalOpen] = useState(false);
    const previousLocationsLengthRef = useRef(itinerary.locations.length);
    const tripProgressHydratedRef = useRef(false);
    const loadItineraryIntoBuilder = useCallback((nextItinerary, options = {}) => {
        if (!nextItinerary) return;

        const { resetProgress = false } = options;
        const normalizedLocations = normalizeLocations(nextItinerary.locations || []);

        previousLocationsLengthRef.current = normalizedLocations.length;

        if (resetProgress) {
            setDirectionsResult(null);
            setTripStarted(false);
            setCompletedStopCount(0);
            setFinishModalOpen(false);
            clearTripProgress(id);
        }

        setItinerary(prev => ({
            ...prev,
            ...nextItinerary,
            locations: normalizedLocations,
            preferredDate: nextItinerary.preferredDate || prev.preferredDate,
            numberOfPeople: nextItinerary.numberOfPeople || prev.numberOfPeople || 1,
        }));
    }, [id]);

    // Load existing itinerary or session data
    useEffect(() => {
        setDirectionsResult(null);
        setTripStarted(false);
        setCompletedStopCount(0);
        setFinishModalOpen(false);
        setRevisionBooking(null);
        setRevisionModalOpen(false);
        setRevisionPreviewApplied(false);
        tripProgressHydratedRef.current = !id;
        previousLocationsLengthRef.current = 0;

        if (id) {
            fetchItinerary(id);
            fetchBookingContext(id, {
                openRevisionModal: Boolean(location.state?.revisionBookingId || location.state?.openRevisionModal),
            });
        } else {
            const transferredSessionItinerary = getTransferredSessionItinerary(location.state);

            if (transferredSessionItinerary?.length) {
                const sessionLocations = normalizeLocations(
                    transferredSessionItinerary.map((item) => ({
                        placeId: item.placeId || item.id,
                        name: item.name,
                        address: item.address || '',
                        lat: item.lat,
                        lng: item.lng,
                        notes: '',
                    }))
                );
                previousLocationsLengthRef.current = sessionLocations.length;
                setItinerary(prev => ({ 
                    ...prev, 
                    locations: sessionLocations,
                    preferredDate: prev.preferredDate || getTodayDateInputValue(),
                }));
            }

            clearPostAuthItineraryHandoff();
        }
    }, [id, location.state]);

    const fetchItinerary = async (itineraryId) => {
        setLoading(true);
        try {
            const res = await api.get(`/itineraries/${itineraryId}`);
            const nextItinerary = {
                ...res.data,
                locations: normalizeLocations(res.data.locations || []),
            };

            setItinerary(nextItinerary);

            const savedProgress = readTripProgressMap()[itineraryId];
            const totalStops = nextItinerary.locations.length || 0;
            const restoredCompletedStopCount = Math.min(savedProgress?.completedStopCount || 0, totalStops);

            previousLocationsLengthRef.current = totalStops;
            setCompletedStopCount(restoredCompletedStopCount);
            setTripStarted(Boolean(savedProgress?.tripStarted) && restoredCompletedStopCount < totalStops);
            setFinishModalOpen(false);
            tripProgressHydratedRef.current = true;
        } catch (error) {
            toast.error('Failed to load itinerary');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookingContext = useCallback(async (itineraryId, options = {}) => {
        const { openRevisionModal = false } = options;

        try {
            const res = await api.get(`/bookings/itinerary/${itineraryId}/context`);
            const activeBookingFound = res.data?.booking || null;

            setIsReadOnly(Boolean(activeBookingFound));
            setActiveBooking(activeBookingFound);

            if (activeBookingFound?.revisionRequested) {
                setRevisionBooking(activeBookingFound);
                if (openRevisionModal) {
                    setRevisionModalOpen(true);
                }
            } else {
                setRevisionBooking(null);
                setRevisionModalOpen(false);
                setRevisionPreviewApplied(false);
            }
        } catch (error) {
            console.error('Failed to check ongoing tour:', error);
        }
    }, []);

    const handleBookGuide = async () => {
        if (!itinerary.preferredDate) {
            toast.error('Please select a date before booking a guide');
            return;
        }

        setBookingRedirectLoading(true);

        const bookingState = {
            preferredDate: itinerary.preferredDate,
            numberOfPeople: itinerary.numberOfPeople || 1,
        };

        try {
            const selectedDate = itinerary.preferredDate.split('T')[0];
            const guidesRes = await api.get(`/users/guides?date=${selectedDate}`);

            navigate(`/book/${id}`, {
                state: {
                    ...bookingState,
                    prefetchedGuides: guidesRes.data,
                    prefetchedGuidesDate: selectedDate,
                    prefetchedGuidesFetchedAt: Date.now(),
                }
            });
        } catch (error) {
            navigate(`/book/${id}`, {
                state: bookingState,
            });
        } finally {
            setBookingRedirectLoading(false);
        }
    };

    const handleReviewRevision = useCallback((booking) => {
        if (!booking?.proposedItinerary) {
            toast.error('No proposed itinerary available to review');
            return;
        }

        loadItineraryIntoBuilder(
            {
                ...itinerary,
                locations: booking.proposedItinerary.locations?.length > 0
                    ? booking.proposedItinerary.locations
                    : itinerary.locations,
                preferredDate: booking.proposedItinerary.preferredDate || itinerary.preferredDate,
                numberOfPeople: booking.proposedItinerary.numberOfPeople || itinerary.numberOfPeople,
            },
            { resetProgress: true }
        );
        setRevisionPreviewApplied(true);
        setRevisionModalOpen(false);
        toast.success('Guide changes loaded on the map');
    }, [itinerary, loadItineraryIntoBuilder]);

    const handleAcceptRevision = async () => {
        if (!revisionBooking?._id) return;

        setAcceptRevisionLoading(true);
        try {
            const res = await api.put(`/bookings/${revisionBooking._id}/accept-revision`);
            const updatedBooking = res.data.booking;

            loadItineraryIntoBuilder(updatedBooking.itineraryId, { resetProgress: true });
            setActiveBooking(updatedBooking);
            setIsReadOnly(true);
            setRevisionBooking(null);
            setRevisionModalOpen(false);
            setRevisionPreviewApplied(false);
            toast.success('Revision accepted! Booking moved to awaiting payment.');
            window.dispatchEvent(new CustomEvent('booking-update', {
                detail: { type: 'revision-accepted', booking: updatedBooking },
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to accept revision');
        } finally {
            setAcceptRevisionLoading(false);
        }
    };

    const handleCancelRevisionBooking = async () => {
        if (!revisionBooking?._id) return;

        setCancelRevisionLoading(true);
        try {
            const res = await api.put(`/bookings/${revisionBooking._id}/cancel`);
            const updatedBooking = res.data.booking;

            loadItineraryIntoBuilder(updatedBooking.itineraryId, { resetProgress: true });
            setIsReadOnly(false);
            setActiveBooking(null);
            setRevisionBooking(null);
            setRevisionModalOpen(false);
            setRevisionPreviewApplied(false);
            toast.success('Booking cancelled');
            window.dispatchEvent(new CustomEvent('booking-update', {
                detail: { type: 'cancelled', booking: updatedBooking },
            }));
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setCancelRevisionLoading(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        const handleBookingUpdate = (event) => {
            const { type, booking } = event.detail || {};
            const bookingItineraryId = getBookingItineraryId(booking);

            if (bookingItineraryId && bookingItineraryId !== id) {
                return;
            }

            if ((type === 'cancelled' || type === 'revision-accepted') && booking?.itineraryId) {
                loadItineraryIntoBuilder(booking.itineraryId, { resetProgress: true });
            }

            fetchBookingContext(id, {
                openRevisionModal: type === 'revision' && bookingItineraryId === id,
            });
        };

        window.addEventListener('booking-update', handleBookingUpdate);
        return () => {
            window.removeEventListener('booking-update', handleBookingUpdate);
        };
    }, [fetchBookingContext, id, loadItineraryIntoBuilder]);

    const handleBackNavigation = () => {
        if (tripStarted) {
            setBackWarningModalOpen(true);
            return;
        }

        navigate('/dashboard');
    };

    const handleSave = async () => {
        if (!itinerary.name.trim()) {
            toast.error('Please enter an itinerary name');
            return;
        }

        if (itinerary.locations.length === 0) {
            toast.error('Please add at least one location to your itinerary');
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
        if (itinerary.locations.length >= 10) {
            toast.error('Maximum of 10 stops allowed');
            return;
        }

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

    const sortedLocations = [...itinerary.locations].sort((a, b) => a.order - b.order);
    const canEditItinerary = !isReadOnly && !tripStarted;
    const isRevisionReviewMode = Boolean(revisionBooking?._id && revisionBooking.revisionRequested);
    const hasTrackedProgress = tripStarted || completedStopCount > 0;
    const progressPercentage = sortedLocations.length > 0
        ? Math.round((completedStopCount / sortedLocations.length) * 100)
        : 0;
    const currentRouteStart = completedStopCount > 0 && completedStopCount < sortedLocations.length
        ? sortedLocations[completedStopCount - 1]
        : null;
    const currentRouteEnd = completedStopCount > 0 && completedStopCount < sortedLocations.length
        ? sortedLocations[completedStopCount]
        : null;

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
        setCompletedStopCount(0);
        setFinishModalOpen(false);
        toast.success(`Generated ${generated.length} stops!`);
    };

    // Start Trip - Calculate directions (authenticated only)
    const calculateSegmentRoute = useCallback(async (originLocation, destinationLocation) => {
        if (!originLocation || !destinationLocation) {
            setDirectionsResult(null);
            return;
        }

        if (!window.google?.maps) {
            toast.error('Map is still loading');
            return;
        }

        setCalculatingRoute(true);

        try {
            const directionsService = new window.google.maps.DirectionsService();
            const result = await new Promise((resolve, reject) => {
                directionsService.route(
                    {
                        origin: { lat: originLocation.lat, lng: originLocation.lng },
                        destination: { lat: destinationLocation.lat, lng: destinationLocation.lng },
                        travelMode: window.google.maps.TravelMode.WALKING,
                        optimizeWaypoints: false,
                    },
                    (routeResult, status) => {
                        if (status === 'OK' && routeResult) {
                            resolve(routeResult);
                            return;
                        }

                        reject(new Error(status));
                    }
                );
            });

            setDirectionsResult(result);
        } catch {
            setDirectionsResult(null);
            toast.error('Could not calculate route');
        } finally {
            setCalculatingRoute(false);
        }
    }, []);

    const handleStartTrip = useCallback(() => {
        if (tripStarted) {
            setDirectionsResult(null);
            setTripStarted(false);
            setFinishModalOpen(false);
            toast.success('Trip paused');
            return;
        }

        if (!isAuthenticated) {
            toast.error('Please login to see routes');
            return;
        }
        
        if (sortedLocations.length === 0) {
            toast.error('Add at least 1 location to start trip');
            return;
        }

        const shouldRestartTrip = completedStopCount >= sortedLocations.length && sortedLocations.length > 0;
        const nextCompletedStopCount = shouldRestartTrip ? 0 : completedStopCount;

        setDirectionsResult(null);
        setTripStarted(true);
        setCompletedStopCount(nextCompletedStopCount);
        setFinishModalOpen(false);

        if (nextCompletedStopCount > 0 && nextCompletedStopCount < sortedLocations.length) {
            calculateSegmentRoute(
                sortedLocations[nextCompletedStopCount - 1],
                sortedLocations[nextCompletedStopCount]
            );
            toast.success('Trip resumed');
            return;
        }

        toast.success(shouldRestartTrip ? 'Trip restarted' : 'Trip started! Complete your first stop to unlock the next route.');
    }, [calculateSegmentRoute, completedStopCount, isAuthenticated, sortedLocations, tripStarted]);

    const handleCompleteStop = useCallback(async (stopIndex) => {
        if (!tripStarted || calculatingRoute || stopIndex !== completedStopCount) {
            return;
        }

        const nextCompletedStopCount = completedStopCount + 1;
        setCompletedStopCount(nextCompletedStopCount);

        if (nextCompletedStopCount >= sortedLocations.length) {
            setDirectionsResult(null);
            setFinishModalOpen(true);
            toast.success('Trip has finished');
            return;
        }

        await calculateSegmentRoute(
            sortedLocations[nextCompletedStopCount - 1],
            sortedLocations[nextCompletedStopCount]
        );
    }, [calculateSegmentRoute, calculatingRoute, completedStopCount, sortedLocations, tripStarted]);

    // Clear route when locations change
    useEffect(() => {
        if (!tripProgressHydratedRef.current) {
            previousLocationsLengthRef.current = itinerary.locations.length;
            return;
        }

        if (
            previousLocationsLengthRef.current !== itinerary.locations.length &&
            (tripStarted || completedStopCount > 0)
        ) {
            setDirectionsResult(null);
            setTripStarted(false);
            setCompletedStopCount(0);
            setFinishModalOpen(false);
            clearTripProgress(id);
        }
        previousLocationsLengthRef.current = itinerary.locations.length;
    }, [completedStopCount, id, itinerary.locations.length, tripStarted]);

    useEffect(() => {
        if (!id || !tripProgressHydratedRef.current) return;

        if (!tripStarted && completedStopCount === 0) {
            clearTripProgress(id);
            return;
        }

        writeTripProgress(id, {
            completedStopCount,
            totalStops: sortedLocations.length,
            tripStarted,
            updatedAt: Date.now(),
        });
    }, [completedStopCount, id, sortedLocations.length, tripStarted]);

    // Calculate total estimated time
    const totalTime = calculateTotalTime(sortedLocations);

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
                                    {isRevisionReviewMode ? 'Revision Requested'
                                        : activeBooking.status === 'paid' ? 'Tour Paid' 
                                        : activeBooking.status === 'awaiting_payment' ? 'Awaiting Payment'
                                        : activeBooking.status === 'accepted' ? 'Tour in Progress' 
                                        : 'Booking Pending'}
                                </p>
                                {activeBooking.status !== 'paid' && (
                                <p className="text-xs text-sage-600">
                                    {isRevisionReviewMode
                                        ? `${activeBooking.guideId?.fullName || 'Your guide'} asked you to review itinerary changes before the booking moves to payment.`
                                        : activeBooking.status === 'awaiting_payment'
                                        ? `Waiting for payment to confirm tour with ${activeBooking.guideId?.fullName || 'your guide'}`
                                        : activeBooking.status === 'accepted'
                                        ? `This itinerary is currently being used for an active tour with ${activeBooking.guideId?.fullName || 'your guide'}`
                                        : `This itinerary has a pending booking request with ${activeBooking.guideId?.fullName || 'a guide'}`
                                    }
                                </p>
                                )}
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
                        markers={sortedLocations
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
                        tripStarted={tripStarted}
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
                    {canEditItinerary && (
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
                                onClick={handleBackNavigation}
                                className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>
                            {canEditItinerary && (
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
                            onChange={(e) => canEditItinerary && setItinerary(prev => ({ ...prev, name: e.target.value }))}
                            readOnly={!canEditItinerary}
                            className={`w-full text-lg font-serif font-semibold text-stone-800 bg-transparent border-b border-transparent ${canEditItinerary ? 'hover:border-stone-200 focus:border-terracotta-500' : ''} focus:outline-none transition-colors mb-2 pb-1`}
                            placeholder="Name your itinerary..."
                        />
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {/* Start Trip Button */}
                            {isAuthenticated ? (
                                <button
                                    onClick={handleStartTrip}
                                    disabled={calculatingRoute || (!tripStarted && sortedLocations.length === 0)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all ${
                                        tripStarted
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'bg-sage-600 hover:bg-sage-700 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {calculatingRoute ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        tripStarted ? <X className="w-4 h-4" /> : <Play className="w-4 h-4" />
                                    )}
                                    {tripStarted
                                        ? 'Pause Trip'
                                        : completedStopCount >= sortedLocations.length && sortedLocations.length > 0
                                            ? 'Restart Trip'
                                            : completedStopCount > 0
                                                ? 'Resume Trip'
                                                : 'Start Trip'}
                                </button>
                            ) : (
                                <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-stone-100 text-stone-500 rounded-lg text-sm">
                                    <Lock className="w-4 h-4" />
                                    Login to see routes
                                </div>
                            )}
                        </div>
                        {hasTrackedProgress && (
                            <div className="mt-3 rounded-xl border border-sage-200 bg-sage-50 p-3">
                                <div className="flex items-center justify-between text-xs font-medium text-sage-700">
                                    <span>{completedStopCount} of {sortedLocations.length} stops completed</span>
                                    <span>{progressPercentage}%</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-white overflow-hidden">
                                    <div
                                        className="h-full bg-sage-600 transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-sage-700">
                                    {completedStopCount >= sortedLocations.length
                                        ? 'You completed every stop in this itinerary.'
                                        : !tripStarted && completedStopCount > 0
                                            ? 'Your trip is paused. Resume whenever you are ready.'
                                        : completedStopCount === 0
                                            ? sortedLocations.length > 1
                                                ? 'Complete Stop 1 to show the route to Stop 2.'
                                                : 'Complete Stop 1 to finish your trip.'
                                            : currentRouteStart && currentRouteEnd
                                                ? `Current route: ${currentRouteStart.name} to ${currentRouteEnd.name}.`
                                                : ''}
                                </p>
                                {tripStarted && (
                                    <p className="mt-1 text-xs text-stone-500">
                                        Editing is disabled while your trip is active.
                                    </p>
                                )}
                            </div>
                        )}
                        {isRevisionReviewMode && (
                            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                <p className="text-sm font-medium text-amber-800">
                                    {revisionPreviewApplied ? 'Reviewing guide changes on the map' : 'Guide changes ready for review'}
                                </p>
                                <p className="mt-1 text-xs text-amber-700">
                                    {revisionPreviewApplied
                                        ? 'Use Accept to confirm the revised itinerary and move this booking to awaiting payment, or Cancel to drop the booking.'
                                        : 'Open the revision modal to review the guide’s proposed route before accepting or cancelling the booking.'}
                                </p>
                            </div>
                        )}
                        
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
                            {hasTrackedProgress && (
                                <span className="flex items-center gap-1 text-sage-600">
                                    <Route className="w-3.5 h-3.5" />
                                    {completedStopCount >= sortedLocations.length
                                        ? 'Trip complete'
                                        : tripStarted
                                            ? `${completedStopCount}/${sortedLocations.length} complete`
                                            : `Paused at ${completedStopCount}/${sortedLocations.length}`}
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
                                        onChange={(e) => canEditItinerary && setItinerary(prev => ({ ...prev, preferredDate: e.target.value }))}
                                        disabled={!canEditItinerary}
                                        className={`w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500 ${!canEditItinerary ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                        onChange={(e) => canEditItinerary && setItinerary(prev => ({ ...prev, numberOfPeople: Math.min(15, Math.max(1, parseInt(e.target.value) || 1)) }))}
                                        disabled={!canEditItinerary}
                                        className={`w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500 ${!canEditItinerary ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                    {sortedLocations
                                        .map((location, index) => (
                                            <div
                                                key={location.placeId}
                                                draggable={canEditItinerary}
                                                onDragStart={(e) => canEditItinerary && handleDragStart(e, index)}
                                                onDragOver={(e) => canEditItinerary && handleDragOver(e, index)}
                                                onDragEnd={canEditItinerary ? handleDragEnd : undefined}
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
                                                        {tripStarted ? (
                                                        <button
                                                            onClick={() => handleCompleteStop(index)}
                                                            disabled={calculatingRoute || index !== completedStopCount || completedStopCount >= sortedLocations.length}
                                                            className={`w-5 h-5 rounded border flex items-center justify-center text-xs font-semibold transition-colors ${
                                                                index < completedStopCount
                                                                    ? 'bg-sage-600 border-sage-600 text-white'
                                                                    : index === completedStopCount
                                                                        ? 'border-sage-500 text-sage-600 hover:bg-sage-100'
                                                                        : 'border-stone-300 text-stone-300 cursor-not-allowed'
                                                            } disabled:hover:bg-transparent`}
                                                        >
                                                            {index < completedStopCount ? '✓' : ''}
                                                        </button>
                                                        ) : (
                                                        !isReadOnly && (
                                                        <GripVertical className="w-4 h-4 text-stone-400 cursor-grab active:cursor-grabbing hover:text-stone-600" />
                                                        )
                                                        )}
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
                                                            index < completedStopCount
                                                                ? 'bg-sage-100 text-sage-700'
                                                                : 'bg-terracotta-100 text-terracotta-600'
                                                        }`}>
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
                                                        {tripStarted && (
                                                            <p className="mt-1 text-[11px] font-medium text-sage-700">
                                                                {index < completedStopCount
                                                                    ? 'Completed'
                                                                    : index === completedStopCount
                                                                        ? 'Current stop'
                                                                        : 'Upcoming'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {canEditItinerary && (
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
                                                        onChange={(e) => canEditItinerary && updateLocationNotes(location.placeId, e.target.value)}
                                                        readOnly={!canEditItinerary}
                                                        placeholder={!canEditItinerary ? '' : 'Add notes...'}
                                                        className={`w-full px-2 py-1.5 bg-white border border-stone-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-terracotta-500 ${!canEditItinerary ? 'cursor-default' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Book Guide Button - Hidden in read-only mode */}
                    {itinerary.locations.length > 0 && id && isRevisionReviewMode && (
                        <div className="p-4 border-t border-stone-200 space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleCancelRevisionBooking}
                                    disabled={cancelRevisionLoading || acceptRevisionLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-3 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {cancelRevisionLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Cancelling...
                                        </>
                                    ) : (
                                        <>
                                            <X className="w-4 h-4" />
                                            Cancel
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleAcceptRevision}
                                    disabled={acceptRevisionLoading || cancelRevisionLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {acceptRevisionLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Accepting...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-4 h-4" />
                                            Accept
                                        </>
                                    )}
                                </button>
                            </div>
                            <button
                                onClick={() => setRevisionModalOpen(true)}
                                className="w-full text-xs font-medium text-sage-700 hover:text-sage-800 transition-colors"
                            >
                                Re-open revision summary
                            </button>
                        </div>
                    )}
                    {itinerary.locations.length > 0 && id && !isRevisionReviewMode && canEditItinerary && (
                        <div className="p-4 border-t border-stone-200">
                            <button
                                onClick={handleBookGuide}
                                disabled={bookingRedirectLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {bookingRedirectLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Loading Guides...
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-4 h-4" />
                                        Book a Guide
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {finishModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Route className="w-6 h-6 text-sage-600" />
                            </div>
                            <h2 className="font-serif font-semibold text-stone-800 text-xl">Trip has finished</h2>
                            <p className="text-sm text-stone-500 mt-2">
                                You completed all {sortedLocations.length} stops. Click Pause Trip to leave route mode while keeping your progress.
                            </p>
                        </div>
                        <div className="p-4 border-t border-stone-200 bg-stone-50">
                            <button
                                onClick={() => setFinishModalOpen(false)}
                                className="w-full px-4 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Okay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={backWarningModalOpen}
                onClose={() => setBackWarningModalOpen(false)}
                onConfirm={() => setBackWarningModalOpen(false)}
                title="Trip Ongoing"
                message="Your trip is ongoing. Please pause the trip first before going back to the itinerary dashboard."
                confirmText="Okay"
                cancelText="Stay Here"
                confirmButtonClass="bg-terracotta-600 hover:bg-terracotta-700"
            />

            <RevisionReviewModal
                isOpen={revisionModalOpen}
                onClose={() => setRevisionModalOpen(false)}
                booking={revisionBooking}
                onReview={handleReviewRevision}
            />

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
                                    {Object.values(LOCATION_CATEGORIES).filter(c => c.id !== 'all').map((cat) => (
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

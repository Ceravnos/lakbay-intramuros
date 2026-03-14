import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Compass, Clock, CheckCircle, Calendar, Users, MapPin,
  RefreshCw, User, Phone, Mail, ChevronRight, ChevronLeft,
  History, ClipboardList, Loader2, AlertCircle,
  XCircle, CalendarOff, Plus, X, Eye, Bell,
  Accessibility, Baby, Heart, Play, CalendarCheck, CreditCard
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";
import Navbar from "../../components/Navbar"
import ConfirmationModal from "../../components/ConfirmationModal"
import ItineraryViewModal from "../../components/ItineraryViewModal"
import ItineraryEditModal from "../../components/ItineraryEditModal"
import GuideOngoingTourPanel from "../../components/GuideOngoingTourPanel"

const GuideDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [scheduledSubTab, setScheduledSubTab] = useState("pending_payment");
  const [pendingBookings, setPendingBookings] = useState([]);
  const [scheduledBookings, setScheduledBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [rejectedBookings, setRejectedBookings] = useState([]);
  const [selectedOngoingBookingId, setSelectedOngoingBookingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  
  // Availability management state
  const [unavailableDates, setUnavailableDates] = useState(user?.unavailableDates || []);
  const [selectedDates, setSelectedDates] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Reject confirmation modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  
  // Itinerary view modal state
  const [itineraryModalOpen, setItineraryModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [revisionLoading, setRevisionLoading] = useState(false);
  
  // Itinerary edit modal state (for revision requests)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  
  // Complete confirmation modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeBookingId, setCompleteBookingId] = useState(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  
  // Start trip confirmation modal state
  const [startTripModalOpen, setStartTripModalOpen] = useState(false);
  const [startTripBookingId, setStartTripBookingId] = useState(null);
  const [startTripLoading, setStartTripLoading] = useState(false);
  
  // Priority assistance labels
  const PRIORITY_LABELS = {
    pwd: { label: 'PWD', icon: Accessibility },
    pregnant: { label: 'Pregnant', icon: Baby },
    senior: { label: 'Senior', icon: Heart },
    locomotive: { label: 'Locomotive', icon: AlertCircle },
  };
  
  const fetchBookings = useCallback(async (options = {}) => {
      const { background = false } = options;
      if (!background) {
          setLoading(true);
          setError(null);
      }
      try {
          const res = await api.get("/bookings/guide-dashboard");
          setPendingBookings(res.data.pendingBookings || []);
          setScheduledBookings(res.data.scheduledBookings || []);
          setActiveBookings(res.data.activeBookings || []);
          setCompletedBookings(res.data.completedBookings || []);
          setRejectedBookings(res.data.rejectedBookings || []);
          setUnavailableDates(res.data.unavailableDates || []);
          setError(null);
          return res.data;
      } catch (err) {
          console.error(err);
          if (background) {
              return null;
          }
          const errorMessage = err.response?.data?.message || "Failed to fetch bookings";
          setError(errorMessage);
          
          if (err.response?.status === 403) {
              try {
                  await refreshUser();
                  toast.info("Your account status has been updated. Please try again.");
              } catch (refreshErr) {
                  console.error("Failed to refresh user:", refreshErr);
              }
          } else {
              toast.error(errorMessage);
          }
          return null;
      } finally {
          if (!background) {
              setLoading(false);
          }
      }
  }, [refreshUser]);

  useEffect(() => {
      fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
      setUnavailableDates(user?.unavailableDates || []);
  }, [user?.unavailableDates]);

  useEffect(() => {
      if (activeBookings.length === 0) {
          setSelectedOngoingBookingId(null);
          return;
      }

      const hasSelectedBooking = activeBookings.some(booking => booking._id === selectedOngoingBookingId);
      if (!hasSelectedBooking) {
          setSelectedOngoingBookingId(activeBookings[0]._id);
      }
  }, [activeBookings, selectedOngoingBookingId]);

  // Listen for real-time booking updates via WebSocket
  useEffect(() => {
      const handleBookingUpdate = (event) => {
          const { type } = event.detail;
          // Refresh bookings on any booking update
          if (type === 'new' || type === 'accepted' || type === 'rejected' || type === 'completed' || type === 'updated' || type === 'revision-accepted' || type === 'payment-paid' || type === 'started' || type === 'cancelled') {
              fetchBookings({ background: true });
          }
      };

      window.addEventListener('booking-update', handleBookingUpdate);
      return () => {
          window.removeEventListener('booking-update', handleBookingUpdate);
      };
  }, [fetchBookings]);

  // Toggle date selection (local state only)
  const handleToggleDateSelection = (dateStr) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  // Check if date is selected
  const isDateSelected = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return selectedDates.includes(dateStr);
  };

  // Mark selected dates as unavailable
  const handleMarkUnavailable = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    const newDates = [
      ...unavailableDates,
      ...selectedDates.map(d => new Date(d).toISOString())
    ];

    // Remove duplicates
    const uniqueDates = [...new Set(newDates.map(d => new Date(d).toISOString().split('T')[0]))]
      .map(d => new Date(d).toISOString());

    setAvailabilityLoading(true);
    try {
      const res = await api.put('/users/unavailable-dates', {
        unavailableDates: uniqueDates
      });
      setUnavailableDates(res.data.unavailableDates);
      setSelectedDates([]);
      toast.success(`${selectedDates.length} date(s) marked as unavailable`);
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Mark selected dates as available (remove from unavailable)
  const handleMarkAvailable = async () => {
    if (selectedDates.length === 0) {
      toast.error('Please select at least one date');
      return;
    }

    const newDates = unavailableDates.filter(d => {
      const existing = new Date(d).toISOString().split('T')[0];
      return !selectedDates.includes(existing);
    });

    setAvailabilityLoading(true);
    try {
      const res = await api.put('/users/unavailable-dates', {
        unavailableDates: newDates
      });
      setUnavailableDates(res.data.unavailableDates);
      setSelectedDates([]);
      toast.success(`${selectedDates.length} date(s) marked as available`);
    } catch {
      toast.error('Failed to update availability');
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedDates([]);
  };

  const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDay = firstDay.getDay();
      return { daysInMonth, startingDay };
  };

  const isDateUnavailable = (day) => {
      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return unavailableDates.some(d => {
          const existing = new Date(d).toISOString().split('T')[0];
          return existing === dateStr;
      });
  };

  const isDatePast = (day) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return checkDate < today;
  };

  const isPastMonth = () => {
      const today = new Date();
      return (
          currentMonth.getFullYear() < today.getFullYear() ||
          (currentMonth.getFullYear() === today.getFullYear() && 
           currentMonth.getMonth() < today.getMonth())
      );
  };

  const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const { daysInMonth, startingDay } = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);




  const handleAccept = async (bookingId) => {
      setActionLoading(bookingId);
      try {
          await api.put(`/bookings/${bookingId}/accept`);
          toast.success("Booking accepted!");
          fetchBookings({ background: true });
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to accept booking");
      } finally {
          setActionLoading(null);
      }
  };

  const openRejectModal = (bookingId) => {
      setRejectBookingId(bookingId);
      setRejectModalOpen(true);
  };

  const handleReject = async () => {
      if (!rejectBookingId) return;

      setRejectLoading(true);
      try {
          await api.put(`/bookings/${rejectBookingId}/reject`);
          toast.success("Booking rejected!");
          setRejectModalOpen(false);
          setRejectBookingId(null);
          fetchBookings({ background: true });
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to reject booking");
      } finally {
          setRejectLoading(false);
      }
  };

  const openItineraryModal = (booking) => {
      setSelectedBooking(booking);
      setItineraryModalOpen(true);
  };

  const openEditModal = (booking) => {
      setEditBooking(booking);
      setEditModalOpen(true);
      // Close view modal if open
      setItineraryModalOpen(false);
      setSelectedBooking(null);
  };

  const handleSendRevisionRequest = async (bookingId, note, proposedItinerary) => {
      setRevisionLoading(true);
      try {
          await api.put(`/bookings/${bookingId}/revision`, { note, proposedItinerary });
          toast.success("Revision sent to tourist!");
          setEditModalOpen(false);
          setEditBooking(null);
          setItineraryModalOpen(false);
          setSelectedBooking(null);
          fetchBookings({ background: true });
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to send revision request");
      } finally {
          setRevisionLoading(false);
      }
  };

  const openCompleteModal = (bookingId) => {
      setCompleteBookingId(bookingId);
      setCompleteModalOpen(true);
  };

  const handleComplete = async () => {
      if (!completeBookingId) return;
      
      setCompleteLoading(true);
      try {
          await api.put(`/bookings/${completeBookingId}/complete`);
          toast.success("Tour marked as complete!");
          setCompleteModalOpen(false);
          setCompleteBookingId(null);
          const refreshedData = await fetchBookings({ background: true });
          if (!refreshedData?.activeBookings?.length) {
              setActiveTab("history");
          }
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to complete booking");
      } finally {
          setCompleteLoading(false);
      }
  };

  const openStartTripModal = (bookingId) => {
      setStartTripBookingId(bookingId);
      setStartTripModalOpen(true);
  };

  const handleStartTrip = async () => {
      if (!startTripBookingId) return;
      
      setStartTripLoading(true);
      try {
          const res = await api.put(`/bookings/${startTripBookingId}/start`);
          setSelectedOngoingBookingId(res.data.booking?._id || startTripBookingId);
          setActiveTab("ongoing");
          toast.success("Trip started successfully!");
          setStartTripModalOpen(false);
          setStartTripBookingId(null);
          await fetchBookings({ background: true });
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to start trip");
      } finally {
          setStartTripLoading(false);
      }
  };

  const handleOngoingBookingUpdate = useCallback((updatedBooking) => {
      if (!updatedBooking?._id) {
          return;
      }

      setActiveBookings(prevBookings =>
          prevBookings.map(booking =>
              booking._id === updatedBooking._id ? updatedBooking : booking
          )
      );
  }, []);


  const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
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

  const pendingPaymentBookings = useMemo(
      () => scheduledBookings.filter(b => b.status === "awaiting_payment"),
      [scheduledBookings]
  );
  const confirmedBookings = useMemo(
      () => scheduledBookings.filter(b => b.status === "scheduled"),
      [scheduledBookings]
  );
  const historyBookings = useMemo(
      () => [
          ...completedBookings.map(b => ({ ...b, displayStatus: "completed" })),
          ...rejectedBookings.map(b => ({ ...b, displayStatus: "rejected" }))
      ].sort((a, b) => new Date(b.completedAt || b.rejectedAt) - new Date(a.completedAt || a.rejectedAt)),
      [completedBookings, rejectedBookings]
  );
  const selectedOngoingBooking = useMemo(
      () => activeBookings.find(booking => booking._id === selectedOngoingBookingId) || activeBookings[0] || null,
      [activeBookings, selectedOngoingBookingId]
  );

  const stats = {
      pending: pendingBookings.length,
      scheduled: scheduledBookings.length,
      ongoing: activeBookings.length,
      pendingPayment: pendingPaymentBookings.length,
      confirmed: confirmedBookings.length,
      completed: completedBookings.length,
      rejected: rejectedBookings.length,
  };

  return (
      <div className="min-h-screen bg-stone-50">
          <Navbar />

          <main className="max-w-6xl mx-auto px-4 py-8">
              {/* Stats Cards - Minimalist */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                  <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
                      <p className="text-2xl font-semibold text-stone-800">{stats.pending}</p>
                      <p className="text-stone-500 text-xs mt-1">Pending</p>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
                      <p className="text-2xl font-semibold text-stone-800">{stats.scheduled}</p>
                      <p className="text-stone-500 text-xs mt-1">Scheduled</p>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
                      <p className="text-2xl font-semibold text-stone-800">{stats.completed}</p>
                      <p className="text-stone-500 text-xs mt-1">Completed</p>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-4 text-center">
                      <p className="text-2xl font-semibold text-stone-800">{stats.rejected}</p>
                      <p className="text-stone-500 text-xs mt-1">Rejected</p>
                  </div>
              </div>

              {/* Tabs */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                  <div className="flex border-b border-stone-200">
                      <button
                          onClick={() => setActiveTab("pending")}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                              activeTab === "pending"
                                  ? "text-terracotta-600 border-b-2 border-terracotta-600 bg-terracotta-50/50"
                                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                          }`}
                      >
                          <ClipboardList className="w-4 h-4" />
                          Pending Requests
                          {stats.pending > 0 && (
                              <span className="px-2 py-0.5 bg-terracotta-100 text-terracotta-700 text-xs rounded-full">
                                  {stats.pending}
                              </span>
                          )}
                      </button>
                      <button
                          onClick={() => setActiveTab("scheduled")}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                              activeTab === "scheduled"
                                  ? "text-sage-600 border-b-2 border-sage-600 bg-sage-50/50"
                                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                          }`}
                      >
                          <CalendarCheck className="w-4 h-4" />
                          Scheduled
                          {stats.scheduled > 0 && (
                              <span className="px-2 py-0.5 bg-sage-100 text-sage-700 text-xs rounded-full">
                                  {stats.scheduled}
                              </span>
                          )}
                      </button>
                      <button
                          onClick={() => setActiveTab("ongoing")}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                              activeTab === "ongoing"
                                  ? "text-sage-700 border-b-2 border-sage-700 bg-sage-50"
                                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                          }`}
                      >
                          <Compass className="w-4 h-4" />
                          Ongoing Tour
                          {stats.ongoing > 0 && (
                              <span className="px-2 py-0.5 bg-sage-100 text-sage-700 text-xs rounded-full">
                                  {stats.ongoing}
                              </span>
                          )}
                      </button>
                      <button
                          onClick={() => setActiveTab("history")}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                              activeTab === "history"
                                  ? "text-stone-700 border-b-2 border-stone-700 bg-stone-50"
                                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                          }`}
                      >
                          <History className="w-4 h-4" />
                          History
                      </button>
                      <button
                          onClick={() => setActiveTab("availability")}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                              activeTab === "availability"
                                  ? "text-terracotta-600 border-b-2 border-terracotta-600 bg-terracotta-50/50"
                                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
                          }`}
                      >
                          <CalendarOff className="w-4 h-4" />
                          Availability
                      </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
                      {/* Error State with Retry */}
                      {error && !loading && (
                          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                              <div className="flex items-start gap-3">
                                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                      <p className="text-red-800 font-medium">Failed to load bookings</p>
                                      <p className="text-red-600 text-sm mt-1">{error}</p>
                                  </div>
                                  <button
                                      onClick={fetchBookings}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
                                  >
                                      <RefreshCw className="w-4 h-4" />
                                      Retry
                                  </button>
                              </div>
                          </div>
                      )}

                      {loading ? (
                          <div className="flex items-center justify-center py-12">
                              <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                          </div>
                      ) : !error && (
                          <>
                              {/* Pending Requests */}
                              {activeTab === "pending" && (
                                  <div className="space-y-4">
                                      {pendingBookings.length === 0 ? (
                                          <div className="text-center py-12">
                                              <Clock className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                              <p className="text-stone-500">No pending requests</p>
                                              <p className="text-stone-400 text-sm mt-1">
                                                  New booking requests will appear here
                                              </p>
                                          </div>
                                      ) : (
                                          pendingBookings.map((booking) => (
                                              <div key={booking._id} className="border border-stone-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                                                  <div className="flex items-center justify-between gap-4">
                                                      <div className="flex-1 min-w-0">
                                                          <div className="flex items-center gap-2 mb-1">
                                                              <h3 className="font-serif font-semibold text-stone-800 truncate">
                                                                  {booking.tripDetails?.title}
                                                              </h3>
                                                              {booking.tripDetails?.priorityAssistance?.length > 0 && (
                                                                  <span className="px-1.5 py-0.5 bg-terracotta-100 text-terracotta-700 text-xs rounded">
                                                                      Priority
                                                                  </span>
                                                              )}
                                                          </div>
                                                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                                                              <span className="flex items-center gap-1">
                                                                  <User className="w-3.5 h-3.5 text-stone-400" />
                                                                  {booking.touristId?.fullName}
                                                              </span>
                                                              <span className="flex items-center gap-1">
                                                                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                                                  {formatDate(booking.tripDetails?.preferredDate)}
                                                              </span>
                                                              <span className="flex items-center gap-1">
                                                                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                                                                  {booking.timeSlot === 'AM' ? 'Morning' : 'Afternoon'}
                                                              </span>
                                                              <span className="flex items-center gap-1">
                                                                  <Users className="w-3.5 h-3.5 text-stone-400" />
                                                                  {booking.tripDetails?.numberOfPeople} {booking.tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}
                                                              </span>
                                                          </div>
                                                      </div>
                                                      <div className="flex items-center gap-2 flex-shrink-0">
                                                          <button
                                                              onClick={() => openItineraryModal(booking)}
                                                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors"
                                                          >
                                                              <Eye className="w-4 h-4" />
                                                              Details
                                                          </button>
                                                          <button
                                                              onClick={() => handleAccept(booking._id)}
                                                              disabled={actionLoading === booking._id}
                                                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                          >
                                                              {actionLoading === booking._id ? (
                                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                              ) : (
                                                                  <>
                                                                      <CheckCircle className="w-4 h-4" />
                                                                      Accept
                                                                  </>
                                                              )}
                                                          </button>
                                                          <button
                                                              onClick={() => openRejectModal(booking._id)}
                                                              disabled={actionLoading === booking._id}
                                                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                          >
                                                              {actionLoading === booking._id ? (
                                                                  <Loader2 className="w-4 h-4 animate-spin" />
                                                              ) : (
                                                                  <>
                                                                      <XCircle className="w-4 h-4" />
                                                                      Reject
                                                                  </>
                                                              )}
                                                          </button>
                                                      </div>
                                                  </div>
                                              </div>
                                          ))
                                      )}
                                  </div>
                              )}

                              {/* Scheduled Bookings */}
                              {activeTab === "scheduled" && (
                                  <div>
                                      {/* Sub-tabs */}
                                      <div className="flex gap-2 mb-6">
                                          <button
                                              onClick={() => setScheduledSubTab("pending_payment")}
                                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                  scheduledSubTab === "pending_payment"
                                                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                                                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                              }`}
                                          >
                                              <CreditCard className="w-4 h-4" />
                                              Pending Payment
                                              {stats.pendingPayment > 0 && (
                                                  <span className="px-1.5 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">
                                                      {stats.pendingPayment}
                                                  </span>
                                              )}
                                          </button>
                                          <button
                                              onClick={() => setScheduledSubTab("confirmed")}
                                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                  scheduledSubTab === "confirmed"
                                                      ? "bg-sage-100 text-sage-800 border border-sage-300"
                                                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                              }`}
                                          >
                                              <CheckCircle className="w-4 h-4" />
                                              Confirmed
                                              {stats.confirmed > 0 && (
                                                  <span className="px-1.5 py-0.5 bg-sage-200 text-sage-800 text-xs rounded-full">
                                                      {stats.confirmed}
                                                  </span>
                                              )}
                                          </button>
                                      </div>

                                      {/* Pending Payment Sub-tab */}
                                      {scheduledSubTab === "pending_payment" && (
                                          <div className="space-y-4">
                                              {pendingPaymentBookings.length === 0 ? (
                                                  <div className="text-center py-12">
                                                      <CreditCard className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                      <p className="text-stone-500">No bookings pending payment</p>
                                                      <p className="text-stone-400 text-sm mt-1">
                                                          Accepted bookings awaiting tourist payment will appear here
                                                      </p>
                                                  </div>
                                              ) : (
                                                  pendingPaymentBookings.map((booking) => (
                                                      <div key={booking._id} className="border border-amber-200 rounded-xl p-4 bg-amber-50/30 hover:shadow-md transition-shadow">
                                                          <div className="flex items-center justify-between gap-4">
                                                              <div className="flex-1 min-w-0">
                                                                  <div className="flex items-center gap-2 mb-1">
                                                                      <h3 className="font-serif font-semibold text-stone-800 truncate">
                                                                          {booking.tripDetails?.title}
                                                                      </h3>
                                                                  </div>
                                                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                                                                      <span className="flex items-center gap-1">
                                                                          <User className="w-3.5 h-3.5 text-stone-400" />
                                                                          {booking.touristId?.fullName}
                                                                      </span>
                                                                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                                                                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                                                          {formatDate(booking.tripDetails?.preferredDate)}
                                                                      </span>
                                                                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                                                                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                                                                          {booking.timeSlot === 'AM' ? 'Morning' : 'Afternoon'}
                                                                      </span>
                                                                      <span className="flex items-center gap-1">
                                                                          <Users className="w-3.5 h-3.5 text-stone-400" />
                                                                          {booking.tripDetails?.numberOfPeople} {booking.tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}
                                                                      </span>
                                                                  </div>
                                                              </div>
                                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                                  <button
                                                                      onClick={() => openItineraryModal(booking)}
                                                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors"
                                                                  >
                                                                      <Eye className="w-4 h-4" />
                                                                      View Itinerary
                                                                  </button>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))
                                              )}
                                          </div>
                                      )}

                                      {/* Confirmed Sub-tab */}
                                      {scheduledSubTab === "confirmed" && (
                                          <div className="space-y-4">
                                              {confirmedBookings.length === 0 ? (
                                                  <div className="text-center py-12">
                                                      <CalendarCheck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                                      <p className="text-stone-500">No confirmed bookings</p>
                                                      <p className="text-stone-400 text-sm mt-1">
                                                          Paid bookings ready for their scheduled date will appear here
                                                      </p>
                                                  </div>
                                              ) : (
                                                  confirmedBookings.map((booking) => (
                                                      <div key={booking._id} className="border border-sage-200 rounded-xl p-4 bg-sage-50/30 hover:shadow-md transition-shadow">
                                                          <div className="flex items-center justify-between gap-4">
                                                              <div className="flex-1 min-w-0">
                                                                  <div className="flex items-center gap-2 mb-1">
                                                                      <h3 className="font-serif font-semibold text-stone-800 truncate">
                                                                          {booking.tripDetails?.title}
                                                                      </h3>
                                                                  </div>
                                                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                                                                      <span className="flex items-center gap-1">
                                                                          <User className="w-3.5 h-3.5 text-stone-400" />
                                                                          {booking.touristId?.fullName}
                                                                      </span>
                                                                      <span className="flex items-center gap-1 text-sage-700 font-medium">
                                                                          <Calendar className="w-3.5 h-3.5 text-sage-600" />
                                                                          {formatDate(booking.tripDetails?.preferredDate)}
                                                                      </span>
                                                                      <span className="flex items-center gap-1 text-sage-700 font-medium">
                                                                          <Clock className="w-3.5 h-3.5 text-sage-600" />
                                                                          {booking.timeSlot === 'AM' ? 'Morning' : 'Afternoon'}
                                                                      </span>
                                                                      <span className="flex items-center gap-1">
                                                                          <Users className="w-3.5 h-3.5 text-stone-400" />
                                                                          {booking.tripDetails?.numberOfPeople} {booking.tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}
                                                                      </span>
                                                                  </div>
                                                              </div>
                                                              <div className="flex items-center gap-2 flex-shrink-0">
                                                                  <button
                                                                      onClick={() => openItineraryModal(booking)}
                                                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-lg transition-colors"
                                                                  >
                                                                      <Eye className="w-4 h-4" />
                                                                      Details
                                                                  </button>
                                                                  <button
                                                                      onClick={() => openStartTripModal(booking._id)}
                                                                      disabled={actionLoading === booking._id}
                                                                      className="flex items-center justify-center gap-1.5 px-3 py-2 bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                                  >
                                                                      {actionLoading === booking._id ? (
                                                                          <Loader2 className="w-4 h-4 animate-spin" />
                                                                      ) : (
                                                                          <>
                                                                              <Play className="w-4 h-4" />
                                                                              Start
                                                                          </>
                                                                      )}
                                                                  </button>
                                                              </div>
                                                          </div>
                                                      </div>
                                                  ))
                                              )}
                                          </div>
                                      )}
                                  </div>
                              )}

                              {activeTab === "ongoing" && (
                                  <div>
                                      {activeBookings.length === 0 ? (
                                          <div className="text-center py-12">
                                              <Compass className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                              <p className="text-stone-500">No ongoing tours</p>
                                              <p className="text-stone-400 text-sm mt-1">
                                                  Start a scheduled booking and it will appear here for live itinerary tracking
                                              </p>
                                          </div>
                                      ) : (
                                          <div className="space-y-6">
                                              {activeBookings.length > 1 && (
                                                  <div className="flex flex-wrap gap-2">
                                                      {activeBookings.map((booking) => (
                                                          <button
                                                              key={booking._id}
                                                              onClick={() => setSelectedOngoingBookingId(booking._id)}
                                                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                  selectedOngoingBooking?._id === booking._id
                                                                      ? "bg-sage-600 text-white"
                                                                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                                                              }`}
                                                          >
                                                              {booking.tripDetails?.title}
                                                          </button>
                                                      ))}
                                                  </div>
                                              )}

                                              <GuideOngoingTourPanel
                                                  booking={selectedOngoingBooking}
                                                  onBookingUpdate={handleOngoingBookingUpdate}
                                                  onOpenCompleteModal={openCompleteModal}
                                                  completeLoading={completeLoading && completeBookingId === selectedOngoingBooking?._id}
                                              />
                                          </div>
                                      )}
                                  </div>
                              )}

                              {/* History */}
                              {activeTab === "history" && (
                                  <div>
                                      {completedBookings.length === 0 && rejectedBookings.length === 0 ? (
                                          <div className="text-center py-12">
                                              <History className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                                              <p className="text-stone-500">No completed or rejected tours yet</p>
                                              <p className="text-stone-400 text-sm mt-1">Your tour history will appear here</p>
                                          </div>
                                      ) : (
                                          <div className="overflow-x-auto">
                                              <table className="w-full">
                                                  <thead>
                                                      <tr className="border-b border-stone-200">
                                                          <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Destination</th>
                                                          <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Tourist</th>
                                                          <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Date</th>
                                                          <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Time</th>
                                                          <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Group Size</th>
                                                          <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Status</th>
                                                          <th className="text-left py-3 px-4 text-sm font-medium text-stone-500">Completed at</th>
                                                      </tr>
                                                  </thead>
                                                  <tbody>
                                                      {historyBookings.map((booking) => (
                                                          <tr key={booking._id} className="border-b border-stone-100 hover:bg-stone-50">
                                                              <td className="py-3 px-4">
                                                                  <span className="font-medium text-stone-800">{booking.tripDetails?.title}</span>
                                                              </td>
                                                              <td className="py-3 px-4 text-stone-600">{booking.touristId?.fullName}</td>
                                                              <td className="py-3 px-4 text-stone-600">{formatDate(booking.tripDetails?.preferredDate)}</td>
                                                              <td className="py-3 px-4 text-stone-600">{formatTime(booking.tripDetails?.preferredDate)}</td>
                                                              <td className="py-3 px-4 text-stone-600">{booking.tripDetails?.numberOfPeople}</td>
                                                              <td className={`py-3 px-4 text-sm ${
                                                                  booking.displayStatus === "completed" ? "text-stone-500" : "text-red-600"
                                                              }`}>
                                                                  {booking.displayStatus === "completed" ? "Completed" : "Rejected"}
                                                              </td>
                                                              <td className="py-3 px-4 text-sm text-stone-500">
                                                                  {booking.displayStatus === "completed" ? formatDate(booking.completedAt) + ", " + formatTime(booking.completedAt) : ""}
                                                              </td>
                                                          </tr>
                                                      ))}
                                                  </tbody>
                                              </table>
                                          </div>
                                      )}
                                  </div>
                              )}

                              {/* Availability Management */}
                              {activeTab === "availability" && (
                                <div>
                                  <div className="mb-6">
                                    <h3 className="font-semibold text-stone-800 mb-2">Manage Your Availability</h3>
                                    <p className="text-sm text-stone-500">
                                      Select dates on the calendar, then click "Mark Unavailable" or "Mark Available" to update your availability.
                                    </p>
                                  </div>

                                  {/* Calendar */}
                                  <div className="max-w-md mx-auto">
                                    {/* Month Navigation */}
                                    <div className="flex items-center justify-between mb-4">
                                      <button
                                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                        disabled={isPastMonth()}
                                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <ChevronLeft className="w-5 h-5 text-stone-600" />
                                      </button>
                                      <span className="font-medium text-stone-800">
                                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                      </span>
                                      <button
                                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                                      >
                                        <ChevronRight className="w-5 h-5 text-stone-600" />
                                      </button>
                                    </div>

                                    {/* Day Headers */}
                                    <div className="grid grid-cols-7 gap-1 mb-2">
                                      {dayNames.map(day => (
                                        <div key={day} className="text-center text-xs font-medium text-stone-500 py-2">
                                          {day}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Calendar Grid */}
                                    <div className="grid grid-cols-7 gap-1">
                                      {/* Empty cells for days before the first of the month */}
                                      {Array.from({ length: startingDay }).map((_, i) => (
                                        <div key={`empty-${i}`} className="aspect-square" />
                                      ))}
                                      
                                      {/* Days of the month */}
                                      {Array.from({ length: daysInMonth }).map((_, i) => {
                                        const day = i + 1;
                                        const unavailable = isDateUnavailable(day);
                                        const selected = isDateSelected(day);
                                        const past = isDatePast(day);
                                        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                                        return (
                                          <button
                                            key={day}
                                            onClick={() => !past && handleToggleDateSelection(dateStr)}
                                            disabled={past || availabilityLoading}
                                            className={`
                                              aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all relative
                                              ${selected
                                                ? 'bg-terracotta-500 text-white ring-2 ring-terracotta-300'
                                                : unavailable 
                                                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                                  : past
                                                    ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                                                    : 'hover:bg-sage-50 text-stone-700 hover:text-sage-700'
                                              }
                                              ${availabilityLoading ? 'opacity-50' : ''}
                                            `}
                                            title={past ? 'Past date' : selected ? 'Selected' : unavailable ? 'Unavailable' : 'Available'}
                                          >
                                            {day}
                                            {unavailable && !selected && (
                                              <X className="w-3 h-3 absolute top-0.5 right-0.5 text-red-500" />
                                            )}
                                            {selected && (
                                              <CheckCircle className="w-3 h-3 absolute top-0.5 right-0.5 text-white" />
                                            )}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-6 space-y-3">
                                      {selectedDates.length > 0 && (
                                        <div className="p-3 bg-terracotta-50 border border-terracotta-200 rounded-xl">
                                          <p className="text-sm text-terracotta-700 mb-3">
                                            <span className="font-medium">{selectedDates.length}</span> date(s) selected
                                          </p>
                                          <div className="flex gap-2">
                                            <button
                                              onClick={handleMarkUnavailable}
                                              disabled={availabilityLoading}
                                              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                              {availabilityLoading ? 'Updating...' : 'Mark Unavailable'}
                                            </button>
                                            <button
                                              onClick={handleMarkAvailable}
                                              disabled={availabilityLoading}
                                              className="flex-1 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                              {availabilityLoading ? 'Updating...' : 'Mark Available'}
                                            </button>
                                          </div>
                                          <button
                                            onClick={handleClearSelection}
                                            className="w-full mt-2 px-4 py-2 text-stone-600 hover:bg-stone-100 text-sm font-medium rounded-lg transition-colors"
                                          >
                                            Clear Selection
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Legend */}
                                    <div className="flex items-center justify-center gap-4 mt-6 text-xs text-stone-500 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-white border border-stone-200 rounded" />
                                        <span>Available</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
                                        <span>Unavailable</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-terracotta-500 rounded" />
                                        <span>Selected</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-stone-100 border border-stone-200 rounded" />
                                        <span>Past</span>
                                      </div>
                                    </div>

                                    {/* Unavailable dates summary */}
                                    {unavailableDates.length > 0 && (
                                      <div className="mt-6 p-4 bg-stone-50 rounded-xl">
                                        <h4 className="text-sm font-medium text-stone-700 mb-2">Your Unavailable Dates</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {unavailableDates
                                            .filter(d => new Date(d) >= new Date().setHours(0,0,0,0))
                                            .sort((a, b) => new Date(a) - new Date(b))
                                            .slice(0, 10)
                                            .map((date, idx) => (
                                              <span 
                                                key={idx}
                                                className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full"
                                              >
                                                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                              </span>
                                            ))}
                                          {unavailableDates.filter(d => new Date(d) >= new Date().setHours(0,0,0,0)).length > 10 && (
                                            <span className="px-2 py-1 bg-stone-200 text-stone-600 text-xs rounded-full">
                                              +{unavailableDates.filter(d => new Date(d) >= new Date().setHours(0,0,0,0)).length - 10} more
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                          </>
                      )}
                  </div>
              </div>
          </main>

          {/* Reject Booking Confirmation Modal */}
          <ConfirmationModal
              isOpen={rejectModalOpen}
              onClose={() => {
                  setRejectModalOpen(false);
                  setRejectBookingId(null);
              }}
              onConfirm={handleReject}
              title="Reject Booking"
              message="Are you sure you want to reject this booking request? The tourist will be notified and this action cannot be undone."
              confirmText="Yes, Reject Booking"
              cancelText="Keep Request"
              loading={rejectLoading}
              icon={XCircle}
          />

          {/* Itinerary View Modal */}
          <ItineraryViewModal
              isOpen={itineraryModalOpen}
              onClose={() => {
                  setItineraryModalOpen(false);
                  setSelectedBooking(null);
              }}
              booking={selectedBooking}
              onEditItinerary={openEditModal}
          />

          {/* Itinerary Edit Modal for Revision Requests */}
          <ItineraryEditModal
              isOpen={editModalOpen}
              onClose={() => {
                  setEditModalOpen(false);
                  setEditBooking(null);
              }}
              booking={editBooking}
              onSubmitRevision={handleSendRevisionRequest}
              loading={revisionLoading}
          />

          {/* Complete Tour Confirmation Modal */}
          <ConfirmationModal
              isOpen={completeModalOpen}
              onClose={() => {
                  setCompleteModalOpen(false);
                  setCompleteBookingId(null);
              }}
              onConfirm={handleComplete}
              title="Complete Tour"
              message="Are you sure you want to mark this tour as completed? The tourist will be notified and prompted to rate their experience."
              confirmText="Yes, Mark Complete"
              cancelText="Cancel"
              loading={completeLoading}
              icon={CheckCircle}
          />

          {/* Start Trip Confirmation Modal */}
          <ConfirmationModal
              isOpen={startTripModalOpen}
              onClose={() => {
                  setStartTripModalOpen(false);
                  setStartTripBookingId(null);
              }}
              onConfirm={handleStartTrip}
              title="Start Trip"
              message="Are you sure you want to start this trip? This will mark the booking as active and notify the tourist."
              confirmText="Yes, Start Trip"
              cancelText="Cancel"
              loading={startTripLoading}
              icon={Play}
          />
      </div>
  );
};

export default GuideDashboard;

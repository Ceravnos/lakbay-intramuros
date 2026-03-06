import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import { 
  Compass, Clock, CheckCircle, Calendar, Users, MapPin,
  RefreshCw, User, Phone, Mail, ChevronRight, ChevronLeft,
  History, ClipboardList, Loader2, AlertCircle,
  XCircle, CalendarOff, Plus, X, Eye, Bell,
  Accessibility, Baby, Heart
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/axios";
import Navbar from "../../components/Navbar"
import ConfirmationModal from "../../components/ConfirmationModal"
import ItineraryViewModal from "../../components/ItineraryViewModal"
import ItineraryEditModal from "../../components/ItineraryEditModal"

const GuideDashboard = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [pendingBookings, setPendingBookings] = useState([]);
  const [acceptedBookings, setAcceptedBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [rejectedBookings, setRejectedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  
  // Availability management state
  const [unavailableDates, setUnavailableDates] = useState([]);
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
  
  // Priority assistance labels
  const PRIORITY_LABELS = {
    pwd: { label: 'PWD', icon: Accessibility },
    pregnant: { label: 'Pregnant', icon: Baby },
    senior: { label: 'Senior', icon: Heart },
    locomotive: { label: 'Locomotive', icon: AlertCircle },
  };
  
  const navigate = useNavigate();

  const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
          const [pendingRes, acceptedRes, historyRes, rejectedRes] = await Promise.all([
              api.get("/bookings/pending"),
              api.get("/bookings/my-accepted"),
              api.get("/bookings/history"),
              api.get("/bookings/my-rejected"),
          ]);
          setPendingBookings(pendingRes.data);
          setAcceptedBookings(acceptedRes.data);
          setCompletedBookings(historyRes.data.completedBookings || []);
          setRejectedBookings(rejectedRes.data);
      } catch (err) {
          console.error(err);
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
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchBookings();
      fetchUnavailableDates();
  }, []);

  // Listen for real-time booking updates via WebSocket
  useEffect(() => {
      const handleBookingUpdate = (event) => {
          const { type } = event.detail;
          // Refresh bookings on any booking update
          if (type === 'new' || type === 'accepted' || type === 'rejected' || type === 'completed' || type === 'updated' || type === 'revision-accepted') {
              fetchBookings();
          }
      };

      window.addEventListener('booking-update', handleBookingUpdate);
      return () => {
          window.removeEventListener('booking-update', handleBookingUpdate);
      };
  }, []);

  const fetchUnavailableDates = async () => {
      try {
          const res = await api.get('/auth/me');
          setUnavailableDates(res.data.unavailableDates || []);
      } catch (err) {
          console.error('Failed to fetch unavailable dates:', err);
      }
  };

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
    } catch (err) {
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
    } catch (err) {
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
          fetchBookings();
          await refreshUser();
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
          fetchBookings();
          await refreshUser();
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
          fetchBookings();
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
          fetchBookings();
          await refreshUser();
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to complete booking");
      } finally {
          setCompleteLoading(false);
      }
  };


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

  const stats = {
      pending: pendingBookings.length,
      active: acceptedBookings.length,
      completed: completedBookings.length,
      rejected: rejectedBookings.length,
  };

  return (
      <div className="min-h-screen bg-stone-50">
          <Navbar />

          <main className="max-w-6xl mx-auto px-4 py-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-xl border border-stone-200 p-5">
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="text-stone-500 text-sm">Pending Requests</p>
                              <p className="text-3xl font-semibold text-sand-600 mt-1">{stats.pending}</p>
                          </div>
                          <div className="w-12 h-12 bg-sand-50 rounded-xl flex items-center justify-center">
                              <Clock className="w-6 h-6 text-sand-500" />
                          </div>
                      </div>
                  </div>
                  <div className={`bg-white rounded-xl border ${acceptedBookings.length > 0 ? 'border-sage-300 bg-sage-50/30' : 'border-stone-200'} p-5`}>
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="text-stone-500 text-sm">Active Tour</p>
                              {acceptedBookings.length > 0 ? (
                                  <p className="text-sm font-medium text-sage-600 mt-1">In Progress</p>
                              ) : (
                                  <p className="text-sm text-stone-400 mt-1">No active tour</p>
                              )}
                          </div>
                          <div className="w-12 h-12 bg-sage-50 rounded-xl flex items-center justify-center">
                              <Users className="w-6 h-6 text-sage-500" />
                          </div>
                      </div>
                      {/* Show current active tour details */}
                      {acceptedBookings.length > 0 ? (
                          <div className="mt-4 pt-4 border-t border-sage-200">
                              <div className="flex items-center gap-2 mb-2">
                                  <MapPin className="w-4 h-4 text-sage-600" />
                                  <span className="font-medium text-stone-800 text-sm">
                                      {acceptedBookings[0].tripDetails?.title}
                                  </span>
                              </div>
                              <div className="space-y-1 text-xs text-stone-600">
                                  <div className="flex items-center gap-2">
                                      <User className="w-3 h-3 text-stone-400" />
                                      <span>{acceptedBookings[0].touristId?.fullName}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Calendar className="w-3 h-3 text-stone-400" />
                                      <span>{formatDate(acceptedBookings[0].tripDetails?.preferredDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-stone-400" />
                                      <span>{formatTime(acceptedBookings[0].tripDetails?.preferredDate)}</span>
                                  </div>
                              </div>
                              <button
                                  onClick={() => openCompleteModal(acceptedBookings[0]._id)}
                                  disabled={completeLoading}
                                  className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                              >
                                  <CheckCircle className="w-3 h-3" />
                                  Mark Complete
                              </button>
                          </div>
                      ) : (
                          <div className="mt-4 pt-4 border-t border-stone-100 text-center">
                              <p className="text-xs text-stone-400">You have no active tours</p>
                          </div>
                      )}
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-5">
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="text-stone-500 text-sm">Completed</p>
                              <p className="text-3xl font-semibold text-stone-700 mt-1">{stats.completed}</p>
                          </div>
                          <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-stone-500" />
                          </div>
                      </div>
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-5">
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="text-stone-500 text-sm">Rejected</p>
                              <p className="text-3xl font-semibold text-stone-700 mt-1">{stats.rejected}</p>
                          </div>
                          <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center">
                              <XCircle className="w-6 h-6 text-stone-500" />
                          </div>
                      </div>
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
                      {/* Refresh Button */}
                      <div className="flex justify-end mb-4">
                          <button
                              onClick={fetchBookings}
                              disabled={loading}
                              className="flex items-center gap-2 px-3 py-1.5 text-stone-500 hover:text-stone-700 text-sm transition-colors"
                          >
                              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                              Refresh
                          </button>
                      </div>

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
                                              <div key={booking._id} className="border border-stone-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                      <div className="flex-1">
                                                          <div className="flex items-center gap-2 mb-2">
                                                              <MapPin className="w-4 h-4 text-terracotta-500" />
                                                              <h3 className="font-serif font-semibold text-stone-800">
                                                                  {booking.tripDetails?.title}
                                                              </h3>
                                                          </div>
                                                          <div className="space-y-2 text-sm text-stone-600">
                                                              <div className="flex items-center gap-2">
                                                                  <User className="w-4 h-4 text-stone-400" />
                                                                  <span>{booking.touristId?.fullName}</span>
                                                              </div>
                                                              <div className="flex items-center gap-2">
                                                                  <Mail className="w-4 h-4 text-stone-400" />
                                                                  <span>{booking.touristId?.email}</span>
                                                              </div>
                                                              <div className="flex items-center gap-2">
                                                                  <Phone className="w-4 h-4 text-stone-400" />
                                                                  <span>{booking.touristId?.phoneNumber}</span>
                                                              </div>
                                                              <div className="flex items-center gap-2">
                                                                  <Calendar className="w-4 h-4 text-stone-400" />
                                                                  <span>{formatDate(booking.tripDetails?.preferredDate)}</span>
                                                              </div>
                                                              <div className="flex items-center gap-2">
                                                                  <Clock className="w-4 h-4 text-stone-400" />
                                                                  <span>{formatTime(booking.tripDetails?.preferredDate)}</span>
                                                              </div>
                                                              <div className="flex items-center gap-2">
                                                                  <Users className="w-4 h-4 text-stone-400" />
                                                                  <span>{booking.tripDetails?.numberOfPeople} {booking.tripDetails?.numberOfPeople === 1 ? 'person' : 'people'}</span>
                                                              </div>
                                                              {booking.tripDetails?.meetingPoint && (
                                                                  <div className="flex items-center gap-2">
                                                                      <MapPin className="w-4 h-4 text-stone-400" />
                                                                      <span>Meeting: {booking.tripDetails.meetingPoint}</span>
                                                                  </div>
                                                              )}
                                                              {booking.tripDetails?.priorityAssistance?.length > 0 && (
                                                                  <div className="flex flex-wrap gap-2 mt-2">
                                                                      {booking.tripDetails.priorityAssistance.map(priority => {
                                                                          const config = PRIORITY_LABELS[priority];
                                                                          if (!config) return null;
                                                                          const Icon = config.icon;
                                                                          return (
                                                                              <span key={priority} className="inline-flex items-center gap-1 px-2 py-1 bg-terracotta-50 text-terracotta-700 text-xs rounded-full">
                                                                                  <Icon className="w-3 h-3" />
                                                                                  {config.label}
                                                                              </span>
                                                                          );
                                                                      })}
                                                                  </div>
                                                              )}
                                                              {booking.tripDetails?.notes && (
                                                                  <p className="text-stone-500 italic mt-2 pl-6">
                                                                      "{booking.tripDetails.notes}"
                                                                  </p>
                                                              )}
                                                          </div>
                                                      </div>
                                                      <div className="flex flex-col gap-2">
                                                          <button
                                                              onClick={() => openItineraryModal(booking)}
                                                              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition-colors w-full"
                                                          >
                                                              <Eye className="w-4 h-4" />
                                                              View Itinerary
                                                          </button>
                                                          <button
                                                              onClick={() => handleAccept(booking._id)}
                                                              disabled={actionLoading === booking._id}
                                                              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 w-full"
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
                                                              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 w-full"
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
                                                      {[
                                                          ...completedBookings.map(b => ({ ...b, displayStatus: "completed" })),
                                                          ...rejectedBookings.map(b => ({ ...b, displayStatus: "rejected" }))
                                                      ]
                                                      .sort((a, b) => new Date(b.completedAt || b.rejectedAt) - new Date(a.completedAt || a.rejectedAt))
                                                      .map((booking) => (
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
      </div>
  );
};

export default GuideDashboard;

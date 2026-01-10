import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, Trash2, MapPin, Calendar, Users, UserCheck, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

const TravelDetailPage = () => {
  const { user, isAuthenticated, isTourist } = useAuth();
  const [travel, setTravel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    preferredDate: "",
    numberOfPeople: 1,
    notes: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchTravel = async () => {
      try {
        const res = await api.get(`/travel/${id}`)
        setTravel(res.data)
      } catch (error) {
        console.log("Error in fetching travel", error);
        toast.error("Failed to fetch destination")
      } finally {
        setLoading(false)
      }
    }
    fetchTravel();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to remove this destination?")) return;
     
    try {
      await api.delete(`/travel/${id}`);
      toast.success("Destination removed");
      navigate("/");
    } catch (error) {
      console.log("Error deleting the travel", error);
      toast.error("Failed to delete destination");
    }
  }

  const handleSave = async () => {
    if (!travel.title.trim() || !travel.content.trim()) {
      toast.error("Please add a title and content");
      return;
    }

    setSaving(true)
    try {
      await api.put(`travel/${id}`, travel);
      toast.success("Destination updated");
      navigate("/")
    } catch (error) {
      console.log("Error saving the travel:", error);
      toast.error("Failed to update destination");
    } finally {
      setSaving(false)
    }
  }

  const handleRequestGuide = async (e) => {
    e.preventDefault();
    
    if (!bookingData.preferredDate) {
      toast.error("Please select a preferred date");
      return;
    }

    setBookingLoading(true);
    try {
      await api.post("/bookings", {
        travelId: id,
        preferredDate: bookingData.preferredDate,
        numberOfPeople: bookingData.numberOfPeople,
        notes: bookingData.notes,
      });
      toast.success("Guide request submitted! You'll be notified when a guide accepts.");
      setShowBookingModal(false);
      setBookingData({ preferredDate: "", numberOfPeople: 1, notes: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Back & Actions */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Itinerary</span>
          </Link>
          
          <button 
            onClick={handleDelete} 
            className="inline-flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-sage-600" />
            </div>
            <h1 className="text-2xl font-serif font-semibold text-stone-800">
              Edit Destination
            </h1>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-stone-200 rounded-xl p-8 mb-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Destination Name
              </label>
              <input
                type="text"
                placeholder="Destination name"
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400"
                value={travel?.title || ""}
                onChange={(e) => setTravel({ ...travel, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Notes & Details
              </label>
              <textarea
                placeholder="Add details about this destination..."
                className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400 resize-none h-40"
                value={travel?.content || ""}
                onChange={(e) => setTravel({ ...travel, content: e.target.value})}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <Link 
                to="/" 
                className="px-5 py-2.5 text-stone-600 hover:text-stone-800 font-medium transition-colors"
              >
                Cancel
              </Link>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Request Guide Section - Only for Tourists */}
        {isAuthenticated && isTourist && (
          <div className="bg-gradient-to-br from-sage-50 to-sand-50 border border-sage-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <UserCheck className="w-6 h-6 text-sage-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-semibold text-stone-800 mb-1">
                  Need a Professional Guide?
                </h3>
                <p className="text-stone-600 text-sm mb-4">
                  Request an accredited tour guide to accompany you on this destination. 
                  They'll share historical insights and local stories.
                </p>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  Request a Guide
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-stone-200">
              <h2 className="text-xl font-serif font-semibold text-stone-800">
                Request a Tour Guide
              </h2>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleRequestGuide} className="p-6 space-y-5">
              <div className="bg-sand-50 rounded-lg p-4 mb-2">
                <p className="text-sm text-stone-600">
                  <span className="font-medium text-stone-800">Destination:</span> {travel?.title}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={bookingData.preferredDate}
                  onChange={(e) => setBookingData({ ...bookingData, preferredDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all text-stone-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Number of People
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={bookingData.numberOfPeople}
                  onChange={(e) => setBookingData({ ...bookingData, numberOfPeople: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all text-stone-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                  placeholder="Any special requests or preferences..."
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent transition-all text-stone-800 placeholder-stone-400 resize-none h-24"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-2.5 border border-stone-200 text-stone-700 font-medium rounded-lg hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TravelDetailPage
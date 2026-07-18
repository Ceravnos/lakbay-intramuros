import { useState } from 'react';
import { 
  X, MapPin, Clock, Users, Calendar, Navigation, 
  Send, Loader2, Plus, Trash2, GripVertical, Search, Route
} from 'lucide-react';
import toast from 'react-hot-toast';
import { INTRAMUROS_LOCATIONS } from '../data/locations';
import { optimizeLocationsNearestNeighbor, routesMatchByOrder } from '../lib/routeOptimization';

const ItineraryEditModal = ({
  isOpen,
  onClose,
  booking,
  onSubmitRevision,
  loading = false,
}) => {
  const [draft, setDraft] = useState({
    bookingId: null,
    revisionNote: '',
    locations: null,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  if (!isOpen || !booking) return null;

  const itinerary = booking.itineraryId;
  const preferredDate = itinerary?.preferredDate ? new Date(itinerary.preferredDate).toISOString().split('T')[0] : '';
  const numberOfPeople = itinerary?.numberOfPeople || booking.tripDetails?.numberOfPeople || 1;
  const initialLocations = itinerary?.locations?.map((loc, idx) => ({
    ...loc,
    order: loc.order ?? idx,
  })) || [];
  const hasCurrentDraft = draft.bookingId === booking._id;
  const revisionNote = hasCurrentDraft ? draft.revisionNote : '';
  const locations = hasCurrentDraft && Array.isArray(draft.locations) ? draft.locations : initialLocations;

  const updateDraft = (updates) => {
    setDraft((previousDraft) => ({
      bookingId: booking._id,
      revisionNote: previousDraft.bookingId === booking._id ? previousDraft.revisionNote : '',
      locations: previousDraft.bookingId === booking._id ? previousDraft.locations : null,
      ...updates,
    }));
  };

  // Filter available locations
  const filteredLandmarks = INTRAMUROS_LOCATIONS.filter(landmark => {
    const matchesSearch = landmark.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      landmark.address?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const addLocation = (landmark) => {
    if (locations.length >= 10) {
      toast.error('Maximum of 10 stops allowed');
      return;
    }

    const isAlreadyAdded = locations.find(loc => loc.placeId === landmark.placeId);
    if (isAlreadyAdded) return;

    const newLocation = {
      placeId: landmark.placeId,
      name: landmark.name,
      address: landmark.address || '',
      lat: landmark.lat,
      lng: landmark.lng,
      order: locations.length,
      notes: '',
    };
    updateDraft({ locations: [...locations, newLocation] });
  };

  const removeLocation = (placeId) => {
    updateDraft({
      locations: locations
        .filter(loc => loc.placeId !== placeId)
        .map((loc, idx) => ({ ...loc, order: idx })),
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === index) return;
    setDragOverItem(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverItem !== null && draggedItem !== dragOverItem) {
      const newLocations = [...locations];
      const [draggedLocation] = newLocations.splice(draggedItem, 1);
      newLocations.splice(dragOverItem, 0, draggedLocation);
      updateDraft({ locations: newLocations.map((loc, idx) => ({ ...loc, order: idx })) });
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleOptimizeRoute = () => {
    if (locations.length < 3) {
      toast.error('Add at least 3 stops to optimize the route');
      return;
    }

    const currentOrderedLocations = [...locations].sort((leftLocation, rightLocation) => leftLocation.order - rightLocation.order);
    const optimizedLocations = optimizeLocationsNearestNeighbor(currentOrderedLocations);

    if (routesMatchByOrder(currentOrderedLocations, optimizedLocations)) {
      toast('Route is already optimized', { icon: '🧭' });
      return;
    }

    updateDraft({ locations: optimizedLocations });
    toast.success('Revision route optimized');
  };

  const handleSubmit = () => {
    const proposedItinerary = {
      locations: locations.map((loc, idx) => ({
        placeId: loc.placeId,
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        order: idx,
        notes: loc.notes || '',
      })),
      preferredDate: preferredDate || null,
      numberOfPeople: numberOfPeople,
    };

    onSubmitRevision(booking._id, revisionNote, proposedItinerary);
  };

  // Check if there are changes
  const hasChanges = () => {
    const originalLocations = itinerary?.locations || [];
    if (locations.length !== originalLocations.length) return true;
    
    for (let i = 0; i < locations.length; i++) {
      if (locations[i].placeId !== originalLocations[i]?.placeId) return true;
    }
    
    const originalDate = itinerary?.preferredDate ? new Date(itinerary.preferredDate).toISOString().split('T')[0] : '';
    if (preferredDate !== originalDate) return true;
    
    if (numberOfPeople !== (itinerary?.numberOfPeople || booking.tripDetails?.numberOfPeople || 1)) return true;
    
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sage-100 rounded-lg flex items-center justify-center">
              <Navigation className="w-5 h-5 text-sage-600" />
            </div>
            <div>
              <h3 className="font-semibold text-stone-800">Edit Itinerary</h3>
              <p className="text-sm text-stone-500">Propose changes for {booking.touristId?.fullName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row">
            {/* Left - Current Itinerary & Edit */}
            <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-stone-200">
              {/* Trip Details (Read-only) */}
              <div className="bg-stone-50 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-stone-800 mb-3">Trip Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    <span>{preferredDate ? new Date(preferredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Users className="w-4 h-4 text-stone-400" />
                    <span>{numberOfPeople} {numberOfPeople === 1 ? 'person' : 'people'}</span>
                  </div>
                </div>
              </div>

              {/* Itinerary Stops */}
              <div className="mb-4">
                <h4 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-terracotta-500" />
                  Itinerary Stops ({locations.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {locations.length === 0 ? (
                    <div className="text-center py-6 text-stone-400 text-sm">
                      No stops added yet
                    </div>
                  ) : (
                    locations
                      .sort((a, b) => a.order - b.order)
                      .map((loc, index) => (
                        <div
                          key={loc.placeId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-2 p-2 bg-white border rounded-lg transition-all ${
                            draggedItem === index
                              ? 'opacity-50 border-sage-400'
                              : dragOverItem === index
                                ? 'border-sage-500 border-2'
                                : 'border-stone-200'
                          }`}
                        >
                          <GripVertical className="w-4 h-4 text-stone-400 cursor-grab flex-shrink-0" />
                          <div className="w-6 h-6 bg-terracotta-100 text-terracotta-600 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-stone-800 text-sm truncate">{loc.name}</p>
                          </div>
                          <button
                            onClick={() => removeLocation(loc.placeId)}
                            className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Revision Note */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Note to Tourist <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={revisionNote}
                  onChange={(e) => updateDraft({ revisionNote: e.target.value })}
                  placeholder="Explain why you're suggesting these changes..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 resize-none text-sm"
                />
              </div>
            </div>

            {/* Right - Add Locations */}
            <div className="w-full lg:w-72 p-4 bg-stone-50">
              <h4 className="font-medium text-stone-800 mb-3">Add Locations</h4>
              
              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search landmarks..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                />
              </div>

              {/* Location List */}
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {filteredLandmarks.map((landmark) => {
                  const isAdded = locations.find(loc => loc.placeId === landmark.placeId);
                  return (
                    <button
                      key={landmark.id}
                      onClick={() => !isAdded && addLocation(landmark)}
                      disabled={isAdded}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                        isAdded
                          ? 'bg-sage-50 cursor-default'
                          : 'hover:bg-white'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                        isAdded ? 'bg-sage-200' : 'bg-terracotta-100'
                      }`}>
                        <MapPin className={`w-3 h-3 ${
                          isAdded ? 'text-sage-600' : 'text-terracotta-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 text-xs truncate">
                          {landmark.name}
                        </p>
                      </div>
                      {isAdded ? (
                        <span className="text-xs text-sage-600">✓</span>
                      ) : (
                        <Plus className="w-3 h-3 text-stone-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-stone-700 font-medium rounded-lg hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleOptimizeRoute}
                disabled={loading || locations.length < 3}
                className="flex items-center gap-2 px-4 py-2 border border-stone-300 text-stone-700 font-medium rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Route className="w-4 h-4" />
                Optimize
              </button>
              {hasChanges() && (
                <span className="text-xs text-sage-600 bg-sage-100 px-2 py-1 rounded-full">
                  Changes made
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={loading || locations.length === 0 || !revisionNote.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-sage-600 hover:bg-sage-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send Revision
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryEditModal;

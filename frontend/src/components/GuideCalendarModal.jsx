import { useState, useMemo } from 'react';
import { 
    X, ChevronLeft, ChevronRight, Calendar, Clock, 
    User, Star, Phone, Check, Loader2 
} from 'lucide-react';

const GuideCalendarModal = ({ 
    isOpen, 
    onClose, 
    guide, 
    onSelectDate, 
    selectedDate,
    selectedTime,
    onSelectTime 
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const selectionKey = `${isOpen ? 'open' : 'closed'}:${guide?._id || ''}:${selectedDate || ''}:${selectedTime || ''}`;
    const [selectionDraft, setSelectionDraft] = useState({
        key: '',
        selectedDate: null,
        selectedTime: '',
    });
    const hasActiveDraft = selectionDraft.key === selectionKey;
    const localSelectedDate = hasActiveDraft ? selectionDraft.selectedDate : (selectedDate || null);
    const localSelectedTime = hasActiveDraft ? selectionDraft.selectedTime : (selectedTime || '');

    const updateSelectionDraft = (updates) => {
        setSelectionDraft((previousDraft) => ({
            key: selectionKey,
            selectedDate: previousDraft.key === selectionKey ? previousDraft.selectedDate : (selectedDate || null),
            selectedTime: previousDraft.key === selectionKey ? previousDraft.selectedTime : (selectedTime || ''),
            ...updates,
        }));
    };

    const guideUnavailableDates = guide?.unavailableDates;

    // Parse unavailable dates from guide data
    const unavailableDates = useMemo(() => {
        if (!guideUnavailableDates) return new Set();
        return new Set(
            guideUnavailableDates.map(d => {
                const date = new Date(d);
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            })
        );
    }, [guideUnavailableDates]);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        return { daysInMonth, startingDay };
    };

    const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

    const isDateUnavailable = (day) => {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return unavailableDates.has(dateStr);
    };

    const isDatePast = (day) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return checkDate < today;
    };

    const isDateSelected = (day) => {
        if (!localSelectedDate) return false;
        const selected = new Date(localSelectedDate);
        return (
            selected.getFullYear() === currentMonth.getFullYear() &&
            selected.getMonth() === currentMonth.getMonth() &&
            selected.getDate() === day
        );
    };

    const handleDateClick = (day) => {
        if (isDateUnavailable(day) || isDatePast(day)) return;
        
        // Format date string directly to avoid timezone issues
        const year = currentMonth.getFullYear();
        const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        updateSelectionDraft({ selectedDate: `${year}-${month}-${dayStr}` });
    };

    const handleConfirm = () => {
        if (localSelectedDate && localSelectedTime) {
            onSelectDate(localSelectedDate);
            onSelectTime(localSelectedTime);
            onClose();
        }
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const timeSlots = [
        { value: 'AM', label: 'Morning', description: '6:00 AM - 12:00 PM' },
        { value: 'PM', label: 'Afternoon', description: '12:00 PM - 6:00 PM' }
    ];

    const formatTime = (time) => {
        if (time === 'AM') return 'Morning';
        if (time === 'PM') return 'Afternoon';
        return time;
    };

    if (!isOpen) return null;

    const isPastMonth = () => {
        const today = new Date();
        return (
            currentMonth.getFullYear() < today.getFullYear() ||
            (currentMonth.getFullYear() === today.getFullYear() && 
             currentMonth.getMonth() < today.getMonth())
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-sage-100 rounded-full flex items-center justify-center overflow-hidden">
                            {guide?.profilePicture ? (
                                <img 
                                    src={guide.profilePicture} 
                                    alt={guide.fullName}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-sage-700 font-semibold text-lg">
                                    {guide?.fullName?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-stone-800">{guide?.fullName}</h3>
                            <div className="flex items-center gap-2 text-sm text-stone-500">
                                {guide?.totalStars > 0 && guide?.totalRatings > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        {(guide.totalStars / guide.totalRatings).toFixed(1)}
                                        <span className="text-stone-400">({guide.totalRatings})</span>
                                    </span>
                                )}
                                {guide?.contactNumber && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {guide.contactNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-stone-500" />
                    </button>
                </div>

                {/* Calendar */}
                <div className="p-4">
                    <h4 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-terracotta-500" />
                        Select Date
                    </h4>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={prevMonth}
                            disabled={isPastMonth()}
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5 text-stone-600" />
                        </button>
                        <span className="font-medium text-stone-800">
                            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                        </span>
                        <button
                            onClick={nextMonth}
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
                            const past = isDatePast(day);
                            const selected = isDateSelected(day);
                            const disabled = unavailable || past;

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    disabled={disabled}
                                    className={`
                                        aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all
                                        ${selected 
                                            ? 'bg-terracotta-600 text-white' 
                                            : disabled
                                                ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                                                : 'hover:bg-terracotta-50 text-stone-700'
                                        }
                                        ${unavailable && !past ? 'bg-red-50 text-red-300 line-through' : ''}
                                    `}
                                    title={unavailable ? 'Guide unavailable' : past ? 'Past date' : ''}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mt-4 text-xs text-stone-500">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
                            <span>Unavailable</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-terracotta-600 rounded" />
                            <span>Selected</span>
                        </div>
                    </div>
                </div>

                {/* Time Selection */}
                <div className="p-4 border-t border-stone-200">
                    <h4 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-terracotta-500" />
                        Select Time
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        {timeSlots.map(slot => (
                            <button
                                key={slot.value}
                                onClick={() => updateSelectionDraft({ selectedTime: slot.value })}
                                className={`
                                    px-4 py-4 rounded-xl text-center transition-all
                                    ${localSelectedTime === slot.value
                                        ? 'bg-terracotta-600 text-white'
                                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                    }
                                `}
                            >
                                <div className="font-semibold text-base">{slot.label}</div>
                                <div className={`text-xs mt-1 ${localSelectedTime === slot.value ? 'text-terracotta-100' : 'text-stone-500'}`}>
                                    {slot.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-stone-600">
                            {localSelectedDate && localSelectedTime ? (
                                <span>
                                    Selected: <strong>{new Date(localSelectedDate).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })}</strong> at <strong>{formatTime(localSelectedTime)}</strong>
                                </span>
                            ) : (
                                <span className="text-stone-400">Please select a date and time</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleConfirm}
                        disabled={!localSelectedDate || !localSelectedTime}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-terracotta-600 hover:bg-terracotta-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-4 h-4" />
                        Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GuideCalendarModal;

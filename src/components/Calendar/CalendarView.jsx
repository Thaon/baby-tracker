import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getEventsByDate, createEvent, deleteEvent } from '../../db/database';
import { toast } from 'react-toastify';
import EventForm from '../EventForm/EventForm';
import './CalendarView.css';

const EVENT_TYPES = {
  FEED: 'feed',
  NAP: 'nap',
  POTTY: 'potty'
};

const EVENT_COLORS = {
  feed: '#3b82f6',
  nap: '#8b5cf6',
  potty: '#ef4444'
};

export default function CalendarView({ selectedDate, onSelectDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [loading, setLoading] = useState(false);

  const formattedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  useEffect(() => {
    fetchMonthEvents();
  }, [currentDate]);

  const fetchMonthEvents = async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const eventsByDate = {};

      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayEvents = await getEventsByDate(dateStr);
        if (dayEvents.length > 0) {
          eventsByDate[dateStr] = dayEvents;
        }
      }
      setEvents(eventsByDate);
    } catch (error) {
      toast.error('Failed to load events');
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getCalendarDays = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const today = new Date();
    const days = [];

    const prevMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        isCurrentMonth: true,
        dateStr,
        isToday: i === today.getDate() &&
          currentDate.getMonth() === today.getMonth() &&
          currentDate.getFullYear() === today.getFullYear()
      });
    }

    // Use 5 rows if possible, 6 if needed
    const targetCells = days.length <= 35 ? 35 : 42;
    const remainingDays = targetCells - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    return days;
  };

  const handleDayClick = (dateStr) => {
    onSelectDate(dateStr);
  };

  const handleAddEvent = (type) => {
    setFormType(type);
    setSelectedEventForEdit(null);
    setShowForm(true);
  };

  const handleEventSubmit = async (event) => {
    try {
      await createEvent(event);
      toast.success(`${event.type.charAt(0).toUpperCase() + event.type.slice(1)} event saved`);
      setShowForm(false);
      await fetchMonthEvents();
      onSelectDate(event.date);
      setSelectedEventForEdit(null);
    } catch (error) {
      toast.error('Failed to save event');
      console.error('Error saving event:', error);
    }
  };

  const getEventCountByDate = (dateStr) => {
    return events[dateStr]?.length || 0;
  };

  if (loading) {
    return <div className="calendar-view">Loading...</div>;
  }

  const calendarDays = getCalendarDays();
  const numRows = Math.ceil(calendarDays.length / 7);

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button className="nav-btn prev" onClick={handlePrevMonth}>
          <ChevronLeft size={20} />
        </button>
        <h2>
          {formattedCurrentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button className="nav-btn next" onClick={handleNextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="calendar-grid">
        <div className="weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>

        <div className="days" style={{ gridTemplateRows: `repeat(${numRows}, 1fr)` }}>
          {calendarDays.map((calendarDay) => (
            <button
              key={calendarDay.dateStr || `other-${calendarDay.day}`}
              className={`day-cell ${
                !calendarDay.isCurrentMonth ? 'other-month' : ''
              } ${calendarDay.isToday ? 'today' : ''} ${selectedDate === calendarDay.dateStr ? 'selected' : ''}`}
              onClick={() => calendarDay.dateStr && handleDayClick(calendarDay.dateStr)}
            >
              <span className="day-number">{calendarDay.day}</span>
              {calendarDay.dateStr && getEventCountByDate(calendarDay.dateStr) > 0 && (
                <div className="event-dots">
                  {events[calendarDay.dateStr]?.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className="event-dot"
                      style={{ backgroundColor: EVENT_COLORS[event.type] }}
                    />
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="quick-add">
        <h3>Quick Add Event</h3>
        <div className="quick-add-buttons">
          <button className="quick-add-btn feed-btn" onClick={() => handleAddEvent(EVENT_TYPES.FEED)}>
            <Plus size={18} /> Feed
          </button>
          <button className="quick-add-btn nap-btn" onClick={() => handleAddEvent(EVENT_TYPES.NAP)}>
            <Plus size={18} /> Nap
          </button>
          <button className="quick-add-btn potty-btn" onClick={() => handleAddEvent(EVENT_TYPES.POTTY)}>
            <Plus size={18} /> Potty
          </button>
        </div>
      </div>

      {showForm && (
        <EventForm
          eventType={formType}
          initialData={selectedEventForEdit}
          onSubmit={handleEventSubmit}
          onCancel={() => {
            setShowForm(false);
            setSelectedEventForEdit(null);
          }}
        />
      )}
    </div>
  );
}

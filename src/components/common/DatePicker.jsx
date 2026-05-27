import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './DatePicker.css';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({ value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  // Reset view month when value changes
  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number);
      setViewMonth(new Date(y, m - 1, 1));
    }
  }, [value]);

  const formatDisplay = (val) => {
    if (!val) return '';
    const [y, m, d] = val.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCalendarDays = () => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const days = [];

    // Previous month fill
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = month === 0 ? 12 : month;
      const y = month === 0 ? year - 1 : year;
      days.push({
        day: d,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month fill (always show 6 rows = 42 cells)
    const remaining = 42 - days.length;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        dateStr: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  };

  const handleDayClick = (dateStr) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const handleToday = (e) => {
    e.stopPropagation();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onChange(todayStr);
    setIsOpen(false);
  };

  const calendarDays = getCalendarDays();

  return (
    <div className="date-picker-container">
      {label && <label className="date-picker-label">{label}</label>}
      <div
        className={`date-picker-input ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="date-display">{value ? formatDisplay(value) : 'Select date'}</span>
      </div>

      {isOpen && (
        <div className="date-picker-overlay" onClick={() => setIsOpen(false)}>
          <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
            {/* Month navigation */}
            <div className="dp-header">
              <button className="dp-nav-btn" onClick={handlePrevMonth}>
                <ChevronLeft size={18} />
              </button>
              <span className="dp-month-year">
                {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button className="dp-nav-btn" onClick={handleNextMonth}>
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="dp-weekdays">
              {WEEKDAYS.map(day => (
                <span key={day} className="dp-weekday">{day}</span>
              ))}
            </div>

            {/* Day grid */}
            <div className="dp-days">
              {calendarDays.map((dayObj) => (
                <button
                  key={dayObj.dateStr}
                  className={`dp-day ${!dayObj.isCurrentMonth ? 'other-month' : ''} ${dayObj.isToday ? 'today' : ''} ${value === dayObj.dateStr ? 'selected' : ''}`}
                  onClick={() => handleDayClick(dayObj.dateStr)}
                >
                  {dayObj.day}
                </button>
              ))}
            </div>

            {/* Today button */}
            <div className="dp-footer">
              <button className="dp-today-btn" onClick={handleToday}>Today</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

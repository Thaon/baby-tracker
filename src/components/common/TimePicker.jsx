import { useState, useRef, useCallback, useEffect } from 'react';
import './TimePicker.css';

const OUTER_RADIUS = 120;
const INNER_RADIUS = 82;
const CLOCK_SIZE = OUTER_RADIUS * 2 + 40;
const CENTER = CLOCK_SIZE / 2;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,10,...55

function getAngle(x, y) {
  // 12 o'clock is 0, clockwise positive
  const angle = Math.atan2(x, -y) * (180 / Math.PI);
  return angle < 0 ? angle + 360 : angle;
}

function getClosestValue(angle, values) {
  const step = 360 / values.length;
  // Normalize angle to closest step
  const index = Math.round(angle / step) % values.length;
  return values[index];
}

export default function TimePicker({ value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('hours'); // 'hours' | 'minutes'
  const [isAM, setIsAM] = useState(true);
  const [dragging, setDragging] = useState(false);
  const clockRef = useRef(null);

  // Parse value ("HH:mm" string) into hours/minutes
  const parseValue = (val) => {
    if (!val) {
      const now = new Date();
      const h = now.getHours();
      return { hours: h % 12 || 12, minutes: now.getMinutes(), isAM: h < 12 };
    }
    const [h, m] = val.split(':').map(Number);
    return { hours: h % 12 || 12, minutes: m, isAM: h < 12 };
  };

  const currentValue = parseValue(value);

  const [selectedHours, setSelectedHours] = useState(currentValue.hours);
  const [selectedMinutes, setSelectedMinutes] = useState(currentValue.minutes);

  useEffect(() => {
    if (isOpen) {
      const parsed = parseValue(value);
      setSelectedHours(parsed.hours);
      setSelectedMinutes(parsed.minutes);
      setIsAM(parsed.isAM);
      setMode('hours');
    }
  }, [isOpen]);

  const formatDisplay = (val) => {
    if (!val) return '';
    const { hours, minutes, isAM: am } = parseValue(val);
    const h12 = hours || 12;
    const mStr = String(minutes).padStart(2, '0');
    const ampm = am ? 'AM' : 'PM';
    return `${h12}:${mStr} ${ampm}`;
  };

  const commitValue = useCallback((h, m, am) => {
    const h24 = am ? (h === 12 ? 0 : h) : (h === 12 ? 12 : h + 12);
    const timeStr = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange(timeStr);
  }, [onChange]);

  const updateFromPointer = useCallback((e) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const dist = Math.sqrt(x * x + y * y);

    // Only respond if pointer is within or near the clock face
    if (dist > OUTER_RADIUS + 30) return;

    const angle = getAngle(x, y);

    if (mode === 'hours') {
      const hour = getClosestValue(angle, HOURS);
      setSelectedHours(hour);
    } else {
      const minute = getClosestValue(angle, MINUTES);
      setSelectedMinutes(minute);
    }
  }, [mode]);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
    updateFromPointer(e);
  }, [updateFromPointer]);

  const handlePointerMove = useCallback((e) => {
    if (!dragging) return;
    updateFromPointer(e);
  }, [dragging, updateFromPointer]);

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (mode === 'hours') {
      // Auto-advance to minutes after hour selection
      setMode('minutes');
    } else {
      commitValue(selectedHours, selectedMinutes, isAM);
      setIsOpen(false);
    }
  }, [dragging, mode, selectedHours, selectedMinutes, isAM, commitValue]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging, handlePointerMove, handlePointerUp]);

  const handleSwitchMode = (newMode) => {
    setMode(newMode);
  };

  const handleAMPM = (am) => {
    setIsAM(am);
    commitValue(selectedHours, selectedMinutes, am);
  };

  const getHandAngle = () => {
    if (mode === 'hours') {
      // 12 o'clock = 0°, each hour = 30°
      return (selectedHours % 12) * 30;
    } else {
      // 0 min = 0°, each minute = 6°
      return selectedMinutes * 6;
    }
  };

  const getHandLength = () => {
    // Shorter hand for hours (inner ring), longer for minutes (outer ring)
    return mode === 'hours' ? INNER_RADIUS : OUTER_RADIUS - 10;
  };

  const renderClockNumbers = () => {
    if (mode === 'hours') {
      return HOURS.map((hour) => {
        const angle = (hour * 30 - 90) * (Math.PI / 180);
        const radius = INNER_RADIUS;
        const x = CENTER + radius * Math.cos(angle);
        const y = CENTER + radius * Math.sin(angle);
        const isSelected = selectedHours === hour;
        return (
          <span
            key={hour}
            className={`clock-number ${isSelected ? 'selected' : ''}`}
            style={{ left: x, top: y }}
          >
            {hour}
          </span>
        );
      });
    } else {
      return MINUTES.map((minute) => {
        const angle = (minute * 6 - 90) * (Math.PI / 180);
        const radius = OUTER_RADIUS - 10;
        const x = CENTER + radius * Math.cos(angle);
        const y = CENTER + radius * Math.sin(angle);
        const isSelected = selectedMinutes === minute;
        const display = String(minute).padStart(2, '0');
        return (
          <span
            key={minute}
            className={`clock-number ${isSelected ? 'selected' : ''}`}
            style={{ left: x, top: y }}
          >
            {display}
          </span>
        );
      });
    }
  };

  const handAngle = getHandAngle();
  const handLength = getHandLength();

  return (
    <div className="time-picker-container">
      {label && <label className="time-picker-label">{label}</label>}
      <div
        className={`time-picker-input ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="time-display">{value ? formatDisplay(value) : '--:-- --'}</span>
      </div>

      {isOpen && (
        <div className="time-picker-overlay" onClick={() => setIsOpen(false)}>
          <div className="time-picker-modal" onClick={(e) => e.stopPropagation()}>
            {/* Time display header */}
            <div className="time-modal-header">
              <button
                className={`time-digit ${mode === 'hours' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('hours')}
              >
                {String(selectedHours).padStart(2, '0')}
              </button>
              <span className="time-colon">:</span>
              <button
                className={`time-digit ${mode === 'minutes' ? 'active' : ''}`}
                onClick={() => handleSwitchMode('minutes')}
              >
                {String(selectedMinutes).padStart(2, '0')}
              </button>
              <div className="ampm-toggle">
                <button
                  className={`ampm-btn ${isAM ? 'active' : ''}`}
                  onClick={() => handleAMPM(true)}
                >
                  AM
                </button>
                <button
                  className={`ampm-btn ${!isAM ? 'active' : ''}`}
                  onClick={() => handleAMPM(false)}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Clock face */}
            <div
              className="clock-face"
              ref={clockRef}
              onPointerDown={handlePointerDown}
              style={{ touchAction: 'none' }}
            >
              <div className="clock-circle">
                {renderClockNumbers()}
                {/* Clock hand */}
                <div
                  className="clock-hand"
                  style={{
                    transform: `rotate(${handAngle}deg)`,
                    height: `${handLength}px`,
                  }}
                >
                  <div className="hand-line" />
                  <div className="hand-dot" />
                </div>
                {/* Center dot */}
                <div className="clock-center" />
              </div>
            </div>

            {/* Actions */}
            <div className="time-modal-footer">
              <button className="time-cancel-btn" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button
                className="time-ok-btn"
                onClick={() => {
                  commitValue(selectedHours, selectedMinutes, isAM);
                  setIsOpen(false);
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

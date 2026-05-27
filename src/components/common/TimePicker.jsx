import { useState, useRef, useCallback, useEffect } from 'react';
import './TimePicker.css';

const OUTER_RADIUS = 110;
const INNER_RADIUS = 70;
const CLOCK_SIZE = 260;
const CENTER = CLOCK_SIZE / 2;

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function getAngle(x, y) {
  const angle = Math.atan2(x, -y) * (180 / Math.PI);
  return angle < 0 ? angle + 360 : angle;
}

function getClosestValue(angle, values) {
  const step = 360 / values.length;
  const index = Math.round(angle / step) % values.length;
  return values[index] !== undefined ? values[index] : values[0];
}

function parseTimeValue(val) {
  if (!val) {
    const now = new Date();
    const h = now.getHours();
    return {
      hours: h % 12 || 12,
      minutes: Math.round(now.getMinutes() / 5) * 5,
      isAM: h < 12
    };
  }
  const [h, m] = val.split(':').map(Number);
  return {
    hours: h % 12 || 12,
    minutes: Math.round(m / 5) * 5,
    isAM: h < 12
  };
}

function formatTimeDisplay(val) {
  if (!val) return '';
  const { hours, minutes, isAM } = parseTimeValue(val);
  const h12 = hours || 12;
  const mStr = String(minutes).padStart(2, '0');
  return `${h12}:${mStr} ${isAM ? 'AM' : 'PM'}`;
}

function toTimeString(hours, minutes, isAM) {
  const h24 = isAM
    ? (hours === 12 ? 0 : hours)
    : (hours === 12 ? 12 : hours + 12);
  return `${String(h24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export default function TimePicker({ value, onChange, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('hours');
  const [isAM, setIsAM] = useState(true);
  const [selectedHours, setSelectedHours] = useState(12);
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [dragging, setDragging] = useState(false);

  // Refs for latest values (avoid stale closures in pointer handlers)
  const modeRef = useRef('hours');
  const hoursRef = useRef(12);
  const minutesRef = useRef(0);
  const amRef = useRef(true);
  const draggingRef = useRef(false);
  const clockRef = useRef(null);

  // Sync refs
  modeRef.current = mode;
  hoursRef.current = selectedHours;
  minutesRef.current = selectedMinutes;
  amRef.current = isAM;

  // Init state when opening
  useEffect(() => {
    if (isOpen) {
      const parsed = parseTimeValue(value);
      setSelectedHours(parsed.hours);
      setSelectedMinutes(parsed.minutes);
      setIsAM(parsed.isAM);
      setMode('hours');
    }
  }, [isOpen]);

  const handleSetHours = (h) => {
    setSelectedHours(h);
    setMode('minutes');
  };

  const handleSetMinutes = (m) => {
    setSelectedMinutes(m);
  };

  const handleCommit = useCallback(() => {
    const timeStr = toTimeString(hoursRef.current, minutesRef.current, amRef.current);
    onChange(timeStr);
  }, [onChange]);

  // --- Pointer logic ---

  const updateSelection = useCallback((clientX, clientY) => {
    if (!clockRef.current) return;
    const rect = clockRef.current.getBoundingClientRect();
    const x = clientX - rect.left - rect.width / 2;
    const y = clientY - rect.top - rect.height / 2;
    const dist = Math.sqrt(x * x + y * y);

    // Require pointer inside the clock area (with some tolerance)
    if (dist < 5 || dist > OUTER_RADIUS + 25) return;

    const angle = getAngle(x, y);
    const currentMode = modeRef.current;

    if (currentMode === 'hours') {
      const hour = getClosestValue(angle, HOURS);
      hoursRef.current = hour;
      setSelectedHours(hour);
    } else {
      const minute = getClosestValue(angle, MINUTES);
      minutesRef.current = minute;
      setSelectedMinutes(minute);
    }
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    setDragging(true);
    updateSelection(e.clientX, e.clientY);
    // Capture pointer so we get events even outside the element
    clockRef.current?.setPointerCapture?.(e.pointerId);
  }, [updateSelection]);

  const handlePointerMove = useCallback((e) => {
    if (!draggingRef.current) return;
    updateSelection(e.clientX, e.clientY);
  }, [updateSelection]);

  const handlePointerUp = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);

    const currentMode = modeRef.current;
    if (currentMode === 'hours') {
      // Advance to minutes phase
      setMode('minutes');
    }
    // In minutes mode, don't auto-commit — user presses OK
  }, []);

  // Attach global listeners via refs to avoid re-registration churn
  const pointerMoveRef = useRef(handlePointerMove);
  const pointerUpRef = useRef(handlePointerUp);
  pointerMoveRef.current = handlePointerMove;
  pointerUpRef.current = handlePointerUp;

  useEffect(() => {
    const onMove = (e) => pointerMoveRef.current?.(e);
    const onUp = (e) => pointerUpRef.current?.(e);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  // --- Render helpers ---

  const handleDigitClick = (newMode) => {
    setMode(newMode);
  };

  const handleAMPMToggle = (am) => {
    setIsAM(am);
    amRef.current = am;
  };

  const handAngle = mode === 'hours'
    ? (selectedHours % 12) * 30
    : selectedMinutes * 6;

  const handLength = mode === 'hours' ? INNER_RADIUS - 8 : OUTER_RADIUS - 14;

  const renderNumbers = () => {
    const items = mode === 'hours' ? HOURS : MINUTES;
    const isHourMode = mode === 'hours';
    const currentSelected = isHourMode ? selectedHours : selectedMinutes;

    return items.map((val) => {
      const degPerItem = 360 / items.length;
      // First item is at the top (12 o'clock), so offset by -90°
      const idx = isHourMode ? (val % 12) : (val / 5);
      const angleRad = (idx * degPerItem - 90) * (Math.PI / 180);
      const radius = isHourMode ? INNER_RADIUS : OUTER_RADIUS;
      const x = CENTER + radius * Math.cos(angleRad);
      const y = CENTER + radius * Math.sin(angleRad);
      const isSelected = currentSelected === val;
      const display = isHourMode ? String(val) : String(val).padStart(2, '0');

      return (
        <span
          key={val}
          className={`clock-number ${isSelected ? 'selected' : ''}`}
          style={{ left: x, top: y }}
          onClick={(e) => {
            e.stopPropagation();
            if (isHourMode) {
              handleSetHours(val);
            } else {
              handleSetMinutes(val);
            }
          }}
        >
          {display}
        </span>
      );
    });
  };

  return (
    <div className="time-picker-container">
      {label && <label className="time-picker-label">{label}</label>}
      <div
        className={`time-picker-input ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <span className="time-display">
          {value ? formatTimeDisplay(value) : '--:-- --'}
        </span>
      </div>

      {isOpen && (
        <div className="time-picker-overlay" onClick={() => setIsOpen(false)}>
          <div className="time-picker-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="time-modal-header">
              <button
                className={`time-digit ${mode === 'hours' ? 'active' : ''}`}
                onClick={() => handleDigitClick('hours')}
              >
                {String(selectedHours).padStart(2, '0')}
              </button>
              <span className="time-colon">:</span>
              <button
                className={`time-digit ${mode === 'minutes' ? 'active' : ''}`}
                onClick={() => handleDigitClick('minutes')}
              >
                {String(selectedMinutes).padStart(2, '0')}
              </button>
              <div className="ampm-toggle">
                <button
                  className={`ampm-btn ${isAM ? 'active' : ''}`}
                  onClick={() => handleAMPMToggle(true)}
                >
                  AM
                </button>
                <button
                  className={`ampm-btn ${!isAM ? 'active' : ''}`}
                  onClick={() => handleAMPMToggle(false)}
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
                {/* Inner ring (hours) */}
                <div className={`clock-ring inner-ring ${mode === 'hours' ? 'ring-active' : ''}`} />

                {/* Outer ring (minutes) */}
                <div className={`clock-ring outer-ring ${mode === 'minutes' ? 'ring-active' : ''}`} />

                {/* Numbers */}
                {renderNumbers()}

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

            {/* Footer */}
            <div className="time-modal-footer">
              <button className="time-cancel-btn" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button
                className="time-ok-btn"
                onClick={() => {
                  handleCommit();
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
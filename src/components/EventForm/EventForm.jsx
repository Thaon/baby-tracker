import { useState, useEffect } from 'react';
import { X, Utensils, Moon, Droplets } from 'lucide-react';
import FeedForm from './FeedForm';
import NapForm from './NapForm';
import PottyForm from './PottyForm';
import DatePicker from '../common/DatePicker';
import TimePicker from '../common/TimePicker';
import './EventForm.css';

const EVENT_ICONS = {
  feed: Utensils,
  nap: Moon,
  potty: Droplets
};

const EVENT_COLORS = {
  feed: '#3b82f6',
  nap: '#8b5cf6',
  potty: '#ef4444'
};

export default function EventForm({ eventType, initialData, onSubmit, onCancel }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nowTime = now.toTimeString().slice(0, 5);

    if (initialData) {
      setSelectedDate(initialData.date || todayStr);
      setTimeFrom(initialData.timeFrom || nowTime);
      setTimeTo(initialData.timeTo || '');
      setNotes(initialData.notes || '');
    } else {
      setSelectedDate(todayStr);
      setTimeFrom(nowTime);
      setTimeTo('');
      setNotes('');
    }
  }, [initialData]);

  const handleSubmit = (typeSpecificData) => {
    const event = {
      id: initialData?.id || crypto.randomUUID(),
      type: eventType,
      date: selectedDate,
      timeFrom,
      timeTo: eventType === 'nap' ? timeTo : null,
      ...typeSpecificData,
      notes,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSubmit(event);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="event-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            {(() => {
              const Icon = EVENT_ICONS[eventType];
              return <Icon size={20} style={{ color: EVENT_COLORS[eventType] }} />;
            })()}
            <h2>{initialData ? 'Edit' : 'New'} {eventType.charAt(0).toUpperCase() + eventType.slice(1)} Event</h2>
          </div>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-section">
            <label className="section-label">When</label>

            <div className="form-row">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label="Date"
              />
            </div>

            <div className="form-row-inline">
              <div className="form-row half">
                <TimePicker
                  value={timeFrom}
                  onChange={setTimeFrom}
                  label="Start Time"
                />
              </div>
              {eventType === 'nap' && (
                <div className="form-row half">
                  <TimePicker
                    value={timeTo}
                    onChange={setTimeTo}
                    label="End Time"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-section">
            <label className="section-label">{eventType.charAt(0).toUpperCase() + eventType.slice(1)} Details</label>

            {eventType === 'feed' && (
              <FeedForm
                initialData={initialData?.foodItems}
                notes={notes}
                onNotesChange={setNotes}
                onSubmit={handleSubmit}
              />
            )}
            {eventType === 'nap' && (
              <NapForm initialData={initialData} onSubmit={handleSubmit} />
            )}
            {eventType === 'potty' && (
              <PottyForm
                initialData={initialData}
                notes={notes}
                onNotesChange={setNotes}
                onSubmit={handleSubmit}
              />
            )}
          </div>

          {eventType === 'nap' && (
            <div className="form-section">
              <label className="input-label">Notes</label>
              <textarea
                className="notes-textarea"
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { getEventsByDate, createEvent, deleteEvent } from "../../db/database";
import { toast } from "react-toastify";
import {
  Plus,
  Pencil,
  Trash2,
  Baby,
  Utensils,
  Moon,
  Droplets,
  Milk,
} from "lucide-react";
import EventForm from "../EventForm/EventForm";
import { getDaySummary, formatDuration } from "../../utils/daySummary";
import "./DayTimeline.css";

const EVENT_COLORS = {
  feed: "#3b82f6",
  nap: "#8b5cf6",
  potty: "#ef4444",
  expressed: "#10b981",
};

const EVENT_ICONS = {
  feed: Utensils,
  nap: Moon,
  potty: Droplets,
  expressed: Milk,
};

const EVENT_TYPES = {
  FEED: "feed",
  NAP: "nap",
  POTTY: "potty",
  EXPRESSED: "expressed",
};

function formatTime12(time24) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function DayTimeline({ selectedDate, onReward }) {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchEvents();
    }
  }, [selectedDate]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const dayEvents = await getEventsByDate(selectedDate);
      setEvents(dayEvents.sort((a, b) => a.timeFrom.localeCompare(b.timeFrom)));
    } catch (error) {
      toast.error("Failed to load events");
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  const daySummary = useMemo(() => getDaySummary(events), [events]);

  const handleAddEvent = (type) => {
    setFormType(type);
    setSelectedEventForEdit(null);
    setShowForm(true);
  };

  const handleEditEvent = (event) => {
    setFormType(event.type);
    setSelectedEventForEdit(event);
    setShowForm(true);
  };

  const handleDeleteEvent = async (event) => {
    if (window.confirm(`Delete this ${event.type} event?`)) {
      try {
        await deleteEvent(event.id);
        toast.success(
          `${event.type.charAt(0).toUpperCase() + event.type.slice(1)} event deleted`,
        );
        await fetchEvents();
      } catch (error) {
        toast.error("Failed to delete event");
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleEventSubmit = async (event) => {
    try {
      await createEvent(event);
      onReward?.();
      toast.success(
        `${event.type.charAt(0).toUpperCase() + event.type.slice(1)} event saved`,
      );
      setShowForm(false);
      await fetchEvents();
      setSelectedEventForEdit(null);
    } catch (error) {
      toast.error("Failed to save event");
      console.error("Error saving event:", error);
    }
  };

  const getEventDetails = (event) => {
    if (event.type === "feed") {
      const foodItems = event.foodItems || [];
      const milkItems = foodItems.filter((item) => item.type === "milk");
      const solidsItems = foodItems.filter((item) => item.type === "solids");
      const totalMilk = milkItems.reduce((sum, item) => sum + item.amount, 0);
      const totalSolids = solidsItems.reduce(
        (sum, item) => sum + item.amount,
        0,
      );
      const parts = [];
      if (totalMilk > 0) parts.push(`Milk: ${totalMilk}ml`);
      if (totalSolids > 0)
        parts.push(
          `Solids: ${solidsItems.map((s) => `${s.name} (${s.amount}mg)`).join(", ")}`,
        );
      return parts.join(" | ") || "No items";
    } else if (event.type === "nap") {
      return `${formatTime12(event.timeFrom)} → ${formatTime12(event.timeTo)}`;
    } else if (event.type === "potty") {
      const parts = [];
      if (event.isPee) parts.push("Pee");
      if (event.isPoop) parts.push("Poop");
      return parts.join(" + ") || "Potty";
    } else if (event.type === "expressed") {
      return event.amount ? `${event.amount}ml expressed` : "Expressed";
    }
    return "";
  };

  const formatDateHeader = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const isToday = dateStr === today.toISOString().split("T")[0];
    const formatted = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return isToday ? `Today — ${formatted}` : formatted;
  };

  const hasSummary =
    daySummary.feedCount > 0 ||
    daySummary.pottyCount > 0 ||
    daySummary.napCount > 0 ||
    daySummary.expressedCount > 0;

  return (
    <div className="day-timeline">
      <div className="timeline-header">
        <h2>{formatDateHeader(selectedDate)}</h2>
        <div className="add-buttons">
          <button
            className="add-type-btn feed"
            onClick={() => handleAddEvent(EVENT_TYPES.FEED)}
          >
            <Plus size={16} /> Feed
          </button>
          <button
            className="add-type-btn nap"
            onClick={() => handleAddEvent(EVENT_TYPES.NAP)}
          >
            <Plus size={16} /> Nap
          </button>
          <button
            className="add-type-btn potty"
            onClick={() => handleAddEvent(EVENT_TYPES.POTTY)}
          >
            <Plus size={16} /> Potty
          </button>
          <button
            className="add-type-btn expressed"
            onClick={() => handleAddEvent(EVENT_TYPES.EXPRESSED)}
          >
            <Plus size={16} /> Expressed
          </button>
        </div>
      </div>

      {hasSummary && (
        <div className="day-summary-card">
          <div className="summary-item feed-summary">
            <div className="summary-left">
              <span className="summary-icon">🍼</span>
              <span className="summary-label">Feeds</span>
            </div>
            <div className="summary-right">
              <span className="summary-detail">
                {daySummary.feedCount} · {daySummary.avgMilk}ml avg
              </span>
            </div>
          </div>

          <div className="summary-item nap-summary">
            <div className="summary-left">
              <span className="summary-icon">😴</span>
              <span className="summary-label">Naps</span>
            </div>
            <div className="summary-right">
              <span className="summary-detail">
                {daySummary.napCount > 0
                  ? formatDuration(daySummary.napDuration)
                  : "No naps"}
              </span>
            </div>
          </div>

          <div className="summary-item potty-summary">
            <div className="summary-left">
              <span className="summary-icon">🚽</span>
              <span className="summary-label">Potty</span>
            </div>
            <div className="summary-right">
              <span className="summary-detail">
                {daySummary.peeCount > 0
                  ? `${daySummary.peeCount} pee${daySummary.peeCount > 1 ? "s" : ""}`
                  : "No pees"}
                {" · "}
                {daySummary.poopCount > 0
                  ? `${daySummary.poopCount} poop${daySummary.poopCount > 1 ? "s" : ""}`
                  : "No poops"}
              </span>
            </div>
          </div>

          <div className="summary-item expressed-summary">
            <div className="summary-left">
              <span className="summary-icon">🤱</span>
              <span className="summary-label">Expressed</span>
            </div>
            <div className="summary-right">
              <span className="summary-detail">
                {daySummary.expressedCount} · {daySummary.totalExpressed}ml
              </span>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : events.length === 0 ? (
        <div className="empty-state">
          <Baby size={48} strokeWidth={1} />
          <p>No events for this day</p>
          <p className="empty-hint">Tap a button above to add one</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map((event) => {
            const IconComp = EVENT_ICONS[event.type];
            return (
              <div
                key={event.id}
                className="event-item"
                style={{ borderLeftColor: EVENT_COLORS[event.type] }}
              >
                <div
                  className="event-icon"
                  style={{
                    backgroundColor: EVENT_COLORS[event.type] + "15",
                    color: EVENT_COLORS[event.type],
                  }}
                >
                  <IconComp size={22} />
                </div>
                <div className="event-content">
                  <div className="event-type-row">
                    <span
                      className="event-type"
                      style={{ color: EVENT_COLORS[event.type] }}
                    >
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                  </div>
                  <div className="event-details">
                    {getEventDetails(event)}
                    <div className="event-time-badge">
                      {formatTime12(event.timeFrom)}
                    </div>
                  </div>
                  {event.notes && (
                    <div className="event-notes">{event.notes}</div>
                  )}
                </div>
                <div className="event-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditEvent(event)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteEvent(event)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

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

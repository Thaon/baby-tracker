import { useState, useEffect, useMemo, useCallback } from "react";
import { getAllEvents, createEvent, getEventsByDate } from "../../db/database";
import {
  getDaySummary,
  formatDuration,
  toDateString,
} from "../../utils/daySummary";
import { toast } from "react-toastify";
import EventForm from "../EventForm/EventForm";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Utensils, Moon, Droplets, Milk } from "lucide-react";
import "./Dashboard.css";

const EVENT_TYPES = {
  FEED: "feed",
  NAP: "nap",
  POTTY: "potty",
  EXPRESSED: "expressed",
};

const CHART_COLORS = {
  feeds: "#3b82f6",
  pees: "#f59e0b",
  poops: "#ef4444",
  naps: "#8b5cf6",
  expressed: "#10b981",
};

function formatTimeAgo(dateStr, timeStr) {
  if (!dateStr || !timeStr) return String.fromCodePoint(8212);
  let dt = new Date(dateStr + "T" + timeStr);
  let now = new Date();
  let diffMs = now - dt;
  let diffMins = Math.floor(diffMs / 60000);
  let diffHours = Math.floor(diffMins / 60);
  let diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return diffMins + "m ago";
  if (diffHours < 24) return diffHours + "h " + (diffMins % 60) + "m ago";
  return diffDays + "d " + (diffHours % 24) + "h ago";
}

function getLastNDays(n) {
  let days = [];
  let today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    let d = new Date(today);
    d.setDate(d.getDate() - i);
    let dateStr = d.toISOString().split("T")[0];
    days.push(dateStr);
  }
  return days;
}

function formatShortDate(dateStr) {
  let d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard({ onReward, onSelectDate }) {
  let [events, setEvents] = useState([]);
  let [todayEvents, setTodayEvents] = useState([]);
  let [loading, setLoading] = useState(true);
  let [showForm, setShowForm] = useState(false);
  let [formType, setFormType] = useState(null);

  let fetchEvents = useCallback(async function () {
    try {
      let all = await getAllEvents();
      setEvents(all);
    } catch (error) {
      toast.error("Failed to load events");
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDayEvents = async () => {
    const now = new Date();
    try {
      const dayEvents = await getEventsByDate(toDateString(now));
      setTodayEvents(
        dayEvents.sort((a, b) => a.timeFrom.localeCompare(b.timeFrom)),
      );
    } catch (error) {
      toast.error("Failed to load events");
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(function () {
    setLoading(true);
    fetchEvents();
    fetchDayEvents();
  }, []);

  let chartData = useMemo(
    function () {
      let days = getLastNDays(7);
      let eventsByDate = {};
      events.forEach(function (e) {
        if (!eventsByDate[e.date]) eventsByDate[e.date] = [];
        eventsByDate[e.date].push(e);
      });

      return days.map(function (dateStr) {
        let dayEvents = eventsByDate[dateStr] || [];
        let feeds = dayEvents.filter(function (e) {
          return e.type === "feed";
        }).length;
        let pees = dayEvents.filter(function (e) {
          return e.type === "potty" && e.isPee;
        }).length;
        let poops = dayEvents.filter(function (e) {
          return e.type === "potty" && e.isPoop;
        }).length;
        let naps = dayEvents.filter(function (e) {
          return e.type === "nap";
        }).length;
        let expressed = dayEvents.filter(function (e) {
          return e.type === "expressed";
        }).length;

        return {
          date: dateStr,
          label: formatShortDate(dateStr),
          feeds: feeds,
          pees: pees,
          poops: poops,
          naps: naps,
          expressed: expressed,
        };
      });
    },
    [events],
  );

  let lastFeed = useMemo(
    function () {
      let feedEvents = events
        .filter(function (e) {
          return e.type === "feed";
        })
        .sort(function (a, b) {
          var da = new Date(a.date + "T" + a.timeFrom);
          var db = new Date(b.date + "T" + b.timeFrom);
          return db - da;
        });
      return feedEvents[0] || null;
    },
    [events],
  );

  var lastPotty = useMemo(
    function () {
      var pottyEvents = events
        .filter(function (e) {
          return e.type === "potty";
        })
        .sort(function (a, b) {
          var da = new Date(a.date + "T" + a.timeFrom);
          var db = new Date(b.date + "T" + b.timeFrom);
          return db - da;
        });
      return pottyEvents[0] || null;
    },
    [events],
  );

  function handleAddEvent(type) {
    setFormType(type);
    setShowForm(true);
  }

  async function handleEventSubmit(event) {
    try {
      await createEvent(event);
      if (onReward) onReward();
      toast.success(
        event.type.charAt(0).toUpperCase() +
          event.type.slice(1) +
          " event saved",
      );
      setShowForm(false);
      await fetchEvents();
      if (onSelectDate) onSelectDate(event.date);
    } catch (error) {
      toast.error("Failed to save event");
      console.error("Error saving event:", error);
    }
  }

  const daySummary = useMemo(() => getDaySummary(todayEvents), [todayEvents]);

  const hasSummary =
    daySummary.feedCount > 0 ||
    daySummary.pottyCount > 0 ||
    daySummary.napCount > 0 ||
    daySummary.expressedCount > 0;

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">Loading dashboard...</div>
      </div>
    );
  }

  var pottyType = "";
  if (lastPotty) {
    if (lastPotty.isPee && lastPotty.isPoop) pottyType = "Pee + Poop";
    else if (lastPotty.isPee) pottyType = "Pee";
    else if (lastPotty.isPoop) pottyType = "Poop";
  }

  return (
    <div className="dashboard">
      <div className="stats-cards">
        <div className="stat-card feed-card">
          <div className="stat-header">
            <Utensils size={18} className="stat-icon" />
            <span className="stat-title">Last Feed</span>
          </div>
          <div className="stat-value">
            {lastFeed
              ? formatTimeAgo(lastFeed.date, lastFeed.timeFrom)
              : "No feeds yet"}
          </div>
          {lastFeed ? (
            <div className="stat-sub">
              {new Date(
                lastFeed.date + "T" + lastFeed.timeFrom,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          ) : null}
        </div>

        <div className="stat-card potty-card">
          <div className="stat-header">
            <Droplets size={18} className="stat-icon" />
            <span className="stat-title">Last Potty</span>
          </div>
          <div className="stat-value">
            {lastPotty
              ? formatTimeAgo(lastPotty.date, lastPotty.timeFrom)
              : "No potty yet"}
          </div>
          {lastPotty ? (
            <div className="stat-sub">
              {new Date(
                lastPotty.date + "T" + lastPotty.timeFrom,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
              <span> {"\u00b7"} </span>
              <span>{pottyType}</span>
            </div>
          ) : null}
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

      <div className="chart-section">
        <h3 className="section-title">Last 7 Days</h3>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                interval="preserveStartEnd"
                angle={-30}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="feeds"
                name="Feeds"
                stroke={CHART_COLORS.feeds}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="pees"
                name="Pees"
                stroke={CHART_COLORS.pees}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="poops"
                name="Poops"
                stroke={CHART_COLORS.poops}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="naps"
                name="Naps"
                stroke={CHART_COLORS.naps}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="expressed"
                name="Expressed (ml)"
                stroke={CHART_COLORS.expressed}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="quick-add-section">
        <h3 className="section-title">Quick Add</h3>
        <div className="quick-add-grid">
          <button
            className="quick-add-tile feed-tile"
            onClick={function () {
              handleAddEvent(EVENT_TYPES.FEED);
            }}
          >
            <Utensils size={24} />
            <span>Feed</span>
          </button>
          <button
            className="quick-add-tile nap-tile"
            onClick={function () {
              handleAddEvent(EVENT_TYPES.NAP);
            }}
          >
            <Moon size={24} />
            <span>Nap</span>
          </button>
          <button
            className="quick-add-tile potty-tile"
            onClick={function () {
              handleAddEvent(EVENT_TYPES.POTTY);
            }}
          >
            <Droplets size={24} />
            <span>Potty</span>
          </button>
          <button
            className="quick-add-tile expressed-tile"
            onClick={function () {
              handleAddEvent(EVENT_TYPES.EXPRESSED);
            }}
          >
            <Milk size={24} />
            <span>Expressed</span>
          </button>
        </div>
      </div>

      {showForm ? (
        <EventForm
          eventType={formType}
          initialData={null}
          onSubmit={handleEventSubmit}
          onCancel={function () {
            setShowForm(false);
          }}
        />
      ) : null}
    </div>
  );
}

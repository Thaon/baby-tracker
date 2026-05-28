import { useState, useCallback } from "react";
import { useReward } from "react-rewards";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CalendarView from "./components/Calendar/CalendarView";
import DayTimeline from "./components/DayTimeline/DayTimeline";
import { exportEvents, createEvent } from "./db/database";
import PoonamiButton from "./components/common/PoonamiButton";
import { Download, Calendar, List, Baby } from "lucide-react";
import "./App.css";

function App() {
  const { reward: rewardEvent, isAnimating: eventAnimating } = useReward(
    "eventReward",
    "confetti",
    {
      elementCount: 160,
      spread: 360,
      startVelocity: 30,
      decay: 0.9,
      ticks: 100,
    },
  );

  const [currentView, setCurrentView] = useState("calendar");
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    setCurrentView("timeline");
  };

  const handleEventSaved = useCallback(() => {
    if (!eventAnimating) {
      rewardEvent();
    }
  }, [eventAnimating, rewardEvent]);

  const handlePoonami = useCallback(async () => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const timeFrom = now.toTimeString().slice(0, 5);

    const event = {
      id: crypto.randomUUID(),
      type: "potty",
      date: dateStr,
      timeFrom,
      timeTo: null,
      isPee: true,
      isPoop: true,
      notes: "💩💩💩 POONAMI! 💩💩💩",
      foodItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await createEvent(event);
      toast.success("💩 POONAMI event saved!");
      setSelectedDate(dateStr);
    } catch (error) {
      toast.error("Failed to save POONAMI");
      console.error("Poonami error:", error);
    }
  }, []);

  const handleExport = async () => {
    try {
      await exportEvents();
      toast.info("Events exported successfully!");
    } catch (error) {
      toast.error("Failed to export events");
      console.error("Export error:", error);
    }
  };

  return (
    <div className="app">
      <span
        id="eventReward"
        style={{
          position: "absolute",
          top: 0,
          right: "50%",
        }}
      />

      <header className="app-header">
        <div className="header-left">
          <Baby size={24} className="app-icon" />
          <h1 className="app-title">Baby Tracker</h1>
        </div>
        <div className="header-right">
          <button
            className="export-btn"
            onClick={handleExport}
            title="Export CSV"
          >
            <Download size={18} />
          </button>
        </div>
      </header>

      <nav className="view-tabs">
        <button
          className={`tab ${currentView === "calendar" ? "active" : ""}`}
          onClick={() => setCurrentView("calendar")}
        >
          <Calendar size={16} />
          Calendar
        </button>
        <button
          className={`tab ${currentView === "timeline" ? "active" : ""}`}
          onClick={() => setCurrentView("timeline")}
        >
          <List size={16} />
          Timeline
        </button>
      </nav>

      <main className="app-main">
        {currentView === "calendar" && (
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            onReward={handleEventSaved}
          />
        )}
        {currentView === "timeline" && (
          <DayTimeline
            selectedDate={selectedDate}
            onReward={handleEventSaved}
          />
        )}
      </main>

      <PoonamiButton createPoonami={handlePoonami} />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;

import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CalendarView from './components/Calendar/CalendarView';
import DayTimeline from './components/DayTimeline/DayTimeline';
import { exportEvents } from './db/database';
import { Download, Calendar, List, Baby } from 'lucide-react';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    setCurrentView('timeline');
  };

  const handleExport = async () => {
    try {
      await exportEvents();
      toast.info('Events exported successfully!');
    } catch (error) {
      toast.error('Failed to export events');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <Baby size={24} className="app-icon" />
          <h1 className="app-title">Baby Tracker</h1>
        </div>
        <div className="header-right">
          <button className="export-btn" onClick={handleExport} title="Export CSV">
            <Download size={18} />
          </button>
        </div>
      </header>

      <nav className="view-tabs">
        <button
          className={`tab ${currentView === 'calendar' ? 'active' : ''}`}
          onClick={() => setCurrentView('calendar')}
        >
          <Calendar size={16} />
          Calendar
        </button>
        <button
          className={`tab ${currentView === 'timeline' ? 'active' : ''}`}
          onClick={() => setCurrentView('timeline')}
        >
          <List size={16} />
          Timeline
        </button>
      </nav>

      <main className="app-main">
        {currentView === 'calendar' && (
          <CalendarView
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
        )}
        {currentView === 'timeline' && (
          <DayTimeline selectedDate={selectedDate} />
        )}
      </main>

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

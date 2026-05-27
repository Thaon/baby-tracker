# Baby Tracker

A Progressive Web App (PWA) for tracking baby events — feeds, naps, and potty breaks — with a calendar view, daily timeline, and offline data persistence.

![Baby Tracker](public/icons/icon-192.svg)

## Features

- **Calendar View** — Monthly calendar with event markers, month navigation, and quick-add buttons
- **Day Timeline** — Chronological list of events for any selected day with edit/delete actions
- **Event Types**
  - 🍼 **Feed** — Track milk (0–300 ml) and solids (name + amount in mg) with range sliders
  - 😴 **Nap** — Record start and end times
  - 🚽 **Potty** — Toggle pee and/or poop with switch controls
- **Custom Time Picker** — Clock-face UI with draggable hand: select hours first, then minutes, with AM/PM toggle
- **Custom Date Picker** — Full month calendar popup with month navigation and today shortcut
- **CSV Export** — Download all events as a CSV file
- **Offline Support** — Works offline via service worker and IndexedDB storage
- **Toast Notifications** — Feedback for save, delete, and export actions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite |
| Styling | CSS (no external UI libraries) |
| Storage | IndexedDB via `idb` library |
| PWA | Vite PWA plugin |
| Date Handling | date-fns |
| Icons | Lucide React |
| Notifications | React Toastify |

## Project Structure

```
baby-tracker/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon.svg
│       ├── icon-192.svg
│       └── icon-512.svg
└── src/
    ├── main.jsx
    ├── App.jsx                    # Root: header, tabs, toast container
    ├── App.css
    ├── index.css                  # CSS variables, reset, global styles
    ├── db/
    │   └── database.js            # IndexedDB: events store, CRUD, CSV export
    ├── hooks/
    │   └── useEvents.js           # Custom hook for event operations
    ├── components/
    │   ├── Calendar/
    │   │   ├── CalendarView.jsx    # Month grid, navigation, event dots, quick-add
    │   │   └── CalendarView.css
    │   ├── DayTimeline/
    │   │   ├── DayTimeline.jsx     # Event list, edit/delete, add buttons
    │   │   └── DayTimeline.css
    │   ├── EventForm/
    │   │   ├── EventForm.jsx       # Modal wrapper, date/time pickers
    │   │   ├── EventForm.css
    │   │   ├── FeedForm.jsx        # Milk/solids items with sliders
    │   │   ├── NapForm.jsx         # Nap details (times in parent)
    │   │   └── PottyForm.jsx       # Pee/poop switches
    │   └── common/
    │       ├── DatePicker.jsx      # Calendar popup with month navigation
    │       ├── DatePicker.css
    │       ├── TimePicker.jsx      # Clock-face picker with draggable hand
    │       ├── TimePicker.css
    │       └── Switch.jsx          # Toggle switch component
    └── utils/
        └── export.js              # CSV export functionality
```

## Data Model

### Event Types

| Type | Fields |
|------|--------|
| `feed` | `foodItems: [{ type: 'milk', amount: 0-300 } \| { type: 'solids', name, amount: 10-300 }]` |
| `nap` | `timeTo: string (HH:mm)` |
| `potty` | `isPee: boolean, isPoop: boolean` |

### Base Event

```typescript
{
  id: string;           // UUID
  type: 'feed' | 'nap' | 'potty';
  date: string;         // YYYY-MM-DD
  timeFrom: string;     // HH:mm (24h)
  timeTo: string | null;// HH:mm (24h), set for naps
  notes: string;
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}
```

### IndexedDB Schema

- **Store**: `events`
- **Key**: `id` (auto-generated UUID)
- **Indexes**: `by-date` (date), `by-date-time` (dateTime)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/baby-tracker.git
cd baby-tracker
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

The production build is output to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Creating an Event

1. Navigate to the **Calendar** or **Timeline** view
2. Click a **Quick Add** button (Feed, Nap, or Potty) or select a date on the calendar
3. In the modal:
   - Pick a **date** using the calendar popup
   - Pick a **time** using the clock-face picker (drag the hand to select hours, release, then drag for minutes)
   - Fill in type-specific details
4. Click **Save**

### Editing an Event

1. In the **Timeline** view, find the event
2. Click the **pencil** icon
3. Modify fields in the modal
4. Click **Save**

### Deleting an Event

1. In the **Timeline** view, find the event
2. Click the **trash** icon
3. Confirm the deletion

### Exporting Data

Click the **download** icon in the header to export all events as a CSV file.

## Design Decisions

### Why IndexedDB?

- Larger storage capacity than localStorage
- Asynchronous operations (non-blocking)
- Indexable for efficient queries
- Supported in all modern browsers

### Why Custom Pickers Instead of Native Inputs?

- Native `<input type="date">` and `<input type="time">` have inconsistent styling across browsers
- Poor mobile UX — small touch targets, platform-specific behaviors
- Custom clock-face time picker provides intuitive hour→minute selection flow
- Custom date picker offers consistent calendar experience everywhere

### Why CSS Instead of Tailwind?

- No build step complexity
- Full control over styles
- Smaller runtime footprint
- Easier to maintain for a small project

## Browser Support

- Chrome 90+
- Firefox 90+
- Safari 15+
- Edge 90+

## License

MIT

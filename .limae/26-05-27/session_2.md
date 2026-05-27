# Goal: Replace native date/time inputs with custom clock-style pickers and fix CalendarView overflow

---

## 1. Initial State (What We Started With)

The app used native HTML `<input type="date">` and `<input type="time">` in EventForm.jsx. Custom DatePicker.jsx and TimePicker.jsx components existed but were unused and poorly implemented (DatePicker showed only a week, TimePicker was a simple dropdown list). CalendarView used `aspect-ratio: 1` on day cells making the calendar extend far beyond the viewport. The app layout had no height constraints, allowing infinite scroll.

### Problems Identified
- Native date/time inputs are ugly and hard to use on mobile
- TimePicker had no clock face — just a dropdown of 30-min intervals
- DatePicker only showed a single week, not a full month calendar
- CalendarView with `aspect-ratio: 1` made cells huge, pushing content off screen
- No viewport height constraints — app scrolled infinitely
- Time displays in DayTimeline used raw 24h format

---

## 2. Architecture Discussion

### TimePicker Design (MUI-style clock)
- Circular clock face with numbers arranged in a ring
- Two modes: hours (1-12 inner ring) → minutes (0-55 in 5-min steps, outer ring)
- Draggable clock hand using pointer events (pointerdown → pointermove → pointerup)
- Auto-advances from hours to minutes on pointer release
- AM/PM toggle in the header
- Blue header bar showing selected time (like MUI)
- Cancel/OK footer buttons

### DatePicker Design
- Input field that opens a centered modal overlay
- Full month calendar grid with weekday headers
- Month navigation with ChevronLeft/ChevronRight
- Today button for quick navigation
- Clicking a day closes the picker and commits the value

### CalendarView Fix
- Removed `aspect-ratio: 1` from day cells (main cause of overflow)
- Used flex layout with `flex: 1` to fill available space
- Dynamic row count (5 or 6 rows) based on month needs
- Compressed padding and font sizes

### App Layout Fix
- `height: 100vh/100dvh` with `overflow: hidden` on html, body, #root, and .app
- `.app-main` uses `flex: 1; min-height: 0; overflow: hidden`
- DayTimeline events list scrolls internally if needed

---

## 3. Implementation Steps

### Step 1: TimePicker.jsx — Full rewrite
- Clock face with 280px diameter circle
- 12 hour numbers (1-12) positioned on inner ring (82px radius)
- 12 minute numbers (00-55 in 5s) positioned on outer ring (110px radius)
- Clock hand with rotation transform, line, and selection dot
- Pointer event handling for drag interaction
- Modal with blue header showing HH:MM AM/PM
- Auto-advance from hours→minutes on pointer up

### Step 2: TimePicker.css — New file
- Styled clock face, numbers, hand, center dot
- Modal overlay with backdrop
- Blue header with large time display
- AM/PM toggle buttons
- Cancel/OK footer

### Step 3: DatePicker.jsx — Full rewrite
- Full month calendar grid (42 cells, 5-6 rows)
- Input field with formatted display
- Modal overlay with month navigation
- Today quick-select button
- Previous/next month filler days (dimmed)

### Step 4: DatePicker.css — New file
- Input field styling matching TimePicker
- Modal overlay, month grid, day cells
- Selected/today/other-month states
- Compact sizing for the calendar popup

### Step 5: EventForm.jsx — Updated
- Replaced `<input type="date">` with `<DatePicker>`
- Replaced `<input type="time">` with `<TimePicker>`
- Added imports for DatePicker and TimePicker

### Step 6: CalendarView.jsx — Fixed
- Dynamic row count (5 or 6 rows) using `numRows` calculation
- Inline style for `gridTemplateRows: repeat(N, 1fr)`

### Step 7: CalendarView.css — Rewritten
- Removed `aspect-ratio: 1` from day cells
- Used `flex: 1; min-height: 0` for responsive sizing
- Compressed padding, margins, and font sizes
- `overflow: hidden` on calendar-view and calendar-grid

### Step 8: App.css — Updated
- `height: 100vh; height: 100dvh` for mobile compatibility
- `overflow: hidden` on .app
- `flex-shrink: 0` on header and tabs
- `.app-main` with `flex: 1; min-height: 0; overflow: hidden`

### Step 9: index.css — Updated
- `height: 100%; overflow: hidden` on html, body, #root

### Step 10: DayTimeline.jsx — Updated
- Added `formatTime12()` helper for 12h AM/PM display
- Used formatTime12 for event times and nap details

### Step 11: DayTimeline.css — Updated
- `height: 100%` and `overflow: hidden` on container
- `.events-list` with `flex: 1; overflow-y: auto` for scrollable events
- Compressed padding and sizes

---

## 4. Critical Bug Fixes

### Bug 1: CalendarView.jsx corrupted from edit_lines
**File**: CalendarView.jsx
**Problem**: `edit_lines` tool inserted code in the wrong location, merging handlePrevMonth with getCalendarDays
**Fix**: Full rewrite with `edit_file`

### Bug 2: CalendarView.css corrupted from edit_lines
**File**: CalendarView.css
**Problem**: Duplicate `.days` block and mixed `.weekday` class content
**Fix**: Full rewrite with `edit_file`

### Bug 3: DayTimeline.jsx severely corrupted from edit_lines
**File**: DayTimeline.jsx
**Problem**: Multiple edit_lines calls inserted code in wrong positions, creating duplicate imports, merged functions, and broken JSX
**Fix**: Full rewrite with `edit_file`

---

## 5. Key Insights

### edit_lines is extremely fragile for JSX files
Multiple edit_lines calls on the same file caused catastrophic corruption. The tool seems to miscalculate line positions after prior edits. Use `edit_file` (full rewrite) for any file that needs more than one targeted change.

### Clock face math
- Numbers positioned using `cos/sin` with angle offset of -90° (so 12 o'clock is at top)
- Clock hand uses `transform: rotate(angle) with transform-origin: bottom center`
- Angle calculation: `atan2(x, -y)` gives clockwise angle from 12 o'clock

### Flex layout for no-scroll design
- The key CSS pattern is: parent `height: 100vh; overflow: hidden`, child `flex: 1; min-height: 0; overflow: hidden`
- `min-height: 0` is critical — without it, flex children won't shrink below their content size
- Internal scrolling (e.g., event list) uses `overflow-y: auto` on a flex child

---

## 6. Known Issues & Limitations

1. **TimePicker minute precision** — Only 5-minute increments (0, 5, 10... 55). Fine-grained minute selection would need a different UI or an additional step.
2. **DatePicker always shows 42 cells** — The DatePicker modal always uses 6 rows (42 cells) for consistency, even when 5 would suffice. Not a problem since it's a modal overlay.
3. **No PWA PNG icons** — Still only SVG icons for PWA manifest.
4. **CalendarView loop fetch** — Still fetches events per-day in a loop instead of a range query.

---

## 7. Next Steps (For Session 3)

### Priority 1: Test & Verify
- Run `npm run dev` and test all flows
- Verify clock face interaction works on touch devices
- Test the calendar fits in viewport on various screen sizes
- Verify event creation with new pickers

### Priority 2: Polish
- Add fine-grained minute selection to TimePicker (e.g., after selecting nearest 5-min, allow drag for 1-min precision)
- Consider making TimePicker adaptive (smaller on mobile)
- Test and polish DatePicker interaction

### Priority 3: Integration
- Integrate useEvents hook for consistent state management
- Add proper edit functionality (updateEvent not just createEvent)

---

## 8. Broad Feature Recap

- Custom clock-face TimePicker with draggable hand, hour→minute auto-advance, AM/PM toggle
- Custom DatePicker with full month calendar, month navigation, today button
- CalendarView fits within viewport — no scrolling needed
- App uses 100vh/100dvh layout with overflow hidden
- DayTimeline shows times in 12h AM/PM format
- Internal scroll only for DayTimeline event list overflow

---

## 9. Session Stats

- **Files created**: 2 (TimePicker.css, DatePicker.css)
- **Files modified**: 8 (TimePicker.jsx, DatePicker.jsx, EventForm.jsx, CalendarView.jsx, CalendarView.css, DayTimeline.jsx, DayTimeline.css, App.css, index.css)
- **Bugs fixed**: 3 (file corruptions from edit_lines)
- **Lines of code**: ~800 (new/rewritten)
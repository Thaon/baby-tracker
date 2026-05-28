import { openDB } from "idb";

const DB_NAME = "babyEventsDB";
const DB_VERSION = 1;
const STORE_NAME = "events";

export const db = openDB(DB_NAME, DB_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("by-date", "date");
      store.createIndex("by-date-time", "dateTime");
    }
  },
});

// Create event
export async function createEvent(event) {
  return (await db).put(STORE_NAME, event);
}

// Read event by ID
export async function getEventById(id) {
  return (await db).get(STORE_NAME, id);
}

// Read all events
export async function getAllEvents() {
  return (await db).getAll(STORE_NAME);
}

// Read events by date
export async function getEventsByDate(date) {
  return (await db).getAllFromIndex(STORE_NAME, "by-date", date);
}

// Update event
export async function updateEvent(event) {
  return (await db).put(STORE_NAME, event);
}

// Delete event
export async function deleteEvent(id) {
  return (await db).delete(STORE_NAME, id);
}

// Export all events as CSV
export async function exportEvents() {
  const events = await getAllEvents();
  const now = new Date().toISOString();

  const headers = ["Type", "Date", "Time From", "Time To", "Details", "Notes"];
  const rows = events.map((event) => {
    let details = "";

    if (event.type === "feed") {
      const foodItems = event.foodItems || [];
      const milkItems = foodItems.filter((item) => item.type === "milk");
      const solidsItems = foodItems.filter((item) => item.type === "solids");

      const milkDetails = milkItems
        .map((milk) => `Milk: ${milk.amount}ml`)
        .join(", ");
    } else if (event.type === "potty") {
      details = `Pee: ${event.isPee ? "Yes" : "No"} | Poop: ${event.isPoop ? "Yes" : "No"}`;
    } else if (event.type === "expressed") {
      details = `Amount: ${event.amount || 0}ml`;
    } else if (event.type === "nap") {
      details = `From: ${event.timeFrom} to ${event.timeTo}`;
    } else if (event.type === "potty") {
      details = `Pee: ${event.isPee ? "Yes" : "No"} | Poop: ${event.isPoop ? "Yes" : "No"}`;
    }

    return [
      event.type.charAt(0).toUpperCase() + event.type.slice(1),
      event.date,
      event.timeFrom,
      event.timeTo || "",
      details,
      event.notes || "",
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `baby-events-${now}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

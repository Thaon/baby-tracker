/**
 * Convert any date input to a "YYYY-MM-DD" string.
 * Handles Date objects, existing "YYYY-MM-DD" strings (returned as-is),
 * Date-only strings like "1/15/2025", and ISO strings.
 */
export function toDateString(input) {
  if (!input) return "";
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input; // already correct format
  }
  const d = new Date(input);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

/**
 * Compute a summary of events for a given day.
 * Returns { feedCount, totalMilk, avgMilk, pottyCount, poopCount, napCount, napDuration, expressedCount, totalExpressed }
 */
export function getDaySummary(dayEvents) {
  const feeds = dayEvents.filter(e => e.type === 'feed');
  const potties = dayEvents.filter(e => e.type === 'potty');
  const naps = dayEvents.filter(e => e.type === 'nap');
  const expressed = dayEvents.filter(e => e.type === 'expressed');

  // Milk: sum up all milk items across all feeds
  const totalMilk = feeds.reduce((sum, feed) => {
    const milkItems = (feed.foodItems || []).filter(item => item.type === 'milk');
    return sum + milkItems.reduce((s, item) => s + (item.amount || 0), 0);
  }, 0);

  const feedsWithMilk = feeds.filter(feed =>
    (feed.foodItems || []).some(item => item.type === 'milk')
  );
  const avgMilk = feedsWithMilk.length > 0 ? Math.round(totalMilk / feedsWithMilk.length) : 0;
  // Potty counts
  const pottyCount = potties.length;
  const peeCount = potties.filter(e => e.isPee).length;
  const poopCount = potties.filter(e => e.isPoop).length;

  // Nap duration
  let napDuration = 0; // in minutes
  naps.forEach(nap => {
    if (nap.timeFrom && nap.timeTo) {
      const [h1, m1] = nap.timeFrom.split(':').map(Number);
      const [h2, m2] = nap.timeTo.split(':').map(Number);
      let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diff < 0) diff += 24 * 60; // overnight nap
      napDuration += diff;
    }
  });

  // Expressed milk
  const expressedCount = expressed.length;
  const totalExpressed = expressed.reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    feedCount: feeds.length,
    totalMilk,
    avgMilk,
    pottyCount,
    peeCount,
    poopCount,
    napCount: naps.length,
    napDuration,
    expressedCount,
    totalExpressed
  };
}

/**
 * Format minutes into a compact human-readable string like "1h 30m" or "45m"
 */
export function formatDuration(minutes) {
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

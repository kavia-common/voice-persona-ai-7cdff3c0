//
// PUBLIC_INTERFACE
// Utility helpers for chat UI: timestamps, relative time, avatar initials.
//
/**
 * PUBLIC_INTERFACE
 * Returns a formatted timestamp string like "10:42 AM" or "Yesterday, 9:15 PM".
 * @param {Date|number|string} dateLike
 * @returns {string}
 */
export function formatTimestamp(dateLike) {
  /** Format a date into a human-friendly chat timestamp. */
  try {
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    const now = new Date();

    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();

    const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    if (isSameDay) return timeStr;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + `, ${timeStr}`;
  } catch {
    return "";
  }
}

/**
 * PUBLIC_INTERFACE
 * Returns relative time like "just now", "2m", "1h".
 * @param {Date|number|string} dateLike
 * @returns {string}
 */
export function relativeTime(dateLike) {
  /** Compute a compact relative time for subtle display. */
  try {
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    const diffMs = Date.now() - d.getTime();
    const s = Math.max(1, Math.floor(diffMs / 1000));
    if (s < 10) return "just now";
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    return `${days}d`;
  } catch {
    return "";
  }
}

/**
 * PUBLIC_INTERFACE
 * Generates simple initials for avatar badges from a display name or fallback.
 * @param {string} displayName
 * @param {string} fallback - e.g., "AI" or "You"
 * @returns {string}
 */
export function initials(displayName, fallback = "AI") {
  /** Extract initials for avatar. */
  if (!displayName || typeof displayName !== "string") return fallback;
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/* =========================================================
   Date helpers
   Everything works with local calendar days, so "overdue"
   always matches the user's own idea of today.
   ========================================================= */

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;


/**
 * Local (not UTC) date as YYYY-MM-DD, `n` days from today.
 * dayOffset(0) → today, dayOffset(-1) → yesterday.
 */
export const dayOffset = (n = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + n);

  // Shift by the timezone offset so toISOString() prints the LOCAL day
  const localDate = new Date(date - date.getTimezoneOffset() * MS_PER_MINUTE);

  return localDate.toISOString().slice(0, 10);
};


/** "2026-10-09" → "Oct 9" (empty string when there is no date) */
export const fmtDate = (dateString) => {
  if (!dateString) return '';

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};


/** ISO timestamp → "09:41 AM" */
export const fmtClock = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });


/** Heading used to group activity entries: "Today", "Yesterday" or "Oct 9, 2026" */
export const dayLabel = (iso) => {
  const date = new Date(iso);
  const yesterday = new Date(Date.now() - MS_PER_DAY);

  if (date.toDateString() === new Date().toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

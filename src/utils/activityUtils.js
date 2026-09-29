/* =========================================================
   Activity log helpers
   Shaping, filtering and grouping entries for the log page.
   ========================================================= */

import { dayLabel } from './dateUtils';


/**
 * Entries saved by an older version only have `text`.
 * Give them the current shape: { type, title, text, detail }.
 */
export const normaliseEntry = (entry) =>
  entry.title
    ? entry
    : { ...entry, type: entry.type || 'updated', title: entry.text, text: '', detail: '' };

/** "In Progress → To Do"  →  "[In Progress] → [To Do]" */
export const formatDetail = (detail) =>
  detail.includes(' → ')
    ? detail
        .split(' → ')
        .map((part) => `[${part}]`)
        .join(' → ')
    : detail;

/** Keeps entries matching the chosen type AND the search text. */
export const filterActivity = (entries, { type, query }) => {
  const searchText = query.trim().toLowerCase();

  return entries.filter(
    (entry) =>
      (!type || entry.type === type) &&
      `${entry.title} ${entry.text} ${entry.detail}`.toLowerCase().includes(searchText)
  );
};

/**
 * Groups entries under a day heading: { "Today": [...], "Yesterday": [...] }.
 * The log is already newest-first, so insertion order is preserved.
 */
export const groupByDay = (entries) =>
  entries.reduce((groups, entry) => {
    const label = dayLabel(entry.at);

    (groups[label] ??= []).push(entry);

    return groups;
  }, {});

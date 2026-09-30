/* =========================================================
   Id helper
   crypto.randomUUID() only exists on https pages and on
   localhost. Opening the dev server from a phone through a
   LAN address (http://192.168.x.x:5173) has neither, so a
   plain fallback keeps task creation working there too.
   ========================================================= */

const RANDOM_PART_LENGTH = 10;

/** A unique id for a new task or activity entry. */
export const newId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 2 + RANDOM_PART_LENGTH);

  return `id-${timePart}-${randomPart}`;
};

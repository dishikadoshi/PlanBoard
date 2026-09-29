import { useEffect, useState } from 'react';

/**
 * Tiny hash router: the current page lives in the URL hash (#/board),
 * so the browser's Back / Forward buttons move between the pages you
 * visited instead of leaving the app.
 *
 *   ids      – the valid page ids
 *   fallback – page shown when the hash is empty or unknown
 *
 * Returns [currentPage, navigate].
 */
export default function useHashRoute(ids, fallback) {
  /** "#/board" → "board" (or the fallback for anything unknown) */
  const readPageFromHash = () => {
    const id = window.location.hash.replace(/^#\/?/, '');

    return ids.includes(id) ? id : fallback;
  };

  const [page, setPage] = useState(readPageFromHash);

  // On mount: write the hash if missing, then follow Back / Forward
  useEffect(() => {
    try {
      if (!window.location.hash) {
        window.history.replaceState(null, '', `#/${page}`);
      }
    } catch {
      // History API unavailable (e.g. sandboxed iframe)
    }

    const syncFromUrl = () => setPage(readPageFromHash());

    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);

    // Runs once on purpose: ids / fallback never change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Navigating adds a history entry, so Back returns to the previous page. */
  const navigate = (id) => {
    if (id === page) return;

    try {
      window.history.pushState(null, '', `#/${id}`);
    } catch {
      // History API unavailable: still switch the page in memory
    }

    setPage(id);
  };

  return [page, navigate];
}

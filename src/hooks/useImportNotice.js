import { useState } from 'react';
import { validateImport } from '../services/storageService';

/**
 * Handles importing a JSON file and the message shown afterwards.
 *
 * The file is MERGED into the board (never replaces it), and the message
 * says how many tasks were added, updated and kept.
 *
 * Returns { notice, clearNotice, importFile }.
 */
export default function useImportNotice(tasks, actions) {
  const [notice, setNotice] = useState('');

  const importFile = async (file) => {
    const result = validateImport(await file.text(), tasks);

    if (result.error) {
      setNotice(`Import failed: ${result.error}`);
      return;
    }

    actions.importTasks(result.tasks);
    setNotice(
      `Imported: ${result.added} new, ${result.updated} updated, ` +
        `${result.kept} of your other tasks kept.`
    );
  };

  const clearNotice = () => setNotice('');

  return { notice, clearNotice, importFile };
}

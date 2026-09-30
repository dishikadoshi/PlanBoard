import { TEAM, PRIORITIES, STATUSES, NO_FILTERS } from '../../app/constants';
import Dropdown from '../common/Dropdown';

/** One labelled dropdown: an "All" choice followed by the given options. */
function FilterSelect({ label, value, options, onChange }) {
  const choices = [{ value: '', label: 'All' }, ...options];

  return (
    <label>
      {label}
      <Dropdown value={value} options={choices} onChange={onChange} />
    </label>
  );
}

/**
 * Search box + dropdown filters above the Kanban board.
 *
 * Props:
 *   filters    – current filter values (see NO_FILTERS for the shape)
 *   setFilters – replaces the filter values
 *   tags       – every tag in use (fills the Tag dropdown)
 *   active     – true when any filter is applied (enables "Clear filters")
 */
export default function BoardFilters({ filters, setFilters, tags, active }) {
  // Builds a change handler that updates just one filter key
  const updateFilter = (key) => (value) => setFilters({ ...filters, [key]: value });

  return (
    <section className="filters" aria-label="Search and filters">
      <label>
        Search titles
        <input
          type="search"
          placeholder="Search…"
          value={filters.q}
          onChange={(event) => updateFilter('q')(event.target.value)}
        />
      </label>

      <FilterSelect label="Assignee" value={filters.assignee} options={TEAM} onChange={updateFilter('assignee')} />
      <FilterSelect label="Priority" value={filters.priority} options={PRIORITIES} onChange={updateFilter('priority')} />
      <FilterSelect label="Status" value={filters.status} options={STATUSES} onChange={updateFilter('status')} />
      <FilterSelect label="Tag" value={filters.tag} options={tags} onChange={updateFilter('tag')} />

      <button disabled={!active} onClick={() => setFilters(NO_FILTERS)}>
        Clear filters
      </button>
    </section>
  );
}

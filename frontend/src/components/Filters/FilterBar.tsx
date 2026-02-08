import type { MessageFilter } from '../../types/webhook';
import { LevelFilter } from './LevelFilter';
import { SearchInput } from './SearchInput';
import { DateRangeFilter } from './DateRangeFilter';
import { PathFilter } from './PathFilter';

interface Props {
  filter: MessageFilter;
  onLevelsChange: (levels: string | undefined) => void;
  onPathContainsChange: (pathContains: string | undefined) => void;
  onSearchChange: (pattern: string | undefined) => void;
  onDateChange: (from?: string, to?: string) => void;
  onReset: () => void;
}

export function FilterBar({ filter, onLevelsChange, onPathContainsChange, onSearchChange, onDateChange, onReset }: Props) {
  const hasFilters = filter.pathContains || filter.searchPattern || filter.from || filter.to ||
    (filter.levels !== 'Warning,Error,Fatal'); // non-default level selection counts as active filter

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      background: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      flexWrap: 'wrap',
    }}>
      <LevelFilter selected={filter.levels} onChange={onLevelsChange} />
      <SearchInput value={filter.searchPattern} onChange={onSearchChange} />
      <PathFilter value={filter.pathContains} onChange={onPathContainsChange} />
      <DateRangeFilter from={filter.from} to={filter.to} onChange={onDateChange} />
      {hasFilters && (
        <button
          onClick={onReset}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            border: '1px solid #cbd5e1',
            borderRadius: 4,
            background: '#fff',
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

import React from 'react';
import { FiSearch } from 'react-icons/fi';
import Input from './Input';

/**
 * Reusable Search & Filter panel.
 * Combines search queries with select filters.
 */
const SearchFilter = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [], // [{ name, value, onChange, options, placeholder }]
  className = '',
}) => {
  return (
    <div className={`flex flex-col md:flex-row gap-3 w-full bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm ${className}`}>
      {/* Search Input */}
      <div className="flex-1">
        <Input
          name="search"
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          icon={FiSearch}
          className="w-full"
        />
      </div>

      {/* Select Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <div key={filter.name} className="min-w-[140px] flex-1 md:flex-initial">
            <Input
              name={filter.name}
              type="select"
              placeholder={filter.placeholder}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              options={filter.options}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchFilter;

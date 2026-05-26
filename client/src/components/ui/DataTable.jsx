import React from 'react';
import Spinner from '../common/Loader';
import EmptyState from '../common/EmptyState';
import { FiInbox } from 'react-icons/fi';

/**
 * Reusable premium data table component supporting selection, custom column rendering, loading indicators, and empty views.
 */
const DataTable = ({
  columns = [], // [{ header: 'Name', key: 'name', render: (row) => ... }]
  data = [],
  loading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'There are no records to display here.',
  selectedIds = [],
  onSelectAll,
  onSelectRow,
  rowKey = '_id',
}) => {
  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              {/* Bulk Checkbox Column */}
              {onSelectAll && onSelectRow && (
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-accent-600 focus:ring-accent-500 h-4 w-4"
                  />
                </th>
              )}

              {/* Dynamic Headers */}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading Spinner
              <tr>
                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Spinner size="md" />
                    <span className="mt-3 text-xs text-slate-400">Fetching records...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length + (onSelectAll ? 1 : 0)} className="py-12 px-6">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    icon={FiInbox}
                    className="border-none bg-transparent"
                  />
                </td>
              </tr>
            ) : (
              // Data Rows
              data.map((row) => {
                const isSelected = selectedIds.includes(row[rowKey]);

                return (
                  <tr
                    key={row[rowKey]}
                    className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${
                      isSelected ? 'bg-slate-50/70 dark:bg-slate-900/40' : ''
                    }`}
                  >
                    {onSelectRow && (
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow(row[rowKey], e.target.checked)}
                          className="rounded border-slate-300 dark:border-slate-700 text-accent-600 focus:ring-accent-500 h-4 w-4"
                        />
                      </td>
                    )}

                    {columns.map((col, idx) => (
                      <td
                        key={idx}
                        className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap"
                      >
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;

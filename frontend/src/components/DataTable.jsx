import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyTitle = 'No Records Found',
  emptyMessage = 'No records match the selected criteria.',
  emptyActionLabel,
  onEmptyAction,
  onRowClick,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div style={{ padding: '3rem 1rem', display: 'flex', justifyContent: 'center' }}>
        <LoadingSpinner message="Fetching data..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyMessage}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className={`table-wrapper ${className}`} style={{ borderRadius: 'var(--radius-lg)' }}>
      <table className="table-modern" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width || 'auto',
                  padding: '0.85rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-alt)',
                  borderBottom: '1px solid var(--color-border)',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={row[keyField] ?? rowIdx}
              onClick={onRowClick ? () => onRowClick(row, rowIdx) : undefined}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  style={{
                    textAlign: col.align || 'left',
                    padding: '0.85rem 1rem',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text)',
                    whiteSpace: col.wrap ? 'normal' : 'nowrap',
                    verticalAlign: 'middle',
                  }}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.accessor] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

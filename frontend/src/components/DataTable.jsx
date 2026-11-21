import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export const DataTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  isLoading = false,
  emptyMessage = 'No records found.'
}) => {
  if (isLoading) {
    return <LoadingSpinner message="Fetching data..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState title="No Records" description={emptyMessage} />;
  }

  return (
    <div style={{
      width: '100%',
      overflowX: 'auto',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      backgroundColor: 'var(--color-surface)'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left',
        fontSize: '0.875rem'
      }}>
        <thead>
          <tr style={{
            backgroundColor: 'var(--color-bg-alt)',
            borderBottom: '1px solid var(--color-border)'
          }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: '0.875rem 1rem',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--color-text-secondary)',
                  textAlign: col.align || 'left',
                  width: col.width || 'auto'
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
              key={row[keyField] || rowIdx}
              style={{
                borderBottom: rowIdx === data.length - 1 ? 'none' : '1px solid var(--color-border-subtle)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  style={{
                    padding: '0.875rem 1rem',
                    verticalAlign: 'middle',
                    textAlign: col.align || 'left',
                    color: 'var(--color-text)'
                  }}
                >
                  {col.render ? col.render(row, rowIdx) : row[col.accessor]}
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

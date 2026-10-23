import { useMemo, useState } from 'react';
import Icon from '../Icon.jsx';
import { SearchInput } from './Field.jsx';
import { EmptyState } from './States.jsx';

/**
 * DataTable — one table implementation for every portal.
 *
 * columns: [{ key, header, render(row), sortValue(row), width, align, mobileHide }]
 * filters: [{ key, label, options: [{value,label}], accessor(row) }]
 * On small screens the table collapses into readable cards (mobileRender).
 */
export default function DataTable({
  columns,
  rows,
  getRowId = (row) => row.id,
  searchPlaceholder = 'Search…',
  searchFields = [],
  filters = [],
  pageSize = 8,
  onRowClick,
  empty,
  mobileRender,
  toolbarExtra,
  ariaLabel = 'Data table',
  showToolbar = true,
  initialSort,
}) {
  const [query, setQuery] = useState('');
  const [filterState, setFilterState] = useState({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(initialSort || null);

  const filtered = useMemo(() => {
    let out = [...rows];
    if (query.trim() && searchFields.length) {
      const q = query.trim().toLowerCase();
      out = out.filter((row) =>
        searchFields.some((field) => {
          const value = typeof field === 'function' ? field(row) : row[field];
          return String(value ?? '').toLowerCase().includes(q);
        }),
      );
    }
    filters.forEach((f) => {
      const selected = filterState[f.key];
      if (selected) {
        out = out.filter((row) => String(f.accessor(row)) === selected);
      }
    });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out.sort((a, b) => {
          const av = col.sortValue(a);
          const bv = col.sortValue(b);
          if (av === bv) return 0;
          const dir = sort.dir === 'asc' ? 1 : -1;
          return av > bv ? dir : -dir;
        });
      }
    }
    return out;
  }, [rows, query, filterState, filters, sort, columns, searchFields]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (col) => {
    if (!col.sortValue) return;
    setSort((prev) =>
      prev?.key === col.key ? { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' },
    );
  };

  const noResults = filtered.length === 0;

  return (
    <div>
      {showToolbar && (
        <div className="toolbar">
          {searchFields.length > 0 && (
            <SearchInput
              value={query}
              onChange={(v) => {
                setQuery(v);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
            />
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              className="select"
              aria-label={f.label}
              value={filterState[f.key] || ''}
              onChange={(e) => {
                setFilterState((prev) => ({ ...prev, [f.key]: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">{f.label}: All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
          {toolbarExtra}
          <span className="toolbar__count">
            {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
          </span>
        </div>
      )}

      {noResults ? (
        <div className="table-empty">
          <EmptyState
            icon={rows.length === 0 ? empty?.icon || 'clipboard' : 'search'}
            title={rows.length === 0 ? empty?.title || 'Nothing here yet' : 'No matching records'}
            description={
              rows.length === 0
                ? empty?.description
                : 'Try a different search term or clear the filters to see more results.'
            }
            action={
              rows.length === 0 ? (
                empty?.action
              ) : (
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => {
                    setQuery('');
                    setFilterState({});
                    setPage(1);
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        </div>
      ) : (
        <>
          <div className="table-wrap table-wrap--responsive">
            <table className="table" aria-label={ariaLabel}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      style={{ width: col.width, textAlign: col.align || 'left' }}
                    >
                      {col.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col)}
                          style={{
                            background: 'none',
                            border: 0,
                            padding: 0,
                            font: 'inherit',
                            color: 'inherit',
                            letterSpacing: 'inherit',
                            textTransform: 'inherit',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {col.header}
                          <Icon
                            name={sort?.key === col.key && sort.dir === 'desc' ? 'chevron-down' : 'chevron-down'}
                            className="icon icon--sm"
                            style={{
                              opacity: sort?.key === col.key ? 1 : 0.35,
                              transform: sort?.key === col.key && sort.dir === 'asc' ? 'rotate(180deg)' : 'none',
                            }}
                          />
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    className={onRowClick ? 'is-clickable' : ''}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                  >
                    {columns.map((col) => (
                      <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-list">
            {pageRows.map((row) => (
              <div
                key={getRowId(row)}
                className="mobile-row"
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
              >
                {mobileRender ? (
                  mobileRender(row)
                ) : (
                  <>
                    <div className="mobile-row__top">
                      <span className="mobile-row__title">{row[columns[0].key]}</span>
                      {columns[columns.length - 1].render?.(row)}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {filtered.length > pageSize && (
            <div className="table-foot">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="pagination">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <Icon name="chevron-left" className="icon icon--sm" />
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-current={currentPage === i + 1 ? 'true' : undefined}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <Icon name="chevron-right" className="icon icon--sm" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

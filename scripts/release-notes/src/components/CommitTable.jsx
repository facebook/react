/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {useMemo, useState} from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import TagPicker from './TagPicker';

const REPO_URL = 'https://github.com/facebook/react';

export default function CommitTable({commits, state, onStateChange}) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [hideReviewed, setHideReviewed] = useState(false);
  const [tagFilter, setTagFilter] = useState('all');

  const filteredCommits = useMemo(() => {
    return commits.filter(commit => {
      // Reviewed filter
      if (hideReviewed && state.reviewedCommits[commit.hash]) return false;

      // Tag filter
      const commitTagIds = state.tagAssignments[commit.hash] || [];
      if (tagFilter === 'untagged' && commitTagIds.length > 0) return false;
      if (
        tagFilter !== 'all' &&
        tagFilter !== 'untagged' &&
        !commitTagIds.includes(tagFilter)
      )
        return false;

      return true;
    });
  }, [commits, state, hideReviewed, tagFilter]);

  const columns = useMemo(
    () => [
      {
        id: 'include',
        header: 'Include',
        cell: ({row}) => {
          const hash = row.original.hash;
          const isIncluded = !!state.includedCommits[hash];
          return (
            <input
              type="checkbox"
              className="row-checkbox"
              checked={isIncluded}
              onChange={() => {
                const newIncluded = {...state.includedCommits};
                const newReviewed = {...state.reviewedCommits};
                if (isIncluded) {
                  delete newIncluded[hash];
                } else {
                  newIncluded[hash] = true;
                  newReviewed[hash] = true;
                }
                onStateChange({
                  ...state,
                  includedCommits: newIncluded,
                  reviewedCommits: newReviewed,
                });
              }}
            />
          );
        },
        size: 40,
        enableSorting: false,
      },
      {
        id: 'reviewed',
        header: 'Reviewed',
        cell: ({row}) => {
          const hash = row.original.hash;
          const isReviewed = !!state.reviewedCommits[hash];
          return (
            <input
              type="checkbox"
              className="row-checkbox"
              checked={isReviewed}
              onChange={() => {
                const newReviewed = {...state.reviewedCommits};
                const newIncluded = {...state.includedCommits};
                if (isReviewed) {
                  delete newReviewed[hash];
                  delete newIncluded[hash];
                } else {
                  newReviewed[hash] = true;
                }
                onStateChange({
                  ...state,
                  includedCommits: newIncluded,
                  reviewedCommits: newReviewed,
                });
              }}
            />
          );
        },
        size: 40,
        enableSorting: false,
      },
      {
        accessorKey: 'summary',
        header: 'Summary',
        cell: ({row}) => (
          <a
            href={`${REPO_URL}/commit/${row.original.fullHash}`}
            target="_blank"
            title={row.original.message}>
            {row.original.summary}
          </a>
        ),
        size: 400,
      },
      {
        accessorKey: 'author',
        header: 'Author',
        size: 120,
      },
      {
        id: 'tags',
        header: 'Tags',
        cell: ({row}) => (
          <TagPicker
            tags={state.customTags}
            selectedTagIds={state.tagAssignments[row.original.hash] || []}
            onChange={tagIds => {
              onStateChange({
                ...state,
                tagAssignments: {
                  ...state.tagAssignments,
                  [row.original.hash]: tagIds,
                },
              });
            }}
          />
        ),
        size: 200,
        enableSorting: false,
      },
    ],
    [state, onStateChange]
  );

  const hasActiveFilters = hideReviewed || tagFilter !== 'all';

  const clearFilters = () => {
    setHideReviewed(false);
    setTagFilter('all');
  };

  const table = useReactTable({
    data: filteredCommits,
    columns,
    state: {sorting, globalFilter},
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="table-container">
      <div className="table-toolbar">
        <input
          type="text"
          placeholder="Filter commits..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="filter-input"
        />
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={hideReviewed}
            onChange={e => setHideReviewed(e.target.checked)}
          />
          Hide reviewed
        </label>
        <select
          className="filter-select"
          value={tagFilter}
          onChange={e => setTagFilter(e.target.value)}>
          <option value="all">Tag: All</option>
          <option value="untagged">Untagged</option>
          {state.customTags.map(tag => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        {hasActiveFilters && (
          <button className="toolbar-btn" onClick={clearFilters}>
            Clear filters
          </button>
        )}
        <span className="filter-count">
          {filteredCommits.length}/{commits.length}
        </span>
      </div>
      <table className="commit-table">
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{
                    width: header.getSize(),
                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                  }}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{asc: ' ^', desc: ' v'}[header.column.getIsSorted()] ?? ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => {
            const hash = row.original.hash;
            const isReviewed = !!state.reviewedCommits[hash];
            const isIncluded = !!state.includedCommits[hash];
            const rowClass = isReviewed && !isIncluded ? 'reviewed-row' : '';
            return (
              <tr key={row.id} className={rowClass}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactScopeMethods} from 'shared/ReactTypes';
import type {KeyboardEvent} from 'react-interactions/events/keyboard';

import React from 'react';
import {useKeyboard} from 'react-interactions/events/keyboard';
import setElementCanTab from './shared/setElementCanTab';

type FocusCellProps = {
  children?: React.Node,
  onKeyDown?: KeyboardEvent => void,
  colSpan?: number,
};

type FocusRowProps = {
  children: React.Node,
};

type FocusTableProps = {|
  children: React.Node,
  onKeyboardOut?: (
    direction: 'left' | 'right' | 'up' | 'down',
    event: KeyboardEvent,
  ) => void,
  wrapX?: boolean,
  wrapY?: boolean,
  tabScopeQuery?: (type: string | Object, props: Object) => boolean,
  allowModifiers?: boolean,
|};

const {useRef} = React;

function focusScope(
  scopeQuery: (type: string | Object, props: Object) => boolean,
  cell: ReactScopeMethods,
  event?: KeyboardEvent,
): void {
  const firstScopedNode = cell.queryFirstNode(scopeQuery);
  if (firstScopedNode !== null) {
    firstScopedNode.focus();
    if (event) {
      event.preventDefault();
    }
  }
}

// This takes into account colSpan
function focusCellByColumnIndex(
  scopeQuery: (type: string | Object, props: Object) => boolean,
  row: ReactScopeMethods,
  columnIndex: number,
  event?: KeyboardEvent,
): void {
  const cells = row.getChildren();
  if (cells !== null) {
    let colSize = 0;
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      if (cell) {
        colSize += cell.getProps().colSpan || 1;
        if (colSize > columnIndex) {
          focusScope(scopeQuery, cell, event);
          return;
        }
      }
    }
  }
}

function getCellIndexes(
  cells: Array<ReactScopeMethods>,
  currentCell: ReactScopeMethods,
): [number, number] {
  let totalColSpan = 0;
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (cell === currentCell) {
      return [i, i + totalColSpan];
    }
    const colSpan = cell.getProps().colSpan;
    if (colSpan) {
      totalColSpan += colSpan - 1;
    }
  }
  return [-1, -1];
}

function getRowCells(currentCell: ReactScopeMethods) {
  const row = currentCell.getParent();
  if (row !== null && row.getProps().type === 'row') {
    const cells = row.getChildren();
    if (cells !== null) {
      const [rowIndex, rowIndexWithColSpan] = getCellIndexes(
        cells,
        currentCell,
      );
      return [cells, rowIndex, rowIndexWithColSpan];
    }
  }
  return [null, -1, -1];
}

function getRows(currentCell: ReactScopeMethods) {
  const row = currentCell.getParent();
  if (row !== null && row.getProps().type === 'row') {
    const table = row.getParent();
    if (table !== null && table.getProps().type === 'table') {
      const rows = table.getChildren();
      if (rows !== null) {
        const columnIndex = rows.indexOf(row);
        return [rows, columnIndex];
      }
    }
  }
  return [null, -1, -1];
}

function triggerNavigateOut(
  currentCell: ReactScopeMethods,
  direction: 'left' | 'right' | 'up' | 'down',
  event,
): void {
  const row = currentCell.getParent();
  if (row !== null && row.getProps().type === 'row') {
    const table = row.getParent();
    if (table !== null) {
      const props = table.getProps();
      const onKeyboardOut = props.onKeyboardOut;
      if (props.type === 'table' && typeof onKeyboardOut === 'function') {
        onKeyboardOut(direction, event);
        return;
      }
    }
  }
  event.continuePropagation();
}

function getTableProps(currentCell: ReactScopeMethods): Object {
  const row = currentCell.getParent();
  if (row !== null && row.getProps().type === 'row') {
    const table = row.getParent();
    if (table !== null) {
      return table.getProps();
    }
  }
  return {};
}

function hasModifierKey(event: KeyboardEvent): boolean {
  const {altKey, ctrlKey, metaKey, shiftKey} = event;
  return (
    altKey === true || ctrlKey === true || metaKey === true || shiftKey === true
  );
}

export function createFocusTable(
  scopeQuery: (type: string | Object, props: Object) => boolean,
): [
  (FocusTableProps) => React.Node,
  (FocusRowProps) => React.Node,
  (FocusCellProps) => React.Node,
] {
  const TableScope = React.unstable_createScope();

  function Table({
    children,
    onKeyboardOut,
    wrapX,
    wrapY,
    tabScopeQuery,
    allowModifiers,
  }: FocusTableProps): React.Node {
    return (
      <TableScope
        type="table"
        onKeyboardOut={onKeyboardOut}
        wrapX={wrapX}
        wrapY={wrapY}
        tabScopeQuery={tabScopeQuery}
        allowModifiers={allowModifiers}>
        {children}
      </TableScope>
    );
  }

  function Row({children}: FocusRowProps): React.Node {
    return <TableScope type="row">{children}</TableScope>;
  }

  function Cell({children, onKeyDown, colSpan}: FocusCellProps): React.Node {
    const scopeRef = useRef(null);
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): void {
        const currentCell = scopeRef.current;
        if (currentCell === null) {
          event.continuePropagation();
          return;
        }
        const key = event.key;
        if (key === 'Tab') {
          const tabScopeQuery = getTableProps(currentCell).tabScopeQuery;
          if (tabScopeQuery) {
            const rowScope = currentCell.getParent();
            if (rowScope) {
              const tableScope = rowScope.getParent();
              if (tableScope) {
                const activeNode = document.activeElement;
                const nodes = tableScope.queryAllNodes(tabScopeQuery);
                for (let i = 0; i < nodes.length; i++) {
                  const node = nodes[i];
                  if (node !== activeNode) {
                    setElementCanTab(node, false);
                  } else {
                    setElementCanTab(node, true);
                  }
                }
                return;
              }
            }
          }
          event.continuePropagation();
          return;
        }
        // Using modifier keys with keyboard arrow events should be no-ops
        // unless an explicit allowModifiers flag is set on the FocusTable.
        if (hasModifierKey(event)) {
          const allowModifiers = getTableProps(currentCell).allowModifiers;
          if (!allowModifiers) {
            event.continuePropagation();
            return;
          }
        }
        switch (key) {
          case 'ArrowUp': {
            const [cells, , cellIndexWithColSpan] = getRowCells(currentCell);
            if (cells !== null) {
              const [rows, rowIndex] = getRows(currentCell);
              if (rows !== null) {
                if (rowIndex > 0) {
                  const row = rows[rowIndex - 1];
                  focusCellByColumnIndex(
                    scopeQuery,
                    row,
                    cellIndexWithColSpan,
                    event,
                  );
                } else if (rowIndex === 0) {
                  const wrapY = getTableProps(currentCell).wrapY;
                  if (wrapY) {
                    const row = rows[rows.length - 1];
                    focusCellByColumnIndex(
                      scopeQuery,
                      row,
                      cellIndexWithColSpan,
                      event,
                    );
                  } else {
                    triggerNavigateOut(currentCell, 'up', event);
                  }
                }
              }
            }
            return;
          }
          case 'ArrowDown': {
            const [cells, , cellIndexWithColSpan] = getRowCells(currentCell);
            if (cells !== null) {
              const [rows, rowIndex] = getRows(currentCell);
              if (rows !== null) {
                if (rowIndex !== -1) {
                  if (rowIndex === rows.length - 1) {
                    const wrapY = getTableProps(currentCell).wrapY;
                    if (wrapY) {
                      const row = rows[0];
                      focusCellByColumnIndex(
                        scopeQuery,
                        row,
                        cellIndexWithColSpan,
                        event,
                      );
                    } else {
                      triggerNavigateOut(currentCell, 'down', event);
                    }
                  } else {
                    const row = rows[rowIndex + 1];
                    focusCellByColumnIndex(
                      scopeQuery,
                      row,
                      cellIndexWithColSpan,
                      event,
                    );
                  }
                }
              }
            }
            return;
          }
          case 'ArrowLeft': {
            const [cells, rowIndex] = getRowCells(currentCell);
            if (cells !== null) {
              if (rowIndex > 0) {
                focusScope(scopeQuery, cells[rowIndex - 1]);
                event.preventDefault();
              } else if (rowIndex === 0) {
                const wrapX = getTableProps(currentCell).wrapX;
                if (wrapX) {
                  focusScope(scopeQuery, cells[cells.length - 1], event);
                } else {
                  triggerNavigateOut(currentCell, 'left', event);
                }
              }
            }
            return;
          }
          case 'ArrowRight': {
            const [cells, rowIndex] = getRowCells(currentCell);
            if (cells !== null) {
              if (rowIndex !== -1) {
                if (rowIndex === cells.length - 1) {
                  const wrapX = getTableProps(currentCell).wrapX;
                  if (wrapX) {
                    focusScope(scopeQuery, cells[0], event);
                  } else {
                    triggerNavigateOut(currentCell, 'right', event);
                  }
                } else {
                  focusScope(scopeQuery, cells[rowIndex + 1], event);
                }
              }
            }
            return;
          }
        }
        if (onKeyDown) {
          onKeyDown(event);
        }
      },
    });
    return (
      <TableScope
        DEPRECATED_flareListeners={keyboard}
        ref={scopeRef}
        type="cell"
        colSpan={colSpan}>
        {children}
      </TableScope>
    );
  }

  return [Table, Row, Cell];
}

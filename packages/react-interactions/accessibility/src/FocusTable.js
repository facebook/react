/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactScope, ReactScopeMethods} from 'shared/ReactTypes';
import type {KeyboardEvent} from 'react-interactions/events/keyboard';

import React from 'react';
import {useKeyboard} from 'react-interactions/events/keyboard';

type FocusCellProps = {
  children?: React.Node,
};

type FocusRowProps = {
  children: React.Node,
};

type FocusTableProps = {|
  children: React.Node,
  id?: string,
  onKeyboardOut?: (
    direction: 'left' | 'right' | 'up' | 'down',
    focusTableByID: (id: string) => void,
  ) => void,
|};

const {useRef} = React;

export function focusFirstCellOnTable(table: ReactScopeMethods): void {
  const rows = table.getChildren();
  if (rows !== null) {
    const firstRow = rows[0];
    if (firstRow !== null) {
      const cells = firstRow.getChildren();
      if (cells !== null) {
        const firstCell = cells[0];
        if (firstCell !== null) {
          const tabbableNodes = firstCell.getScopedNodes();
          if (tabbableNodes !== null) {
            const firstElem = tabbableNodes[0];
            if (firstElem !== null) {
              firstElem.focus();
            }
          }
        }
      }
    }
  }
}

function focusCell(cell: ReactScopeMethods): void {
  const tabbableNodes = cell.getScopedNodes();
  if (tabbableNodes !== null && tabbableNodes.length > 0) {
    tabbableNodes[0].focus();
  }
}

function focusCellByIndex(row: ReactScopeMethods, cellIndex: number): void {
  const cells = row.getChildren();
  if (cells !== null) {
    const cell = cells[cellIndex];
    if (cell) {
      focusCell(cell);
    }
  }
}

function getRowCells(currentCell: ReactScopeMethods) {
  const row = currentCell.getParent();
  if (row !== null && row.getProps().type === 'row') {
    const cells = row.getChildren();
    if (cells !== null) {
      const rowIndex = cells.indexOf(currentCell);
      return [cells, rowIndex];
    }
  }
  return [null, 0];
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
  return [null, 0];
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
        const focusTableByID = (id: string) => {
          const topLevelTables = table.getChildrenFromRoot();
          if (topLevelTables !== null) {
            for (let i = 0; i < topLevelTables.length; i++) {
              const topLevelTable = topLevelTables[i];
              if (topLevelTable.getProps().id === id) {
                focusFirstCellOnTable(topLevelTable);
                return;
              }
            }
          }
        };
        onKeyboardOut(direction, focusTableByID);
        return;
      }
    }
  }
  event.continuePropagation();
}

export function createFocusTable(scope: ReactScope): Array<React.Component> {
  const TableScope = React.unstable_createScope(scope.fn);

  function Table({children, onKeyboardOut, id}): FocusTableProps {
    return (
      <TableScope type="table" onKeyboardOut={onKeyboardOut} id={id}>
        {children}
      </TableScope>
    );
  }

  function Row({children}): FocusRowProps {
    return <TableScope type="row">{children}</TableScope>;
  }

  function Cell({children}): FocusCellProps {
    const scopeRef = useRef(null);
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): void {
        const currentCell = scopeRef.current;
        if (currentCell === null) {
          event.continuePropagation();
          return;
        }
        switch (event.key) {
          case 'ArrowUp': {
            const [cells, cellIndex] = getRowCells(currentCell);
            if (cells !== null) {
              const [rows, rowIndex] = getRows(currentCell);
              if (rows !== null) {
                if (rowIndex > 0) {
                  const row = rows[rowIndex - 1];
                  focusCellByIndex(row, cellIndex);
                  event.preventDefault();
                } else if (rowIndex === 0) {
                  triggerNavigateOut(currentCell, 'up', event);
                }
              }
            }
            return;
          }
          case 'ArrowDown': {
            const [cells, cellIndex] = getRowCells(currentCell);
            if (cells !== null) {
              const [rows, rowIndex] = getRows(currentCell);
              if (rows !== null) {
                if (rowIndex !== -1) {
                  if (rowIndex === rows.length - 1) {
                    triggerNavigateOut(currentCell, 'down', event);
                  } else {
                    const row = rows[rowIndex + 1];
                    focusCellByIndex(row, cellIndex);
                    event.preventDefault();
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
                focusCell(cells[rowIndex - 1]);
                event.preventDefault();
              } else if (rowIndex === 0) {
                triggerNavigateOut(currentCell, 'left', event);
              }
            }
            return;
          }
          case 'ArrowRight': {
            const [cells, rowIndex] = getRowCells(currentCell);
            if (cells !== null) {
              if (rowIndex !== -1) {
                if (rowIndex === cells.length - 1) {
                  triggerNavigateOut(currentCell, 'right', event);
                } else {
                  focusCell(cells[rowIndex + 1]);
                  event.preventDefault();
                }
              }
            }
            return;
          }
        }
      },
    });
    return (
      <TableScope listeners={keyboard} ref={scopeRef} type="cell">
        {children}
      </TableScope>
    );
  }

  return [Table, Row, Cell];
}

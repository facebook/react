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
import {setElementCanTab} from 'react-interactions/accessibility/focus-control';

type FocusCellProps = {
  children?: React.Node,
  onKeyDown?: KeyboardEvent => void,
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
  wrap?: boolean,
  tabScope?: ReactScope,
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

function focusScope(cell: ReactScopeMethods, event?: KeyboardEvent): void {
  const tabbableNodes = cell.getScopedNodes();
  if (tabbableNodes !== null && tabbableNodes.length > 0) {
    tabbableNodes[0].focus();
    if (event) {
      event.preventDefault();
    }
  }
}

function focusCellByIndex(
  row: ReactScopeMethods,
  cellIndex: number,
  event?: KeyboardEvent,
): void {
  const cells = row.getChildren();
  if (cells !== null) {
    const cell = cells[cellIndex];
    if (cell) {
      focusScope(cell, event);
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

export function createFocusTable(scope: ReactScope): Array<React.Component> {
  const TableScope = React.unstable_createScope(scope.fn);

  function Table({
    children,
    onKeyboardOut,
    id,
    wrap,
    tabScope: TabScope,
  }): FocusTableProps {
    const tabScopeRef = useRef(null);
    return (
      <TableScope
        type="table"
        onKeyboardOut={onKeyboardOut}
        id={id}
        wrap={wrap}
        tabScopeRef={tabScopeRef}>
        {TabScope ? (
          <TabScope ref={tabScopeRef}>{children}</TabScope>
        ) : (
          children
        )}
      </TableScope>
    );
  }

  function Row({children}): FocusRowProps {
    return <TableScope type="row">{children}</TableScope>;
  }

  function Cell({children, onKeyDown}): FocusCellProps {
    const scopeRef = useRef(null);
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): void {
        const currentCell = scopeRef.current;
        if (currentCell === null) {
          event.continuePropagation();
          return;
        }
        switch (event.key) {
          case 'Tab': {
            const tabScope = getTableProps(currentCell).tabScopeRef.current;
            if (tabScope) {
              const activeNode = document.activeElement;
              const nodes = tabScope.getScopedNodes();
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
            event.continuePropagation();
            return;
          }
          case 'ArrowUp': {
            const [cells, cellIndex] = getRowCells(currentCell);
            if (cells !== null) {
              const [rows, rowIndex] = getRows(currentCell);
              if (rows !== null) {
                if (rowIndex > 0) {
                  const row = rows[rowIndex - 1];
                  focusCellByIndex(row, cellIndex, event);
                } else if (rowIndex === 0) {
                  const wrap = getTableProps(currentCell).wrap;
                  if (wrap) {
                    const row = rows[rows.length - 1];
                    focusCellByIndex(row, cellIndex, event);
                  } else {
                    triggerNavigateOut(currentCell, 'up', event);
                  }
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
                    const wrap = getTableProps(currentCell).wrap;
                    if (wrap) {
                      const row = rows[0];
                      focusCellByIndex(row, cellIndex, event);
                    } else {
                      triggerNavigateOut(currentCell, 'down', event);
                    }
                  } else {
                    const row = rows[rowIndex + 1];
                    focusCellByIndex(row, cellIndex, event);
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
                focusScope(cells[rowIndex - 1]);
                event.preventDefault();
              } else if (rowIndex === 0) {
                const wrap = getTableProps(currentCell).wrap;
                if (wrap) {
                  focusScope(cells[cells.length - 1], event);
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
                  const wrap = getTableProps(currentCell).wrap;
                  if (wrap) {
                    focusScope(cells[0], event);
                  } else {
                    triggerNavigateOut(currentCell, 'right', event);
                  }
                } else {
                  focusScope(cells[rowIndex + 1], event);
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
      <TableScope listeners={keyboard} ref={scopeRef} type="cell">
        {children}
      </TableScope>
    );
  }

  return [Table, Row, Cell];
}

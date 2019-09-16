/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {KeyboardEvent} from 'react-ui/events/src/dom/Keyboard';

import React from 'react';
import {tabFocusableImpl} from './TabbableScope';
import {useKeyboard} from '../../events/keyboard';

type GridComponentProps = {
  children: React.Node,
};

const {useRef} = React;

function focusCell(cell) {
  const tabbableNodes = cell.getScopedNodes();
  if (tabbableNodes !== null && tabbableNodes.length > 0) {
    tabbableNodes[0].focus();
  }
}

function focusCellByRowIndex(row, rowIndex) {
  const cells = row.getChildren();
  const cell = cells[rowIndex];
  if (cell) {
    focusCell(cell);
  }
}

function getRowCells(currentCell) {
  const row = currentCell.getParent();
  if (parent !== null) {
    const cells = row.getChildren();
    const rowIndex = cells.indexOf(currentCell);
    return [cells, rowIndex];
  }
  return [null, 0];
}

function getColumns(currentCell) {
  const row = currentCell.getParent();
  if (parent !== null) {
    const grid = row.getParent();
    const columns = grid.getChildren();
    const columnIndex = columns.indexOf(row);
    return [columns, columnIndex];
  }
  return [null, 0];
}

export function createFocusGrid(): Array<React.Component> {
  const GridScope = React.unstable_createScope(tabFocusableImpl);

  function GridContainer({children}): GridComponentProps {
    return <GridScope>{children}</GridScope>;
  }

  function GridRow({children}): GridComponentProps {
    return <GridScope>{children}</GridScope>;
  }

  function GridCell({children}): GridComponentProps {
    const scopeRef = useRef(null);
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): boolean {
        const currentCell = scopeRef.current;
        switch (event.key) {
          case 'UpArrow': {
            const [cells, rowIndex] = getRowCells(currentCell);
            if (cells !== null) {
              const [columns, columnIndex] = getColumns(currentCell);
              if (columns !== null) {
                if (columnIndex > 0) {
                  const column = columns[columnIndex - 1];
                  focusCellByRowIndex(column, rowIndex);
                }
              }
            }
            return false;
          }
          case 'DownArrow': {
            const [cells, rowIndex] = getRowCells(currentCell);
            if (cells !== null) {
              const [columns, columnIndex] = getColumns(currentCell);
              if (columns !== null) {
                if (columnIndex !== -1 && columnIndex !== columns.length - 1) {
                  const column = columns[columnIndex + 1];
                  focusCellByRowIndex(column, rowIndex);
                }
              }
            }
            return false;
          }
          case 'LeftArrow': {
            const [cells, rowIndex] = getRowCells(currentCell);
            if (cells !== null) {
              if (rowIndex > 0) {
                focusCell(cells[rowIndex - 1]);
              }
            }
            return false;
          }
          case 'RightArrow': {
            const [cells, rowIndex] = getRowCells(currentCell);
            if (cells !== null) {
              if (rowIndex !== -1 && rowIndex !== cells.length - 1) {
                focusCell(cells[rowIndex + 1]);
              }
            }
            return false;
          }
        }
        return true;
      },
    });
    return (
      <GridScope listeners={keyboard} ref={scopeRef}>
        {children}
      </GridScope>
    );
  }

  return [GridContainer, GridRow, GridCell];
}

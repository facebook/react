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

type FocusItemProps = {
  children?: React.Node,
};

type FocusListProps = {|
  children: React.Node,
  portrait: boolean,
|};

const {useRef} = React;

function focusListItem(cell: ReactScopeMethods): void {
  const tabbableNodes = cell.getScopedNodes();
  if (tabbableNodes !== null && tabbableNodes.length > 0) {
    tabbableNodes[0].focus();
  }
}

function getPreviousListItem(
  list: ReactScopeMethods,
  currentItem: ReactScopeMethods,
): null | ReactScopeMethods {
  const items = list.getChildren();
  if (items !== null) {
    const currentItemIndex = items.indexOf(currentItem);
    if (currentItemIndex > 0) {
      return items[currentItemIndex - 1] || null;
    }
  }
  return null;
}

function getNextListItem(
  list: ReactScopeMethods,
  currentItem: ReactScopeMethods,
): null | ReactScopeMethods {
  const items = list.getChildren();
  if (items !== null) {
    const currentItemIndex = items.indexOf(currentItem);
    if (currentItemIndex !== -1 && currentItemIndex !== items.length - 1) {
      return items[currentItemIndex + 1] || null;
    }
  }
  return null;
}

export function createFocusList(scope: ReactScope): Array<React.Component> {
  const TableScope = React.unstable_createScope(scope.fn);

  function List({children, portrait}): FocusListProps {
    return (
      <TableScope type="list" portrait={portrait}>
        {children}
      </TableScope>
    );
  }

  function Item({children}): FocusItemProps {
    const scopeRef = useRef(null);
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): void {
        const currentItem = scopeRef.current;
        if (currentItem !== null) {
          const list = currentItem.getParent();
          const listProps = list && list.getProps();
          if (list !== null && listProps.type === 'list') {
            const portrait = listProps.portrait;
            switch (event.key) {
              case 'ArrowUp': {
                if (portrait) {
                  const previousListItem = getPreviousListItem(
                    list,
                    currentItem,
                  );
                  if (previousListItem) {
                    event.preventDefault();
                    focusListItem(previousListItem);
                    return;
                  }
                }
                break;
              }
              case 'ArrowDown': {
                if (portrait) {
                  const nextListItem = getNextListItem(list, currentItem);
                  if (nextListItem) {
                    event.preventDefault();
                    focusListItem(nextListItem);
                    return;
                  }
                }
                break;
              }
              case 'ArrowLeft': {
                if (!portrait) {
                  const previousListItem = getPreviousListItem(
                    list,
                    currentItem,
                  );
                  if (previousListItem) {
                    event.preventDefault();
                    focusListItem(previousListItem);
                    return;
                  }
                }
                break;
              }
              case 'ArrowRight': {
                if (!portrait) {
                  const nextListItem = getNextListItem(list, currentItem);
                  if (nextListItem) {
                    event.preventDefault();
                    focusListItem(nextListItem);
                    return;
                  }
                }
                break;
              }
            }
          }
        }
        event.continuePropagation();
      },
    });
    return (
      <TableScope listeners={keyboard} ref={scopeRef} type="item">
        {children}
      </TableScope>
    );
  }

  return [List, Item];
}

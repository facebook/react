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
  onKeyDown?: KeyboardEvent => void,
};

type FocusListProps = {|
  children: React.Node,
  portrait: boolean,
  wrap?: boolean,
|};

const {useRef} = React;

function focusListItem(cell: ReactScopeMethods, event: KeyboardEvent): void {
  const tabbableNodes = cell.getScopedNodes();
  if (tabbableNodes !== null && tabbableNodes.length > 0) {
    tabbableNodes[0].focus();
    event.preventDefault();
  }
}

function getPreviousListItem(
  list: ReactScopeMethods,
  currentItem: ReactScopeMethods,
): null | ReactScopeMethods {
  const items = list.getChildren();
  if (items !== null) {
    const currentItemIndex = items.indexOf(currentItem);
    const wrap = getListWrapProp(currentItem);
    if (currentItemIndex === 0 && wrap) {
      return items[items.length - 1] || null;
    } else if (currentItemIndex > 0) {
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
    const wrap = getListWrapProp(currentItem);
    const end = currentItemIndex === items.length - 1;
    if (end && wrap) {
      return items[0] || null;
    } else if (currentItemIndex !== -1 && !end) {
      return items[currentItemIndex + 1] || null;
    }
  }
  return null;
}

function getListWrapProp(currentItem: ReactScopeMethods): boolean {
  const list = currentItem.getParent();
  if (list !== null) {
    const listProps = list.getProps();
    return (listProps.type === 'list' && listProps.wrap) || false;
  }
  return false;
}

export function createFocusList(scope: ReactScope): Array<React.Component> {
  const TableScope = React.unstable_createScope(scope.fn);

  function List({children, portrait, wrap}): FocusListProps {
    return (
      <TableScope type="list" portrait={portrait} wrap={wrap}>
        {children}
      </TableScope>
    );
  }

  function Item({children, onKeyDown}): FocusItemProps {
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
                    focusListItem(previousListItem, event);
                    return;
                  }
                }
                break;
              }
              case 'ArrowDown': {
                if (portrait) {
                  const nextListItem = getNextListItem(list, currentItem);
                  if (nextListItem) {
                    focusListItem(nextListItem, event);
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
                    focusListItem(previousListItem, event);
                    return;
                  }
                }
                break;
              }
              case 'ArrowRight': {
                if (!portrait) {
                  const nextListItem = getNextListItem(list, currentItem);
                  if (nextListItem) {
                    focusListItem(nextListItem, event);
                    return;
                  }
                }
                break;
              }
            }
          }
        }
        if (onKeyDown) {
          onKeyDown(event);
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

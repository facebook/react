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

type FocusItemProps = {
  children?: React.Node,
  onKeyDown?: KeyboardEvent => void,
};

type FocusListProps = {|
  children: React.Node,
  portrait: boolean,
  wrap?: boolean,
  tabScope?: ReactScope,
  allowModifiers?: boolean,
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
    const wrap = getListProps(currentItem).wrap;
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
    const wrap = getListProps(currentItem).wrap;
    const end = currentItemIndex === items.length - 1;
    if (end && wrap) {
      return items[0] || null;
    } else if (currentItemIndex !== -1 && !end) {
      return items[currentItemIndex + 1] || null;
    }
  }
  return null;
}

function getListProps(currentCell: ReactScopeMethods): Object {
  const list = currentCell.getParent();
  if (list !== null) {
    const listProps = list.getProps();
    if (listProps && listProps.type === 'list') {
      return listProps;
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

export function createFocusList(scope: ReactScope): Array<React.Component> {
  const TableScope = React.unstable_createScope(scope.fn);

  function List({
    children,
    portrait,
    wrap,
    tabScope: TabScope,
    allowModifiers,
  }): FocusListProps {
    const tabScopeRef = useRef(null);
    return (
      <TableScope
        type="list"
        portrait={portrait}
        wrap={wrap}
        tabScopeRef={tabScopeRef}
        allowModifiers={allowModifiers}>
        {TabScope ? (
          <TabScope ref={tabScopeRef}>{children}</TabScope>
        ) : (
          children
        )}
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
            const key = event.key;

            if (key === 'Tab') {
              const tabScope = getListProps(currentItem).tabScopeRef.current;
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
            // Using modifier keys with keyboard arrow events should be no-ops
            // unless an explicit allowModifiers flag is set on the FocusList.
            if (hasModifierKey(event)) {
              const allowModifiers = getListProps(currentItem).allowModifiers;
              if (!allowModifiers) {
                event.continuePropagation();
                return;
              }
            }
            switch (key) {
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

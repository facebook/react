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

type FocusItemProps = {
  children?: React.Node,
  onKeyDown?: KeyboardEvent => void,
};

type FocusGroupProps = {|
  children: React.Node,
  portrait: boolean,
  wrap?: boolean,
  tabScopeQuery?: (type: string | Object, props: Object) => boolean,
  allowModifiers?: boolean,
|};

const {useRef} = React;

function focusGroupItem(
  scopeQuery: (type: string | Object, props: Object) => boolean,
  cell: ReactScopeMethods,
  event: KeyboardEvent,
): void {
  const firstScopedNode = cell.queryFirstNode(scopeQuery);
  if (firstScopedNode !== null) {
    firstScopedNode.focus();
    event.preventDefault();
  }
}

function getPreviousGroupItem(
  group: ReactScopeMethods,
  currentItem: ReactScopeMethods,
): null | ReactScopeMethods {
  const items = group.getChildren();
  if (items !== null) {
    const currentItemIndex = items.indexOf(currentItem);
    const wrap = getGroupProps(currentItem).wrap;
    if (currentItemIndex === 0 && wrap) {
      return items[items.length - 1] || null;
    } else if (currentItemIndex > 0) {
      return items[currentItemIndex - 1] || null;
    }
  }
  return null;
}

function getNextGroupItem(
  group: ReactScopeMethods,
  currentItem: ReactScopeMethods,
): null | ReactScopeMethods {
  const items = group.getChildren();
  if (items !== null) {
    const currentItemIndex = items.indexOf(currentItem);
    const wrap = getGroupProps(currentItem).wrap;
    const end = currentItemIndex === items.length - 1;
    if (end && wrap) {
      return items[0] || null;
    } else if (currentItemIndex !== -1 && !end) {
      return items[currentItemIndex + 1] || null;
    }
  }
  return null;
}

function getGroupProps(currentCell: ReactScopeMethods): Object {
  const group = currentCell.getParent();
  if (group !== null) {
    const groupProps = group.getProps();
    if (groupProps && groupProps.type === 'group') {
      return groupProps;
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

export function createFocusGroup(
  scopeQuery: (type: string | Object, props: Object) => boolean,
): [(FocusGroupProps) => React.Node, (FocusItemProps) => React.Node] {
  const TableScope = React.unstable_createScope();

  function Group({
    children,
    portrait,
    wrap,
    tabScopeQuery,
    allowModifiers,
  }: FocusGroupProps): React.Node {
    return (
      <TableScope
        type="group"
        portrait={portrait}
        wrap={wrap}
        tabScopeQuery={tabScopeQuery}
        allowModifiers={allowModifiers}>
        {children}
      </TableScope>
    );
  }

  function Item({children, onKeyDown}: FocusItemProps): React.Node {
    const scopeRef = useRef(null);
    const keyboard = useKeyboard({
      onKeyDown(event: KeyboardEvent): void {
        const currentItem = scopeRef.current;
        if (currentItem !== null) {
          const group = currentItem.getParent();
          const groupProps = group && group.getProps();
          if (group !== null && groupProps.type === 'group') {
            const portrait = groupProps.portrait;
            const key = event.key;

            if (key === 'Tab') {
              const tabScopeQuery = getGroupProps(currentItem).tabScopeQuery;
              if (tabScopeQuery) {
                const groupScope = currentItem.getParent();
                if (groupScope) {
                  const activeNode = document.activeElement;
                  const nodes = groupScope.queryAllNodes(tabScopeQuery);
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
              event.continuePropagation();
              return;
            }
            // Using modifier keys with keyboard arrow events should be no-ops
            // unless an explicit allowModifiers flag is set on the FocusGroup.
            if (hasModifierKey(event)) {
              const allowModifiers = getGroupProps(currentItem).allowModifiers;
              if (!allowModifiers) {
                event.continuePropagation();
                return;
              }
            }
            switch (key) {
              case 'ArrowUp': {
                if (portrait) {
                  const previousGroupItem = getPreviousGroupItem(
                    group,
                    currentItem,
                  );
                  if (previousGroupItem) {
                    focusGroupItem(scopeQuery, previousGroupItem, event);
                    return;
                  }
                }
                break;
              }
              case 'ArrowDown': {
                if (portrait) {
                  const nextGroupItem = getNextGroupItem(group, currentItem);
                  if (nextGroupItem) {
                    focusGroupItem(scopeQuery, nextGroupItem, event);
                    return;
                  }
                }
                break;
              }
              case 'ArrowLeft': {
                if (!portrait) {
                  const previousGroupItem = getPreviousGroupItem(
                    group,
                    currentItem,
                  );
                  if (previousGroupItem) {
                    focusGroupItem(scopeQuery, previousGroupItem, event);
                    return;
                  }
                }
                break;
              }
              case 'ArrowRight': {
                if (!portrait) {
                  const nextGroupItem = getNextGroupItem(group, currentItem);
                  if (nextGroupItem) {
                    focusGroupItem(scopeQuery, nextGroupItem, event);
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
      <TableScope
        DEPRECATED_flareListeners={keyboard}
        ref={scopeRef}
        type="item">
        {children}
      </TableScope>
    );
  }

  return [Group, Item];
}

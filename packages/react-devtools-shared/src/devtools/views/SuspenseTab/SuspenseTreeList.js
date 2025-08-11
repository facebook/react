/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {SuspenseNode} from '../../../frontend/types';

import * as React from 'react';
import {useContext} from 'react';
import {
  TreeDispatcherContext,
  TreeStateContext,
} from '../Components/TreeContext';
import {StoreContext} from '../context';
import {useHighlightHostInstance} from '../hooks';
import styles from './SuspenseTreeList.css';

function SuspenseTreeListElement({
  instance,
}: {
  instance: SuspenseNode,
}): React$Node {
  const {selectedSuspenseID} = useContext(TreeStateContext);
  const treeDispatch = useContext(TreeDispatcherContext);
  const {id, name} = instance;
  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  function handleMouseEnter() {
    highlightHostInstance(id);
  }

  function handleMouseDown(event: SyntheticPointerEvent<HTMLElement>) {
    if (!event.metaKey) {
      treeDispatch({
        type: 'SELECT_ELEMENT_BY_ID',
        payload: id,
      });
    }
  }

  const selected = selectedSuspenseID === id;

  return (
    <li
      className={styles.SuspenseTreeListItem}
      aria-selected={selected}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={clearHighlightHostInstance}>
      {name === null ? `Suspense #${id}` : name}
    </li>
  );
}

export default function SuspenseTreeList(_: {}): React$Node {
  const store = useContext(StoreContext);
  const {numSuspense} = useContext(TreeStateContext);

  // TODO: Use FixedSizeList
  const children: React$Node[] = [];
  for (let i = 0; i < numSuspense; i++) {
    const suspense = store.getSuspenseAtIndex(i);
    if (suspense !== null) {
      children.push(
        <SuspenseTreeListElement key={suspense.id} instance={suspense} />,
      );
    }
  }

  const treeDispatch = useContext(TreeDispatcherContext);
  function handleKeyDown(event: SyntheticKeyboardEvent<HTMLElement>) {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        treeDispatch({type: 'SELECT_NEXT_SUSPENSE_IN_TREE'});
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        treeDispatch({type: 'SELECT_PREVIOUS_SUSPENSE_IN_TREE'});
        break;
      }
      default:
        break;
    }
  }

  return (
    <div className={styles.SuspenseTreeListContainer}>
      <ol
        className={styles.SuspenseTreeList}
        role="listbox"
        tabIndex={0}
        onKeyDown={handleKeyDown}>
        {children}
      </ol>
    </div>
  );
}

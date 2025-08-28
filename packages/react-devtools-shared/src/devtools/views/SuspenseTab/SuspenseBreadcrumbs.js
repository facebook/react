/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SuspenseNode} from 'react-devtools-shared/src/frontend/types';

import * as React from 'react';
import {useContext} from 'react';
import {
  TreeDispatcherContext,
  TreeStateContext,
} from '../Components/TreeContext';
import {StoreContext} from '../context';
import {useHighlightHostInstance} from '../hooks';
import styles from './SuspenseBreadcrumbs.css';
import typeof {SyntheticMouseEvent} from 'react-dom-bindings/src/events/SyntheticEvent';

export default function SuspenseBreadcrumbs(): React$Node {
  const store = useContext(StoreContext);
  const dispatch = useContext(TreeDispatcherContext);
  const {inspectedElementID} = useContext(TreeStateContext);

  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  // TODO: Use the nearest Suspense boundary
  const inspectedSuspenseID = inspectedElementID;
  if (inspectedSuspenseID === null) {
    return null;
  }

  const suspense = store.getSuspenseByID(inspectedSuspenseID);
  if (suspense === null) {
    return null;
  }

  const lineage: SuspenseNode[] = [];
  let next: null | SuspenseNode = suspense;
  while (next !== null) {
    if (next.parentID === 0) {
      next = null;
    } else {
      lineage.unshift(next);
      next = store.getSuspenseByID(next.parentID);
    }
  }

  function handleClick(node: SuspenseNode, event: SyntheticMouseEvent) {
    event.preventDefault();
    dispatch({type: 'SELECT_ELEMENT_BY_ID', payload: node.id});
  }

  return (
    <ol className={styles.SuspenseBreadcrumbsList}>
      {lineage.map((node, index) => {
        return (
          <li
            key={node.id}
            className={styles.SuspenseBreadcrumbsListItem}
            aria-current={index === lineage.length - 1}
            onPointerEnter={highlightHostInstance.bind(null, node.id)}
            onPointerLeave={clearHighlightHostInstance}>
            <button
              className={styles.SuspenseBreadcrumbsButton}
              onClick={handleClick.bind(null, node)}
              type="button">
              {node.name}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

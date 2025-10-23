/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {SuspenseNode} from 'react-devtools-shared/src/frontend/types';
import typeof {SyntheticMouseEvent} from 'react-dom-bindings/src/events/SyntheticEvent';

import * as React from 'react';
import {useContext} from 'react';
import {TreeDispatcherContext} from '../Components/TreeContext';
import {StoreContext} from '../context';
import {useHighlightHostInstance} from '../hooks';
import styles from './SuspenseBreadcrumbs.css';
import {
  SuspenseTreeStateContext,
  SuspenseTreeDispatcherContext,
} from './SuspenseTreeContext';

export default function SuspenseBreadcrumbs(): React$Node {
  const store = useContext(StoreContext);
  const treeDispatch = useContext(TreeDispatcherContext);
  const suspenseTreeDispatch = useContext(SuspenseTreeDispatcherContext);
  const {selectedSuspenseID, lineage, roots} = useContext(
    SuspenseTreeStateContext,
  );

  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  function handleClick(id: SuspenseNode['id'], event: SyntheticMouseEvent) {
    event.preventDefault();
    treeDispatch({type: 'SELECT_ELEMENT_BY_ID', payload: id});
    suspenseTreeDispatch({type: 'SELECT_SUSPENSE_BY_ID', payload: id});
  }

  return (
    <ol className={styles.SuspenseBreadcrumbsList}>
      {lineage === null ? null : lineage.length === 0 ? (
        // We selected the root. This means that we're currently viewing the Transition
        // that rendered the whole screen. In laymans terms this is really "Initial Paint".
        // TODO: Once we add subtree selection, then the equivalent should be called
        // "Transition" since in that case it's really about a Transition within the page.
        roots.length > 0 ? (
          <li
            className={styles.SuspenseBreadcrumbsListItem}
            aria-current="true">
            <button
              className={styles.SuspenseBreadcrumbsButton}
              onClick={handleClick.bind(null, roots[0])}
              type="button">
              Initial Paint
            </button>
          </li>
        ) : null
      ) : (
        lineage.map((id, index) => {
          const node = store.getSuspenseByID(id);

          return (
            <li
              key={id}
              className={styles.SuspenseBreadcrumbsListItem}
              aria-current={selectedSuspenseID === id}
              onPointerEnter={highlightHostInstance.bind(null, id, false)}
              onPointerLeave={clearHighlightHostInstance}>
              <button
                className={styles.SuspenseBreadcrumbsButton}
                onClick={handleClick.bind(null, id)}
                type="button">
                {node === null ? 'Unknown' : node.name || 'Unknown'}
              </button>
            </li>
          );
        })
      )}
    </ol>
  );
}

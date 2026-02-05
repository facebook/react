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
import {useContext, useLayoutEffect, useState} from 'react';
import {
  TreeDispatcherContext,
  TreeStateContext,
} from '../Components/TreeContext';
import {StoreContext} from '../context';
import {useHighlightHostInstance, useIsOverflowing} from '../hooks';
import styles from './SuspenseBreadcrumbs.css';
import {
  SuspenseTreeStateContext,
  SuspenseTreeDispatcherContext,
} from './SuspenseTreeContext';

type SuspenseBreadcrumbsFlatListProps = {
  onItemClick: (id: SuspenseNode['id'], event: SyntheticMouseEvent) => void,
  onItemPointerEnter: (
    id: SuspenseNode['id'],
    scrollIntoView?: boolean,
  ) => void,
  onItemPointerLeave: (event: SyntheticMouseEvent) => void,
};

function SuspenseBreadcrumbsFlatList({
  onItemClick,
  onItemPointerEnter,
  onItemPointerLeave,
}: SuspenseBreadcrumbsFlatListProps): React$Node {
  const store = useContext(StoreContext);
  const {activityID} = useContext(TreeStateContext);
  const {selectedSuspenseID, lineage, roots} = useContext(
    SuspenseTreeStateContext,
  );
  return (
    <ol className={styles.SuspenseBreadcrumbsList}>
      {lineage === null ? null : lineage.length === 0 ? (
        // We selected the root. This means that we're currently viewing the Transition
        // that rendered the whole screen. In laymans terms this is really "Initial Paint" .
        // When we're looking at a subtree selection, then the equivalent is a
        // "Transition" since in that case it's really about a Transition within the page.
        roots.length > 0 ? (
          <li
            className={styles.SuspenseBreadcrumbsListItem}
            aria-current="true">
            <button
              className={styles.SuspenseBreadcrumbsButton}
              onClick={onItemClick.bind(
                null,
                activityID === null ? roots[0] : activityID,
              )}
              type="button">
              {activityID === null ? 'Initial Paint' : 'Transition'}
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
              onPointerEnter={onItemPointerEnter.bind(null, id, false)}
              onPointerLeave={onItemPointerLeave}>
              <button
                className={styles.SuspenseBreadcrumbsButton}
                onClick={onItemClick.bind(null, id)}
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

type SuspenseBreadcrumbsMenuProps = {
  onItemClick: (id: SuspenseNode['id'], event: SyntheticMouseEvent) => void,
  onItemPointerEnter: (
    id: SuspenseNode['id'],
    scrollIntoView?: boolean,
  ) => void,
  onItemPointerLeave: (event: SyntheticMouseEvent) => void,
};

function SuspenseBreadcrumbsMenu({}: SuspenseBreadcrumbsMenuProps): React$Node {
  return <div>TODO: Suspense Breadcrumbs Menu</div>;
}

export default function SuspenseBreadcrumbs(): React$Node {
  const treeDispatch = useContext(TreeDispatcherContext);
  const suspenseTreeDispatch = useContext(SuspenseTreeDispatcherContext);

  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  function handleClick(id: SuspenseNode['id'], event: SyntheticMouseEvent) {
    event.preventDefault();
    treeDispatch({type: 'SELECT_ELEMENT_BY_ID', payload: id});
    suspenseTreeDispatch({type: 'SELECT_SUSPENSE_BY_ID', payload: id});
  }

  const [elementsTotalWidth, setElementsTotalWidth] = useState(0);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const isOverflowing = useIsOverflowing(containerRef, elementsTotalWidth);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const ResizeObserver = container.ownerDocument.defaultView.ResizeObserver;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      setElementsTotalWidth(entry.contentRect.width);
    });

    observer.observe(container);

    return observer.disconnect.bind(observer);
  }, [containerRef, isOverflowing]);

  return (
    <div className={styles.SuspenseBreadcrumbsContainer} ref={containerRef}>
      {isOverflowing ? (
        <SuspenseBreadcrumbsMenu />
      ) : (
        <SuspenseBreadcrumbsFlatList
          onItemClick={handleClick}
          onItemPointerEnter={highlightHostInstance}
          onItemPointerLeave={clearHighlightHostInstance}
        />
      )}
    </div>
  );
}

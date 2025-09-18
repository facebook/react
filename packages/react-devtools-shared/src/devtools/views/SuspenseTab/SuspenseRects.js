/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Store from 'react-devtools-shared/src/devtools/store';
import type {
  SuspenseNode,
  Rect,
} from 'react-devtools-shared/src/frontend/types';
import typeof {
  SyntheticMouseEvent,
  SyntheticPointerEvent,
} from 'react-dom-bindings/src/events/SyntheticEvent';

import * as React from 'react';
import {createContext, useContext} from 'react';
import {
  TreeDispatcherContext,
  TreeStateContext,
} from '../Components/TreeContext';
import {StoreContext} from '../context';
import {useHighlightHostInstance} from '../hooks';
import styles from './SuspenseRects.css';
import {
  SuspenseTreeStateContext,
  SuspenseTreeDispatcherContext,
} from './SuspenseTreeContext';

function ScaledRect({
  className,
  rect,
  ...props
}: {
  className: string,
  rect: Rect,
  ...
}): React$Node {
  const viewBox = useContext(ViewBox);
  const width = (rect.width / viewBox.width) * 100 + '%';
  const height = (rect.height / viewBox.height) * 100 + '%';
  const x = ((rect.x - viewBox.x) / viewBox.width) * 100 + '%';
  const y = ((rect.y - viewBox.y) / viewBox.height) * 100 + '%';

  return (
    <div
      {...props}
      className={styles.SuspenseRectsScaledRect + ' ' + className}
      style={{
        width,
        height,
        top: y,
        left: x,
      }}
    />
  );
}

function SuspenseRects({
  suspenseID,
}: {
  suspenseID: SuspenseNode['id'],
}): React$Node {
  const store = useContext(StoreContext);
  const treeDispatch = useContext(TreeDispatcherContext);
  const suspenseTreeDispatch = useContext(SuspenseTreeDispatcherContext);

  const {inspectedElementID} = useContext(TreeStateContext);

  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const suspense = store.getSuspenseByID(suspenseID);
  if (suspense === null) {
    // getSuspenseByID will have already warned
    return null;
  }

  function handleClick(event: SyntheticMouseEvent) {
    if (event.defaultPrevented) {
      // Already clicked on an inner rect
      return;
    }
    event.preventDefault();
    treeDispatch({type: 'SELECT_ELEMENT_BY_ID', payload: suspenseID});
    suspenseTreeDispatch({
      type: 'SET_SUSPENSE_LINEAGE',
      payload: suspenseID,
    });
  }

  function handlePointerOver(event: SyntheticPointerEvent) {
    if (event.defaultPrevented) {
      // Already hovered an inner rect
      return;
    }
    event.preventDefault();
    highlightHostInstance(suspenseID);
  }

  function handlePointerLeave(event: SyntheticPointerEvent) {
    if (event.defaultPrevented) {
      // Already hovered an inner rect
      return;
    }
    event.preventDefault();
    clearHighlightHostInstance();
  }

  // TODO: Use the nearest Suspense boundary
  const selected = inspectedElementID === suspenseID;

  const boundingBox = getBoundingBox(suspense.rects);

  return (
    <ScaledRect rect={boundingBox} className={styles.SuspenseRectsBoundary}>
      <ViewBox.Provider value={boundingBox}>
        {suspense.rects !== null &&
          suspense.rects.map((rect, index) => {
            return (
              <ScaledRect
                key={index}
                className={styles.SuspenseRectsRect}
                rect={rect}
                data-highlighted={selected}
                onClick={handleClick}
                onPointerOver={handlePointerOver}
                onPointerLeave={handlePointerLeave}
                // Reach-UI tooltip will go out of bounds of parent scroll container.
                title={suspense.name}
              />
            );
          })}
        {suspense.children.length > 0 && (
          <ScaledRect
            className={styles.SuspenseRectsBoundaryChildren}
            rect={boundingBox}>
            {suspense.children.map(childID => {
              return <SuspenseRects key={childID} suspenseID={childID} />;
            })}
          </ScaledRect>
        )}
      </ViewBox.Provider>
    </ScaledRect>
  );
}

function getBoundingBox(rects: $ReadOnlyArray<Rect> | null): Rect {
  if (rects === null || rects.length === 0) {
    return {x: 0, y: 0, width: 0, height: 0};
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function getDocumentBoundingRect(
  store: Store,
  roots: $ReadOnlyArray<SuspenseNode['id']>,
): Rect {
  if (roots.length === 0) {
    return {x: 0, y: 0, width: 0, height: 0};
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < roots.length; i++) {
    const rootID = roots[i];
    const root = store.getSuspenseByID(rootID);
    if (root === null) {
      continue;
    }

    const rects = root.rects;
    if (rects === null) {
      continue;
    }
    for (let j = 0; j < rects.length; j++) {
      const rect = rects[j];
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }
  }

  if (minX === Number.POSITIVE_INFINITY) {
    // No rects found, return empty rect
    return {x: 0, y: 0, width: 0, height: 0};
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function SuspenseRectsShell({
  rootID,
}: {
  rootID: SuspenseNode['id'],
}): React$Node {
  const store = useContext(StoreContext);
  const root = store.getSuspenseByID(rootID);
  if (root === null) {
    // getSuspenseByID will have already warned
    return null;
  }

  return root.children.map(childID => {
    return <SuspenseRects key={childID} suspenseID={childID} />;
  });
}

const ViewBox = createContext<Rect>((null: any));

function SuspenseRectsContainer(): React$Node {
  const store = useContext(StoreContext);
  // TODO: This relies on a full re-render of all children when the Suspense tree changes.
  const {roots} = useContext(SuspenseTreeStateContext);

  const boundingBox = getDocumentBoundingRect(store, roots);

  const boundingBoxWidth = boundingBox.width;
  const heightScale =
    boundingBoxWidth === 0 ? 1 : boundingBox.height / boundingBoxWidth;
  // Scales the inspected document to fit into the available width
  const width = '100%';
  const aspectRatio = `1 / ${heightScale}`;

  return (
    <div className={styles.SuspenseRectsContainer}>
      <ViewBox.Provider value={boundingBox}>
        <div
          className={styles.SuspenseRectsViewBox}
          style={{aspectRatio, width}}>
          {roots.map(rootID => {
            return <SuspenseRectsShell key={rootID} rootID={rootID} />;
          })}
        </div>
      </ViewBox.Provider>
    </div>
  );
}

export default SuspenseRectsContainer;

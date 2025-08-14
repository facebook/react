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

import * as React from 'react';
import {useContext} from 'react';
import {
  TreeDispatcherContext,
  TreeStateContext,
} from '../Components/TreeContext';
import {StoreContext} from '../context';
import {useHighlightHostInstance} from '../hooks';
import styles from './SuspenseRects.css';
import {SuspenseTreeStateContext} from './SuspenseTreeContext';

function SuspenseRect({rect}: {rect: Rect}): React$Node {
  return (
    <rect
      className={styles.SuspenseRect}
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
    />
  );
}

function SuspenseRects({
  suspenseID,
}: {
  suspenseID: SuspenseNode['id'],
}): React$Node {
  const dispatch = useContext(TreeDispatcherContext);
  const store = useContext(StoreContext);

  const {inspectedElementID} = useContext(TreeStateContext);

  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const suspense = store.getSuspenseByID(suspenseID);
  if (suspense === null) {
    console.warn(`<Element> Could not find suspense node id ${suspenseID}`);
    return null;
  }

  function handleClick(event: SyntheticMouseEvent<>) {
    if (event.defaultPrevented) {
      // Already clicked on an inner rect
      return;
    }
    event.preventDefault();
    dispatch({type: 'SELECT_ELEMENT_BY_ID', payload: suspenseID});
  }

  function handlePointerOver(event: SyntheticPointerEvent<>) {
    if (event.defaultPrevented) {
      // Already hovered an inner rect
      return;
    }
    event.preventDefault();
    highlightHostInstance(suspenseID);
  }

  function handlePointerLeave(event: SyntheticPointerEvent<>) {
    if (event.defaultPrevented) {
      // Already hovered an inner rect
      return;
    }
    event.preventDefault();
    clearHighlightHostInstance();
  }

  // TODO: Use the nearest Suspense boundary
  const selected = inspectedElementID === suspenseID;

  return (
    <g
      data-highlighted={selected}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerLeave={handlePointerLeave}>
      <title>{suspense.name}</title>
      {suspense.rects !== null &&
        suspense.rects.map((rect, index) => {
          return <SuspenseRect key={index} rect={rect} />;
        })}
      {suspense.children.map(childID => {
        return <SuspenseRects key={childID} suspenseID={childID} />;
      })}
    </g>
  );
}

function getDocumentBoundingRect(
  store: Store,
  shells: $ReadOnlyArray<SuspenseNode['id']>,
): Rect {
  if (shells.length === 0) {
    return {x: 0, y: 0, width: 0, height: 0};
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < shells.length; i++) {
    const shellID = shells[i];
    const shell = store.getSuspenseByID(shellID);
    if (shell === null) {
      continue;
    }

    const rects = shell.rects;
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
  shellID,
}: {
  shellID: SuspenseNode['id'],
}): React$Node {
  const store = useContext(StoreContext);
  const shell = store.getSuspenseByID(shellID);
  if (shell === null) {
    console.warn(`<Element> Could not find suspense node id ${shellID}`);
    return null;
  }

  return (
    <g>
      {shell.children.map(childID => {
        return <SuspenseRects key={childID} suspenseID={childID} />;
      })}
    </g>
  );
}

function SuspenseRectsContainer(): React$Node {
  const store = useContext(StoreContext);
  // TODO: This relies on a full re-render of all children when the Suspense tree changes.
  const {shells} = useContext(SuspenseTreeStateContext);

  const boundingRect = getDocumentBoundingRect(store, shells);

  const width = '100%';
  const boundingRectWidth = boundingRect.width;
  const height =
    (boundingRectWidth === 0 ? 0 : boundingRect.height / boundingRect.width) *
      100 +
    '%';

  return (
    <div className={styles.SuspenseRectsContainer}>
      <svg
        style={{width, height}}
        viewBox={`${boundingRect.x} ${boundingRect.y} ${boundingRect.width} ${boundingRect.height}`}>
        {shells.map(shellID => {
          return <SuspenseRectsShell key={shellID} shellID={shellID} />;
        })}
      </svg>
    </div>
  );
}

export default SuspenseRectsContainer;

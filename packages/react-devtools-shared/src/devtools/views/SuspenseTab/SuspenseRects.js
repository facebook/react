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
import {getClassNameForEnvironment} from './SuspenseEnvironmentColors.js';

function ScaledRect({
  className,
  rect,
  visible,
  suspended,
  selected,
  hovered,
  adjust,
  ...props
}: {
  className: string,
  rect: Rect,
  visible: boolean,
  suspended: boolean,
  selected?: boolean,
  hovered?: boolean,
  adjust?: boolean,
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
      data-visible={visible}
      data-suspended={suspended}
      data-selected={selected}
      data-hovered={hovered}
      style={{
        // Shrink one pixel so that the bottom outline will line up with the top outline of the next one.
        width: adjust ? 'calc(' + width + ' - 1px)' : width,
        height: adjust ? 'calc(' + height + ' - 1px)' : height,
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
  const {uniqueSuspendersOnly, timeline, hoveredTimelineIndex} = useContext(
    SuspenseTreeStateContext,
  );

  const {inspectedElementID} = useContext(TreeStateContext);

  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const suspense = store.getSuspenseByID(suspenseID);
  if (suspense === null) {
    // getSuspenseByID will have already warned
    return null;
  }
  const visible = suspense.hasUniqueSuspenders || !uniqueSuspendersOnly;

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

  function handleDoubleClick(event: SyntheticMouseEvent) {
    if (event.defaultPrevented) {
      // Already clicked on an inner rect
      return;
    }
    event.preventDefault();
    suspenseTreeDispatch({
      type: 'TOGGLE_TIMELINE_FOR_ID',
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
    suspenseTreeDispatch({
      type: 'HOVER_TIMELINE_FOR_ID',
      payload: suspenseID,
    });
  }

  function handlePointerLeave(event: SyntheticPointerEvent) {
    if (event.defaultPrevented) {
      // Already hovered an inner rect
      return;
    }
    event.preventDefault();
    clearHighlightHostInstance();
    suspenseTreeDispatch({
      type: 'HOVER_TIMELINE_FOR_ID',
      payload: -1,
    });
  }

  // TODO: Use the nearest Suspense boundary
  const selected = inspectedElementID === suspenseID;

  const hovered =
    hoveredTimelineIndex > -1 &&
    timeline[hoveredTimelineIndex].id === suspenseID;

  let environment: null | string = null;
  for (let i = 0; i < timeline.length; i++) {
    const timelineStep = timeline[i];
    if (timelineStep.id === suspenseID) {
      environment = timelineStep.environment;
      break;
    }
  }

  const boundingBox = getBoundingBox(suspense.rects);

  return (
    <ScaledRect
      rect={boundingBox}
      className={
        styles.SuspenseRectsBoundary +
        ' ' +
        getClassNameForEnvironment(environment)
      }
      visible={visible}
      selected={selected}
      suspended={suspense.isSuspended}
      hovered={hovered}>
      <ViewBox.Provider value={boundingBox}>
        {visible &&
          suspense.rects !== null &&
          suspense.rects.map((rect, index) => {
            return (
              <ScaledRect
                key={index}
                className={styles.SuspenseRectsRect}
                rect={rect}
                adjust={true}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
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
        {selected ? (
          <ScaledRect
            className={styles.SuspenseRectOutline}
            rect={boundingBox}
            adjust={true}
          />
        ) : null}
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

function computeBoundingRectRecursively(
  store: Store,
  node: SuspenseNode,
  bounds: {
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  },
): void {
  const rects = node.rects;
  if (rects !== null) {
    for (let j = 0; j < rects.length; j++) {
      const rect = rects[j];
      if (rect.x < bounds.minX) {
        bounds.minX = rect.x;
      }
      if (rect.x + rect.width > bounds.maxX) {
        bounds.maxX = rect.x + rect.width;
      }
      if (rect.y < bounds.minY) {
        bounds.minY = rect.y;
      }
      if (rect.y + rect.height > bounds.maxY) {
        bounds.maxY = rect.y + rect.height;
      }
    }
  }
  for (let i = 0; i < node.children.length; i++) {
    const child = store.getSuspenseByID(node.children[i]);
    if (child !== null) {
      computeBoundingRectRecursively(store, child, bounds);
    }
  }
}

function getDocumentBoundingRect(
  store: Store,
  roots: $ReadOnlyArray<SuspenseNode['id']>,
): Rect {
  if (roots.length === 0) {
    return {x: 0, y: 0, width: 0, height: 0};
  }

  const bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (let i = 0; i < roots.length; i++) {
    const rootID = roots[i];
    const root = store.getSuspenseByID(rootID);
    if (root === null) {
      continue;
    }
    computeBoundingRectRecursively(store, root, bounds);
  }

  if (bounds.minX === Number.POSITIVE_INFINITY) {
    // No rects found, return empty rect
    return {x: 0, y: 0, width: 0, height: 0};
  }

  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

function SuspenseRectsRoot({rootID}: {rootID: SuspenseNode['id']}): React$Node {
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
  const {inspectedElementID} = useContext(TreeStateContext);
  const treeDispatch = useContext(TreeDispatcherContext);
  const suspenseTreeDispatch = useContext(SuspenseTreeDispatcherContext);
  // TODO: This relies on a full re-render of all children when the Suspense tree changes.
  const {roots, timeline, hoveredTimelineIndex, uniqueSuspendersOnly} =
    useContext(SuspenseTreeStateContext);

  // TODO: bbox does not consider uniqueSuspendersOnly filter
  const boundingBox = getDocumentBoundingRect(store, roots);

  const boundingBoxWidth = boundingBox.width;
  const heightScale =
    boundingBoxWidth === 0 ? 1 : boundingBox.height / boundingBoxWidth;
  // Scales the inspected document to fit into the available width
  const width = '100%';
  const aspectRatio = `1 / ${heightScale}`;

  function handleClick(event: SyntheticMouseEvent) {
    if (event.defaultPrevented) {
      // Already clicked on an inner rect
      return;
    }
    if (roots.length === 0) {
      // Nothing to select
      return;
    }
    const arbitraryRootID = roots[0];

    event.preventDefault();
    treeDispatch({type: 'SELECT_ELEMENT_BY_ID', payload: arbitraryRootID});
    suspenseTreeDispatch({
      type: 'SET_SUSPENSE_LINEAGE',
      payload: arbitraryRootID,
    });
  }

  function handleDoubleClick(event: SyntheticMouseEvent) {
    if (event.defaultPrevented) {
      // Already clicked on an inner rect
      return;
    }
    event.preventDefault();
    suspenseTreeDispatch({
      type: 'SUSPENSE_SET_TIMELINE_INDEX',
      payload: 0,
    });
  }

  const isRootSelected = roots.includes(inspectedElementID);
  const isRootHovered = hoveredTimelineIndex === 0;

  let hasRootSuspenders = false;
  if (!uniqueSuspendersOnly) {
    hasRootSuspenders = true;
  } else {
    for (let i = 0; i < roots.length; i++) {
      const rootID = roots[i];
      const root = store.getSuspenseByID(rootID);
      if (root !== null && root.hasUniqueSuspenders) {
        hasRootSuspenders = true;
        break;
      }
    }
  }

  const rootEnvironment =
    timeline.length === 0 ? null : timeline[0].environment;

  return (
    <div
      className={
        styles.SuspenseRectsContainer +
        (hasRootSuspenders ? ' ' + styles.SuspenseRectsRoot : '') +
        ' ' +
        getClassNameForEnvironment(rootEnvironment)
      }
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-highlighted={isRootSelected}
      data-hovered={isRootHovered}>
      <ViewBox.Provider value={boundingBox}>
        <div
          className={styles.SuspenseRectsViewBox}
          style={{aspectRatio, width}}>
          {roots.map(rootID => {
            return <SuspenseRectsRoot key={rootID} rootID={rootID} />;
          })}
        </div>
      </ViewBox.Provider>
    </div>
  );
}

export default SuspenseRectsContainer;

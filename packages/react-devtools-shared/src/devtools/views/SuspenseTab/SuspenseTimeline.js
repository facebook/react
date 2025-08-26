/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Element, SuspenseNode} from '../../../frontend/types';
import type Store from '../../store';

import * as React from 'react';
import {
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {BridgeContext, StoreContext} from '../context';
import {TreeDispatcherContext} from '../Components/TreeContext';
import {useHighlightHostInstance} from '../hooks';
import {SuspenseTreeStateContext} from './SuspenseTreeContext';
import styles from './SuspenseTimeline.css';
import typeof {
  SyntheticEvent,
  SyntheticPointerEvent,
} from 'react-dom-bindings/src/events/SyntheticEvent';

// TODO: This returns the roots which would mean we attempt to suspend the shell.
// Suspending the shell is currently not supported and we don't have a good view
// for inspecting the root. But we probably should?
function getDocumentOrderSuspense(
  store: Store,
  roots: $ReadOnlyArray<Element['id']>,
): Array<SuspenseNode> {
  const suspenseTreeList: SuspenseNode[] = [];
  for (let i = 0; i < roots.length; i++) {
    const root = store.getElementByID(roots[i]);
    if (root === null) {
      continue;
    }
    const suspense = store.getSuspenseByID(root.id);
    if (suspense !== null) {
      const stack = [suspense];
      while (stack.length > 0) {
        const current = stack.pop();
        if (current === undefined) {
          continue;
        }
        suspenseTreeList.push(current);
        // Add children in reverse order to maintain document order
        for (let j = current.children.length - 1; j >= 0; j--) {
          const childSuspense = store.getSuspenseByID(current.children[j]);
          if (childSuspense !== null) {
            stack.push(childSuspense);
          }
        }
      }
    }
  }

  return suspenseTreeList;
}

export default function SuspenseTimeline(): React$Node {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const dispatch = useContext(TreeDispatcherContext);
  const {shells} = useContext(SuspenseTreeStateContext);

  const timeline = useMemo(() => {
    return getDocumentOrderSuspense(store, shells);
  }, [store, shells]);

  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const inputRef = useRef<HTMLElement | null>(null);
  const inputBBox = useRef<ClientRect | null>(null);
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (input === null) {
      throw new Error('Expected an input HTML element to be present.');
    }

    inputBBox.current = input.getBoundingClientRect();
    const observer = new ResizeObserver(entries => {
      inputBBox.current = input.getBoundingClientRect();
    });
    observer.observe(input);
    return () => {
      inputBBox.current = null;
      observer.disconnect();
    };
  }, []);

  const min = 0;
  const max = timeline.length > 0 ? timeline.length - 1 : 0;

  const [value, setValue] = useState(max);
  if (value > max) {
    // TODO: Handle timeline changes
    setValue(max);
  }

  const markersID = useId();
  const markers: React.Node[] = useMemo(() => {
    return timeline.map((suspense, index) => {
      const takesUpSpace =
        suspense.rects !== null &&
        suspense.rects.some(rect => {
          return rect.width > 0 && rect.height > 0;
        });

      return takesUpSpace ? (
        <option
          key={suspense.id}
          className={
            index === value ? styles.SuspenseTimelineActiveMarker : undefined
          }
          value={index}>
          #{index + 1}
        </option>
      ) : (
        <option key={suspense.id} />
      );
    });
  }, [timeline, value]);

  function handleChange(event: SyntheticEvent) {
    const pendingValue = +event.currentTarget.value;
    for (let i = 0; i < timeline.length; i++) {
      const forceFallback = i > pendingValue;
      const suspense = timeline[i];
      const elementID = suspense.id;
      const rendererID = store.getRendererIDForElement(elementID);
      if (rendererID === null) {
        // TODO: Handle disconnected elements.
        console.warn(
          `No renderer ID found for element ${elementID} in suspense timeline.`,
        );
      } else {
        bridge.send('overrideSuspense', {
          id: elementID,
          rendererID,
          forceFallback,
        });
      }
    }

    const suspense = timeline[pendingValue];
    const elementID = suspense.id;
    highlightHostInstance(elementID);
    dispatch({type: 'SELECT_ELEMENT_BY_ID', payload: elementID});
    setValue(pendingValue);
  }

  function handleBlur() {
    clearHighlightHostInstance();
  }

  function handleFocus() {
    const suspense = timeline[value];

    highlightHostInstance(suspense.id);
  }

  function handlePointerMove(event: SyntheticPointerEvent) {
    const bbox = inputBBox.current;
    if (bbox === null) {
      throw new Error('Bounding box of slider is unknown.');
    }

    const hoveredValue = Math.max(
      min,
      Math.min(
        Math.round(
          min + ((event.clientX - bbox.left) / bbox.width) * (max - min),
        ),
        max,
      ),
    );
    const suspense = timeline[hoveredValue];
    if (suspense === undefined) {
      throw new Error(
        `Suspense node not found for value ${hoveredValue} in timeline when on ${event.clientX} in bounding box ${JSON.stringify(bbox)}.`,
      );
    }
    highlightHostInstance(suspense.id);
  }

  return (
    <div>
      <input
        className={styles.SuspenseTimelineSlider}
        type="range"
        min={min}
        max={max}
        list={markersID}
        value={value}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        onPointerMove={handlePointerMove}
        onPointerUp={clearHighlightHostInstance}
        ref={inputRef}
      />
      <datalist id={markersID} className={styles.SuspenseTimelineMarkers}>
        {markers}
      </datalist>
    </div>
  );
}

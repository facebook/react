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
import {useContext, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {BridgeContext, StoreContext} from '../context';
import {TreeDispatcherContext} from '../Components/TreeContext';
import {useHighlightHostInstance} from '../hooks';
import {SuspenseTreeStateContext} from './SuspenseTreeContext';
import styles from './SuspenseTimeline.css';
import typeof {
  SyntheticEvent,
  SyntheticPointerEvent,
} from 'react-dom-bindings/src/events/SyntheticEvent';

function getSuspendableDocumentOrderSuspense(
  store: Store,
  rootID: Element['id'] | void,
): Array<SuspenseNode> {
  if (rootID === undefined) {
    return [];
  }
  const root = store.getElementByID(rootID);
  if (root === null) {
    return [];
  }
  if (!store.supportsTogglingSuspense(root.id)) {
    return [];
  }
  const suspenseTreeList: SuspenseNode[] = [];
  const suspense = store.getSuspenseByID(root.id);
  if (suspense !== null) {
    const stack = [suspense];
    while (stack.length > 0) {
      const current = stack.pop();
      if (current === undefined) {
        continue;
      }
      // Don't include the root. It's currently not supported to suspend the shell.
      if (current !== suspense) {
        suspenseTreeList.push(current);
      }
      // Add children in reverse order to maintain document order
      for (let j = current.children.length - 1; j >= 0; j--) {
        const childSuspense = store.getSuspenseByID(current.children[j]);
        if (childSuspense !== null) {
          stack.push(childSuspense);
        }
      }
    }
  }

  return suspenseTreeList;
}

function SuspenseTimelineInput({rootID}: {rootID: Element['id'] | void}) {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const dispatch = useContext(TreeDispatcherContext);
  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const timeline = useMemo(() => {
    return getSuspendableDocumentOrderSuspense(store, rootID);
  }, [store, rootID]);

  const inputRef = useRef<HTMLElement | null>(null);
  const inputBBox = useRef<ClientRect | null>(null);
  useLayoutEffect(() => {
    if (timeline.length === 0) {
      return;
    }

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
  }, [timeline.length]);

  const min = 0;
  const max = timeline.length > 0 ? timeline.length - 1 : 0;
  const [value, setValue] = useState(max);

  if (value > max) {
    // TODO: Handle timeline changes
    setValue(max);
  }

  if (rootID === undefined) {
    return <div className={styles.SuspenseTimelineInput}>Root not found.</div>;
  }

  if (!store.supportsTogglingSuspense(rootID)) {
    return (
      <div className={styles.SuspenseTimelineInput}>
        Can't step through Suspense in production apps.
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className={styles.SuspenseTimelineInput}>
        Root contains no Suspense nodes.
      </div>
    );
  }

  function handleChange(event: SyntheticEvent) {
    if (rootID === undefined) {
      return;
    }
    const rendererID = store.getRendererIDForElement(rootID);
    if (rendererID === null) {
      console.error(
        `No renderer ID found for root element ${rootID} in suspense timeline.`,
      );
      return;
    }

    const pendingValue = +event.currentTarget.value;
    const suspendedSet = timeline
      .slice(pendingValue + 1)
      .map(suspense => suspense.id);

    bridge.send('overrideSuspenseMilestone', {
      rendererID,
      rootID,
      suspendedSet,
    });

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
    <>
      <div>
        {value}/{max}
      </div>
      <div className={styles.SuspenseTimelineInput}>
        <input
          className={styles.SuspenseTimelineSlider}
          type="range"
          min={min}
          max={max}
          value={value}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onPointerMove={handlePointerMove}
          onPointerUp={clearHighlightHostInstance}
          ref={inputRef}
        />
      </div>
    </>
  );
}

export default function SuspenseTimeline(): React$Node {
  const store = useContext(StoreContext);
  const {shells} = useContext(SuspenseTreeStateContext);

  const defaultSelectedRootID = shells.find(rootID => {
    const suspense = store.getSuspenseByID(rootID);
    return (
      store.supportsTogglingSuspense(rootID) &&
      suspense !== null &&
      suspense.children.length > 1
    );
  });
  const [selectedRootID, setSelectedRootID] = useState(defaultSelectedRootID);

  if (selectedRootID === undefined && defaultSelectedRootID !== undefined) {
    setSelectedRootID(defaultSelectedRootID);
  }

  function handleChange(event: SyntheticEvent) {
    const newRootID = +event.currentTarget.value;
    // TODO: scrollIntoView both suspense rects and host instance.
    setSelectedRootID(newRootID);
  }

  return (
    <div className={styles.SuspenseTimelineContainer}>
      <SuspenseTimelineInput key={selectedRootID} rootID={selectedRootID} />
      {shells.length > 0 && (
        <select
          aria-label="Select Suspense Root"
          className={styles.SuspenseTimelineRootSwitcher}
          onChange={handleChange}>
          {shells.map(rootID => {
            // TODO: Use name
            const name = '#' + rootID;
            // TODO: Highlight host on hover
            return (
              <option
                key={rootID}
                selected={rootID === selectedRootID}
                value={rootID}>
                {name}
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
}

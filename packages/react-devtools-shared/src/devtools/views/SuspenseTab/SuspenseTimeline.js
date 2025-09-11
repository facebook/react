/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext, useLayoutEffect, useRef} from 'react';
import {BridgeContext, StoreContext} from '../context';
import {TreeDispatcherContext} from '../Components/TreeContext';
import Tooltip from '../Components/reach-ui/tooltip';
import {useHighlightHostInstance} from '../hooks';
import {
  SuspenseTreeDispatcherContext,
  SuspenseTreeStateContext,
} from './SuspenseTreeContext';
import styles from './SuspenseTimeline.css';
import typeof {
  SyntheticEvent,
  SyntheticPointerEvent,
} from 'react-dom-bindings/src/events/SyntheticEvent';

function SuspenseTimelineInput() {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const treeDispatch = useContext(TreeDispatcherContext);
  const suspenseTreeDispatch = useContext(SuspenseTreeDispatcherContext);
  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const {
    selectedRootID: rootID,
    timeline,
    timelineIndex,
    uniqueSuspendersOnly,
  } = useContext(SuspenseTreeStateContext);

  function handleToggleUniqueSuspenders(event: SyntheticEvent) {
    const nextUniqueSuspendersOnly = (event.currentTarget as HTMLInputElement)
      .checked;
    const nextTimeline =
      rootID === null
        ? []
        : // TODO: Handle different timeline modes (e.g. random order)
          store.getSuspendableDocumentOrderSuspense(
            rootID,
            nextUniqueSuspendersOnly,
          );
    suspenseTreeDispatch({
      type: 'SET_SUSPENSE_TIMELINE',
      payload: [nextTimeline, null, nextUniqueSuspendersOnly],
    });
  }

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

  if (rootID === null) {
    return (
      <div className={styles.SuspenseTimelineInput}>No root selected.</div>
    );
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

  function switchSuspenseNode(nextTimelineIndex: number) {
    const nextSelectedSuspenseID = timeline[nextTimelineIndex];
    highlightHostInstance(nextSelectedSuspenseID);
    treeDispatch({
      type: 'SELECT_ELEMENT_BY_ID',
      payload: nextSelectedSuspenseID,
    });
    suspenseTreeDispatch({
      type: 'SUSPENSE_SET_TIMELINE_INDEX',
      payload: nextTimelineIndex,
    });
  }

  function handleChange(event: SyntheticEvent) {
    if (rootID === null) {
      return;
    }
    const rendererID = store.getRendererIDForElement(rootID);
    if (rendererID === null) {
      console.error(
        `No renderer ID found for root element ${rootID} in suspense timeline.`,
      );
      return;
    }

    const pendingTimelineIndex = +event.currentTarget.value;
    const suspendedSet = timeline.slice(pendingTimelineIndex);

    bridge.send('overrideSuspenseMilestone', {
      rendererID,
      rootID,
      suspendedSet,
    });

    switchSuspenseNode(pendingTimelineIndex);
  }

  function handleBlur() {
    clearHighlightHostInstance();
  }

  function handleFocus() {
    switchSuspenseNode(timelineIndex);
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
    const suspenseID = timeline[hoveredValue];
    if (suspenseID === undefined) {
      throw new Error(
        `Suspense node not found for value ${hoveredValue} in timeline when on ${event.clientX} in bounding box ${JSON.stringify(bbox)}.`,
      );
    }
    highlightHostInstance(suspenseID);
  }

  return (
    <>
      {timelineIndex}/{max}
      <div className={styles.SuspenseTimelineInput}>
        <input
          className={styles.SuspenseTimelineSlider}
          type="range"
          min={min}
          max={max}
          value={timelineIndex}
          onBlur={handleBlur}
          onChange={handleChange}
          onFocus={handleFocus}
          onPointerMove={handlePointerMove}
          onPointerUp={clearHighlightHostInstance}
          ref={inputRef}
        />
      </div>
      <Tooltip label="Only include boundaries with unique suspenders">
        <input
          checked={uniqueSuspendersOnly}
          type="checkbox"
          onChange={handleToggleUniqueSuspenders}
        />
      </Tooltip>
    </>
  );
}

export default function SuspenseTimeline(): React$Node {
  const store = useContext(StoreContext);
  const {roots, selectedRootID, uniqueSuspendersOnly} = useContext(
    SuspenseTreeStateContext,
  );
  const treeDispatch = useContext(TreeDispatcherContext);
  const suspenseTreeDispatch = useContext(SuspenseTreeDispatcherContext);

  function handleChange(event: SyntheticEvent) {
    const newRootID = +event.currentTarget.value;
    // TODO: scrollIntoView both suspense rects and host instance.
    const nextTimeline = store.getSuspendableDocumentOrderSuspense(
      newRootID,
      uniqueSuspendersOnly,
    );
    suspenseTreeDispatch({
      type: 'SET_SUSPENSE_TIMELINE',
      payload: [nextTimeline, newRootID, uniqueSuspendersOnly],
    });
    if (nextTimeline.length > 0) {
      const milestone = nextTimeline[nextTimeline.length - 1];
      treeDispatch({type: 'SELECT_ELEMENT_BY_ID', payload: milestone});
    }
  }

  return (
    <div className={styles.SuspenseTimelineContainer}>
      <SuspenseTimelineInput key={selectedRootID} />
      {roots.length > 0 && (
        <select
          aria-label="Select Suspense Root"
          className={styles.SuspenseTimelineRootSwitcher}
          onChange={handleChange}
          value={selectedRootID === null ? -1 : selectedRootID}>
          <option disabled={true} value={-1}>
            ----
          </option>
          {roots.map(rootID => {
            // TODO: Use name
            const name = '#' + rootID;
            // TODO: Highlight host on hover
            return (
              <option key={rootID} value={rootID}>
                {name}
              </option>
            );
          })}
        </select>
      )}
    </div>
  );
}

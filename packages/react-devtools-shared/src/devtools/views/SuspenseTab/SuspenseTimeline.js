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

  const {timeline, timelineIndex, uniqueSuspendersOnly} = useContext(
    SuspenseTreeStateContext,
  );

  function handleToggleUniqueSuspenders(event: SyntheticEvent) {
    const nextUniqueSuspendersOnly = (event.currentTarget as HTMLInputElement)
      .checked;
    const nextTimeline = store.getSuspendableDocumentOrderSuspense(
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

  if (timeline.length === 0) {
    return (
      <div className={styles.SuspenseTimelineInput}>
        Timeline contains no suspendable boundaries.
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
    const pendingTimelineIndex = +event.currentTarget.value;
    const suspendedSet = timeline.slice(pendingTimelineIndex);

    bridge.send('overrideSuspenseMilestone', {
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
  return (
    <div className={styles.SuspenseTimelineContainer}>
      <SuspenseTimelineInput />
    </div>
  );
}

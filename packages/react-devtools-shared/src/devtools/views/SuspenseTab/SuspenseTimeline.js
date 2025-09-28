/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext, useLayoutEffect, useEffect, useRef} from 'react';
import {BridgeContext, StoreContext} from '../context';
import {TreeDispatcherContext} from '../Components/TreeContext';
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
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';

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
    playing,
  } = useContext(SuspenseTreeStateContext);

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
    const pendingTimelineIndex = +event.currentTarget.value;
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

  function skipPrevious() {
    const nextSelectedSuspenseID = timeline[timelineIndex - 1];
    highlightHostInstance(nextSelectedSuspenseID);
    treeDispatch({
      type: 'SELECT_ELEMENT_BY_ID',
      payload: nextSelectedSuspenseID,
    });
    suspenseTreeDispatch({
      type: 'SUSPENSE_SKIP_TIMELINE_INDEX',
      payload: false,
    });
  }

  function skipForward() {
    const nextSelectedSuspenseID = timeline[timelineIndex + 1];
    highlightHostInstance(nextSelectedSuspenseID);
    treeDispatch({
      type: 'SELECT_ELEMENT_BY_ID',
      payload: nextSelectedSuspenseID,
    });
    suspenseTreeDispatch({
      type: 'SUSPENSE_SKIP_TIMELINE_INDEX',
      payload: true,
    });
  }

  function togglePlaying() {
    suspenseTreeDispatch({
      type: 'SUSPENSE_PLAY_PAUSE',
      payload: 'toggle',
    });
  }

  // TODO: useEffectEvent here once it's supported in all versions DevTools supports.
  // For now we just exclude it from deps since we don't lint those anyway.
  function changeTimelineIndex(newIndex: number) {
    // Synchronize timeline index with what is resuspended.
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
    // We suspend everything after the current selection. The root isn't showing
    // anything suspended in the root. The step after that should have one less
    // thing suspended. I.e. the first suspense boundary should be unsuspended
    // when it's selected. This also lets you show everything in the last step.
    const suspendedSet = timeline.slice(timelineIndex + 1);
    bridge.send('overrideSuspenseMilestone', {
      rendererID,
      rootID,
      suspendedSet,
    });
  }

  useEffect(() => {
    changeTimelineIndex(timelineIndex);
  }, [timelineIndex]);

  useEffect(() => {
    if (!playing) {
      return undefined;
    }
    // While playing, advance one step every second.
    const PLAY_SPEED_INTERVAL = 1000;
    const timer = setInterval(() => {
      suspenseTreeDispatch({
        type: 'SUSPENSE_PLAY_TICK',
      });
    }, PLAY_SPEED_INTERVAL);
    return () => {
      clearInterval(timer);
    };
  }, [playing]);

  return (
    <>
      <Button
        disabled={timelineIndex === 0}
        title={'Previous'}
        onClick={skipPrevious}>
        <ButtonIcon type={'skip-previous'} />
      </Button>
      <Button
        disabled={max === 0 && !playing}
        title={playing ? 'Pause' : 'Play'}
        onClick={togglePlaying}>
        <ButtonIcon type={playing ? 'pause' : 'play'} />
      </Button>
      <Button
        disabled={timelineIndex === max}
        title={'Next'}
        onClick={skipForward}>
        <ButtonIcon type={'skip-next'} />
      </Button>
      <div
        className={styles.SuspenseTimelineInput}
        title={timelineIndex + '/' + max}>
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
    </>
  );
}

export default function SuspenseTimeline(): React$Node {
  const {selectedRootID} = useContext(SuspenseTreeStateContext);
  return (
    <div className={styles.SuspenseTimelineContainer}>
      <SuspenseTimelineInput key={selectedRootID} />
    </div>
  );
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {
  importFromChromeTimeline,
  Flamechart as SpeedscopeFlamechart,
} from '@elg/speedscope';
import type {TimelineEvent} from '@elg/speedscope';
import type {
  Milliseconds,
  BatchUID,
  Flamechart,
  ReactLane,
  ReactMeasureType,
  ReactProfilerData,
} from '../types';

import {REACT_TOTAL_NUM_LANES} from '../constants';
import InvalidProfileError from './InvalidProfileError';

type MeasureStackElement = {|
  type: ReactMeasureType,
  depth: number,
  index: number,
  startTime: Milliseconds,
  stopTime?: Milliseconds,
|};

type ProcessorState = {|
  nextRenderShouldGenerateNewBatchID: boolean,
  batchUID: BatchUID,
  uidCounter: BatchUID,
  measureStack: MeasureStackElement[],
|};

// Exported for tests
export function getLanesFromTransportDecimalBitmask(
  laneBitmaskString: string,
): ReactLane[] {
  const laneBitmask = parseInt(laneBitmaskString, 10);

  // As negative numbers are stored in two's complement format, our bitmask
  // checks will be thrown off by them.
  if (laneBitmask < 0) {
    return [];
  }

  const lanes = [];
  let powersOfTwo = 0;
  while (powersOfTwo <= REACT_TOTAL_NUM_LANES) {
    if ((1 << powersOfTwo) & laneBitmask) {
      lanes.push(powersOfTwo);
    }
    powersOfTwo++;
  }
  return lanes;
}

function getLastType(stack: $PropertyType<ProcessorState, 'measureStack'>) {
  if (stack.length > 0) {
    const {type} = stack[stack.length - 1];
    return type;
  }
  return null;
}

function getDepth(stack: $PropertyType<ProcessorState, 'measureStack'>) {
  if (stack.length > 0) {
    const {depth, type} = stack[stack.length - 1];
    return type === 'render-idle' ? depth : depth + 1;
  }
  return 0;
}

function markWorkStarted(
  type: ReactMeasureType,
  startTime: Milliseconds,
  lanes: ReactLane[],
  currentProfilerData: ReactProfilerData,
  state: ProcessorState,
) {
  const {batchUID, measureStack} = state;
  const index = currentProfilerData.measures.length;
  const depth = getDepth(measureStack);

  state.measureStack.push({depth, index, startTime, type});

  currentProfilerData.measures.push({
    type,
    batchUID,
    depth,
    lanes,
    timestamp: startTime,
    duration: 0,
  });
}

function markWorkCompleted(
  type: ReactMeasureType,
  stopTime: Milliseconds,
  currentProfilerData: ReactProfilerData,
  stack: $PropertyType<ProcessorState, 'measureStack'>,
) {
  if (stack.length === 0) {
    console.error(
      'Unexpected type "%s" completed at %sms while stack is empty.',
      type,
      stopTime,
    );
    // Ignore work "completion" user timing mark that doesn't complete anything
    return;
  }

  const last = stack[stack.length - 1];
  if (last.type !== type) {
    console.error(
      'Unexpected type "%s" completed at %sms before "%s" completed.',
      type,
      stopTime,
      last.type,
    );
  }

  const {index, startTime} = stack.pop();
  const measure = currentProfilerData.measures[index];
  if (!measure) {
    console.error('Could not find matching measure for type "%s".', type);
  }

  // $FlowFixMe This property should not be writable outside of this function.
  measure.duration = stopTime - startTime;
}

function throwIfIncomplete(
  type: ReactMeasureType,
  stack: $PropertyType<ProcessorState, 'measureStack'>,
) {
  const lastIndex = stack.length - 1;
  if (lastIndex >= 0) {
    const last = stack[lastIndex];
    if (last.stopTime === undefined && last.type === type) {
      throw new InvalidProfileError(
        `Unexpected type "${type}" started before "${last.type}" completed.`,
      );
    }
  }
}

function processTimelineEvent(
  event: TimelineEvent,
  /** Finalized profiler data up to `event`. May be mutated. */
  currentProfilerData: ReactProfilerData,
  /** Intermediate processor state. May be mutated. */
  state: ProcessorState,
) {
  const {cat, name, ts, ph} = event;
  if (cat !== 'blink.user_timing') {
    return;
  }

  const startTime = (ts - currentProfilerData.startTime) / 1000;

  // React Events - schedule
  if (name.startsWith('--schedule-render-')) {
    const [laneBitmaskString, ...splitComponentStack] = name
      .substr(18)
      .split('-');
    currentProfilerData.events.push({
      type: 'schedule-render',
      lanes: getLanesFromTransportDecimalBitmask(laneBitmaskString),
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
    });
  } else if (name.startsWith('--schedule-forced-update-')) {
    const [
      laneBitmaskString,
      componentName,
      ...splitComponentStack
    ] = name.substr(25).split('-');
    const isCascading = !!state.measureStack.find(
      ({type}) => type === 'commit',
    );
    currentProfilerData.events.push({
      type: 'schedule-force-update',
      lanes: getLanesFromTransportDecimalBitmask(laneBitmaskString),
      componentName,
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
      isCascading,
    });
  } else if (name.startsWith('--schedule-state-update-')) {
    const [
      laneBitmaskString,
      componentName,
      ...splitComponentStack
    ] = name.substr(24).split('-');
    const isCascading = !!state.measureStack.find(
      ({type}) => type === 'commit',
    );
    currentProfilerData.events.push({
      type: 'schedule-state-update',
      lanes: getLanesFromTransportDecimalBitmask(laneBitmaskString),
      componentName,
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
      isCascading,
    });
  } // eslint-disable-line brace-style

  // React Events - suspense
  else if (name.startsWith('--suspense-suspend-')) {
    const [id, componentName, ...splitComponentStack] = name
      .substr(19)
      .split('-');
    currentProfilerData.events.push({
      type: 'suspense-suspend',
      id,
      componentName,
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
    });
  } else if (name.startsWith('--suspense-resolved-')) {
    const [id, componentName, ...splitComponentStack] = name
      .substr(20)
      .split('-');
    currentProfilerData.events.push({
      type: 'suspense-resolved',
      id,
      componentName,
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
    });
  } else if (name.startsWith('--suspense-rejected-')) {
    const [id, componentName, ...splitComponentStack] = name
      .substr(20)
      .split('-');
    currentProfilerData.events.push({
      type: 'suspense-rejected',
      id,
      componentName,
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
    });
  } // eslint-disable-line brace-style

  // React Measures - render
  else if (name.startsWith('--render-start-')) {
    if (state.nextRenderShouldGenerateNewBatchID) {
      state.nextRenderShouldGenerateNewBatchID = false;
      state.batchUID = ((state.uidCounter++: any): BatchUID);
    }
    const laneBitmaskString = name.substr(15);
    const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
    throwIfIncomplete('render', state.measureStack);
    if (getLastType(state.measureStack) !== 'render-idle') {
      markWorkStarted(
        'render-idle',
        startTime,
        lanes,
        currentProfilerData,
        state,
      );
    }
    markWorkStarted('render', startTime, lanes, currentProfilerData, state);
  } else if (
    name.startsWith('--render-stop') ||
    name.startsWith('--render-yield')
  ) {
    markWorkCompleted(
      'render',
      startTime,
      currentProfilerData,
      state.measureStack,
    );
  } else if (name.startsWith('--render-cancel')) {
    state.nextRenderShouldGenerateNewBatchID = true;
    markWorkCompleted(
      'render',
      startTime,
      currentProfilerData,
      state.measureStack,
    );
    markWorkCompleted(
      'render-idle',
      startTime,
      currentProfilerData,
      state.measureStack,
    );
  } // eslint-disable-line brace-style

  // React Measures - commits
  else if (name.startsWith('--commit-start-')) {
    state.nextRenderShouldGenerateNewBatchID = true;
    const laneBitmaskString = name.substr(15);
    const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
    markWorkStarted('commit', startTime, lanes, currentProfilerData, state);
  } else if (name.startsWith('--commit-stop')) {
    markWorkCompleted(
      'commit',
      startTime,
      currentProfilerData,
      state.measureStack,
    );
    markWorkCompleted(
      'render-idle',
      startTime,
      currentProfilerData,
      state.measureStack,
    );
  } // eslint-disable-line brace-style

  // React Measures - layout effects
  else if (name.startsWith('--layout-effects-start-')) {
    const laneBitmaskString = name.substr(23);
    const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
    markWorkStarted(
      'layout-effects',
      startTime,
      lanes,
      currentProfilerData,
      state,
    );
  } else if (name.startsWith('--layout-effects-stop')) {
    markWorkCompleted(
      'layout-effects',
      startTime,
      currentProfilerData,
      state.measureStack,
    );
  } // eslint-disable-line brace-style

  // React Measures - passive effects
  else if (name.startsWith('--passive-effects-start-')) {
    const laneBitmaskString = name.substr(24);
    const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
    markWorkStarted(
      'passive-effects',
      startTime,
      lanes,
      currentProfilerData,
      state,
    );
  } else if (name.startsWith('--passive-effects-stop')) {
    markWorkCompleted(
      'passive-effects',
      startTime,
      currentProfilerData,
      state.measureStack,
    );
  } // eslint-disable-line brace-style

  // Other user timing marks/measures
  else if (ph === 'R' || ph === 'n') {
    // User Timing mark
    currentProfilerData.otherUserTimingMarks.push({
      name,
      timestamp: startTime,
    });
  } else if (ph === 'b') {
    // TODO: Begin user timing measure
  } else if (ph === 'e') {
    // TODO: End user timing measure
  } // eslint-disable-line brace-style

  // Unrecognized event
  else {
    throw new InvalidProfileError(
      `Unrecognized event ${JSON.stringify(
        event,
      )}! This is likely a bug in this profiler tool.`,
    );
  }
}

function preprocessFlamechart(rawData: TimelineEvent[]): Flamechart {
  let parsedData;
  try {
    parsedData = importFromChromeTimeline(rawData, 'react-devtools');
  } catch (error) {
    // Assume any Speedscope errors are caused by bad profiles
    const errorToRethrow = new InvalidProfileError(error.message);
    errorToRethrow.stack = error.stack;
    throw errorToRethrow;
  }

  const profile = parsedData.profiles[0]; // TODO: Choose the main CPU thread only

  const speedscopeFlamechart = new SpeedscopeFlamechart({
    getTotalWeight: profile.getTotalWeight.bind(profile),
    forEachCall: profile.forEachCall.bind(profile),
    formatValue: profile.formatValue.bind(profile),
    getColorBucketForFrame: () => 0,
  });

  const flamechart: Flamechart = speedscopeFlamechart.getLayers().map(layer =>
    layer.map(({start, end, node: {frame: {name, file, line, col}}}) => ({
      name,
      timestamp: start / 1000,
      duration: (end - start) / 1000,
      scriptUrl: file,
      locationLine: line,
      locationColumn: col,
    })),
  );

  return flamechart;
}

export default function preprocessData(
  timeline: TimelineEvent[],
): ReactProfilerData {
  const flamechart = preprocessFlamechart(timeline);

  const profilerData: ReactProfilerData = {
    startTime: 0,
    duration: 0,
    events: [],
    measures: [],
    flamechart,
    otherUserTimingMarks: [],
  };

  // Sort `timeline`. JSON Array Format trace events need not be ordered. See:
  // https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#heading=h.f2f0yd51wi15
  timeline = timeline.filter(Boolean).sort((a, b) => (a.ts > b.ts ? 1 : -1));

  // Events displayed in flamechart have timestamps relative to the profile
  // event's startTime. Source: https://github.com/v8/v8/blob/44bd8fd7/src/inspector/js_protocol.json#L1486
  //
  // We'll thus expect there to be a 'Profile' event; if there is not one, we
  // can deduce that there are no flame chart events. As we expect React
  // scheduling profiling user timing marks to be recorded together with browser
  // flame chart events, we can futher deduce that the data is invalid and we
  // don't bother finding React events.
  const indexOfProfileEvent = timeline.findIndex(
    event => event.name === 'Profile',
  );
  if (indexOfProfileEvent === -1) {
    return profilerData;
  }

  // Use Profile event's `startTime` as the start time to align with flame chart.
  // TODO: Remove assumption that there'll only be 1 'Profile' event. If this
  // assumption does not hold, the chart may start at the wrong time.
  profilerData.startTime = timeline[indexOfProfileEvent].args.data.startTime;
  profilerData.duration =
    (timeline[timeline.length - 1].ts - profilerData.startTime) / 1000;

  const state: ProcessorState = {
    batchUID: 0,
    uidCounter: 0,
    nextRenderShouldGenerateNewBatchID: true,
    measureStack: [],
  };

  timeline.forEach(event => processTimelineEvent(event, profilerData, state));

  // Validate that all events and measures are complete
  const {measureStack} = state;
  if (measureStack.length > 0) {
    console.error('Incomplete events or measures', measureStack);
  }

  return profilerData;
}

// @flow

import type { TimelineEvent } from '../speedscope/import/chrome';
import type {
  Milliseconds,
  BatchUID,
  ReactEventV2,
  ReactLane,
  ReactMeasureType,
  ReactProfilerDataV2,
} from '../types';

import { REACT_TOTAL_NUM_LANES } from '../constants';

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

/**
 * Create an array containing the numbers 0 through `n`.
 */
const range = (n: number): number[] => Array.from(Array(n).keys());

// Exported for tests
export function getLanesFromTransportDecimalBitmask(
  laneBitmaskString: string
): ReactLane[] {
  const laneBitmask = parseInt(laneBitmaskString);

  // As negative numbers are stored in two's complement format, our bitmask
  // checks will be thrown off by them.
  if (laneBitmask < 0) {
    return [];
  }

  let lanes = [];
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
    const { type } = stack[stack.length - 1];
    return type;
  }
  return null;
}

function getDepth(stack: $PropertyType<ProcessorState, 'measureStack'>) {
  if (stack.length > 0) {
    const { depth, type } = stack[stack.length - 1];
    return type === 'render-idle' ? depth : depth + 1;
  }
  return 0;
}

function markWorkStarted(
  type: ReactMeasureType,
  startTime: Milliseconds,
  lanes: ReactLane[],
  currentProfilerData: ReactProfilerDataV2,
  state: ProcessorState
) {
  const { batchUID, measureStack } = state;
  const index = currentProfilerData.measures.length;
  const depth = getDepth(measureStack);

  state.measureStack.push({ depth, index, startTime, type });

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
  currentProfilerData: ReactProfilerDataV2,
  stack: $PropertyType<ProcessorState, 'measureStack'>
) {
  if (stack.length === 0) {
    console.error(
      `Unexpected type "${type}" completed at ${stopTime}ms while stack is empty.`
    );
    // Ignore work "completion" user timing mark that doesn't complete anything
    return;
  }

  const last = stack[stack.length - 1];
  if (last.type !== type) {
    console.error(
      `Unexpected type "${type}" completed at ${stopTime}ms before "${last.type}" completed.`
    );
  }

  const { index, startTime } = stack.pop();
  const measure = currentProfilerData.measures[index];
  if (!measure) {
    console.error(`Could not find matching measure for type "${type}".`);
  }

  // $FlowFixMe This property should not be writable outside of this function.
  measure.duration = stopTime - startTime;
}

function throwIfIncomplete(
  type: ReactMeasureType,
  stack: $PropertyType<ProcessorState, 'measureStack'>
) {
  const lastIndex = stack.length - 1;
  if (lastIndex >= 0) {
    const last = stack[lastIndex];
    if (last.stopTime === undefined && last.type === type) {
      throw new Error(
        `Unexpected type "${type}" started before "${last.type}" completed.`
      );
    }
  }
}

function processTimelineEvent(
  event: TimelineEvent,
  /** Finalized profiler data up to `event`. May be mutated. */
  currentProfilerData: ReactProfilerDataV2,
  /** Intermediate processor state. May be mutated. */
  state: ProcessorState
) {
  const { cat, name, ts } = event;
  if (cat !== 'blink.user_timing' || !name.startsWith('--')) {
    return;
  }

  const startTime = (ts - currentProfilerData.startTime) / 1000;

  // React Events - schedule
  if (name.startsWith('--schedule-render-')) {
    const [
      componentName,
      laneBitmaskString,
      ...splitComponentStack
    ] = name.substr(18).split('-');
    currentProfilerData.events.push({
      type: 'schedule-render',
      lanes: getLanesFromTransportDecimalBitmask(laneBitmaskString),
      componentName,
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
    });
  } else if (name.startsWith('--schedule-forced-update-')) {
    const [
      componentName,
      laneBitmaskString,
      ...splitComponentStack
    ] = name.substr(25).split('-');
    const isCascading = !!state.measureStack.find(
      ({ type }) => type === 'commit'
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
      componentName,
      laneBitmaskString,
      ...splitComponentStack
    ] = name.substr(24).split('-');
    const isCascading = !!state.measureStack.find(
      ({ type }) => type === 'commit'
    );
    currentProfilerData.events.push({
      type: 'schedule-state-update',
      lanes: getLanesFromTransportDecimalBitmask(laneBitmaskString),
      componentName,
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
      isCascading,
    });
  }

  // React Events - suspense
  else if (name.startsWith('--suspense-suspend-')) {
    const [componentName, id, ...splitComponentStack] = name
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
    const [componentName, id, ...splitComponentStack] = name
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
    const [componentName, id, ...splitComponentStack] = name
      .substr(20)
      .split('-');
    currentProfilerData.events.push({
      type: 'suspense-rejected',
      id,
      componentName,
      componentStack: splitComponentStack.join('-'),
      timestamp: startTime,
    });
  }

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
        state
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
      state.measureStack
    );
  } else if (name.startsWith('--render-cancel')) {
    state.nextRenderShouldGenerateNewBatchID = true;
    markWorkCompleted(
      'render',
      startTime,
      currentProfilerData,
      state.measureStack
    );
    markWorkCompleted(
      'render-idle',
      startTime,
      currentProfilerData,
      state.measureStack
    );
  }

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
      state.measureStack
    );
    markWorkCompleted(
      'render-idle',
      startTime,
      currentProfilerData,
      state.measureStack
    );
  }

  // React Measures - layout effects
  else if (name.startsWith('--layout-effects-start-')) {
    const laneBitmaskString = name.substr(23);
    const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
    markWorkStarted(
      'layout-effects',
      startTime,
      lanes,
      currentProfilerData,
      state
    );
  } else if (name.startsWith('--layout-effects-stop')) {
    markWorkCompleted(
      'layout-effects',
      startTime,
      currentProfilerData,
      state.measureStack
    );
  }

  // React Measures - passive effects
  else if (name.startsWith('--passive-effects-start-')) {
    const laneBitmaskString = name.substr(24);
    const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
    markWorkStarted(
      'passive-effects',
      startTime,
      lanes,
      currentProfilerData,
      state
    );
  } else if (name.startsWith('--passive-effects-stop')) {
    markWorkCompleted(
      'passive-effects',
      startTime,
      currentProfilerData,
      state.measureStack
    );
  }

  // Unrecognized event
  else {
    throw new Error(
      `Unrecognized event ${name}! This is likely a bug in this profiler tool.`
    );
  }
}

export default function preprocessData(
  timeline: TimelineEvent[]
): ReactProfilerDataV2 {
  const profilerData = {
    startTime: 0,
    duration: 0,
    events: [],
    measures: [],
  };

  if (timeline.length === 0) {
    return profilerData;
  }

  profilerData.startTime = timeline[0].ts; // TODO: Confirm with trace events doc if this is legit -- the events may not have to be ordered

  const state: ProcessorState = {
    batchUID: 0,
    uidCounter: 0,
    nextRenderShouldGenerateNewBatchID: true,
    measureStack: [],
  };

  for (const event of timeline) {
    processTimelineEvent(event, profilerData, state);
  }

  // Validate that all events and measures are complete
  const { measureStack } = state;
  if (measureStack.length > 0) {
    console.error(`Incomplete events or measures`, measureStack);
  }

  // Compute profilerData.duration
  const { events, measures } = profilerData;
  if (events.length > 0) {
    const { timestamp } = events[events.length - 1];
    profilerData.duration = Math.max(profilerData.duration, timestamp);
  }
  if (measures.length > 0) {
    const { duration, timestamp } = measures[measures.length - 1];
    profilerData.duration = Math.max(
      profilerData.duration,
      timestamp + duration
    );
  }

  return profilerData;
}

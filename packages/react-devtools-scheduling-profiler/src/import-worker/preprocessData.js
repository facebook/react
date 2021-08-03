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
  NativeEvent,
  ReactLane,
  ReactComponentMeasure,
  ReactMeasureType,
  ReactProfilerData,
  SuspenseEvent,
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
  batchUID: BatchUID,
  currentReactComponentMeasure: ReactComponentMeasure | null,
  measureStack: MeasureStackElement[],
  nativeEventStack: NativeEvent[],
  nextRenderShouldGenerateNewBatchID: boolean,
  uidCounter: BatchUID,
  unresolvedSuspenseEvents: Map<string, SuspenseEvent>,
|};

const NATIVE_EVENT_DURATION_THRESHOLD = 20;

const WARNING_STRINGS = {
  LONG_EVENT_HANDLER:
    'An event handler scheduled a big update with React. Consider using the Transition API to defer some of this work.',
  NESTED_UPDATE:
    'A nested update was scheduled during layout. These updates require React to re-render synchronously before the browser can paint.',
  SUSPENDD_DURING_UPATE:
    'A component suspended during an update which caused a fallback to be shown. ' +
    "Consider using the Transition API to avoid hiding components after they've been mounted.",
};

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
  laneLabels: Array<string>,
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
    laneLabels,
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
  const {args, cat, name, ts, ph} = event;
  switch (cat) {
    case 'devtools.timeline':
      if (name === 'EventDispatch') {
        const type = args.data.type;

        if (type.startsWith('react-')) {
          const stackTrace = args.data.stackTrace;
          if (stackTrace) {
            const topFrame = stackTrace[stackTrace.length - 1];
            if (topFrame.url.includes('/react-dom.')) {
              // Filter out fake React events dispatched by invokeGuardedCallbackDev.
              return;
            }
          }
        }

        // Reduce noise from events like DOMActivate, load/unload, etc. which are usually not relevant
        if (
          type.startsWith('blur') ||
          type.startsWith('click') ||
          type.startsWith('focus') ||
          type.startsWith('mouse') ||
          type.startsWith('pointer')
        ) {
          const timestamp = (ts - currentProfilerData.startTime) / 1000;
          const duration = event.dur / 1000;

          let depth = 0;

          while (state.nativeEventStack.length > 0) {
            const prevNativeEvent =
              state.nativeEventStack[state.nativeEventStack.length - 1];
            const prevStopTime =
              prevNativeEvent.timestamp + prevNativeEvent.duration;

            if (timestamp < prevStopTime) {
              depth = prevNativeEvent.depth + 1;
              break;
            } else {
              state.nativeEventStack.pop();
            }
          }

          const nativeEvent = {
            depth,
            duration,
            timestamp,
            type,
            warning: null,
          };

          currentProfilerData.nativeEvents.push(nativeEvent);

          // Keep track of curent event in case future ones overlap.
          // We separate them into different vertical lanes in this case.
          state.nativeEventStack.push(nativeEvent);
        }
      }
      break;
    case 'blink.user_timing':
      const startTime = (ts - currentProfilerData.startTime) / 1000;

      if (name.startsWith('--component-render-start-')) {
        const [componentName] = name.substr(25).split('-');

        if (state.currentReactComponentMeasure !== null) {
          console.error(
            'Render started while another render in progress:',
            state.currentReactComponentMeasure,
          );
        }

        state.currentReactComponentMeasure = {
          componentName,
          timestamp: startTime,
          duration: 0,
          warning: null,
        };
      } else if (name === '--component-render-stop') {
        if (state.currentReactComponentMeasure !== null) {
          const componentMeasure = state.currentReactComponentMeasure;
          componentMeasure.duration = startTime - componentMeasure.timestamp;

          state.currentReactComponentMeasure = null;

          currentProfilerData.componentMeasures.push(componentMeasure);
        }
      } else if (name.startsWith('--schedule-render-')) {
        const [laneBitmaskString, laneLabels] = name.substr(18).split('-');
        currentProfilerData.schedulingEvents.push({
          type: 'schedule-render',
          lanes: getLanesFromTransportDecimalBitmask(laneBitmaskString),
          laneLabels: laneLabels ? laneLabels.split(',') : [],
          timestamp: startTime,
          warning: null,
        });
      } else if (name.startsWith('--schedule-forced-update-')) {
        const [laneBitmaskString, laneLabels, componentName] = name
          .substr(25)
          .split('-');

        let warning = null;
        if (state.measureStack.find(({type}) => type === 'commit')) {
          // TODO (scheduling profiler) Only warn if the subsequent update is longer than some threshold.
          warning = WARNING_STRINGS.NESTED_UPDATE;
        }

        currentProfilerData.schedulingEvents.push({
          type: 'schedule-force-update',
          lanes: getLanesFromTransportDecimalBitmask(laneBitmaskString),
          laneLabels: laneLabels ? laneLabels.split(',') : [],
          componentName,
          timestamp: startTime,
          warning,
        });
      } else if (name.startsWith('--schedule-state-update-')) {
        const [laneBitmaskString, laneLabels, componentName] = name
          .substr(24)
          .split('-');

        let warning = null;
        if (state.measureStack.find(({type}) => type === 'commit')) {
          // TODO (scheduling profiler) Only warn if the subsequent update is longer than some threshold.
          warning = WARNING_STRINGS.NESTED_UPDATE;
        }

        currentProfilerData.schedulingEvents.push({
          type: 'schedule-state-update',
          lanes: getLanesFromTransportDecimalBitmask(laneBitmaskString),
          laneLabels: laneLabels ? laneLabels.split(',') : [],
          componentName,
          timestamp: startTime,
          warning,
        });
      } // eslint-disable-line brace-style

      // React Events - suspense
      else if (name.startsWith('--suspense-suspend-')) {
        const [id, componentName, ...rest] = name.substr(19).split('-');

        // Older versions of the scheduling profiler data didn't contain phase or lane values.
        let phase = null;
        let warning = null;
        if (rest.length === 3) {
          switch (rest[0]) {
            case 'mount':
            case 'update':
              phase = rest[0];
              break;
          }

          if (phase === 'update') {
            const laneLabels = rest[2];
            // HACK This is a bit gross but the numeric lane value might change between render versions.
            if (!laneLabels.includes('Transition')) {
              warning = WARNING_STRINGS.SUSPENDD_DURING_UPATE;
            }
          }
        }

        const availableDepths = new Array(
          state.unresolvedSuspenseEvents.size + 1,
        ).fill(true);
        state.unresolvedSuspenseEvents.forEach(({depth}) => {
          availableDepths[depth] = false;
        });

        let depth = 0;
        for (let i = 0; i < availableDepths.length; i++) {
          if (availableDepths[i]) {
            depth = i;
            break;
          }
        }

        // TODO (scheduling profiler) Maybe we should calculate depth in post,
        // so unresolved Suspense requests don't take up space.
        // We can't know if they'll be resolved or not at this point.
        // We'll just give them a default (fake) duration width.

        const suspenseEvent = {
          componentName,
          depth,
          duration: null,
          id,
          phase,
          resolution: 'unresolved',
          resuspendTimestamps: null,
          timestamp: startTime,
          type: 'suspense',
          warning,
        };

        currentProfilerData.suspenseEvents.push(suspenseEvent);
        state.unresolvedSuspenseEvents.set(id, suspenseEvent);
      } else if (name.startsWith('--suspense-resuspend-')) {
        const [id] = name.substr(21).split('-');
        const suspenseEvent = state.unresolvedSuspenseEvents.get(id);
        if (suspenseEvent != null) {
          if (suspenseEvent.resuspendTimestamps === null) {
            suspenseEvent.resuspendTimestamps = [startTime];
          } else {
            suspenseEvent.resuspendTimestamps.push(startTime);
          }
        }
      } else if (name.startsWith('--suspense-resolved-')) {
        const [id] = name.substr(20).split('-');
        const suspenseEvent = state.unresolvedSuspenseEvents.get(id);
        if (suspenseEvent != null) {
          state.unresolvedSuspenseEvents.delete(id);

          suspenseEvent.duration = startTime - suspenseEvent.timestamp;
          suspenseEvent.resolution = 'resolved';
        }
      } else if (name.startsWith('--suspense-rejected-')) {
        const [id] = name.substr(20).split('-');
        const suspenseEvent = state.unresolvedSuspenseEvents.get(id);
        if (suspenseEvent != null) {
          state.unresolvedSuspenseEvents.delete(id);

          suspenseEvent.duration = startTime - suspenseEvent.timestamp;
          suspenseEvent.resolution = 'rejected';
        }
      } // eslint-disable-line brace-style

      // React Measures - render
      else if (name.startsWith('--render-start-')) {
        if (state.nextRenderShouldGenerateNewBatchID) {
          state.nextRenderShouldGenerateNewBatchID = false;
          state.batchUID = ((state.uidCounter++: any): BatchUID);
        }
        const [laneBitmaskString, laneLabels] = name.substr(15).split('-');
        const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
        throwIfIncomplete('render', state.measureStack);
        if (getLastType(state.measureStack) !== 'render-idle') {
          markWorkStarted(
            'render-idle',
            startTime,
            lanes,
            laneLabels ? laneLabels.split(',') : [],
            currentProfilerData,
            state,
          );
        }
        markWorkStarted(
          'render',
          startTime,
          lanes,
          laneLabels ? laneLabels.split(',') : [],
          currentProfilerData,
          state,
        );

        for (let i = 0; i < state.nativeEventStack.length; i++) {
          const nativeEvent = state.nativeEventStack[i];
          const stopTime = nativeEvent.timestamp + nativeEvent.duration;
          if (
            stopTime > startTime &&
            nativeEvent.duration > NATIVE_EVENT_DURATION_THRESHOLD
          ) {
            nativeEvent.warning = WARNING_STRINGS.LONG_EVENT_HANDLER;
          }
        }
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
        const [laneBitmaskString, laneLabels] = name.substr(15).split('-');
        const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
        markWorkStarted(
          'commit',
          startTime,
          lanes,
          laneLabels ? laneLabels.split(',') : [],
          currentProfilerData,
          state,
        );
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
        const [laneBitmaskString, laneLabels] = name.substr(23).split('-');
        const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
        markWorkStarted(
          'layout-effects',
          startTime,
          lanes,
          laneLabels ? laneLabels.split(',') : [],
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
        const [laneBitmaskString, laneLabels] = name.substr(24).split('-');
        const lanes = getLanesFromTransportDecimalBitmask(laneBitmaskString);
        markWorkStarted(
          'passive-effects',
          startTime,
          lanes,
          laneLabels ? laneLabels.split(',') : [],
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
      } else if (ph === 'i' || ph === 'I') {
        // Instant events.
        // Note that the capital "I" is a deprecated value that exists in Chrome Canary traces.
      } // eslint-disable-line brace-style

      // Unrecognized event
      else {
        throw new InvalidProfileError(
          `Unrecognized event ${JSON.stringify(
            event,
          )}! This is likely a bug in this profiler tool.`,
        );
      }
      break;
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
    componentMeasures: [],
    duration: 0,
    flamechart,
    measures: [],
    nativeEvents: [],
    otherUserTimingMarks: [],
    schedulingEvents: [],
    startTime: 0,
    suspenseEvents: [],
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
    currentReactComponentMeasure: null,
    measureStack: [],
    nativeEventStack: [],
    nextRenderShouldGenerateNewBatchID: true,
    uidCounter: 0,
    unresolvedSuspenseEvents: new Map(),
  };

  timeline.forEach(event => processTimelineEvent(event, profilerData, state));

  // Validate that all events and measures are complete
  const {measureStack} = state;
  if (measureStack.length > 0) {
    console.error('Incomplete events or measures', measureStack);
  }

  return profilerData;
}

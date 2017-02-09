/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugTool
 * @flow
 */

'use strict';

var ReactInvalidSetStateWarningHook = require('ReactInvalidSetStateWarningHook');
var ReactHostOperationHistoryHook = require('ReactHostOperationHistoryHook');
var ReactComponentTreeHook = require('ReactComponentTreeHook');
var ExecutionEnvironment = require('ExecutionEnvironment');

var performanceNow = require('performanceNow');
var warning = require('warning');

import type { ReactElement } from 'ReactElementType';
import type { DebugID } from 'ReactInstanceType';
import type { Operation } from 'ReactHostOperationHistoryHook';

type Hook = any;

type TimerType =
  'ctor' |
  'render' |
  'componentWillMount' |
  'componentWillUnmount' |
  'componentWillReceiveProps' |
  'shouldComponentUpdate' |
  'componentWillUpdate' |
  'componentDidUpdate' |
  'componentDidMount';

type Measurement = {
  timerType: TimerType,
  instanceID: DebugID,
  duration: number,
};

type TreeSnapshot = {
  [key: DebugID]: {
    displayName: string,
    text: string,
    updateCount: number,
    childIDs: Array<DebugID>,
    ownerID: DebugID,
    parentID: DebugID,
  }
};

type HistoryItem = {
  duration: number,
  measurements: Array<Measurement>,
  operations: Array<Operation>,
  treeSnapshot: TreeSnapshot,
};

export type FlushHistory = Array<HistoryItem>;

// Trust the developer to only use this with a __DEV__ check
var ReactDebugTool = ((null: any): typeof ReactDebugTool);

if (__DEV__) {
  var hooks = [];
  var didHookThrowForEvent = {};

  const callHook = function(event, fn, context, arg1, arg2, arg3, arg4, arg5) {
    try {
      fn.call(context, arg1, arg2, arg3, arg4, arg5);
    } catch (e) {
      warning(
        didHookThrowForEvent[event],
        'Exception thrown by hook while handling %s: %s',
        event,
        e + '\n' + e.stack
      );
      didHookThrowForEvent[event] = true;
    }
  };

  const emitEvent = function(event, arg1, arg2, arg3, arg4, arg5) {
    for (var i = 0; i < hooks.length; i++) {
      var hook = hooks[i];
      var fn = hook[event];
      if (fn) {
        callHook(event, fn, hook, arg1, arg2, arg3, arg4, arg5);
      }
    }
  };

  var isProfiling = false;
  var flushHistory = [];
  var lifeCycleTimerStack = [];
  var currentFlushNesting = 0;
  var currentFlushMeasurements = [];
  var currentFlushStartTime = 0;
  var currentTimerDebugID = null;
  var currentTimerStartTime = 0;
  var currentTimerNestedFlushDuration = 0;
  var currentTimerType = null;

  var lifeCycleTimerHasWarned = false;

  const clearHistory = function() {
    ReactComponentTreeHook.purgeUnmountedComponents();
    ReactHostOperationHistoryHook.clearHistory();
  };

  const getTreeSnapshot = function(registeredIDs) {
    return registeredIDs.reduce((tree, id) => {
      var ownerID = ReactComponentTreeHook.getOwnerID(id);
      var parentID = ReactComponentTreeHook.getParentID(id);
      tree[id] = {
        displayName: ReactComponentTreeHook.getDisplayName(id),
        text: ReactComponentTreeHook.getText(id),
        updateCount: ReactComponentTreeHook.getUpdateCount(id),
        childIDs: ReactComponentTreeHook.getChildIDs(id),
        // Text nodes don't have owners but this is close enough.
        ownerID: ownerID ||
          parentID && ReactComponentTreeHook.getOwnerID(parentID) ||
          0,
        parentID,
      };
      return tree;
    }, {});
  };

  const resetMeasurements = function() {
    var previousStartTime = currentFlushStartTime;
    var previousMeasurements = currentFlushMeasurements;
    var previousOperations = ReactHostOperationHistoryHook.getHistory();

    if (currentFlushNesting === 0) {
      currentFlushStartTime = 0;
      currentFlushMeasurements = [];
      clearHistory();
      return;
    }

    if (previousMeasurements.length || previousOperations.length) {
      var registeredIDs = ReactComponentTreeHook.getRegisteredIDs();
      flushHistory.push({
        duration: performanceNow() - previousStartTime,
        measurements: previousMeasurements || [],
        operations: previousOperations || [],
        treeSnapshot: getTreeSnapshot(registeredIDs),
      });
    }

    clearHistory();
    currentFlushStartTime = performanceNow();
    currentFlushMeasurements = [];
  };

  const checkDebugID = function(debugID, allowRoot = false) {
    if (allowRoot && debugID === 0) {
      return;
    }
    if (!debugID) {
      warning(false, 'ReactDebugTool: debugID may not be empty.');
    }
  };

  const beginLifeCycleTimer = function(debugID, timerType) {
    if (currentFlushNesting === 0) {
      return;
    }
    if (currentTimerType && !lifeCycleTimerHasWarned) {
      warning(
        false,
        'There is an internal error in the React performance measurement code.' +
        '\n\nDid not expect %s timer to start while %s timer is still in ' +
        'progress for %s instance.',
        timerType,
        currentTimerType || 'no',
        (debugID === currentTimerDebugID) ? 'the same' : 'another'
      );
      lifeCycleTimerHasWarned = true;
    }
    currentTimerStartTime = performanceNow();
    currentTimerNestedFlushDuration = 0;
    currentTimerDebugID = debugID;
    currentTimerType = timerType;
  };

  const endLifeCycleTimer = function(debugID, timerType) {
    if (currentFlushNesting === 0) {
      return;
    }
    if (currentTimerType !== timerType && !lifeCycleTimerHasWarned) {
      warning(
        false,
        'There is an internal error in the React performance measurement code. ' +
        'We did not expect %s timer to stop while %s timer is still in ' +
        'progress for %s instance. Please report this as a bug in React.',
        timerType,
        currentTimerType || 'no',
        (debugID === currentTimerDebugID) ? 'the same' : 'another'
      );
      lifeCycleTimerHasWarned = true;
    }
    if (isProfiling) {
      currentFlushMeasurements.push({
        timerType,
        instanceID: debugID,
        duration: performanceNow() - currentTimerStartTime - currentTimerNestedFlushDuration,
      });
    }
    currentTimerStartTime = 0;
    currentTimerNestedFlushDuration = 0;
    currentTimerDebugID = null;
    currentTimerType = null;
  };

  const pauseCurrentLifeCycleTimer = function() {
    var currentTimer = {
      startTime: currentTimerStartTime,
      nestedFlushStartTime: performanceNow(),
      debugID: currentTimerDebugID,
      timerType: currentTimerType,
    };
    lifeCycleTimerStack.push(currentTimer);
    currentTimerStartTime = 0;
    currentTimerNestedFlushDuration = 0;
    currentTimerDebugID = null;
    currentTimerType = null;
  };

  const resumeCurrentLifeCycleTimer = function() {
    var {startTime, nestedFlushStartTime, debugID, timerType} = lifeCycleTimerStack.pop();
    var nestedFlushDuration = performanceNow() - nestedFlushStartTime;
    currentTimerStartTime = startTime;
    currentTimerNestedFlushDuration += nestedFlushDuration;
    currentTimerDebugID = debugID;
    currentTimerType = timerType;
  };

  var lastMarkTimeStamp = 0;
  var canUsePerformanceMeasure: boolean =
    typeof performance !== 'undefined' &&
    typeof performance.mark === 'function' &&
    typeof performance.clearMarks === 'function' &&
    typeof performance.measure === 'function' &&
    typeof performance.clearMeasures === 'function';

  const shouldMark = function(debugID) {
    if (!isProfiling || !canUsePerformanceMeasure) {
      return false;
    }
    var element = ReactComponentTreeHook.getElement(debugID);
    if (element == null || typeof element !== 'object') {
      return false;
    }
    var isHostElement = typeof element.type === 'string';
    if (isHostElement) {
      return false;
    }
    return true;
  };

  const markBegin = function(debugID, markType) {
    if (!shouldMark(debugID)) {
      return;
    }

    var markName = `${debugID}::${markType}`;
    lastMarkTimeStamp = performanceNow();
    performance.mark(markName);
  };

  const markEnd = function(debugID, markType) {
    if (!shouldMark(debugID)) {
      return;
    }

    var markName = `${debugID}::${markType}`;
    var displayName = ReactComponentTreeHook.getDisplayName(debugID) || 'Unknown';

    // Chrome has an issue of dropping markers recorded too fast:
    // https://bugs.chromium.org/p/chromium/issues/detail?id=640652
    // To work around this, we will not report very small measurements.
    // I determined the magic number by tweaking it back and forth.
    // 0.05ms was enough to prevent the issue, but I set it to 0.1ms to be safe.
    // When the bug is fixed, we can `measure()` unconditionally if we want to.
    var timeStamp = performanceNow();
    if (timeStamp - lastMarkTimeStamp > 0.1) {
      var measurementName = `${displayName} [${markType}]`;
      performance.measure(measurementName, markName);
    }

    performance.clearMarks(markName);
    performance.clearMeasures(measurementName);
  };

  ReactDebugTool = {
    addHook(hook: Hook): void {
      hooks.push(hook);
    },
    removeHook(hook: Hook): void {
      for (var i = 0; i < hooks.length; i++) {
        if (hooks[i] === hook) {
          hooks.splice(i, 1);
          i--;
        }
      }
    },
    isProfiling(): boolean {
      return isProfiling;
    },
    beginProfiling(): void {
      if (isProfiling) {
        return;
      }

      isProfiling = true;
      flushHistory.length = 0;
      resetMeasurements();
      ReactDebugTool.addHook(ReactHostOperationHistoryHook);
    },
    endProfiling(): void {
      if (!isProfiling) {
        return;
      }

      isProfiling = false;
      resetMeasurements();
      ReactDebugTool.removeHook(ReactHostOperationHistoryHook);
    },
    getFlushHistory(): FlushHistory {
      return flushHistory;
    },
    onBeginFlush(): void {
      currentFlushNesting++;
      resetMeasurements();
      pauseCurrentLifeCycleTimer();
      emitEvent('onBeginFlush');
    },
    onEndFlush(): void {
      resetMeasurements();
      currentFlushNesting--;
      resumeCurrentLifeCycleTimer();
      emitEvent('onEndFlush');
    },
    onBeginLifeCycleTimer(debugID: DebugID, timerType: TimerType): void {
      checkDebugID(debugID);
      emitEvent('onBeginLifeCycleTimer', debugID, timerType);
      markBegin(debugID, timerType);
      beginLifeCycleTimer(debugID, timerType);
    },
    onEndLifeCycleTimer(debugID: DebugID, timerType: TimerType): void {
      checkDebugID(debugID);
      endLifeCycleTimer(debugID, timerType);
      markEnd(debugID, timerType);
      emitEvent('onEndLifeCycleTimer', debugID, timerType);
    },
    onBeginProcessingChildContext(): void {
      emitEvent('onBeginProcessingChildContext');
    },
    onEndProcessingChildContext(): void {
      emitEvent('onEndProcessingChildContext');
    },
    onHostOperation(operation: Operation) {
      checkDebugID(operation.instanceID);
      emitEvent('onHostOperation', operation);
    },
    onSetState(): void {
      emitEvent('onSetState');
    },
    onSetChildren(debugID: DebugID, childDebugIDs: Array<DebugID>) {
      checkDebugID(debugID);
      childDebugIDs.forEach(checkDebugID);
      emitEvent('onSetChildren', debugID, childDebugIDs);
    },
    onBeforeMountComponent(debugID: DebugID, element: ReactElement, parentDebugID: DebugID): void {
      checkDebugID(debugID);
      checkDebugID(parentDebugID, true);
      emitEvent('onBeforeMountComponent', debugID, element, parentDebugID);
      markBegin(debugID, 'mount');
    },
    onMountComponent(debugID: DebugID): void {
      checkDebugID(debugID);
      markEnd(debugID, 'mount');
      emitEvent('onMountComponent', debugID);
    },
    onBeforeUpdateComponent(debugID: DebugID, element: ReactElement): void {
      checkDebugID(debugID);
      emitEvent('onBeforeUpdateComponent', debugID, element);
      markBegin(debugID, 'update');
    },
    onUpdateComponent(debugID: DebugID): void {
      checkDebugID(debugID);
      markEnd(debugID, 'update');
      emitEvent('onUpdateComponent', debugID);
    },
    onBeforeUnmountComponent(debugID: DebugID): void {
      checkDebugID(debugID);
      emitEvent('onBeforeUnmountComponent', debugID);
      markBegin(debugID, 'unmount');
    },
    onUnmountComponent(debugID: DebugID): void {
      checkDebugID(debugID);
      markEnd(debugID, 'unmount');
      emitEvent('onUnmountComponent', debugID);
    },
    onTestEvent(): void {
      emitEvent('onTestEvent');
    },
  };

  ReactDebugTool.addHook(ReactInvalidSetStateWarningHook);
  ReactDebugTool.addHook(ReactComponentTreeHook);
  var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
  if ((/[?&]react_perf\b/).test(url)) {
    ReactDebugTool.beginProfiling();
  }
}

module.exports = ReactDebugTool;

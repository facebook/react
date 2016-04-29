/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugTool
 */

'use strict';

var ExecutionEnvironment = require('ExecutionEnvironment');

var performanceNow = require('performanceNow');
var warning = require('warning');

var eventHandlers = [];
var handlerDoesThrowForEvent = {};

function emitEvent(handlerFunctionName, arg1, arg2, arg3, arg4, arg5) {
  if (__DEV__) {
    eventHandlers.forEach(function(handler) {
      try {
        if (handler[handlerFunctionName]) {
          handler[handlerFunctionName](arg1, arg2, arg3, arg4, arg5);
        }
      } catch (e) {
        warning(
          handlerDoesThrowForEvent[handlerFunctionName],
          'exception thrown by devtool while handling %s: %s',
          handlerFunctionName,
          e.message
        );
        handlerDoesThrowForEvent[handlerFunctionName] = true;
      }
    });
  }
}

var isProfiling = false;
var flushHistory = [];
var currentFlushNesting = 0;
var currentFlushMeasurements = null;
var currentFlushStartTime = null;
var currentTimerDebugID = null;
var currentTimerStartTime = null;
var currentTimerType = null;

function resetMeasurements() {
  if (__DEV__) {
    if (!isProfiling || currentFlushNesting === 0) {
      currentFlushStartTime = null;
      currentFlushMeasurements = null;
      return;
    }

    var previousStartTime = currentFlushStartTime;
    var previousMeasurements = currentFlushMeasurements || [];
    var previousOperations = ReactNativeOperationHistoryDevtool.getHistory();

    if (previousMeasurements.length || previousOperations.length) {
      var registeredIDs = ReactComponentTreeDevtool.getRegisteredIDs();
      flushHistory.push({
        duration: performanceNow() - previousStartTime,
        measurements: previousMeasurements || [],
        operations: previousOperations || [],
        treeSnapshot: registeredIDs.reduce((tree, id) => {
          var ownerID = ReactComponentTreeDevtool.getOwnerID(id);
          var parentID = ReactComponentTreeDevtool.getParentID(id);
          tree[id] = {
            displayName: ReactComponentTreeDevtool.getDisplayName(id),
            text: ReactComponentTreeDevtool.getText(id),
            childIDs: ReactComponentTreeDevtool.getChildIDs(id),
            // Text nodes don't have owners but this is close enough.
            ownerID: ownerID || ReactComponentTreeDevtool.getOwnerID(parentID),
            parentID,
          };
          return tree;
        }, {}),
      });
    }

    currentFlushStartTime = performanceNow();
    currentFlushMeasurements = [];
    ReactComponentTreeDevtool.purgeUnmountedComponents();
    ReactNativeOperationHistoryDevtool.clearHistory();
  }
}

var ReactDebugTool = {
  addDevtool(devtool) {
    eventHandlers.push(devtool);
  },
  removeDevtool(devtool) {
    for (var i = 0; i < eventHandlers.length; i++) {
      if (eventHandlers[i] === devtool) {
        eventHandlers.splice(i, 1);
        i--;
      }
    }
  },
  beginProfiling() {
    if (__DEV__) {
      if (isProfiling) {
        return;
      }

      isProfiling = true;
      flushHistory.length = 0;
      resetMeasurements();
    }
  },
  endProfiling() {
    if (__DEV__) {
      if (!isProfiling) {
        return;
      }

      isProfiling = false;
      resetMeasurements();
    }
  },
  getFlushHistory() {
    if (__DEV__) {
      return flushHistory;
    }
  },
  onBeginFlush() {
    if (__DEV__) {
      currentFlushNesting++;
      resetMeasurements();
    }
    emitEvent('onBeginFlush');
  },
  onEndFlush() {
    if (__DEV__) {
      resetMeasurements();
      currentFlushNesting--;
    }
    emitEvent('onEndFlush');
  },
  onBeginLifeCycleTimer(debugID, timerType) {
    emitEvent('onBeginLifeCycleTimer', debugID, timerType);
    if (__DEV__) {
      if (isProfiling) {
        warning(
          !currentTimerType,
          'There is an internal error in the React performance measurement code. ' +
          'Did not expect %s timer to start while %s timer is still in ' +
          'progress for %s instance.',
          timerType,
          currentTimerType || 'no',
          (debugID === currentTimerDebugID) ? 'the same' : 'another'
        );
        currentTimerStartTime = performanceNow();
        currentTimerDebugID = debugID;
        currentTimerType = timerType;
      }
    }
  },
  onEndLifeCycleTimer(debugID, timerType) {
    if (__DEV__) {
      if (isProfiling) {
        warning(
          currentTimerType === timerType,
          'There is an internal error in the React performance measurement code. ' +
          'We did not expect %s timer to stop while %s timer is still in ' +
          'progress for %s instance. Please report this as a bug in React.',
          timerType,
          currentTimerType || 'no',
          (debugID === currentTimerDebugID) ? 'the same' : 'another'
        );
        currentFlushMeasurements.push({
          timerType,
          instanceID: debugID,
          duration: performance.now() - currentTimerStartTime,
        });
        currentTimerStartTime = null;
        currentTimerDebugID = null;
        currentTimerType = null;
      }
    }
    emitEvent('onEndLifeCycleTimer', debugID, timerType);
  },
  onBeginReconcilerTimer(debugID, timerType) {
    emitEvent('onBeginReconcilerTimer', debugID, timerType);
  },
  onEndReconcilerTimer(debugID, timerType) {
    emitEvent('onEndReconcilerTimer', debugID, timerType);
  },
  onBeginProcessingChildContext() {
    emitEvent('onBeginProcessingChildContext');
  },
  onEndProcessingChildContext() {
    emitEvent('onEndProcessingChildContext');
  },
  onNativeOperation(debugID, type, payload) {
    emitEvent('onNativeOperation', debugID, type, payload);
  },
  onSetState() {
    emitEvent('onSetState');
  },
  onSetDisplayName(debugID, displayName) {
    emitEvent('onSetDisplayName', debugID, displayName);
  },
  onSetChildren(debugID, childDebugIDs) {
    emitEvent('onSetChildren', debugID, childDebugIDs);
  },
  onSetOwner(debugID, ownerDebugID) {
    emitEvent('onSetOwner', debugID, ownerDebugID);
  },
  onSetText(debugID, text) {
    emitEvent('onSetText', debugID, text);
  },
  onMountRootComponent(debugID) {
    emitEvent('onMountRootComponent', debugID);
  },
  onMountComponent(debugID) {
    emitEvent('onMountComponent', debugID);
  },
  onUpdateComponent(debugID) {
    emitEvent('onUpdateComponent', debugID);
  },
  onUnmountComponent(debugID) {
    emitEvent('onUnmountComponent', debugID);
  },
  onTestEvent() {
    emitEvent('onTestEvent');
  },
};

if (__DEV__) {
  var ReactInvalidSetStateWarningDevTool = require('ReactInvalidSetStateWarningDevTool');
  var ReactNativeOperationHistoryDevtool = require('ReactNativeOperationHistoryDevtool');
  var ReactComponentTreeDevtool = require('ReactComponentTreeDevtool');
  ReactDebugTool.addDevtool(ReactInvalidSetStateWarningDevTool);
  ReactDebugTool.addDevtool(ReactComponentTreeDevtool);
  ReactDebugTool.addDevtool(ReactNativeOperationHistoryDevtool);
  var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
  if ((/[?&]react_perf\b/).test(url)) {
    ReactDebugTool.beginProfiling();
  }
}

module.exports = ReactDebugTool;

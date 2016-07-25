/**
 * Copyright 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDebugToolDev
 */

'use strict';

var ReactChildrenMutationWarningDevtoolDev = require('ReactChildrenMutationWarningDevtoolDev');
var ReactComponentTreeDevtoolDev = require('ReactComponentTreeDevtoolDev');
var ReactHostOperationHistoryDevtoolDev = require('ReactHostOperationHistoryDevtoolDev');
var ReactInvalidSetStateWarningDevToolDev = require('ReactInvalidSetStateWarningDevToolDev');
var ExecutionEnvironment = require('ExecutionEnvironment');

var performanceNow = require('performanceNow');
var warning = require('warning');

var ReactDebugToolDev = {};

if (__DEV__) {
  var eventHandlers = [];
  var handlerDoesThrowForEvent = {};

  var emitEvent = function(handlerFunctionName, arg1, arg2, arg3, arg4, arg5) {
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
          e + '\n' + e.stack
        );
        handlerDoesThrowForEvent[handlerFunctionName] = true;
      }
    });
  };

  var isProfiling = false;
  var flushHistory = [];
  var lifeCycleTimerStack = [];
  var currentFlushNesting = 0;
  var currentFlushMeasurements = null;
  var currentFlushStartTime = null;
  var currentTimerDebugID = null;
  var currentTimerStartTime = null;
  var currentTimerNestedFlushDuration = null;
  var currentTimerType = null;

  var clearHistory = function() {
    ReactComponentTreeDevtoolDev.purgeUnmountedComponents();
    ReactHostOperationHistoryDevtoolDev.clearHistory();
  };

  var getTreeSnapshot = function(registeredIDs) {
    return registeredIDs.reduce((tree, id) => {
      var ownerID = ReactComponentTreeDevtoolDev.getOwnerID(id);
      var parentID = ReactComponentTreeDevtoolDev.getParentID(id);
      tree[id] = {
        displayName: ReactComponentTreeDevtoolDev.getDisplayName(id),
        text: ReactComponentTreeDevtoolDev.getText(id),
        updateCount: ReactComponentTreeDevtoolDev.getUpdateCount(id),
        childIDs: ReactComponentTreeDevtoolDev.getChildIDs(id),
        // Text nodes don't have owners but this is close enough.
        ownerID: ownerID || ReactComponentTreeDevtoolDev.getOwnerID(parentID),
        parentID,
      };
      return tree;
    }, {});
  };

  var resetMeasurements = function() {
    var previousStartTime = currentFlushStartTime;
    var previousMeasurements = currentFlushMeasurements || [];
    var previousOperations = ReactHostOperationHistoryDevtoolDev.getHistory();

    if (currentFlushNesting === 0) {
      currentFlushStartTime = null;
      currentFlushMeasurements = null;
      clearHistory();
      return;
    }

    if (previousMeasurements.length || previousOperations.length) {
      var registeredIDs = ReactComponentTreeDevtoolDev.getRegisteredIDs();
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

  var checkDebugID = function(debugID) {
    warning(debugID, 'ReactDebugTool: debugID may not be empty.');
  };

  var beginLifeCycleTimer = function(debugID, timerType) {
    if (currentFlushNesting === 0) {
      return;
    }
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
    currentTimerNestedFlushDuration = 0;
    currentTimerDebugID = debugID;
    currentTimerType = timerType;
  };

  var endLifeCycleTimer = function(debugID, timerType) {
    if (currentFlushNesting === 0) {
      return;
    }
    warning(
      currentTimerType === timerType,
      'There is an internal error in the React performance measurement code. ' +
      'We did not expect %s timer to stop while %s timer is still in ' +
      'progress for %s instance. Please report this as a bug in React.',
      timerType,
      currentTimerType || 'no',
      (debugID === currentTimerDebugID) ? 'the same' : 'another'
    );
    if (isProfiling) {
      currentFlushMeasurements.push({
        timerType,
        instanceID: debugID,
        duration: performanceNow() - currentTimerStartTime - currentTimerNestedFlushDuration,
      });
    }
    currentTimerStartTime = null;
    currentTimerNestedFlushDuration = null;
    currentTimerDebugID = null;
    currentTimerType = null;
  };

  var pauseCurrentLifeCycleTimer = function() {
    var currentTimer = {
      startTime: currentTimerStartTime,
      nestedFlushStartTime: performanceNow(),
      debugID: currentTimerDebugID,
      timerType: currentTimerType,
    };
    lifeCycleTimerStack.push(currentTimer);
    currentTimerStartTime = null;
    currentTimerNestedFlushDuration = null;
    currentTimerDebugID = null;
    currentTimerType = null;
  };

  var resumeCurrentLifeCycleTimer = function() {
    var {startTime, nestedFlushStartTime, debugID, timerType} = lifeCycleTimerStack.pop();
    var nestedFlushDuration = performanceNow() - nestedFlushStartTime;
    currentTimerStartTime = startTime;
    currentTimerNestedFlushDuration += nestedFlushDuration;
    currentTimerDebugID = debugID;
    currentTimerType = timerType;
  };

  ReactDebugToolDev = {
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
    isProfiling() {
      return isProfiling;
    },
    beginProfiling() {
      if (isProfiling) {
        return;
      }

      isProfiling = true;
      flushHistory.length = 0;
      resetMeasurements();
      ReactDebugToolDev.addDevtool(ReactHostOperationHistoryDevtoolDev);
    },
    endProfiling() {
      if (!isProfiling) {
        return;
      }

      isProfiling = false;
      resetMeasurements();
      ReactDebugToolDev.removeDevtool(ReactHostOperationHistoryDevtoolDev);
    },
    getFlushHistory() {
      return flushHistory;
    },
    onBeginFlush() {
      currentFlushNesting++;
      resetMeasurements();
      pauseCurrentLifeCycleTimer();
      emitEvent('onBeginFlush');
    },
    onEndFlush() {
      resetMeasurements();
      currentFlushNesting--;
      resumeCurrentLifeCycleTimer();
      emitEvent('onEndFlush');
    },
    onBeginLifeCycleTimer(debugID, timerType) {
      checkDebugID(debugID);
      emitEvent('onBeginLifeCycleTimer', debugID, timerType);
      beginLifeCycleTimer(debugID, timerType);
    },
    onEndLifeCycleTimer(debugID, timerType) {
      checkDebugID(debugID);
      endLifeCycleTimer(debugID, timerType);
      emitEvent('onEndLifeCycleTimer', debugID, timerType);
    },
    onBeginReconcilerTimer(debugID, timerType) {
      checkDebugID(debugID);
      emitEvent('onBeginReconcilerTimer', debugID, timerType);
    },
    onEndReconcilerTimer(debugID, timerType) {
      checkDebugID(debugID);
      emitEvent('onEndReconcilerTimer', debugID, timerType);
    },
    onError(debugID) {
      if (currentTimerDebugID != null) {
        endLifeCycleTimer(currentTimerDebugID, currentTimerType);
      }
      emitEvent('onError', debugID);
    },
    onBeginProcessingChildContext() {
      emitEvent('onBeginProcessingChildContext');
    },
    onEndProcessingChildContext() {
      emitEvent('onEndProcessingChildContext');
    },
    onHostOperation(debugID, type, payload) {
      checkDebugID(debugID);
      emitEvent('onHostOperation', debugID, type, payload);
    },
    onComponentHasMounted(debugID) {
      checkDebugID(debugID);
      emitEvent('onComponentHasMounted', debugID);
    },
    onComponentHasUpdated(debugID) {
      checkDebugID(debugID);
      emitEvent('onComponentHasUpdated', debugID);
    },
    onSetState() {
      emitEvent('onSetState');
    },
    onSetDisplayName(debugID, displayName) {
      checkDebugID(debugID);
      emitEvent('onSetDisplayName', debugID, displayName);
    },
    onSetChildren(debugID, childDebugIDs) {
      checkDebugID(debugID);
      childDebugIDs.forEach(checkDebugID);
      emitEvent('onSetChildren', debugID, childDebugIDs);
    },
    onSetOwner(debugID, ownerDebugID) {
      checkDebugID(debugID);
      emitEvent('onSetOwner', debugID, ownerDebugID);
    },
    onSetParent(debugID, parentDebugID) {
      checkDebugID(debugID);
      emitEvent('onSetParent', debugID, parentDebugID);
    },
    onSetText(debugID, text) {
      checkDebugID(debugID);
      emitEvent('onSetText', debugID, text);
    },
    onMountRootComponent(debugID) {
      checkDebugID(debugID);
      emitEvent('onMountRootComponent', debugID);
    },
    onBeforeMountComponent(debugID, element) {
      checkDebugID(debugID);
      emitEvent('onBeforeMountComponent', debugID, element);
    },
    onMountComponent(debugID) {
      checkDebugID(debugID);
      emitEvent('onMountComponent', debugID);
    },
    onBeforeUpdateComponent(debugID, element) {
      checkDebugID(debugID);
      emitEvent('onBeforeUpdateComponent', debugID, element);
    },
    onUpdateComponent(debugID) {
      checkDebugID(debugID);
      emitEvent('onUpdateComponent', debugID);
    },
    onUnmountComponent(debugID) {
      checkDebugID(debugID);
      emitEvent('onUnmountComponent', debugID);
    },
    onTestEvent() {
      emitEvent('onTestEvent');
    },
  };

  ReactDebugToolDev.addDevtool(ReactInvalidSetStateWarningDevToolDev);
  ReactDebugToolDev.addDevtool(ReactComponentTreeDevtoolDev);
  ReactDebugToolDev.addDevtool(ReactChildrenMutationWarningDevtoolDev);
  var url = (ExecutionEnvironment.canUseDOM && window.location.href) || '';
  if ((/[?&]react_perf\b/).test(url)) {
    ReactDebugToolDev.beginProfiling();
  }
}

module.exports = ReactDebugToolDev;

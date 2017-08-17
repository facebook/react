/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ChangeEventPlugin
 */

'use strict';

var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment');
var ReactControlledComponent = require('ReactControlledComponent');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var SyntheticEvent = require('SyntheticEvent');
var getActiveElement = require('fbjs/lib/getActiveElement');

var inputValueTracking = require('inputValueTracking');
var isTextInputElement = require('isTextInputElement');

var eventTypes = {
  change: {
    phasedRegistrationNames: {
      bubbled: 'onChange',
      captured: 'onChangeCapture',
    },
    dependencies: [
      'topBlur',
      'topChange',
      'topClick',
      'topFocus',
      'topInput',
      'topKeyDown',
      'topKeyUp',
      'topSelectionChange',
    ],
  },
};

function shouldUseChangeEvent(elem) {
  var nodeName = elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName === 'select' || (nodeName === 'input' && elem.type === 'file')
  );
}

function createAndAccumulateChangeEvent(
  inst,
  nativeEvent,
  nativeEventTarget,
  virtualTarget,
) {
  var event = SyntheticEvent.getPooled(
    eventTypes.change,
    inst,
    nativeEvent,
    nativeEventTarget,
  );
  event.type = 'change';
  // Flag this event loop as needing state restore.
  ReactControlledComponent.enqueueStateRestore(virtualTarget);
  EventPropagators.accumulateTwoPhaseDispatches(event);
  return event;
}

function getInstIfValueChanged(targetInst, targetNode) {
  if (inputValueTracking.updateValueIfChanged(targetNode)) {
    return targetInst;
  }
}

/**
 * SECTION: handle `input` event
 */

var isTextInputEventSupported = false;
if (ExecutionEnvironment.canUseDOM) {
  isTextInputEventSupported =
    !document.documentMode || document.documentMode > 9;
}

function getTargetInstForInputEventPolyfill(
  topLevelType,
  targetInst,
  targetNode,
) {
  if (
    topLevelType === 'topInput' ||
    topLevelType === 'topChange' ||
    // These events catch anything the IE9 onInput misses
    topLevelType === 'topSelectionChange' ||
    topLevelType === 'topKeyUp' ||
    topLevelType === 'topKeyDown'
  ) {
    return getInstIfValueChanged(targetInst, targetNode);
  }
}

function getTargetInstForInputOrChangeEvent(
  topLevelType,
  targetInst,
  targetNode,
) {
  if (topLevelType === 'topInput' || topLevelType === 'topChange') {
    return getInstIfValueChanged(targetInst, targetNode);
  }
}

function getTargetInstForChangeEvent(topLevelType, targetInst, targetNode) {
  if (topLevelType === 'topChange') {
    return getInstIfValueChanged(targetInst, targetNode);
  }
}

function handleControlledInputBlur(inst, node) {
  // TODO: In IE, inst is occasionally null. Why?
  if (inst == null) {
    return;
  }

  // Fiber and ReactDOM keep wrapper state in separate places
  let state = inst._wrapperState || node._wrapperState;

  if (!state || !state.controlled || node.type !== 'number') {
    return;
  }

  // If controlled, assign the value attribute to the current value on blur
  let value = '' + node.value;
  if (node.getAttribute('value') !== value) {
    node.setAttribute('value', value);
  }
}

/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `isTextInputElement`)
 * - textarea
 * - select
 */
var ChangeEventPlugin = {
  eventTypes: eventTypes,

  extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var targetNode = targetInst
      ? ReactDOMComponentTree.getNodeFromInstance(targetInst)
      : window;

    // On the selectionchange event, the target is the document which isn't
    // helpful becasue we need the input, so we use the activeElement instead.
    if (!isTextInputEventSupported && topLevelType === 'topSelectionChange') {
      nativeEventTarget = targetNode = getActiveElement();

      if (targetNode) {
        targetInst = ReactDOMComponentTree.getInstanceFromNode(targetNode);
      }
    }

    var getTargetInstFunc, handleEventFunc;

    if (shouldUseChangeEvent(targetNode)) {
      getTargetInstFunc = getTargetInstForChangeEvent;
    } else if (isTextInputElement(targetNode) && !isTextInputEventSupported) {
      getTargetInstFunc = getTargetInstForInputEventPolyfill;
    } else {
      getTargetInstFunc = getTargetInstForInputOrChangeEvent;
    }

    if (getTargetInstFunc) {
      var inst = getTargetInstFunc(topLevelType, targetInst, targetNode);
      if (inst) {
        var event = createAndAccumulateChangeEvent(
          inst,
          nativeEvent,
          nativeEventTarget,
          targetNode,
        );
        return event;
      }
    }

    if (handleEventFunc) {
      handleEventFunc(topLevelType, targetNode, targetInst);
    }

    // When blurring, set the value attribute for number inputs
    if (topLevelType === 'topBlur') {
      handleControlledInputBlur(targetInst, targetNode);
    }
  },
};

module.exports = ChangeEventPlugin;

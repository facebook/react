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

var EventConstants = require('EventConstants');
var EventPluginHub = require('EventPluginHub');
var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactUpdates = require('ReactUpdates');
var SyntheticEvent = require('SyntheticEvent');

var getEventTarget = require('getEventTarget');
var isEventSupported = require('isEventSupported');
var isTextInputElement = require('isTextInputElement');
var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;

function isCheckable(elem) {
  var type = elem.type;
  var nodeName = elem.nodeName;
  return (
    (nodeName && nodeName.toLowerCase() === 'input') &&
    (type === 'checkbox' || type === 'radio')
  );
}

var eventTypes = {
  change: {
    phasedRegistrationNames: {
      bubbled: keyOf({onChange: null}),
      captured: keyOf({onChangeCapture: null}),
    },
    dependencies: [
      topLevelTypes.topBlur,
      topLevelTypes.topChange,
      topLevelTypes.topClick,
      topLevelTypes.topFocus,
      topLevelTypes.topInput,
      topLevelTypes.topKeyDown,
      topLevelTypes.topKeyUp,
      topLevelTypes.topSelectionChange,
    ],
  },
};

var LAST_VALUE_KEY = '__reactLastInputValue';
var lastInputValue = {
  get: function(elem) {
    if (elem) {
      return elem[LAST_VALUE_KEY];
    }
  },

  set: function(elem, value) {
    if (elem) {
      // cast to a string for comparisons
      elem[LAST_VALUE_KEY] = '' + value;
    }
  },
};

function getInstIfValueChanged(targetInst, target) {
  var value = getInputValue(target);
  var lastValue = lastInputValue.get(target);

  if (!target.hasOwnProperty(LAST_VALUE_KEY) || value !== lastValue) {
    lastInputValue.set(target, value);
    return targetInst;
  }
}

function getInputValue(elem) {
  var value;

  if (elem) {
    if (isCheckable(elem)) {
      value = '' + elem.checked;
    } else {
      value = elem.value;
    }
  }
  return value;
}

/**
 * For IE shims
 */
var activeElement = null;
var activeElementInst = null;
var activeElementValue = null;
var activeElementValueProp = null;

/**
 * SECTION: handle `change` event
 */
function shouldUseChangeEvent(elem) {
  var nodeName = elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName === 'select' ||
    (nodeName === 'input' && elem.type === 'file')
  );
}

var doesChangeEventBubble = false;
if (ExecutionEnvironment.canUseDOM) {
  // See `handleChange` comment below
  doesChangeEventBubble = isEventSupported('change') && (
    !('documentMode' in document) || document.documentMode > 8
  );
}

function manualDispatchChangeEvent(nativeEvent, targetInst) {
  var event = SyntheticEvent.getPooled(
    eventTypes.change,
    targetInst,
    nativeEvent,
    getEventTarget(nativeEvent)
  );
  EventPropagators.accumulateTwoPhaseDispatches(event);

  // If change and propertychange bubbled, we'd just bind to it like all the
  // other events and have it go through ReactBrowserEventEmitter. Since it
  // doesn't, we manually listen for the events and so we have to enqueue and
  // process the abstract event manually.
  //
  // Batching is necessary here in order to ensure that all event handlers run
  // before the next rerender (including event handlers attached to ancestor
  // elements instead of directly on the input). Without this, controlled
  // components don't work properly in conjunction with event bubbling because
  // the component is rerendered and the value reverted before all the event
  // handlers can run. See https://github.com/facebook/react/issues/708.
  ReactUpdates.batchedUpdates(runEventInBatch, event);
}

function runEventInBatch(event) {
  EventPluginHub.enqueueEvents(event);
  EventPluginHub.processEventQueue(false);
}

function startWatchingForChangeEventIE8(target, targetInst) {
  activeElement = target;
  activeElementInst = targetInst;
  activeElement.attachEvent('onchange', manualDispatchChangeEvent);
}

function stopWatchingForChangeEventIE8() {
  if (!activeElement) {
    return;
  }
  activeElement.detachEvent('onchange', manualDispatchChangeEvent);
  activeElement = null;
  activeElementInst = null;
}

function getTargetInstForChangeEvent(
  topLevelType,
  targetInst,
  target
) {
  if (topLevelType === topLevelTypes.topChange) {
    return targetInst;
  }
}

function handleEventsForChangeEventIE8(
  topLevelType,
  target,
  targetInst
) {
  if (topLevelType === topLevelTypes.topFocus) {
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForChangeEventIE8();
    startWatchingForChangeEventIE8(target, targetInst);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForChangeEventIE8();
  }
}


/**
 * SECTION: handle `input` event
 */
var isInputEventSupported = false;
if (ExecutionEnvironment.canUseDOM) {
  // IE9 claims to support the input event but fails to trigger it when
  // deleting text, so we ignore its input events.
  isInputEventSupported = isEventSupported('input') && (
    !('documentMode' in document) || document.documentMode > 9
  );
}

/**
 * (For IE <=9) Replacement getter/setter for the `value` property that gets
 * set on the active element.
 */
var newValueProp = {
  get: function() {
    return activeElementValueProp.get.call(this);
  },
  set: function(val) {
    // Cast to a string so we can do equality checks.
    activeElementValue = '' + val;
    activeElementValueProp.set.call(this, val);
  },
};

function clearActiveElement() {
  activeElement = null;
  activeElementInst = null;
  activeElementValue = null;
  activeElementValueProp = null;
}

function updateActiveElement(target, targetInst) {
  activeElement = target;
  activeElementInst = targetInst;
  activeElementValue = target.value;
  activeElementValueProp = Object.getOwnPropertyDescriptor(
    target.constructor.prototype,
    'value'
  );
}

/**
 * (For IE <=9) Starts tracking propertychange events on the passed-in element
 * and override the value property so that we can distinguish user events from
 * value changes in JS.
 */
function startWatchingForValueChange(target, targetInst) {
  updateActiveElement(target, targetInst);

  // Not guarded in a canDefineProperty check: IE8 supports defineProperty only
  // on DOM elements
  Object.defineProperty(activeElement, 'value', newValueProp);
  activeElement.attachEvent('onpropertychange', handlePropertyChange);
}

/**
 * (For IE <=9) Removes the event listeners from the currently-tracked element,
 * if any exists.
 */
function stopWatchingForValueChange() {
  if (!activeElement) {
    return;
  }

  // delete restores the original property definition
  delete activeElement.value;
  activeElement.detachEvent('onpropertychange', handlePropertyChange);
  clearActiveElement();
}

/**
 * (For IE <=9) Handles a propertychange event, sending a `change` event if
 * the value of the active element has changed.
 */
function handlePropertyChange(nativeEvent) {
  if (nativeEvent.propertyName !== 'value') {
    return;
  }
  var value = nativeEvent.srcElement.value;
  if (value === activeElementValue) {
    return;
  }
  activeElementValue = value;

  manualDispatchChangeEvent(nativeEvent);
}

function handleEventsForInputEventPolyfill(
  topLevelType,
  target,
  targetInst
) {
  if (topLevelType === topLevelTypes.topFocus) {
    // In IE8, we can capture almost all .value changes by adding a
    // propertychange handler and looking for events with propertyName
    // equal to 'value'
    // In IE9, propertychange fires for most input events but is buggy and
    // doesn't fire when text is deleted, but conveniently, selectionchange
    // appears to fire in all of the remaining cases so we catch those and
    // forward the event if the value has changed
    // In either case, we don't want to call the event handler if the value
    // is changed from JS so we redefine a setter for `.value` that updates
    // our activeElementValue variable, allowing us to ignore those changes
    //
    // stopWatching() should be a noop here but we call it just in case we
    // missed a blur event somehow.
    stopWatchingForValueChange();
    startWatchingForValueChange(target, targetInst);
  } else if (topLevelType === topLevelTypes.topBlur) {
    stopWatchingForValueChange();
  }
}

// For IE8 and IE9.
function getTargetInstForInputEventPolyfill(
  topLevelType,
  targetInst
) {
  if (topLevelType === topLevelTypes.topSelectionChange ||
      topLevelType === topLevelTypes.topKeyUp ||
      topLevelType === topLevelTypes.topKeyDown) {
    // On the selectionchange event, the target is just document which isn't
    // helpful for us so just check activeElement instead.
    //
    // 99% of the time, keydown and keyup aren't necessary. IE8 fails to fire
    // propertychange on the first input event after setting `value` from a
    // script and fires only keydown, keypress, keyup. Catching keyup usually
    // gets it and catching keydown lets us fire an event for the first
    // keystroke if user does a key repeat (it'll be a little delayed: right
    // before the second keystroke). Other input methods (e.g., paste) seem to
    // fire selectionchange normally.
    if (activeElement && activeElement.value !== activeElementValue) {
      activeElementValue = activeElement.value;
      return activeElementInst;
    }
  }
}


/**
 * SECTION: handle `click` event
 */
function shouldUseClickEvent(elem) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  return isCheckable(elem);
}

function getTargetInstForClickEvent(
  topLevelType,
  targetInst,
  target
) {
  if (topLevelType === topLevelTypes.topClick) {
    return getInstIfValueChanged(targetInst, target);
  }
}

function getTargetInstForInputOrChangeEvent(
  topLevelType,
  targetInst,
  target
) {
  if (
    topLevelType === topLevelTypes.topInput ||
    topLevelType === topLevelTypes.topChange
  ) {
    return getInstIfValueChanged(targetInst, target);
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

  _isInputEventSupported: isInputEventSupported,

  willDeleteListener(inst) {
    var targetNode;

    // An uglier internal check to avoid a try/catch
    // if the instance is unmounted the node will already be removed
    if (inst._nativeNode !== null) {
      targetNode = ReactDOMComponentTree.getNodeFromInstance(inst);
    }

    if (targetNode) {
      delete targetNode.value;
    }
  },

  didPutListener: function(inst, registrationName) {
    var targetNode = ReactDOMComponentTree.getNodeFromInstance(inst);
    var valueField = isCheckable(targetNode) ? 'checked' : 'value';
    var descriptor = Object.getOwnPropertyDescriptor(
      targetNode.constructor.prototype,
      valueField
    );

    Object.defineProperty(targetNode, valueField, {
      enumerable: descriptor.enumerable,
      configurable: true,
      get: function() {
        return descriptor.get.call(this);
      },
      set: function(val) {
        lastInputValue.set(this, val);
        descriptor.set.call(this, val);
      },
    });
  },

  extractEvents: function(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    var targetNode = targetInst ?
      ReactDOMComponentTree.getNodeFromInstance(targetInst) : window;

    var getTargetInstFunc, handleEventFunc;
    if (shouldUseChangeEvent(targetNode)) {
      if (doesChangeEventBubble) {
        getTargetInstFunc = getTargetInstForChangeEvent;
      } else {
        handleEventFunc = handleEventsForChangeEventIE8;
      }
    } else if (isTextInputElement(targetNode)) {
      if (isInputEventSupported) {
        getTargetInstFunc = getTargetInstForInputOrChangeEvent;
      } else {
        getTargetInstFunc = getTargetInstForInputEventPolyfill;
        handleEventFunc = handleEventsForInputEventPolyfill;
      }
    } else if (shouldUseClickEvent(targetNode)) {
      getTargetInstFunc = getTargetInstForClickEvent;
    }

    if (getTargetInstFunc) {
      var inst = getTargetInstFunc(topLevelType, targetInst, targetNode);
      if (inst) {
        var event = SyntheticEvent.getPooled(
          eventTypes.change,
          inst,
          nativeEvent,
          nativeEventTarget
        );
        event.type = 'change';
        EventPropagators.accumulateTwoPhaseDispatches(event);
        return event;
      }
    }

    if (handleEventFunc) {
      handleEventFunc(
        topLevelType,
        targetNode,
        targetInst
      );
    }
  },

};

// exposed for testing ONLY
ChangeEventPlugin.__lastInputValue = lastInputValue;

module.exports = ChangeEventPlugin;

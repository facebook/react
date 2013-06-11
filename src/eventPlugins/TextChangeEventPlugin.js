/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule TextChangeEventPlugin
 */

"use strict";

var AbstractEvent = require('AbstractEvent');
var EventConstants = require('EventConstants');
var EventPluginHub = require('EventPluginHub');
var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');

var isEventSupported = require('isEventSupported');
var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;

var abstractEventTypes = {
  textChange: {
    phasedRegistrationNames: {
      bubbled: keyOf({onTextChange: null}),
      captured: keyOf({onTextChangeCapture: null})
    }
  }
};

// IE9 claims to support the input event but fails to trigger it when deleting
// text, so we ignore its input events
var isInputSupported;
if (ExecutionEnvironment.canUseDOM) {
  isInputSupported = isEventSupported('input') && (
    !("documentMode" in document) || document.documentMode > 9
  );
}

var hasInputCapabilities = function(elem) {
  // The HTML5 spec lists many more types than `text` and `password` on which
  // the input event is triggered but none of them exist in old IE, so we don't
  // check them here.
  // TODO: <textarea> should be supported too but IE seems to reset the
  // selection when changing textarea contents during a selectionchange event
  // so it's not listed here for now.
  return (
    elem.nodeName === 'INPUT' &&
    (elem.type === 'text' || elem.type === 'password')
  );
};

var activeElement = null;
var activeElementID = null;
var activeElementValue = null;
var activeElementValueProp = null;

// Replacement getter/setter for the `value` property for old IE that gets set
// on the active element
var newValueProp =  {
  get: function() {
    return activeElementValueProp.get.call(this);
  },
  set: function(val) {
    activeElementValue = val;
    activeElementValueProp.set.call(this, val);
  }
};

var handlePropertyChange = function(nativeEvent) {
  var value;
  var abstractEvent;

  if (nativeEvent.propertyName === "value") {
    value = nativeEvent.srcElement.value;
    if (value !== activeElementValue) {
      activeElementValue = value;

      abstractEvent = AbstractEvent.getPooled(
        abstractEventTypes.textChange,
        activeElementID,
        nativeEvent
      );
      EventPropagators.accumulateTwoPhaseDispatches(abstractEvent);
      EventPluginHub.enqueueAbstractEvents(abstractEvent);
      EventPluginHub.processAbstractEventQueue();
    }
  }
};

/**
 * @param {string} topLevelType Record from `EventConstants`.
 * @param {DOMEventTarget} topLevelTarget The listening component root node.
 * @param {string} topLevelTargetID ID of `topLevelTarget`.
 * @param {object} nativeEvent Native browser event.
 * @return {*} An accumulation of `AbstractEvent`s.
 * @see {EventPluginHub.extractAbstractEvents}
 */
var extractAbstractEvents = function(
    topLevelType,
    topLevelTarget,
    topLevelTargetID,
    nativeEvent) {
  var targetID;

  if (isInputSupported && topLevelType === topLevelTypes.topInput) {
    // In modern browsers (i.e., not IE8 or IE9), the input event is exactly
    // what we want so fall through here and trigger an abstract event...
    if (topLevelTarget.nodeName === 'TEXTAREA') {
      // ...unless it's a textarea, in which case we don't fire an event (so
      // that we have consistency with our old-IE shim).
      return;
    }
    targetID = topLevelTargetID;

  } else if (!isInputSupported && topLevelType === topLevelTypes.topFocus) {
    // In IE8, we can capture almost all .value changes by adding a
    // propertychange handler and looking for events with propertyName 'value'
    // In IE9, propertychange fires for most input events but is buggy and
    // doesn't fire when text is deleted, but conveniently, selectionchange
    // appears to fire in all of the remaining cases so we catch those and
    // forward the event if the value has changed
    // In either case, we don't want to call the event handler if the value is
    // changed from JS so we redefine a setter for `.value` that updates our
    // activeElementValue variable, allowing us to ignore those changes
    if (hasInputCapabilities(topLevelTarget)) {
      activeElement = topLevelTarget;
      activeElementID = topLevelTargetID;
      activeElementValue = topLevelTarget.value;
      activeElementValueProp = Object.getOwnPropertyDescriptor(
        topLevelTarget.constructor.prototype,
        'value'
      );

      Object.defineProperty(topLevelTarget, 'value', newValueProp);
      topLevelTarget.attachEvent('onpropertychange', handlePropertyChange);
    }
    return;

  } else if (!isInputSupported && topLevelType === topLevelTypes.topBlur) {
    // If blur is triggered due to element removal, the target is set to the
    // <html> element so ignore that and unbind from activeElement instead
    if (activeElement) {
      // delete restores the original property definition
      delete activeElement.value;
      activeElement.detachEvent('onpropertychange', handlePropertyChange);

      activeElement = null;
      activeElementID = null;
      activeElementValue = null;
      activeElementValueProp = null;
    }
    return;

  } else if (!isInputSupported && (
      topLevelType === topLevelTypes.topSelectionChange ||
      topLevelType === topLevelTypes.topKeyUp ||
      topLevelType === topLevelTypes.topKeyDown)) {
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
    if (!activeElement || activeElement.value === activeElementValue) {
      return;
    }
    activeElementValue = activeElement.value;
    targetID = activeElementID;

  } else {
    return;
  }

  // If we've made it to this point, some value change occurred
  var abstractEvent = AbstractEvent.getPooled(
    abstractEventTypes.textChange,
    targetID,
    nativeEvent
  );
  EventPropagators.accumulateTwoPhaseDispatches(abstractEvent);
  return abstractEvent;
};

var TextChangeEventPlugin = {
  abstractEventTypes: abstractEventTypes,
  extractAbstractEvents: extractAbstractEvents
};

module.exports = TextChangeEventPlugin;

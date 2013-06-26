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
 * @providesModule ChangeEventPlugin
 */

"use strict";

var EventConstants = require('EventConstants');
var EventPluginHub = require('EventPluginHub');
var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');
var SyntheticEvent = require('SyntheticEvent');

var isEventSupported = require('isEventSupported');
var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  change: {
    phasedRegistrationNames: {
      bubbled: keyOf({onChange: null}),
      captured: keyOf({onChangeCapture: null})
    }
  }
};

/**
 * For IE shims
 */
var activeElement = null;
var activeElementID = null;
var activeElementValue = null;
var activeElementValueProp = null;


/**
 * SECTION: handle `change` event
 */
var shouldUseChangeEvent = function(elem) {
  return (
    elem.nodeName === 'SELECT' ||
    (elem.nodeName === 'INPUT' && elem.type === 'file')
  );
};

var doesChangeEventBubble = false;
if (ExecutionEnvironment.canUseDOM) {
  // See `handleChange` comment below
  doesChangeEventBubble = isEventSupported('change') && (
    !('documentMode' in document) || document.documentMode > 8
  );
}

/**
 * (For IE8). The `change` event does not bubble in IE8 so we add a listener
 * when the element is focused (and remove when blurred).
 */
var handleChange = function(nativeEvent) {
  var event = SyntheticEvent.getPooled(
    eventTypes.change,
    activeElementID,
    nativeEvent
  );
  EventPropagators.accumulateTwoPhaseDispatches(event);

  // If change bubbled, we'd just bind to it like all the other events
  // and have it go through ReactEventTopLevelCallback. Since it doesn't, we
  // manually listen for the change event and so we have to enqueue and
  // process the abstract event manually.
  EventPluginHub.enqueueEvents(event);
  EventPluginHub.processEventQueue();
};

var getTargetIDForChangeEvent;
if (doesChangeEventBubble) {
  getTargetIDForChangeEvent = function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID) {
    if (topLevelType === topLevelTypes.topChange) {
      return topLevelTargetID;
    }
  };
} else {
  getTargetIDForChangeEvent = function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID) {
    if (topLevelType === topLevelTypes.topFocus) {
      activeElementID = topLevelTargetID;
      topLevelTarget.attachEvent('onchange', handleChange);
    } else if (topLevelType === topLevelTypes.topBlur) {
      topLevelTarget.detachEvent('onchange', handleChange);
      activeElementID = null;
    }
  };
}


/**
 * SECTION: handle `input` event
 */
var isInputEventSupported = false;
if (ExecutionEnvironment.canUseDOM) {
  // IE9 claims to support the input event but fails to trigger it when
  // deleting text, so we ignore its input events
  isInputEventSupported = isEventSupported('input') && (
    !('documentMode' in document) || document.documentMode > 9
  );
}


/**
 * @see http://www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary
 */
var supportedInputTypes = {
  'color': true,
  'date': true,
  'datetime': true,
  'datetime-local': true,
  'email': true,
  'month': true,
  'number': true,
  'password': true,
  'range': true,
  'search': true,
  'tel': true,
  'text': true,
  'time': true,
  'url': true,
  'week': true
};

var shouldUseInputEvent = function(elem) {
  return (
    (elem.nodeName === 'INPUT' && supportedInputTypes[elem.type]) ||
    elem.nodeName === 'TEXTAREA'
  );
};

/**
 * (For old IE.) Replacement getter/setter for the `value` property that gets
 * set on the active element.
 */
var newValueProp =  {
  get: function() {
    return activeElementValueProp.get.call(this);
  },
  set: function(val) {
    activeElementValue = val;
    activeElementValueProp.set.call(this, val);
  }
};

/**
 * (For old IE.) Starts tracking propertychange events on the passed-in element
 * and override the value property so that we can distinguish user events from
 * value changes in JS.
 */
var startWatchingForValueChange = function(target, targetID) {
  activeElement = target;
  activeElementID = targetID;
  activeElementValue = target.value;
  activeElementValueProp = Object.getOwnPropertyDescriptor(
    target.constructor.prototype,
    'value'
  );

  Object.defineProperty(activeElement, 'value', newValueProp);
  activeElement.attachEvent('onpropertychange', handlePropertyChange);
};

/**
 * (For old IE.) Removes the event listeners from the currently-tracked element,
 * if any exists.
 */
var stopWatchingForValueChange = function() {
  if (!activeElement) {
    return;
  }

  // delete restores the original property definition
  delete activeElement.value;
  activeElement.detachEvent('onpropertychange', handlePropertyChange);

  activeElement = null;
  activeElementID = null;
  activeElementValue = null;
  activeElementValueProp = null;
};

/**
 * (For old IE.) Handles a propertychange event, sending a `change` event if
 * the value of the active element has changed.
 */
var handlePropertyChange = function(nativeEvent) {
  if (nativeEvent.propertyName !== 'value') {
    return;
  }
  var value = nativeEvent.srcElement.value;
  if (value === activeElementValue) {
    return;
  }
  activeElementValue = value;

  var event = SyntheticEvent.getPooled(
    eventTypes.change,
    activeElementID,
    nativeEvent
  );
  EventPropagators.accumulateTwoPhaseDispatches(event);

  // See comment above in handleChange
  EventPluginHub.enqueueEvents(event);
  EventPluginHub.processEventQueue();
};

/**
 * If a `change` event should be fired, returns the target's ID.
 */
var getTargetIDForValueChangeEvent;
if (isInputEventSupported) {
  getTargetIDForValueChangeEvent = function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID) {
    if (topLevelType === topLevelTypes.topInput) {
      // In modern browsers (i.e., not IE8 or IE9), the input event is exactly
      // what we want so fall through here and trigger an abstract event
      return topLevelTargetID;
    }
  };
} else {
  getTargetIDForValueChangeEvent = function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID) {
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
      startWatchingForValueChange(topLevelTarget, topLevelTargetID);
    } else if (topLevelType === topLevelTypes.topBlur) {
      stopWatchingForValueChange();
    } else if (
        topLevelType === topLevelTypes.topSelectionChange ||
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
        return activeElementID;
      }
    }
  };
}


/**
 * SECTION: handle `click` event
 */
var shouldUseClickEvent = function(elem) {
  // Use the `click` event to detect changes to checkbox and radio inputs.
  // This approach works across all browsers, whereas `change` does not fire
  // until `blur` in IE8.
  return (
    elem.nodeName === 'INPUT' &&
    (elem.type === 'checkbox' || elem.type === 'radio')
  );
};

var getTargetIDForClickEvent = function(
    topLevelType,
    topLevelTarget,
    topLevelTargetID) {
  if (topLevelType === topLevelTypes.topClick) {
    return topLevelTargetID;
  }
};

/**
 * This plugin creates an `onChange` event that normalizes change events
 * across form elements. This event fires at a time when it's possible to
 * change the element's value without seeing a flicker.
 *
 * Supported elements are:
 * - input (see `supportedInputTypes`)
 * - textarea
 * - select
 */
var ChangeEventPlugin = {

  eventTypes: eventTypes,

  /**
   * @param {string} topLevelType Record from `EventConstants`.
   * @param {DOMEventTarget} topLevelTarget The listening component root node.
   * @param {string} topLevelTargetID ID of `topLevelTarget`.
   * @param {object} nativeEvent Native browser event.
   * @return {*} An accumulation of synthetic events.
   * @see {EventPluginHub.extractEvents}
   */
  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {

    var getTargetIDFunc, targetID;
    if (shouldUseChangeEvent(topLevelTarget)) {
      getTargetIDFunc = getTargetIDForChangeEvent;
    } else if (shouldUseInputEvent(topLevelTarget)) {
      getTargetIDFunc = getTargetIDForValueChangeEvent;
    } else if (shouldUseClickEvent(topLevelTarget)) {
      getTargetIDFunc = getTargetIDForClickEvent;
    }
    if (getTargetIDFunc) {
      targetID = getTargetIDFunc(
        topLevelType,
        topLevelTarget,
        topLevelTargetID
      );
    }

    if (targetID) {
      var event = SyntheticEvent.getPooled(
        eventTypes.change,
        targetID,
        nativeEvent
      );
      EventPropagators.accumulateTwoPhaseDispatches(event);
      return event;
    }
  }

};

module.exports = ChangeEventPlugin;

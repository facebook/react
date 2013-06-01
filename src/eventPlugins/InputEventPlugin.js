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
 * @providesModule InputEventPlugin
 */

"use strict";

var AbstractEvent = require('AbstractEvent');
var EventConstants = require('EventConstants');
var EventPluginUtils = require('EventPluginUtils');
var EventPropagators = require('EventPropagators');

var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;

var abstractEventTypes = {
  input: {
    phasedRegistrationNames: {
      bubbled: keyOf({onInput: null}),
      captured: keyOf({onInputCapture: null})
    }
  }
};

/**
 * @see EventPluginHub.extractAbstractEvents
 */
var extractAbstractEvents = function(
    topLevelType,
    nativeEvent,
    renderedTargetID,
    renderedTarget) {

  var defer, key;
  switch (topLevelType) {
    case topLevelTypes.topInput:
      // When the native input event is triggered, we definitely want to
      // forward it along. However, IE9's input event doesn't get triggered
      // when deleting text, and IE8 doesn't support input at all, so we
      // simulate it on change, cut, paste, and keydown.
    case topLevelTypes.topChange:
      defer = false;
      break;
    case topLevelTypes.topCut:
    case topLevelTypes.topPaste:
      defer = true;
      break;
    case topLevelTypes.topKeyDown:
      key = nativeEvent.keyCode;
      // Ignore command, modifiers, and arrow keys, respectively
      if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40)) {
        return;
      }
      defer = true;
      break;
    default:
      return;
  }

  var type = abstractEventTypes.input;
  var abstractTargetID = renderedTargetID;
  var abstractEvent = AbstractEvent.getPooled(
    type,
    abstractTargetID,
    topLevelType,
    nativeEvent
  );
  EventPropagators.accumulateTwoPhaseDispatches(abstractEvent);

  if (defer) {
    setTimeout(function() {
      EventPluginHub.enqueueAbstractEvents(abstractEvent);
      EventPluginHub.processAbstractEventQueue();
    }, 0);
  } else {
    return abstractEvent;
  }
};

var InputEventPlugin = {
  abstractEventTypes: abstractEventTypes,
  extractAbstractEvents: extractAbstractEvents
};

module.exports = InputEventPlugin;

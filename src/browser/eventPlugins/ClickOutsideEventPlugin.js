/**
 * Copyright 2013-2014 Facebook, Inc.
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
 * @providesModule ClickOutsideEventPlugin
 * @typechecks static-only
 */

"use strict";

var EventConstants = require('EventConstants');
var EventPropagators = require('EventPropagators');
var SimpleEventPlugin = require('SimpleEventPlugin');
var SyntheticMouseEvent = require('SyntheticMouseEvent');

var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;

var eventTypes = {
  clickOutside: {
    registrationName: keyOf({onClickOutside: null}),
    dependencies: [
      topLevelTypes.topClick
    ]
  }
};

var ClickOutsideEventPlugin = {

  eventTypes: eventTypes,

  // Allow the onClickOutside synthetic event to be prevented
  executeDispatch: SimpleEventPlugin.executeDispatch,

  extractEvents: function(
      topLevelType,
      topLevelTarget,
      topLevelTargetID,
      nativeEvent) {
    if (topLevelType !== topLevelTypes.topClick) {
      return null;
    }

    var event = SyntheticMouseEvent.getPooled(
      eventTypes.clickOutside,
      topLevelTargetID,
      nativeEvent
    );
    event.type = 'clickoutside';

    EventPropagators.accumulateOutsideDispatches(event);

    return event;
  }

};

module.exports = ClickOutsideEventPlugin;

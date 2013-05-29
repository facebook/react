/**
 * @providesModule EnterLeaveEventPlugin
 */

"use strict";

var EventPropagators = require('EventPropagators');
var ExecutionEnvironment = require('ExecutionEnvironment');
var AbstractEvent = require('AbstractEvent');
var EventConstants = require('EventConstants');
var ReactInstanceHandles = require('ReactInstanceHandles');

var getDOMNodeID = require('getDOMNodeID');
var keyOf = require('keyOf');

var topLevelTypes = EventConstants.topLevelTypes;
var getFirstReactDOM = ReactInstanceHandles.getFirstReactDOM;

var abstractEventTypes = {
  mouseEnter: {registrationName: keyOf({onMouseEnter: null})},
  mouseLeave: {registrationName: keyOf({onMouseLeave: null})}
};

/**
 * For almost every interaction we care about, there will be a top level
 * `mouseOver` and `mouseOut` event that occur so we can usually only pay
 * attention to one of the two (we'll pay attention to the `mouseOut` event) to
 * avoid extracting a duplicate event. However, there's one interaction where
 * there will be no `mouseOut` event to rely on - mousing from outside the
 * browser *into* the chrome. We detect this scenario and only in that case, we
 * use the `mouseOver` event.
 *
 * @see EventPluginHub.extractAbstractEvents
 */
var extractAbstractEvents = function(
    topLevelType,
    nativeEvent,
    renderedTargetID,
    renderedTarget) {

  if (topLevelType === topLevelTypes.topMouseOver &&
      (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
    return;
  }
  if (topLevelType !== topLevelTypes.topMouseOut &&
     topLevelType !== topLevelTypes.topMouseOver){
    return null;  // Must not be a mouse in or mouse out - ignoring.
  }

  var to, from;
  if (topLevelType === topLevelTypes.topMouseOut) {
    to = getFirstReactDOM(nativeEvent.relatedTarget || nativeEvent.toElement) ||
      ExecutionEnvironment.global;
    from = renderedTarget;
  } else {
    to = renderedTarget;
    from = ExecutionEnvironment.global;
  }

  // Nothing pertains to our managed components.
  if (from === to ) {
    return;
  }

  var fromID = from ? getDOMNodeID(from) : '';
  var toID = to ? getDOMNodeID(to) : '';
  var leave = AbstractEvent.getPooled(
    abstractEventTypes.mouseLeave,
    fromID,
    topLevelType,
    nativeEvent
  );
  var enter = AbstractEvent.getPooled(
    abstractEventTypes.mouseEnter,
    toID,
    topLevelType,
    nativeEvent
  );
  EventPropagators.accumulateEnterLeaveDispatches(leave, enter, fromID, toID);
  return [leave, enter];
};

var EnterLeaveEventPlugin = {
  abstractEventTypes: abstractEventTypes,
  extractAbstractEvents: extractAbstractEvents
};

module.exports = EnterLeaveEventPlugin;

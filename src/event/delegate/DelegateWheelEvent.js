/**
 * @providesModule DelegateWheelEvent
 * @typechecks
 */

var DelegateMouseEvent = require('DelegateMouseEvent');

/**
 * @interface WheelEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var WheelEventInterface = {
  deltaX: function(event) {
    // NOTE: IE<9 does not support x-axis delta.
    return (
      'deltaX' in event ? event.deltaX :
      // Fallback to `wheelDeltaX` for Webkit and normalize (right is positive).
      'wheelDeltaX' in event ? -event.wheelDeltaX : 0
    );
  },
  deltaY: function(event) {
    return (
      // Normalize (up is positive).
      'deltaY' in event ? -event.deltaY :
      // Fallback to `wheelDeltaY` for Webkit.
      'wheelDeltaY' in event ? event.wheelDeltaY :
      // Fallback to `wheelDelta` for IE<9.
      'wheelDelta' in event ? event.wheelData : 0
    );
  },
  deltaZ: null,
  deltaMode: null
};

/**
 * @param {object} delegateConfig Configuration used by top-level delegation.
 * @param {string} delegateMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {DelegateMouseEvent}
 */
function DelegateWheelEvent(delegateConfig, delegateMarker, nativeEvent) {
  DelegateMouseEvent.call(this, delegateConfig, delegateMarker, nativeEvent);
}

DelegateMouseEvent.augmentClass(DelegateWheelEvent, WheelEventInterface);

module.exports = DelegateWheelEvent;

/**
 * @providesModule DelegateTouchEvent
 * @typechecks
 */

var DelegateUIEvent = require('DelegateUIEvent');

/**
 * @interface TouchEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var TouchEventInterface = {
  touches: null,
  targetTouches: null,
  changedTouches: null,
  altKey: null,
  metaKey: null,
  ctrlKey: null,
  shiftKey: null
};

/**
 * @param {object} reactEventType See `EventPluginHub`.
 * @param {string} reactTargetID ID of the target component.
 * @param {object} nativeEvent Native browser event.
 * @extends {DelegateUIEvent}
 */
function DelegateTouchEvent(reactEventType, reactTargetID, nativeEvent) {
  DelegateUIEvent.call(this, reactEventType, reactTargetID, nativeEvent);
}

DelegateUIEvent.augmentClass(DelegateTouchEvent, TouchEventInterface);

module.exports = DelegateTouchEvent;

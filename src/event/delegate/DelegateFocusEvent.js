/**
 * @providesModule DelegateFocusEvent
 * @typechecks
 */

var DelegateUIEvent = require('DelegateUIEvent');

/**
 * @interface FocusEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var FocusEventInterface = {
  relatedTarget: null
};

/**
 * @param {object} reactEventType See `EventPluginHub`.
 * @param {string} reactTargetID ID of the target component.
 * @param {object} nativeEvent Native browser event.
 * @extends {DelegateUIEvent}
 */
function DelegateFocusEvent(reactEventType, reactTargetID, nativeEvent) {
  DelegateUIEvent.call(this, reactEventType, reactTargetID, nativeEvent);
}

DelegateUIEvent.augmentClass(DelegateFocusEvent, FocusEventInterface);

module.exports = DelegateFocusEvent;

/**
 * @providesModule DelegateKeyboardEvent
 * @typechecks
 */

var DelegateUIEvent = require('DelegateUIEvent');

/**
 * @interface KeyboardEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var KeyboardEventInterface = {
  char: null,
  key: null,
  location: null,
  ctrlKey: null,
  shiftKey: null,
  altKey: null,
  metaKey: null,
  repeat: null,
  locale: null,
  // Legacy Interface
  charCode: null,
  keyCode: null,
  which: null
};

/**
 * @param {object} reactEventType See `EventPluginHub`.
 * @param {string} reactTargetID ID of the target component.
 * @param {object} nativeEvent Native browser event.
 * @extends {DelegateUIEvent}
 */
function DelegateKeyboardEvent(reactEventType, reactTargetID, nativeEvent) {
  DelegateUIEvent.call(this, reactEventType, reactTargetID, nativeEvent);
}

DelegateUIEvent.augmentClass(DelegateKeyboardEvent, KeyboardEventInterface);

module.exports = DelegateKeyboardEvent;

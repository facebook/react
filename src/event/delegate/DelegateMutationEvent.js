/**
 * @providesModule DelegateMutationEvent
 * @typechecks
 */

var DelegateEvent = require('DelegateEvent');

/**
 * @interface MutationEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var MutationEventInterface = {
  relatedNode: null,
  prevValue: null,
  newValue: null,
  attrName: null,
  attrChange: null
};

/**
 * @param {object} reactEventType See `EventPluginHub`.
 * @param {string} reactTargetID ID of the target component.
 * @param {object} nativeEvent Native browser event.
 * @extends {DelegateEvent}
 */
function DelegateMutationEvent(reactEventType, reactTargetID, nativeEvent) {
  DelegateEvent.call(this, reactEventType, reactTargetID, nativeEvent);
}

DelegateEvent.augmentClass(DelegateMutationEvent, MutationEventInterface);

module.exports = DelegateMutationEvent;

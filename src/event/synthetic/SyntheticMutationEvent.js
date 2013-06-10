/**
 * @providesModule SyntheticMutationEvent
 * @typechecks
 */

var SyntheticEvent = require('SyntheticEvent');

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
 * @param {object} dispatchConfig Configuration used to dispatch this event.
 * @param {string} dispatchMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {SyntheticEvent}
 */
function SyntheticMutationEvent(dispatchConfig, dispatchMarker, nativeEvent) {
  SyntheticEvent.call(this, dispatchConfig, dispatchMarker, nativeEvent);
}

SyntheticEvent.augmentClass(SyntheticMutationEvent, MutationEventInterface);

module.exports = SyntheticMutationEvent;

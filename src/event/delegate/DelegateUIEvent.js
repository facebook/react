/**
 * @providesModule DelegateUIEvent
 * @typechecks
 */

var DelegateEvent = require('DelegateEvent');

/**
 * @interface UIEvent
 * @see http://www.w3.org/TR/DOM-Level-3-Events/
 */
var UIEventInterface = {
  view: null,
  detail: null
};

/**
 * @param {object} delegateConfig Configuration used by top-level delegation.
 * @param {string} delegateMarker Marker identifying the event target.
 * @param {object} nativeEvent Native browser event.
 * @extends {DelegateEvent}
 */
function DelegateUIEvent(delegateConfig, delegateMarker, nativeEvent) {
  DelegateEvent.call(this, delegateConfig, delegateMarker, nativeEvent);
}

DelegateEvent.augmentClass(DelegateUIEvent, UIEventInterface);

module.exports = DelegateUIEvent;

/**
 * @providesModule EventConstants
 */

"use strict";

var keyMirror = require('keyMirror');

var PropagationPhases = keyMirror({bubbled: null, captured: null});

/**
 * Types of raw signals from the browser caught at the top level.
 */
var topLevelTypes = keyMirror({
  topBlur: null,
  topChange: null,
  topClick: null,
  topDOMCharacterDataModified: null,
  topDoubleClick: null,
  topFocus: null,
  topKeyDown: null,
  topKeyPress: null,
  topKeyUp: null,
  topMouseDown: null,
  topMouseMove: null,
  topMouseOut: null,
  topMouseOver: null,
  topMouseUp: null,
  topMouseWheel: null,
  topScroll: null,
  topSubmit: null,
  topTouchCancel: null,
  topTouchEnd: null,
  topTouchMove: null,
  topTouchStart: null
});

var EventConstants = {
  topLevelTypes: topLevelTypes,
  PropagationPhases: PropagationPhases
};

module.exports = EventConstants;

/**
 * @providesModule isEventSupported
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');

var testNode;
if (ExecutionEnvironment.canUseDOM) {
  testNode = document.createElement('div');
}

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @param {?boolean} capture Check if the capture phase is supported.
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported(eventNameSuffix, capture) {
  if (!testNode || (capture && !testNode.addEventListener)) {
    return false;
  }
  var element = document.createElement('div');
  var eventName = 'on' + eventNameSuffix;
  var isSupported = eventName in element;

  if (!isSupported) {
    element.setAttribute(eventName, '');
    isSupported = typeof element[eventName] === 'function';
    if (typeof element[eventName] !== 'undefined') {
      element[eventName] = undefined;
    }
    element.removeAttribute(eventName);
  }
  element = null;
  return isSupported;
}

module.exports = isEventSupported;

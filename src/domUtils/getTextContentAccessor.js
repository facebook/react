/**
 * @providesModule getTextContentAccessor
 */

"use strict";

var ExecutionEnvironment = require('ExecutionEnvironment');

var contentKey = null;

/**
 * Gets the key used to access text content on a DOM node.
 *
 * @return {?string} Key used to access text content.
 * @internal
 */
function getTextContentAccessor() {
  if (!contentKey && ExecutionEnvironment.canUseDOM) {
    contentKey = 'innerText' in document.createElement('div') ?
      'innerText' :
      'textContent';
  }
  return contentKey;
}

module.exports = getTextContentAccessor;

/**
 * @providesModule $
 */

var ge = require('ge');

/**
 * Find a node by ID.
 *
 * If your application code depends on the existence of the element, use $,
 * which will throw if the element doesn't exist.
 *
 * If you're not sure whether or not the element exists, use ge instead, and
 * manually check for the element's existence in your application code.
 */
function $(arg) {
  var element = ge(arg);
  if (!element) {
    if (typeof arg == 'undefined') {
      arg = 'undefined';
    } else if (arg === null) {
      arg = 'null';
    }
    throw new Error(
      'Tried to get element "' + arg.toString() + '" but it is not present ' +
      'on the page.'
    );
  }
  return element;
}

module.exports = $;

var baseToString = require('./baseToString'),
    createPadding = require('./createPadding');

/**
 * Creates a function for `_.padLeft` or `_.padRight`.
 *
 * @private
 * @param {boolean} [fromRight] Specify padding from the right.
 * @returns {Function} Returns the new pad function.
 */
function createPadDir(fromRight) {
  return function(string, length, chars) {
    string = baseToString(string);
    return (fromRight ? string : '') + createPadding(string, length, chars) + (fromRight ? '' : string);
  };
}

module.exports = createPadDir;

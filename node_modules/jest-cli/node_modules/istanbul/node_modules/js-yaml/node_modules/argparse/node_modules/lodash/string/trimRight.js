var baseToString = require('../internal/baseToString'),
    charsRightIndex = require('../internal/charsRightIndex'),
    isIterateeCall = require('../internal/isIterateeCall'),
    trimmedRightIndex = require('../internal/trimmedRightIndex');

/**
 * Removes trailing whitespace or specified characters from `string`.
 *
 * @static
 * @memberOf _
 * @category String
 * @param {string} [string=''] The string to trim.
 * @param {string} [chars=whitespace] The characters to trim.
 * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.
 * @returns {string} Returns the trimmed string.
 * @example
 *
 * _.trimRight('  abc  ');
 * // => '  abc'
 *
 * _.trimRight('-_-abc-_-', '_-');
 * // => '-_-abc'
 */
function trimRight(string, chars, guard) {
  var value = string;
  string = baseToString(string);
  if (!string) {
    return string;
  }
  if (guard ? isIterateeCall(value, chars, guard) : chars == null) {
    return string.slice(0, trimmedRightIndex(string) + 1);
  }
  return string.slice(0, charsRightIndex(string, (chars + '')) + 1);
}

module.exports = trimRight;

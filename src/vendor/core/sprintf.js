/**
 * @providesModule sprintf
 * @typechecks
 */

/**
 * Simple function for formatting strings.
 *
 * Replaces placeholders with values passed as extra arguments
 *
 * @param {string} format the base string
 * @param ...args the values to insert
 * @returns {string} the replaced string
 */
function sprintf(format, ...args) {
  var index = 0;
  return format.replace(/%s/g, match => args[index++]);
}

module.exports = sprintf;

/**
 * @providesModule invariant
 */

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf style format and arguments to provide information about
 * what broke and what you were expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

function invariant(condition) {
  if (!condition) {
    throw new Error('Invariant Violation');
  }
}

module.exports = invariant;

if (__DEV__) {
  var invariantDev = function(condition, format, a, b, c, d, e, f) {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }

    if (!condition) {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      throw new Error(
        'Invariant Violation: ' +
        format.replace(/%s/g, function() { return args[argIndex++]; })
      );
    }
  };

  module.exports = invariantDev;
}

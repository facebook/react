/**
 * @providesModule throwIf
 */

"use strict";

var throwIf = function(condition, err) {
  if (condition) {
    throw new Error(err);
  }
};

module.exports = throwIf;

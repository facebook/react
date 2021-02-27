/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _assign = require('object-assign');

var lowPriorityWarning = require('./lowPriorityWarning');

/**
 * This will log a single deprecation notice per function and forward the call
 * on to the new API.
 *
 * @param {string} fnName The name of the function
 * @param {string} newModule The module that fn will exist in
 * @param {string} newPackage The module that fn will exist in
 * @param {*} ctx The context this forwarded call should run in
 * @param {function} fn The function to forward on to
 * @return {function} The function that will warn once and then call fn
 */
function deprecated(fnName, newModule, newPackage, ctx, fn) {
  var warned = false;
  if (process.env.NODE_ENV !== 'production') {
    var newFn = function () {
      lowPriorityWarning(warned,
      /* eslint-disable no-useless-concat */
      // Require examples in this string must be split to prevent React's
      // build tools from mistaking them for real requires.
      // Otherwise the build tools will attempt to build a '%s' module.
      'React.%s is deprecated. Please use %s.%s from require' + "('%s') " + 'instead.', fnName, newModule, fnName, newPackage);
      /* eslint-enable no-useless-concat */
      warned = true;
      return fn.apply(ctx, arguments);
    };
    // We need to make sure all properties of the original fn are copied over.
    // In particular, this is needed to support PropTypes
    _assign(newFn, fn);

    // Flow is not smart enough to figure out that newFn is of the same type as
    // fn. Since we don't want to lose out the type of the function, casting
    // to any and force flow to use T.
    return newFn;
  }

  return fn;
}

module.exports = deprecated;
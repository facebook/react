/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule deprecated
 */

'use strict';

var assign = require('Object.assign');
var warning = require('warning');

/**
 * This will log a single deprecation notice per function and forward the call
 * on to the new API.
 *
 * @param {string} fnName The name of the function
 * @param {string} newModule The module that fn will exist in
 * @param {*} ctx The context this forwarded call should run in
 * @param {function} fn The function to forward on to
 * @return {function} The function that will warn once and then call fn
 */
function deprecated(fnName, newModule, ctx, fn) {
  var warned = false;
  if (__DEV__) {
    var newFn = function() {
      warning(
        warned,
        // Require examples in this string must be split to prevent React's
        // build tools from mistaking them for real requires.
        // Otherwise the build tools will attempt to build a '%s' module.
        '`require' + '("react").%s` is deprecated. Please use `require' + '("%s").%s` ' +
        'instead.',
        fnName,
        newModule,
        fnName
      );
      warned = true;
      return fn.apply(ctx, arguments);
    };
    // We need to make sure all properties of the original fn are copied over.
    // In particular, this is needed to support PropTypes
    return assign(newFn, fn);
  }

  return fn;
}

module.exports = deprecated;

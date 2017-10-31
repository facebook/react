/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* globals MSApp */

'use strict';

/**
 * Create a function which has 'unsafe' privileges (required by windows8 apps)
 */
var createMicrosoftUnsafeLocalFunction = function(func) {
  if (typeof MSApp !== 'undefined' && MSApp.execUnsafeLocalFunction) {
    return function(arg0, arg1, arg2, arg3) {
      MSApp.execUnsafeLocalFunction(function() {
        return func(arg0, arg1, arg2, arg3);
      });
    };
  } else {
    return func;
  }
};

export default createMicrosoftUnsafeLocalFunction;

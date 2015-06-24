/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Object.freeze
 */

// http://www.ecma-international.org/ecma-262/5.1/#sec-15.2.3.9
// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.freeze

'use strict';

var nativeFreeze = typeof Object.freeze === 'function' && Object.freeze;

function freeze(object) {
  // ES5 and ES6 have different behaviors when object is not an Object.
  //   - ES5 Throw a TypeError
  //   - ES6 Return object
  // Within React, using freeze() on a non-object is most likely to be an error
  // so this method throws.
  if (Object(object) !== object) {
    throw new TypeError('freeze can only be called an Object');
  }

  // Freeze if possible, but don't error if it is not implemented.
  if (nativeFreeze) {
    nativeFreeze(object);
  }

  return object;
}

module.exports = freeze;

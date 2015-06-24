/**
 * Copyright 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Object.create
 */

// https://people.mozilla.org/~jorendorff/es6-draft.html#sec-object.create

'use strict';

var nativeCreate = typeof Object.create === 'function' && Object.create;

var Type = function() {};

function create(prototype, properties) {
  if (prototype == null) {
    throw new TypeError('This create() implementation cannot create empty objects with create(null)');
  }

  if (typeof prototype !== 'object' && typeof prototype !== 'function') {
    throw new TypeError('Object prototype may only be an Object');
  }

  if (properties) {
    throw new TypeError('This create() implementation does not support assigning properties');
  }

  var object;
  if ( nativeCreate ) {
    object = nativeCreate(prototype);
  } else {
    Type.prototype = prototype;
    object = new Type();
    Type.prototype = null;
  }

  return object;
}

module.exports = create;

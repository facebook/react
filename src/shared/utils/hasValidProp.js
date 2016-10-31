/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule hasValidProp
 */

'use strict';

function hasValidProp(name: string) {
  return function(object: Object) {
    if (__DEV__ && hasOwnProperty.call(object, name)) {
      var getter = Object.getOwnPropertyDescriptor(object, name).get;
      if (getter && getter.isReactWarning) {
        return false;
      }
    }
    return object[name] !== undefined;
  };
}

module.exports = hasValidProp;

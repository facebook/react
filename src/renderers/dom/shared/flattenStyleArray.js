/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule flattenStyleArray
 * @flow
 */

'use strict';

type NestedStylesArray = Array<Object | NestedStylesArray | null | false>;

var result = {};

function flattenStyleArray(nestedStylesArray: NestedStylesArray): Object {
  nestedStylesArray.forEach((styleObjOrArray) => {
    if (Array.isArray(styleObjOrArray)) {
      flattenStyleArray(styleObjOrArray);
    } else if (typeof styleObjOrArray === 'object' &&
               styleObjOrArray !== null) {
      // it is an object
      // reassigning this value helps Flow remember that it is not null
      var styleObj = styleObjOrArray;
      Object.keys(styleObjOrArray).forEach(styleName => {
        result[styleName] = styleObj[styleName];
      });
    }
  });

  return result;
}

module.exports = flattenStyleArray;

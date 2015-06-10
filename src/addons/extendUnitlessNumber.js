/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule extendUnitlessNumber
 */
/**
 * This module provide a method to modify `CSSProperty.isUnitlessNumber`.
 * CSS properties which accept numbers but are not in units of "px" defined in `isUnitlessNumber`, but `isUnitlessNumber` just contains part of unitless CSS properties.
 * So we can add our unitless properties by `extendUnitlessNumber` method
 */
'use strict';

var CSSProperty = require('CSSProperty');

function extendUnitlessNumber(properties){

  function prefixKey(prefix, key) {
    return prefix + key.charAt(0).toUpperCase() + key.substring(1);
  }

  var prefixes = ['Webkit', 'ms', 'Moz', 'O'];

  var isUnitlessNumber = CSSProperty.isUnitlessNumber;

  Object.keys(properties).forEach(function(prop) {

    isUnitlessNumber[prop] = properties[prop];

    prefixes.forEach(function(prefix) {
      isUnitlessNumber[prefixKey(prefix, prop)] = properties[prop];
    });
  });

  return isUnitlessNumber;
}

module.exports = extendUnitlessNumber;

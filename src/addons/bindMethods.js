/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
* @providesModule bindMethods
*/

'use strict';

/**
 * Helper method to force bind methods to object
 * This helper simplifies binding compoment's handlers since ES6 Component classes has no autobinding.
 *
 * @param {Object} self object with the methods that we want to bind.
 * @param {Array} methods names to bind to the given self.
 **/
function bindMethods(self, methods) {
  methods.forEach(function(method) {
    self[method] = self[method].bind(self);
  });
}

module.exports = bindMethods;

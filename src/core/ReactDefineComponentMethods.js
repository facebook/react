/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDefineComponentMethods
 */

"use strict";

var ReactCompositeComponentInterface =
  require('ReactCompositeComponentInterface');

var ReactSpecPolicy = require('ReactSpecPolicy');

/**
 * Allows to define new methods for all React components
 * and sets policy that describes these methods
 * */
var ReactDefineComponentMethods = {

  /**
   * Defines new methods and its policies for React components.
   *
   * @param {string} methodName New method name.
   * @param {string} policy The policy that should be applied to a new method.
   * @public
   */
  define: function(methodName, policy) {
    if (!ReactSpecPolicy.hasOwnProperty(policy)) {
      throw new Error('There is no appropriate policy ' +
        'to the one you\'ve provided');
    }

    if (ReactCompositeComponentInterface.hasOwnProperty(methodName)) {
      throw new Error('It is unacceptable ' +
        'to redefine standard React component methods');
    }

    ReactCompositeComponentInterface[methodName] = ReactSpecPolicy[policy];
  }
};

module.exports = ReactDefineComponentMethods;
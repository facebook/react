/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule BaseDefinition
 */

'use strict';

var mergeMethod = require('mergeMethod');

function BaseDefinition() {
  this.initialState = function(stateObj) {
    mergeMethod(this, 'getInitialState', function() {
      return stateObj;
    });
  };

  this.defaultProps = function(propsObj) {
    mergeMethod(this, 'getDefaultProps', function() {
      return propsObj;
    });
  };
}

module.exports = BaseDefinition;

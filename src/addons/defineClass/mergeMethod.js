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
 * @providesModule mergeMethod
 */

'use strict';

var ReactCompositeComponent = require('ReactCompositeComponent');
var SpecPolicy = ReactCompositeComponent.SpecPolicy;
var ReactCompositeComponentInterface = ReactCompositeComponent.Interface;
var invariant = require('invariant');
var objMap = require('objMap');
var createMergedResultFunction = require('createMergedResultFunction');
var createChainedFunction = require('createChainedFunction');

function mergeMethod(spec, name, fn) {
  if (spec[name] == null) {
    spec[name] = fn;
  } else {
    var specPolicy = ReactCompositeComponentInterface[name];
    invariant(
      typeof spec[name] === 'function' && (
        specPolicy === SpecPolicy.DEFINE_MANY ||
        specPolicy === SpecPolicy.DEFINE_MANY_MERGED
      ),
      'mergeMethod: You are attempting to define %s more than once, or it is ' +
      'not a function. This conflict might be due to a mixin.',
      name
    );
    if (specPolicy === SpecPolicy.DEFINE_MANY_MERGED) {
      spec[name] = createMergedResultFunction(spec[name], fn);
    } else {
      spec[name] = createChainedFunction(spec[name], fn);
    }
  }
}

module.exports = mergeMethod;

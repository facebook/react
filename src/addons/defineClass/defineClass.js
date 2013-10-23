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
 * @providesModule defineClass
 */

"use strict";

/**
 * A 'definition' is a function which is invoked with a spec as its context.
 * Therefore, all definitions are mixins, insofar as multiple definitions can
 * be called on the same spec.
 */

var BaseDefinition = require('BaseDefinition');
var AdviceDefinition = require('AdviceDefinition');
var ReactCompositeComponent = require('ReactCompositeComponent');

/**
 * Adds a definition to the spec if it hasn't already been added.
 *
 * @param {object} spec
 * @param {function} definition
 */
function addDefinition(spec, definition) {
  if (spec._definitions.indexOf(definition) === -1) {
    definition.call(spec);
    spec._definitions.push(definition);
  }
}

/**
 * Creates a composite component given one or more definitions. 
 *
 * @param {...[function]} definitions
 * @return {function} Component constructor function.
 * @public
 */
function defineClass(/* ...definitions */) {
  var spec = {
    _definitions: []
  };
  addDefinition(spec, BaseDefinition);
  addDefinition(spec, AdviceDefinition);
  for (var i = 0, l = arguments.length; i < l; i++) {
    addDefinition(spec, arguments[i]);
  }

  return ReactCompositeComponent.createClass(spec);
}

module.exports = defineClass;

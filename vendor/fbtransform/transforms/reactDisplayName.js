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
 */
/*global exports:true*/
"use strict";

var Syntax = require('esprima-fb').Syntax;
var utils = require('jstransform/src/utils');

/**
 * Transforms the following:
 *
 * var MyComponent = React.createClass({
 *    render: ...
 * });
 *
 * into:
 *
 * var MyComponent = React.createClass({
 *    displayName: 'MyComponent',
 *    render: ...
 * });
 */
function visitReactDisplayName(traverse, object, path, state) {
  var displayName = object.id.name;
  utils.catchup(object.init['arguments'][0].range[0] + 1, state);
  utils.append("displayName: '" + displayName + "',", state);
}

/**
 * Will only run on @jsx files for now.
 */
visitReactDisplayName.test = function(object, path, state) {
  if (!!utils.getDocblock(state).jsx &&
      object.type === Syntax.VariableDeclarator &&
      object.id.type === Syntax.Identifier &&
      object.init &&
      object.init.type === Syntax.CallExpression &&
      object.init.callee.type === Syntax.MemberExpression &&
      object.init.callee.object.type === Syntax.Identifier &&
      object.init.callee.object.name === 'React' &&
      object.init.callee.property.type === Syntax.Identifier &&
      object.init.callee.property.name === 'createClass' &&
      object.init['arguments'].length === 1 &&
      object.init['arguments'][0].type === Syntax.ObjectExpression) {

    // Verify that the displayName property isn't already set
    var properties = object.init['arguments'][0].properties;
    return properties.reduce(function (safe, property) {
      var value = property.key.type === 'Identifier'
        ? property.key.name
        : property.key.value;
      return safe && value !== 'displayName';
    }, true);
  }
  return false;
};

exports.visitReactDisplayName = visitReactDisplayName;

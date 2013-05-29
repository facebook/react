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

var Syntax = require('esprima').Syntax;
var catchup = require('../lib/utils').catchup;
var append = require('../lib/utils').append;
var getDocblock = require('../lib/utils').getDocblock;

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
  object.declarations.forEach(function(dec) {
    if (dec.type === Syntax.VariableDeclarator &&
        dec.id.type === Syntax.Identifier &&
        dec.init &&
        dec.init.type === Syntax.CallExpression &&
        dec.init.callee.type === Syntax.MemberExpression &&
        dec.init.callee.object.type === Syntax.Identifier &&
        dec.init.callee.object.name === 'React' &&
        dec.init.callee.property.type === Syntax.Identifier &&
        dec.init.callee.property.name === 'createClass' &&
        dec.init['arguments'].length === 1 &&
        dec.init['arguments'][0].type === Syntax.ObjectExpression) {

      var displayName = dec.id.name;
      catchup(dec.init['arguments'][0].range[0] + 1, state);
      append("displayName: '" + displayName + "',", state);
    }
  });
}


/**
 * Will only run on @jsx files for now.
 */
visitReactDisplayName.test = function(object, path, state) {
  return object.type === Syntax.VariableDeclaration && !!getDocblock(state).jsx;
};

exports.visitReactDisplayName = visitReactDisplayName;

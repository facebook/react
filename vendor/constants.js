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
 */
'use strict';

var recast = require('recast');
var types = recast.types;
var namedTypes = types.namedTypes;
var builders = types.builders;
var hasOwn = Object.prototype.hasOwnProperty;

function propagate(constants, source) {
  return recast.print(transform(recast.parse(source), constants)).code;
}

var DEV_EXPRESSION = builders.binaryExpression(
  '!==',
  builders.literal('production'),
  builders.memberExpression(
    builders.memberExpression(
      builders.identifier('process'),
      builders.identifier('env'),
      false
    ),
    builders.identifier('NODE_ENV'),
    false
  )
);

function transform(ast, constants) {
  constants = constants || {};

  return types.traverse(ast, function(node, traverse) {
    if (namedTypes.Identifier.check(node)) {
      // If the identifier is the property of a member expression
      // (e.g. object.property), then it definitely is not a constant
      // expression that we want to replace.
      if (namedTypes.MemberExpression.check(this.parent.node) &&
          this.name === 'property' &&
          !this.parent.node.computed) {
        return false;
      }

      // There could in principle be a constant called "hasOwnProperty",
      // so be careful always to use Object.prototype.hasOwnProperty.
      if (node.name === '__DEV__') {
        // replace __DEV__ with process.env.NODE_ENV !== 'production'
        this.replace(DEV_EXPRESSION);
        return false;
      } else if (hasOwn.call(constants, node.name)) {
        this.replace(builders.literal(constants[node.name]));
        return false;
      }

    } else if (namedTypes.CallExpression.check(node)) {
      if (namedTypes.Identifier.check(node.callee) &&
          node.callee.name === 'invariant') {
        // Truncate the arguments of invariant(condition, ...)
        // statements to just the condition based on NODE_ENV
        // (dead code removal will remove the extra bytes).
        this.replace(
          builders.conditionalExpression(
            DEV_EXPRESSION,
            node,
            builders.callExpression(
              node.callee,
              [node.arguments[0]]
            )
          )
        );
        return false;
      } else if (namedTypes.Identifier.check(node.callee) &&
          node.callee.name === 'warning') {
        // Eliminate warning(condition, ...) statements based on NODE_ENV
        // (dead code removal will remove the extra bytes).
        this.replace(
          builders.conditionalExpression(
            DEV_EXPRESSION,
            node,
            builders.literal(null)
          )
        );
      }
    }
  });
}

if (!module.parent) {
  var constants = JSON.parse(process.argv[3]);
  recast.run(function(ast, callback) {
    callback(transform(ast, constants));
  });
}

exports.propagate = propagate;
exports.transform = transform;

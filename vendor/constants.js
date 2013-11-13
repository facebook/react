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
'use strict';

var recast = require('recast');
var types = recast.types;
var namedTypes = types.namedTypes;
var builders = types.builders;
var hasOwn = Object.prototype.hasOwnProperty;

function propagate(constants, source) {
  return recast.print(transform(recast.parse(source), constants));
}

function transform(ast, constants) {
  constants = constants || {};

  return types.traverse(ast, function(node, traverse) {
    if (namedTypes.Identifier.check(node)) {
      if (namedTypes.MemberExpression.check(this.parent.node) &&
          this.name === 'property' &&
          !this.parent.node.computed) {
        return false;
      }

      if (hasOwn.call(constants, node.name)) {
        this.replace(builders.literal(constants[node.name]));
        return false;
      }

    } else if (namedTypes.CallExpression.check(node)) {
      if (!constants.__DEV__) {
        if (namedTypes.Identifier.check(node.callee) &&
            node.callee.name === 'invariant') {
          node.arguments.length = 1;
        }
      }

    } else if (namedTypes.IfStatement.check(node) &&
               namedTypes.Literal.check(node.test)) {
      if (node.test.value) {
        node.alternate = null;
      } else if (node.alternate) {
        this.replace(node.alternate);
        return false;
      } else {
        this.replace(); // Remove the if-statement.
        return false;
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

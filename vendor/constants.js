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

  var devProgram = copyAst(ast.program);
  var prodProgram = copyAst(ast.program);

  devProgram = transformDev(hoistFunctions(devProgram), constants);
  prodProgram = transformProd(hoistFunctions(prodProgram), constants);

  return builders.program([
    builders.ifStatement(
      DEV_EXPRESSION,
      builders.blockStatement(devProgram.body),
      builders.blockStatement(prodProgram.body)
    )
  ]);
}

function copyAst(node) {
  if (node instanceof RegExp) {
    return node;
  } else if (node instanceof Array) {
    return node.map(copyAst);
  } else if (typeof node === "object" && node != null) {
    var newNode = Object.create(Object.getPrototypeOf(node));
    for (var key in node) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) {
        continue;
      }
      if (namedTypes.Node.check(node)) {
        newNode[key] = copyAst(node[key]);
      } else {
        newNode[key] = node[key];
      }
    }

    Object.defineProperty(newNode, "original", {
      value: node.original,
      configurable: false,
      enumerable: false,
      writable: true
    });

    return newNode;
  } else {
    return node;
  }
}

function isUseStrict(node) {
  return node &&
    namedTypes.ExpressionStatement.check(node) &&
    namedTypes.Literal.check(node.expression) &&
    node.expression.value === "use strict";
}

function hoistFunctions(program) {
  var functionVariableDeclarations = [];

  var body = program.body.slice();
  for (var i = 0; i < body.length; i++) {
    var node = body[i];
    if (namedTypes.FunctionDeclaration.check(node)) {
      functionVariableDeclarations.push(
        builders.variableDeclaration("var", [
          builders.variableDeclarator(
            node.id,
            builders.functionExpression(
              null,
              node.params,
              node.body,
              node.generator,
              node.expression,
              // Switch to node.async after upgrading esprima-fb
              false
            )
          )
        ])
      );
      body.splice(i, 1);
      i--;
    }
  }

  // Insert functions after "use strict", if present
  body.splice.apply(
    body,
    [isUseStrict(body[0]) ? 1 : 0, 0].concat(functionVariableDeclarations)
  );
  return builders.program(body);
}

function transformDev(ast, constants) {
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

      if (node.name === '__DEV__') {
        // Replace __DEV__ with 'true'
        this.replace(builders.literal(true));
        return false;

      // There could in principle be a constant called "hasOwnProperty",
      // so be careful always to use Object.prototype.hasOwnProperty.
      } else if (hasOwn.call(constants, node.name)) {
        this.replace(builders.literal(constants[node.name]));
        return false;
      }
    }
  });
}

function transformProd(ast, constants) {
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

      if (node.name === '__DEV__') {
        // Replace __DEV__ with 'false'
        this.replace(builders.literal(false));
        return false;

      // There could in principle be a constant called "hasOwnProperty",
      // so be careful always to use Object.prototype.hasOwnProperty.
      } else if (hasOwn.call(constants, node.name)) {
        this.replace(builders.literal(constants[node.name]));
        return false;
      }

    } else if (namedTypes.CallExpression.check(node)) {
      if (namedTypes.Identifier.check(node.callee) &&
          node.callee.name === 'invariant') {
        // Truncate the arguments of invariant(condition, ...) statements to
        // just the condition
        this.replace(
          builders.callExpression(
            node.callee,
            [node.arguments[0]]
          )
        );
        return false;
      } else if (namedTypes.Identifier.check(node.callee) &&
          node.callee.name === 'warning') {
        // Eliminate warning(condition, ...) statements
        this.replace(
          builders.literal(null)
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

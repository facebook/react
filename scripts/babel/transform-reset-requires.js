/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';
module.exports = function (babel) {
  const {types: t} = babel;

  return {
    visitor: {
      Program: {
        enter(path, state) {
          // Initialize state for different types of requires
          state.requires = [];
          state.propertyAccesses = [];
          state.destructured = [];
          state.destructuredDirectly = [];
          state.assignments = [];
          state.aliases = [];
        },
        exit(path, state) {
          // Deduplicate and create let declarations for all identifiers
          const allIdentifiers = new Set([
            ...state.requires.map(req => req.varName),
            ...state.aliases.map(alias => alias.alias),
            ...state.propertyAccesses.map(access => access.varName),
            ...state.destructured.flatMap(d => d.identifiers),
            ...state.assignments.map(assignment => assignment.varName),
            ...state.destructuredDirectly.flatMap(d =>
              d.identifiers.map(id => id.varName)
            ), // Adjusted
          ]);

          // Prepare and insert the beforeEach block
          const assignments = [
            ...state.requires.map(req =>
              t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  t.identifier(req.varName),
                  t.callExpression(t.identifier('require'), [
                    t.stringLiteral(req.moduleName),
                  ])
                )
              )
            ),
            ...state.aliases
              .filter(alias =>
                state.requires.find(imp => imp.varName === alias.original)
              )
              .map(alias =>
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.identifier(alias.alias),
                    t.identifier(alias.original) // Assign the alias to the original imported module
                  )
                )
              ),
            ...state.propertyAccesses.map(access =>
              t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  t.identifier(access.varName),
                  t.memberExpression(
                    t.callExpression(t.identifier('require'), [
                      t.stringLiteral(access.moduleName),
                    ]),
                    t.identifier(access.property)
                  )
                )
              )
            ),
            ...state.destructured.flatMap(d =>
              d.identifiers.map(identifier =>
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.identifier(identifier),
                    t.memberExpression(
                      t.identifier(d.from),
                      t.identifier(identifier)
                    )
                  )
                )
              )
            ),
            ...state.destructuredDirectly.flatMap(d =>
              d.identifiers.map(({varName, property}) =>
                t.expressionStatement(
                  t.assignmentExpression(
                    '=',
                    t.identifier(varName),
                    t.memberExpression(
                      t.callExpression(t.identifier('require'), [
                        t.stringLiteral(d.moduleName),
                      ]),
                      t.identifier(property)
                    )
                  )
                )
              )
            ),
            ...state.assignments.map(assignment =>
              t.expressionStatement(
                t.assignmentExpression(
                  '=',
                  t.identifier(assignment.varName),
                  t.memberExpression(
                    t.identifier(assignment.fromVarName),
                    t.identifier(assignment.property)
                  )
                )
              )
            ),
          ];

          if (assignments.length > 0) {
            const beforeEachBlock = t.expressionStatement(
              t.callExpression(t.identifier('beforeEach'), [
                t.arrowFunctionExpression([], t.blockStatement(assignments)),
              ])
            );
            path.node.body.unshift(beforeEachBlock); // Add beforeEach after let declarations
            allIdentifiers.forEach(varName => {
              path.node.body.unshift(
                t.variableDeclaration('let', [
                  t.variableDeclarator(t.identifier(varName)),
                ])
              );
            });
          }
        },
      },
      VariableDeclaration(path, state) {
        if (path.parentPath.type === 'Program') {
          path.node.declarations.forEach(declaration => {
            // Handle direct require calls
            if (
              t.isObjectPattern(declaration.id) &&
              t.isCallExpression(declaration.init) &&
              t.isIdentifier(declaration.init.callee, {name: 'require'}) &&
              declaration.init.arguments.length === 1 &&
              t.isStringLiteral(declaration.init.arguments[0])
            ) {
              const moduleName = declaration.init.arguments[0].value;
              const identifiers = declaration.id.properties.map(prop => ({
                varName: prop.key.name, // Capture the variable name from the destructured property
                property: prop.key.name, // Assuming property name matches variable name; adjust if needed
              }));
              state.destructuredDirectly.push({moduleName, identifiers});
              path.remove();
            } else if (
              t.isCallExpression(declaration.init) &&
              t.isIdentifier(declaration.init.callee, {name: 'require'}) &&
              declaration.init.arguments.length === 1 &&
              t.isStringLiteral(declaration.init.arguments[0])
            ) {
              const moduleName = declaration.init.arguments[0].value;
              if (state.opts.moduleNames.includes(moduleName)) {
                state.requires.push({
                  varName: declaration.id.name,
                  moduleName,
                });
                path.remove();
              }
            } else if (
              t.isMemberExpression(declaration.init) &&
              t.isCallExpression(declaration.init.object) &&
              t.isIdentifier(declaration.init.object.callee, {
                name: 'require',
              }) &&
              declaration.init.object.arguments.length === 1 &&
              t.isStringLiteral(declaration.init.object.arguments[0])
            ) {
              // Handle require call with property access
              const moduleName = declaration.init.object.arguments[0].value;
              const property = declaration.init.property.name;
              const varName = declaration.id.name;
              if (state.opts.moduleNames.includes(moduleName)) {
                state.propertyAccesses.push({varName, moduleName, property});
                path.remove();
              }
            } else if (
              t.isObjectPattern(declaration.id) &&
              t.isIdentifier(declaration.init)
            ) {
              // Handle destructuring from a previously required variable
              const fromVarName = declaration.init.name;
              const identifiers = declaration.id.properties.map(
                prop => prop.key.name
              );
              if (
                state.requires.find(req => req.varName === fromVarName) ||
                state.propertyAccesses.find(
                  access => access.varName === fromVarName
                )
              ) {
                state.destructured.push({from: fromVarName, identifiers});
                path.remove();
              }
            } else if (t.isMemberExpression(declaration.init)) {
              // Handle variable assignments from an imported module
              const fromVarName = declaration.init.object.name;
              const varName = declaration.id.name;
              if (
                state.requires.some(req => req.varName === fromVarName) ||
                state.aliases.some(req => req.alias === fromVarName)
              ) {
                // Assume property name matches variable name; adjust if needed
                state.assignments.push({
                  fromVarName,
                  varName,
                  property: varName,
                });
                if (!path.removed) {
                  path.remove();
                }
              }
            } else if (
              t.isIdentifier(declaration.init) &&
              state.requires.find(imp => imp.varName === declaration.init.name)
            ) {
              // Aliases of those requires
              const originalName = declaration.init.name;
              const alias = declaration.id.name;
              state.aliases.push({original: originalName, alias});
            }
          });
        }
      },
    },
  };
};

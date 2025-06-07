/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Rule} from 'eslint';
import type {FunctionDeclaration, ReturnStatement} from 'estree';

import {validateStableValueHookReturn} from '../utils/stableHooks';

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'verifies that hooks specified in stableValueHooks configuration are implemented correctly',
      recommended: true,
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          stableValueHooks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  propertiesOrIndexes: {
                    oneOf: [
                      {
                        type: 'null',
                      },
                      {
                        type: 'array',
                        items: {
                          type: 'string',
                        },
                      },
                      {
                        type: 'array',
                        items: {
                          type: 'number',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
  create(context: Rule.RuleContext) {
    const rawOptions = context.options && context.options[0];

    const stableValueHooks: Map<string, null | Array<number> | Array<string>> =
      new Map();
    if (rawOptions && rawOptions.stableValueHooks) {
      rawOptions.stableValueHooks.forEach(
        (config: {
          name: string;
          propertiesOrIndexes: null | Array<number> | Array<string>;
        }) => {
          stableValueHooks.set(config.name, config.propertiesOrIndexes);
        },
      );
    }

    // If no stableValueHooks are configured, there's nothing to check
    if (stableValueHooks.size === 0) {
      return {};
    }

    /**
     * Checks if a function is a hook (starts with 'use' and has a capital letter after)
     */
    function isHookName(name: string): boolean {
      return (
        name.startsWith('use') &&
        name.length > 3 &&
        name[3] === name[3].toUpperCase()
      );
    }

    /**
     * Finds the return statement in a function body
     */
    function findReturnStatement(
      node: FunctionDeclaration,
    ): ReturnStatement | null {
      if (!node.body || node.body.type !== 'BlockStatement') {
        return null;
      }

      return (
        node.body.body.find(
          statement => statement.type === 'ReturnStatement',
        ) || null
      );
    }

    /**
     * Validates that a hook's implementation matches its configuration
     */
    function validateHookImplementation(
      node: FunctionDeclaration,
      hookName: string,
    ): void {
      // Find the return statement
      const returnStatement = findReturnStatement(node);
      if (!returnStatement || !returnStatement.argument) {
        context.report({
          node,
          message: `Hook '${hookName}' is configured as a stable value hook but doesn't have a return statement.`,
        });
        return;
      }

      const returnValue = returnStatement.argument;

      // Check if the return value matches the configuration
      if (
        !validateStableValueHookReturn(returnValue, hookName, stableValueHooks)
      ) {
        const config = stableValueHooks.get(hookName);

        if (config === null) {
          context.report({
            node: returnStatement,
            message: `Hook '${hookName}' is configured to return a stable value, but its implementation doesn't guarantee stability.`,
          });
        } else if (Array.isArray(config)) {
          if (returnValue.type === 'ArrayExpression') {
            const numericIndexes = config.filter(
              item => typeof item === 'number',
            );
            if (numericIndexes.length > 0) {
              const maxIndex = Math.max(...(numericIndexes as Array<number>));
              if (maxIndex >= returnValue.elements.length) {
                context.report({
                  node: returnStatement,
                  message: `Hook '${hookName}' is configured with stable indexes [${numericIndexes.join(', ')}], but the returned array only has ${returnValue.elements.length} elements.`,
                });
              }
            }
          } else if (returnValue.type === 'ObjectExpression') {
            const stringProps = config.filter(item => typeof item === 'string');
            if (stringProps.length > 0) {
              const properties = returnValue.properties
                .filter(
                  prop =>
                    prop.type === 'Property' && prop.key.type === 'Identifier',
                )
                .map(prop => (prop as any).key.name);

              const missingProps = stringProps.filter(
                prop => !properties.includes(prop),
              );
              if (missingProps.length > 0) {
                context.report({
                  node: returnStatement,
                  message: `Hook '${hookName}' is configured with stable properties [${stringProps.join(', ')}], but the returned object is missing: ${missingProps.join(', ')}.`,
                });
              }
            }
          } else {
            context.report({
              node: returnStatement,
              message: `Hook '${hookName}' is configured with stable properties/indexes [${config.join(', ')}], but doesn't return an array or object.`,
            });
          }
        }
      }
    }

    return {
      // Look for function declarations that are hooks
      FunctionDeclaration(node) {
        if (
          node.id &&
          isHookName(node.id.name) &&
          stableValueHooks.has(node.id.name)
        ) {
          validateHookImplementation(node, node.id.name);
        }
      },

      // Look for variable declarations that are hooks
      VariableDeclarator(node) {
        if (
          node.id.type === 'Identifier' &&
          isHookName(node.id.name) &&
          stableValueHooks.has(node.id.name) &&
          node.init &&
          node.init.type === 'FunctionExpression'
        ) {
          // Convert to a format compatible with validateHookImplementation
          const functionNode = {
            ...node.init,
            id: node.id,
            type: 'FunctionDeclaration',
          } as unknown as FunctionDeclaration;

          validateHookImplementation(functionNode, node.id.name);
        } else if (
          node.id.type === 'Identifier' &&
          isHookName(node.id.name) &&
          stableValueHooks.has(node.id.name) &&
          node.init &&
          node.init.type === 'ArrowFunctionExpression'
        ) {
          // For arrow functions, we need to handle both block and expression bodies
          const arrowFunction = node.init;

          if (arrowFunction.body.type === 'BlockStatement') {
            // Convert to a format compatible with validateHookImplementation
            const functionNode = {
              ...arrowFunction,
              id: node.id,
              body: arrowFunction.body,
              type: 'FunctionDeclaration',
            } as unknown as FunctionDeclaration;

            validateHookImplementation(functionNode, node.id.name);
          } else {
            // For expression bodies (implicit return), check the expression directly
            const returnValue = arrowFunction.body;

            if (
              !validateStableValueHookReturn(
                returnValue,
                node.id.name,
                stableValueHooks,
              )
            ) {
              const config = stableValueHooks.get(node.id.name);

              if (config === null) {
                context.report({
                  node: arrowFunction,
                  message: `Hook '${node.id.name}' is configured to return a stable value, but its implementation doesn't guarantee stability.`,
                });
              } else if (Array.isArray(config)) {
                if (returnValue.type === 'ArrayExpression') {
                  const numericIndexes = config.filter(
                    item => typeof item === 'number',
                  );
                  if (numericIndexes.length > 0) {
                    const maxIndex = Math.max(
                      ...(numericIndexes as Array<number>),
                    );
                    if (maxIndex >= returnValue.elements.length) {
                      context.report({
                        node: arrowFunction,
                        message: `Hook '${node.id.name}' is configured with stable indexes [${numericIndexes.join(', ')}], but the returned array only has ${returnValue.elements.length} elements.`,
                      });
                    }
                  }
                } else if (returnValue.type === 'ObjectExpression') {
                  const stringProps = config.filter(
                    item => typeof item === 'string',
                  );
                  if (stringProps.length > 0) {
                    const properties = returnValue.properties
                      .filter(
                        prop =>
                          prop.type === 'Property' &&
                          prop.key.type === 'Identifier',
                      )
                      .map(prop => (prop as any).key.name);

                    const missingProps = stringProps.filter(
                      prop => !properties.includes(prop),
                    );
                    if (missingProps.length > 0) {
                      context.report({
                        node: arrowFunction,
                        message: `Hook '${node.id.name}' is configured with stable properties [${stringProps.join(', ')}], but the returned object is missing: ${missingProps.join(', ')}.`,
                      });
                    }
                  }
                } else {
                  context.report({
                    node: arrowFunction,
                    message: `Hook '${node.id.name}' is configured with stable properties/indexes [${config.join(', ')}], but doesn't return an array or object.`,
                  });
                }
              }
            }
          }
        }
      },
    };
  },
} satisfies Rule.RuleModule;

export default rule;

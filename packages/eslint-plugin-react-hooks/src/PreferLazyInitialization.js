/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import {
  getNodeWithoutReactNamespace,
  getReactiveHookInitialValueIndex,
  isHook,
  isHookName,
} from './utils';

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        "checks if hooks' initial values are potentially expensive created and suggests lazy initialization if possible",
      category: 'Best Practices',
      recommended: false,
      url:
        'https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily',
    },
    schema: [
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          additionalHooks: {
            type: 'string',
          },
          classObjectInstantiation: {
            type: 'boolean',
          },
          functionCall: {
            type: 'boolean',
          },
        },
      },
    ],
  },
  create(context) {
    return {
      'CallExpression[arguments.length>0]': node =>
        visitCallExpression(context, node),
    };
  },
};

function createErrorMessage(hookName) {
  return `${hookName}'s initial value is not created lazily, and will execute every render.`;
}

function visitCallExpression(context, callExpressionNode) {
  const [providedOptions = {}] = context.options;

  const options = {
    ...providedOptions,
    additionalHooks: providedOptions.additionalHooks
      ? new RegExp(providedOptions.additionalHooks)
      : undefined,
  };

  const {classObjectInstantiation = true, functionCall = true} = options;

  const calleeNode = callExpressionNode.callee;
  const callArguments = callExpressionNode.arguments;

  if (!calleeNode || !callArguments) {
    return;
  }

  const node = getNodeWithoutReactNamespace(calleeNode);

  const hookName = node.name;

  if (!isHookName(hookName)) {
    return;
  }

  const initialValueIndex = getReactiveHookInitialValueIndex(node, options);

  if (initialValueIndex === -1 || !callArguments[initialValueIndex]) {
    return;
  }

  const initialValueNode = callArguments[initialValueIndex];

  if (
    classObjectInstantiation === true &&
    initialValueNode &&
    initialValueNode.type === 'NewExpression'
  ) {
    context.report({
      node: initialValueNode,
      message: createErrorMessage(hookName),
    });
  }

  if (
    functionCall === true &&
    initialValueNode &&
    initialValueNode.type === 'CallExpression' &&
    initialValueNode.callee &&
    !isHook(initialValueNode.callee)
  ) {
    context.report({
      node: initialValueNode,
      message: createErrorMessage(hookName),
    });
  }
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  getFunctionName,
  isComponentName,
  isForwardRefCallback,
  isHook,
  isMemoCallback,
  isReactFunction,
} from './utils';

function isFunction(node) {
  return (
    node.type === 'FunctionDeclaration' ||
    node.type === 'ArrowFunctionExpression'
  );
}

function isAssignmentExpression(node) {
  return node.type === 'AssignmentExpression';
}

function isMemberExpression(node) {
  return node.type === 'MemberExpression';
}

function isIdentifier(node) {
  return node.type === 'Identifier';
}

function isCallExpression(node) {
  return node.type === 'CallExpression';
}

function isProgram(node) {
  return node.type === 'Program';
}

function getComponentOrHookScopeBlock(node) {
  let currentNode = node;

  while (!isProgram(currentNode)) {
    const functionName = getFunctionName(currentNode);
    if (functionName) {
      if (isComponentName(functionName) || isHook(functionName)) {
        return currentNode;
      }
    }
    if (isForwardRefCallback(currentNode) || isMemoCallback(currentNode)) {
      return currentNode;
    }
    currentNode = currentNode.parent;
  }

  return;
}

function getNearestFunctionScopeBlock(node) {
  let currentNode = node;

  while (!isProgram(currentNode)) {
    if (isFunction(currentNode)) {
      return currentNode.body;
    }

    currentNode = currentNode.parent;
  }

  return;
}

function isAssignmentToCurrent(node) {
  if (!isMemberExpression(node.left)) return false;
  if (!isIdentifier(node.left.property)) return false;
  return node.left.property.name === 'current';
}

function isRefAssignmentLike(expressionStatementNode) {
  // Returns true if it looks something like this:
  //
  // .current = x
  //
  const assignmentNode = expressionStatementNode.expression;
  if (!isAssignmentExpression(assignmentNode)) return false;

  return isAssignmentToCurrent(assignmentNode);
}

function isUseRefCall(node) {
  // Returns true if it is either:
  //
  // useRef(...)
  //
  // or
  //
  // React.useRef(...)
  //
  return (
    isCallExpression(node) &&
    ((isIdentifier(node.callee) && node.callee.name === 'useRef') ||
      isReactFunction(node.callee, 'useRef'))
  );
}

function isRefAssignment(assignmentExpressionNode, scope) {
  const assignmentMemberObject = assignmentExpressionNode.left.object;
  if (!isIdentifier(assignmentMemberObject)) return false;

  const {name} = assignmentMemberObject;

  // TODO: Generate a map and re-use it across calls when possible. Possibly
  // memoize.
  const reference = scope.references.find(
    scopeReference =>
      scopeReference.resolved.name && scopeReference.resolved.name === name,
  );

  // TODO: Handle more involved scenarios like:
  //
  // let myRef;
  // myRef = useRef(...);
  //
  // or
  //
  // const myRef = useRef(...);
  // const myTransitiveRef = myRef;
  //
  const definition = reference.resolved.defs[0].node;
  return isUseRefCall(definition.init);
}

function createSuggestionForEffectWrapper(effectWrapperString) {
  function createSuggestion(expressionStatementNode) {
    return {
      desc: `Place the ref mutation in a ${effectWrapperString}`,
      fix(fixer) {
        // TODO:
        // We need to handle the deps array in the case that the ref is assigned
        // to a variable of any kind.
        return [
          fixer.insertTextBefore(
            expressionStatementNode,
            `${effectWrapperString}(() => { `,
          ),
          fixer.insertTextAfter(expressionStatementNode, ' }, []);'),
        ];
      },
    };
  }

  return createSuggestion;
}

const EFFECT_WRAPPERS = [
  createSuggestionForEffectWrapper('useEffect'),
  createSuggestionForEffectWrapper('useLayoutEffect'),
];

function createSuggestions(expressionStatementNode) {
  return EFFECT_WRAPPERS.map(createSuggestion =>
    createSuggestion(expressionStatementNode),
  );
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'ensures ref.current assignments only ever occur in either useEffect or useLayoutEffect call expressions',
      category: 'Possible Errors',
      recommended: false,
      suggestion: true,
    },
  },
  create(context) {
    // This is where the overarching logic resides.
    function isUnsafeRefMutation(expressionStatementNode) {
      // First, let's check if it's an assignment to an object's current
      // property. This is low cost and likely to short-circuit often.
      if (!isRefAssignmentLike(expressionStatementNode)) return false;
      // Next, let's only move forward if we're inside a component or hook.
      const componentOrHookScopeBlock = getComponentOrHookScopeBlock(
        expressionStatementNode,
      );
      const isInsideComponentOrHook = !!componentOrHookScopeBlock;
      if (!isInsideComponentOrHook) return false;
      // Next, let's verify that the assignment was really taking place on a
      // ref.
      const scope = context.getScope();
      const assignmentNode = expressionStatementNode.expression;
      if (!isRefAssignment(assignmentNode, scope)) return false;
      // At this point, we know that we have a ref mutation inside of a
      // component. We can now check to see if assignment is occurring at the
      // top-level of a component or hook by looking up the expression's nearest
      // function block. If it is the same, then we know that we have a
      // top-level assignment.
      const nearestFunctionScopeBlock = getNearestFunctionScopeBlock(
        expressionStatementNode,
      );
      const isTopLevelRefMutation =
        nearestFunctionScopeBlock === componentOrHookScopeBlock.body;

      if (isTopLevelRefMutation) return true;

      // TODO:
      // If it's not a top-level ref assignment, that doesn't mean we're in the
      // clear. Now we need to check if the ref assignment isn't occurring in
      // a function that is immediately called as a consequence of the render or
      // hook call.
      return false;
    }

    return {
      ExpressionStatement(node) {
        if (isUnsafeRefMutation(node)) {
          context.report({
            message:
              'Ref mutations should either be in useEffect or useLayoutEffect calls or inside callbacks.',
            node,
            suggest: createSuggestions(node),
          });
        }
      },
    };
  },
};

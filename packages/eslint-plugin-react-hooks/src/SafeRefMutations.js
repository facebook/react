/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Catch all identifiers that begin with "use" followed by an uppercase Latin
 * character to exclude identifiers like "user".
 */

function getFunctionName(node) {
  if (
    node.type === 'FunctionDeclaration' ||
    (node.type === 'FunctionExpression' && node.id)
  ) {
    // function useHook() {}
    // const whatever = function useHook() {};
    //
    // Function declaration or function expression names win over any
    // assignment statements or other renames.
    return node.id;
  } else if (
    node.type === 'FunctionExpression' ||
    node.type === 'ArrowFunctionExpression'
  ) {
    if (
      node.parent.type === 'VariableDeclarator' &&
      node.parent.init === node
    ) {
      // const useHook = () => {};
      return node.parent.id;
    } else if (
      node.parent.type === 'AssignmentExpression' &&
      node.parent.right === node &&
      node.parent.operator === '='
    ) {
      // useHook = () => {};
      return node.parent.left;
    } else if (
      node.parent.type === 'Property' &&
      node.parent.value === node &&
      !node.parent.computed
    ) {
      // {useHook: () => {}}
      // {useHook() {}}
      return node.parent.key;

      // NOTE: We could also support `ClassProperty` and `MethodDefinition`
      // here to be pedantic. However, hooks in a class are an anti-pattern. So
      // we don't allow it to error early.
      //
      // class {useHook = () => {}}
      // class {useHook() {}}
    } else if (
      node.parent.type === 'AssignmentPattern' &&
      node.parent.right === node &&
      !node.parent.computed
    ) {
      // const {useHook = () => {}} = {};
      // ({useHook = () => {}} = {});
      //
      // Kinda clowny, but we'd said we'd follow spec convention for
      // `IsAnonymousFunctionDefinition()` usage.
      return node.parent.left;
    } else {
      return undefined;
    }
  } else {
    return undefined;
  }
}

function isHookName(s) {
  return /^use[A-Z0-9].*$/.test(s);
}

/**
 * We consider hooks to be a hook name identifier or a member expression
 * containing a hook name.
 */

function isHook(node) {
  if (node.type === 'Identifier') {
    return isHookName(node.name);
  } else if (
    node.type === 'MemberExpression' &&
    !node.computed &&
    isHook(node.property)
  ) {
    const obj = node.object;
    const isPascalCaseNameSpace = /^[A-Z].*/;
    return obj.type === 'Identifier' && isPascalCaseNameSpace.test(obj.name);
  } else {
    return false;
  }
}

/**
 * Checks if the node is a React component name. React component names must
 * always start with a non-lowercase letter. So `MyComponent` or `_MyComponent`
 * are valid component names for instance.
 */

function isComponentName(node) {
  if (node.type === 'Identifier') {
    return !/^[a-z]/.test(node.name);
  } else {
    return false;
  }
}

function isReactFunction(node, functionName) {
  return (
    node.name === functionName ||
    (node.type === 'MemberExpression' &&
      node.object.name === 'React' &&
      node.property.name === functionName)
  );
}

/**
 * Checks if the node is a callback argument of forwardRef. This render function
 * should follow the rules of hooks.
 */

function isForwardRefCallback(node) {
  return !!(
    node.parent &&
    node.parent.callee &&
    isReactFunction(node.parent.callee, 'forwardRef')
  );
}

/**
 * Checks if the node is a callback argument of React.memo. This anonymous
 * functional component should follow the rules of hooks.
 */

function isMemoCallback(node) {
  return !!(
    node.parent &&
    node.parent.callee &&
    isReactFunction(node.parent.callee, 'memo')
  );
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

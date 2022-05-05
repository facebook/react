/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'enforces component render purity',
      recommended: true,
      url: 'https://beta.reactjs.org/learn/keeping-components-pure',
    },
  },
  create(context) {
    return {
      MemberExpression(member) {
        // Look for member expressions that look like refs (i.e. `ref.current`).
        if (
          member.object.type !== 'Identifier' ||
          member.computed ||
          member.property.type !== 'Identifier' ||
          member.property.name !== 'current'
        ) {
          return;
        }

        // Find the parent function of this node, as well as any if statement matching against the ref value
        // (i.e. lazy init pattern shown in React docs).
        let node = member;
        let fn;
        let conditional;
        while (node) {
          if (
            node.type === 'FunctionDeclaration' ||
            node.type === 'FunctionExpression' ||
            node.type === 'ArrowFunctionExpression'
          ) {
            fn = node;
            break;
          }

          if (
            node.type === 'IfStatement' &&
            node.test.type === 'BinaryExpression' &&
            (node.test.operator === '==' || node.test.operator === '===') &&
            isMemberExpressionEqual(node.test.left, member)
          ) {
            conditional = node.test;
          }

          node = node.parent;
        }

        if (!fn) {
          return;
        }

        // Find the variable definition for the object.
        const variable = getVariable(context.getScope(), member.object.name);
        if (!variable) {
          return;
        }

        // Find the initialization of the variable and see if it's a call to useRef.
        const refDefinition = variable.defs.find(def => {
          const init = def.node.init;
          if (!init) {
            return false;
          }

          return (
            init.type === 'CallExpression' &&
            init.callee.type === 'Identifier' &&
            init.callee.name === 'useRef' &&
            parentFunction(def.node) === fn
          );
        });

        if (refDefinition) {
          // If within an if statement, check if comparing with the initial value passed to useRef.
          // This indicates the lazy init pattern, which is allowed.
          if (conditional) {
            const init = refDefinition.node.init.arguments[0] || {
              type: 'Identifier',
              name: 'undefined',
            };
            if (isLiteralEqual(conditional.operator, init, conditional.right)) {
              return;
            }
          }

          // Otherwise, report an error for either writing or reading to this ref based on parent expression.
          context.report({
            node: member,
            message:
              member.parent.type === 'AssignmentExpression' &&
              member.parent.left === member
                ? `Writing to refs during rendering is not allowed. Move this into a useEffect or useLayoutEffect. See https://beta.reactjs.org/apis/useref`
                : 'Reading from refs during rendering is not allowed. See https://beta.reactjs.org/apis/useref',
          });
        }
      },
    };
  },
};

function getVariable(scope, name) {
  while (scope) {
    const variable = scope.set.get(name);
    if (variable) {
      return variable;
    }

    scope = scope.upper;
  }
}

function parentFunction(node) {
  while (node) {
    if (
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression'
    ) {
      return node;
    }

    node = node.parent;
  }
}

function isMemberExpressionEqual(a, b) {
  if (a === b) {
    return true;
  }

  return (
    a.type === 'MemberExpression' &&
    b.type === 'MemberExpression' &&
    a.object.type === 'Identifier' &&
    b.object.type === 'Identifier' &&
    a.object.name === b.object.name &&
    a.property.type === 'Identifier' &&
    b.property.type === 'Identifier' &&
    a.property.name === b.property.name
  );
}

function isLiteralEqual(operator, a, b) {
  let aValue, bValue;
  if (a.type === 'Identifier' && a.name === 'undefined') {
    aValue = undefined;
  } else if (a.type === 'Literal') {
    aValue = a.value;
  } else {
    return;
  }

  if (b.type === 'Identifier' && b.name === 'undefined') {
    bValue = undefined;
  } else if (b.type === 'Literal') {
    bValue = b.value;
  } else {
    return;
  }

  if (operator === '===') {
    return aValue === bValue;
  } else if (operator === '==') {
    // eslint-disable-next-line
    return aValue == bValue;
  }

  return false;
}

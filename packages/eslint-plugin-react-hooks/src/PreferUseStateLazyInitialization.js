'use strict';

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        "Disallow function calls in useState that aren't wrapped in an initializer function",
      recommended: false,
      url: null,
    },
    fixable: null,
    schema: [],
    messages: {
      useLazyInitialization:
        'To prevent re-computation, consider using lazy initial state for useState calls that involve function calls. Ex: useState(() => getValue())',
    },
  },

  create(context) {
    const ALLOW_LIST = Object.freeze(['Boolean', 'String']);

    //----------------------------------------------------------------------
    // Helpers
    //----------------------------------------------------------------------

    const hasFunctionCall = node => {
      if (
        node.type === 'CallExpression' &&
        ALLOW_LIST.indexOf(node.callee.name) === -1
      ) {
        return true;
      }
      if (node.type === 'ConditionalExpression') {
        return (
          hasFunctionCall(node.test) ||
          hasFunctionCall(node.consequent) ||
          hasFunctionCall(node.alternate)
        );
      }
      if (
        node.type === 'LogicalExpression' ||
        node.type === 'BinaryExpression'
      ) {
        return hasFunctionCall(node.left) || hasFunctionCall(node.right);
      }
      return false;
    };

    //----------------------------------------------------------------------
    // Public
    //----------------------------------------------------------------------

    return {
      CallExpression(node) {
        if (node.callee && node.callee.name === 'useState') {
          if (node.arguments.length > 0) {
            const useStateInput = node.arguments[0];
            if (hasFunctionCall(useStateInput)) {
              context.report({node, messageId: 'useLazyInitialization'});
            }
          }
        }
      },
    };
  },
};

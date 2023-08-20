'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

// Import the getComments function from a separate module.
const getComments = require('./getComments');

// Define a constant for the string prefix used to identify version conditions in comments.
const GATE_VERSION_STR = '@reactVersion ';

// Get the REACT_VERSION environment variable.
const REACT_VERSION_ENV = process.env.REACT_VERSION;

// Define the main transformation function for the Babel plugin.
function transform(babel) {
  const { types: t } = babel;

  // This function processes comments to build a condition string based on a specific prefix.
  function buildGateVersionCondition(comments) {
    if (!comments) {
      return null;
    }

    // Use the reduce method to accumulate conditions from comments.
    const resultingCondition = comments.reduce(
      (accumulatedCondition, commentLine) => {
        const commentStr = commentLine.value.trim();

        if (!commentStr.startsWith(GATE_VERSION_STR)) {
          return accumulatedCondition;
        }

        // Extract the condition part of the comment after the prefix.
        const condition = commentStr.slice(GATE_VERSION_STR.length);

        // If this is the first condition, return it; otherwise, concatenate with a space.
        if (accumulatedCondition === null) {
          return condition;
        }

        return accumulatedCondition.concat(' ', condition);
      },
      null
    );

    // If no condition was found, return null; otherwise, return it as a string literal.
    if (resultingCondition === null) {
      return null;
    }

    return t.stringLiteral(resultingCondition);
  }

  // Define the Babel plugin object with a name and a visitor that processes ExpressionStatements.
  return {
    name: 'transform-react-version-pragma',
    visitor: {
      ExpressionStatement(path) {
        const statement = path.node;
        const expression = statement.expression;

        if (expression.type === 'CallExpression') {
          const callee = expression.callee;

          // Check if the callee is an Identifier (test, it, fit).
          switch (callee.type) {
            case 'Identifier': {
              if (
                callee.name === 'test' ||
                callee.name === 'it' ||
                callee.name === 'fit'
              ) {
                // Get comments associated with the current expression.
                const comments = getComments(path);

                // Build the condition based on comments.
                const condition = buildGateVersionCondition(comments);

                // Modify the callee and arguments based on the condition.
                if (condition !== null) {
                  callee.name =
                    callee.name === 'fit'
                      ? '_test_react_version_focus'
                      : '_test_react_version';
                  expression.arguments = [condition, ...expression.arguments];
                } else if (REACT_VERSION_ENV) {
                  callee.name = '_test_ignore_for_react_version';
                }
              }
              break;
            }
            case 'MemberExpression': {
              if (
                callee.object.type === 'Identifier' &&
                (callee.object.name === 'test' ||
                  callee.object.name === 'it') &&
                callee.property.type === 'Identifier' &&
                callee.property.name === 'only'
              ) {
                // Get comments associated with the current expression.
                const comments = getComments(path);

                // Build the condition based on comments.
                const condition = buildGateVersionCondition(comments);

                // Modify the expression to use the appropriate function based on the condition.
                if (condition !== null) {
                  statement.expression = t.callExpression(
                    t.identifier('_test_react_version_focus'),
                    [condition, ...expression.arguments]
                  );
                } else if (REACT_VERSION_ENV) {
                  statement.expression = t.callExpression(
                    t.identifier('_test_ignore_for_react_version'),
                    expression.arguments
                  );
                }
              }
              break;
            }
          }
        }
        return;
      },
    },
  };
}

// Export the transform function as the module's main export.
module.exports = transform;


/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

/* eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

function isOldFork(filename) {
  return filename.endsWith('.old.js') || filename.endsWith('.old');
}

function isNewFork(filename) {
  return filename.endsWith('.new.js') || filename.endsWith('.new');
}

function warnIfNewField(context, newFields, identifier) {
  const name = identifier.name;
  if (name.endsWith('_new') || (newFields !== null && newFields.has(name))) {
    context.report({
      node: identifier,
      message:
        'Field cannot be accessed inside the old reconciler fork, only the ' +
        'new fork.',
    });
  }
}

function warnIfOldField(context, oldFields, identifier) {
  const name = identifier.name;
  if (name.endsWith('_old') || (oldFields !== null && oldFields.has(name))) {
    context.report({
      node: identifier,
      message:
        'Field cannot be accessed inside the new reconciler fork, only the ' +
        'old fork.',
    });
  }
}

module.exports = {
  meta: {
    type: 'problem',
    fixable: 'code',
  },
  create(context) {
    const sourceFilename = context.getFilename();

    if (isOldFork(sourceFilename)) {
      const options = context.options;
      let newFields = null;
      if (options !== null) {
        for (const option of options) {
          if (option.new !== undefined) {
            if (newFields === null) {
              newFields = new Set(option.new);
            } else {
              for (const field of option.new) {
                newFields.add(field);
              }
            }
          }
        }
      }
      return {
        MemberExpression(node) {
          const property = node.property;
          if (property.type === 'Identifier') {
            warnIfNewField(context, newFields, property);
          }
        },

        ObjectPattern(node) {
          for (const property of node.properties) {
            const key = property.key;
            if (key.type === 'Identifier') {
              warnIfNewField(context, newFields, key);
            }
          }
        },
      };
    }

    if (isNewFork(sourceFilename)) {
      const options = context.options;
      let oldFields = null;
      if (options !== null) {
        for (const option of options) {
          if (option.old !== undefined) {
            if (oldFields === null) {
              oldFields = new Set(option.old);
            } else {
              for (const field of option.new) {
                oldFields.add(field);
              }
            }
          }
        }
      }
      return {
        MemberExpression(node) {
          const property = node.property;
          if (property.type === 'Identifier') {
            warnIfOldField(context, oldFields, property);
          }
        },

        ObjectPattern(node) {
          for (const property of node.properties) {
            const key = property.key;
            if (key.type === 'Identifier') {
              warnIfOldField(context, oldFields, key);
            }
          }
        },
      };
    }

    return {};
  },
};

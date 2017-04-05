/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

module.exports = function keyMirrorToLiteral(babel) {
  const t = babel.types;

  function isKeyMirrorRequireCall(node) {
    return (
      node &&
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      node.callee.name === 'require' &&
      node.arguments.length === 1 &&
      node.arguments[0].type === 'StringLiteral' &&
      (
        node.arguments[0].value === 'fbjs/lib/keyMirror' ||
        node.arguments[0].value === 'keyMirror'
      )
    );
  }

  return {
    visitor: {
      Program(path, file) {
        const binding = path.scope.getBinding('keyMirror');
        if (binding == null) {
          return;
        }
        const initNode = binding.path.get('init').node;
        if (!isKeyMirrorRequireCall(initNode)) {
          return;
        }
        for (const reference of binding.referencePaths) {
          if (!reference.parentPath.isCallExpression()) {
            throw reference.buildCodeFrameError('Expected keyMirror function call.');
          }
          const argPath = reference.parentPath.get('arguments.0');
          if (!argPath.isObjectExpression()) {
            throw argPath.buildCodeFrameError('Expected object literal.');
          }
          for (const prop of argPath.get('properties')) {
            const value = prop.get('value');
            if (value.isNullLiteral()) {
              const name = prop.get('key.name').node;
              value.replaceWith(t.stringLiteral(name));
            } else {
              throw value.buildCodeFrameError('Expected null value for key.');
            }
          }
          reference.parentPath.replaceWith(argPath);
        }
        binding.path.remove();
      },
    },
  };
};

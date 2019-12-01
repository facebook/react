/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = ({
  types: {isIdentifier, isReturnStatement, objectProperty, identifier},
}) => {
  return {
    visitor: {
      ObjectMethod: path => {
        // Turns this code:
        //
        // get prop() {
        //   return variable;
        // }
        //
        // into this:
        //
        // prop: variable;
        if (path.node.kind !== 'get') {
          return;
        }

        const keyNode = path.node.key;
        const isValidKey = isIdentifier(keyNode);
        if (!isValidKey) {
          throw path.buildCodeFrameError(
            'Getter key format not supported. Expected identifier.'
          );
        }

        const bodyNode = path.node.body;
        const isValidBody =
          bodyNode.body.length === 1 &&
          isReturnStatement(bodyNode.body[0]) &&
          isIdentifier(bodyNode.body[0].argument);
        if (!isValidBody) {
          throw path.buildCodeFrameError(
            'Getter body format not supported. Expected return of identifier.'
          );
        }

        const prop = keyNode.name;
        const variable = bodyNode.body[0].argument.name;

        path.replaceWith(
          objectProperty(identifier(prop), identifier(variable))
        );
      },
    },
  };
};

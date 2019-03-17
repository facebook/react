/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

module.exports = ({types: t}) => {
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
        const isValidKey = t.isIdentifier(keyNode);
        if (!isValidKey) {
          return;
          /*
            Similar to Rollup.legacy behaviour.
            Don't throw error.

            Not all getters code usage can be transformed in meaningful way.

            Code usage of getters, where they can't be transformed should be wrapped in try catch.

            e.g. use try catch because getters of this style is used as a side effect.

            var passiveSupported = false;
            try {
              var options = {
                  get passive() {
                    passiveBrowserEventsSupported = true;
                  },
              };
            } catch(err) {
              passiveSupported = false;
            }
          */
        }

        const bodyNode = path.node.body;
        const isValidBody =
          bodyNode.body.length === 1 &&
          t.isReturnStatement(bodyNode.body[0]) &&
          t.isIdentifier(bodyNode.body[0].argument);
        if (!isValidBody) {
          /*
            Similar to Rollup.legacy behaviour.
            Not all getters code usage can be transformed in meaningful way.
            Simply return and don't throw error.
          */
          return;
        }

        const prop = keyNode.name;
        const variable = bodyNode.body[0].argument.name;

        path.replaceWith(
          t.objectProperty(t.identifier(prop), t.identifier(variable))
        );
      },
    },
  };
};

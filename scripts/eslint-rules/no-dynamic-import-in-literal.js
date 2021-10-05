/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const IMPORT_PATTERN = /import\(([`'"]([^`'"]+)[`'"])*\)/;

module.exports = {
  meta: {
    schema: [],
  },
  create(context) {
    function checkIsImportExpression(node) {
      const {type: nodeType} = node;
      const content =
        (nodeType === 'Literal' && node.value) ||
        (nodeType === 'TemplateLiteral' && node.quasis[0].value.raw);
      const isPossibleImportExpression = IMPORT_PATTERN.test(content);
      if (isPossibleImportExpression) {
        context.report(node, 'Possible dynamic import expression in literal');
      }
    }
    return {
      Literal: checkIsImportExpression,
      TemplateLiteral: checkIsImportExpression,
    };
  },
};

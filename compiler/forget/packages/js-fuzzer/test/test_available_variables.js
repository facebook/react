// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Tests for mutating variables
 */

'use strict';

const babelTraverse = require('@babel/traverse').default;

const common = require('../mutators/common.js');
const helpers = require('./helpers.js');

describe('Available variables and functions', () => {
  it('test', () => {
    const source = helpers.loadTestData('available_variables.js');
    const result = new Array();

    babelTraverse(source.ast, {
      CallExpression(path) {
        result.push({
          variables: common.availableVariables(path),
          functions: common.availableFunctions(path),
        });
      }
    });

    helpers.assertExpectedResult(
        'available_variables_expected.js',
        JSON.stringify(result, null, 2));
  });
});

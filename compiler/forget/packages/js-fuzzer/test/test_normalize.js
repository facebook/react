// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Test normalization.
 */

'use strict';

const helpers = require('./helpers.js');
const normalizer = require('../mutators/normalizer.js');
const sourceHelpers = require('../source_helpers.js');

describe('Normalize', () => {
  it('test basic', () => {
    const source = helpers.loadTestData('normalize.js');

    const mutator = new normalizer.IdentifierNormalizer();
    mutator.mutate(source);

    const normalized_0 = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'normalize_expected_0.js', normalized_0);

    mutator.mutate(source);
    const normalized_1 = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'normalize_expected_1.js', normalized_1);
  });

  it('test simple_test.js', () => {
    const source = helpers.loadTestData('simple_test.js');

    const mutator = new normalizer.IdentifierNormalizer();
    mutator.mutate(source);

    const normalized = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'simple_test_expected.js', normalized);
  });
});

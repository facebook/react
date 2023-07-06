// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Tests for mutating arrays
 */

'use strict';

const sinon = require('sinon');

const babylon = require('@babel/parser');

const common = require('../mutators/common.js');
const helpers = require('./helpers.js');
const scriptMutator = require('../script_mutator.js');
const sourceHelpers = require('../source_helpers.js');

const {ArrayMutator} = require('../mutators/array_mutator.js');

const sandbox = sinon.createSandbox();

describe('Mutate arrays', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('performs all mutations', () => {
    // Make random operations deterministic.
    sandbox.stub(common, 'randomValue').callsFake(
        () => babylon.parseExpression('""'));
    helpers.deterministicRandom(sandbox);

    const source = helpers.loadTestData('mutate_arrays.js');

    const settings = scriptMutator.defaultSettings();
    settings['MUTATE_ARRAYS'] = 1.0;

    const mutator = new ArrayMutator(settings);
    mutator.mutate(source);

    const mutated = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'mutate_arrays_expected.js', mutated);
  });
});

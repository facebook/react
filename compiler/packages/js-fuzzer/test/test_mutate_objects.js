// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Tests for mutating object expressions
 */

'use strict';

const sinon = require('sinon');

const babylon = require('@babel/parser');

const common = require('../mutators/common.js');
const helpers = require('./helpers.js');
const scriptMutator = require('../script_mutator.js');
const sourceHelpers = require('../source_helpers.js');

const {ObjectMutator} = require('../mutators/object_mutator.js');

const sandbox = sinon.createSandbox();

describe('Mutate objects', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('performs all mutations', () => {
    // Make random operations deterministic.
    sandbox.stub(common, 'randomValue').callsFake(
        () => babylon.parseExpression('""'));
    helpers.deterministicRandom(sandbox);

    const source = helpers.loadTestData('mutate_objects.js');

    const settings = scriptMutator.defaultSettings();
    settings['MUTATE_OBJECTS'] = 1.0;

    const mutator = new ObjectMutator(settings);
    mutator.mutate(source);

    const mutated = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'mutate_objects_expected.js', mutated);
  });
});

// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Test variable-or-object mutator.
 */

'use strict';

const babylon = require('@babel/parser');
const sinon = require('sinon');

const common = require('../mutators/common.js');
const helpers = require('./helpers.js');
const variableOrObject = require('../mutators/variable_or_object_mutation.js');
const random = require('../random.js');
const sourceHelpers = require('../source_helpers.js');

const sandbox = sinon.createSandbox();

function testMutations(testPath, expectedPath) {
  const source = helpers.loadTestData(testPath);

  const mutator = new variableOrObject.VariableOrObjectMutator(
      { ADD_VAR_OR_OBJ_MUTATIONS: 1.0 });

  mutator.mutate(source);

  const mutated = sourceHelpers.generateCode(source);
  helpers.assertExpectedResult(expectedPath, mutated);
}

describe('Variable or object mutator', () => {
  beforeEach(() => {
    // Make before/after insertion deterministic. This also chooses
    // random objects.
    sandbox.stub(random, 'choose').callsFake(() => { return true; });
    // This stubs out the random seed.
    sandbox.stub(random, 'randInt').callsFake(() => { return 123; });
    // Random value is itself dependent on too much randomization.
    sandbox.stub(common, 'randomValue').callsFake(
        () => { return babylon.parseExpression('0'); });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('test', () => {
    let index = 0;
    // Test different cases of _randomVariableOrObjectMutations in
    // variable_or_object_mutation.js.
    const choices = [
      0.2, // Trigger recursive case.
      0.3, // Recursion 1: Delete.
      0.4, // Recursion 2: Property access.
      0.5, // Random assignment.
      // 0.6 case for randomFunction omitted as it has too much randomization.
      0.7, // Variable assignment.
      0.8, // Object.defineProperty.
      0.9, // Object.defineProperty recursive.
      0.3, // Recursion 1: Delete.
      0.4, // Recursion 2: Property access.
    ];
    sandbox.stub(random, 'random').callsFake(
        () => { return choices[index++]; });
    testMutations(
        'mutate_var_or_obj.js',
        'mutate_var_or_obj_expected.js');
  });
});

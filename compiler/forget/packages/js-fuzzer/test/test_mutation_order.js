// Copyright 2022 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Test shuffling mutators and extra mutations.
 *
 * Use minimal probability settings to demonstrate order changes of top-level
 * mutators. Which mutations are used exactly is not relevant to the test and
 * handled pseudo-randomly.
 */

'use strict';

const sinon = require('sinon');

const helpers = require('./helpers.js');
const scriptMutator = require('../script_mutator.js');
const sourceHelpers = require('../source_helpers.js');
const random = require('../random.js');

const sandbox = sinon.createSandbox();

describe('Toplevel mutations', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('shuffle their order', () => {
    // Make random operations deterministic.
    helpers.deterministicRandom(sandbox);

    this.settings = {
      ADD_VAR_OR_OBJ_MUTATIONS: 0.0,
      MUTATE_CROSSOVER_INSERT: 0.0,
      MUTATE_EXPRESSIONS: 0.0,
      MUTATE_FUNCTION_CALLS: 1.0,
      MUTATE_NUMBERS: 1.0,
      MUTATE_VARIABLES: 0.0,
      SCRIPT_MUTATOR_SHUFFLE: 1.0,
      SCRIPT_MUTATOR_EXTRA_MUTATIONS: 1.0,
      engine: 'V8',
      testing: true,
    };

    const source = helpers.loadTestData('mutation_order/input.js');
    const mutator = new scriptMutator.ScriptMutator(this.settings, helpers.DB_DIR);
    const mutated = mutator.mutateInputs([source]);
    const code = sourceHelpers.generateCode(mutated);

    // The test data should be rich enough to produce a pattern from the
    // FunctionCallMutator that afterwards gets mutated by the NumberMutator.
    helpers.assertExpectedResult(
        'mutation_order/output_expected.js', code);
  });
});

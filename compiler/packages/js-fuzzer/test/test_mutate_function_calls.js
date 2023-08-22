// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Tests for mutating funciton calls.
 */

'use strict';

const sinon = require('sinon');

const helpers = require('./helpers.js');
const random = require('../random.js');
const scriptMutator = require('../script_mutator.js');
const sourceHelpers = require('../source_helpers.js');
const functionCallMutator = require('../mutators/function_call_mutator.js');

const sandbox = sinon.createSandbox();

function loadAndMutate(input_file) {
  const source = helpers.loadTestData(input_file);

  const settings = scriptMutator.defaultSettings();
  settings['engine'] = 'V8';
  settings['MUTATE_FUNCTION_CALLS'] = 1.0;

  const mutator = new functionCallMutator.FunctionCallMutator(settings);
  mutator.mutate(source);
  return source;
}

describe('Mutate functions', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('is robust without available functions', () => {
    sandbox.stub(random, 'random').callsFake(() => { return 0.2; });

    // We just ensure here that mutating this file doesn't throw.
    loadAndMutate('mutate_function_call.js');
  });

  it('optimizes functions with turbofan in V8', () => {
    sandbox.stub(random, 'random').callsFake(() => { return 0.5; });
    sandbox.stub(random, 'choose').callsFake(p => true);

    const source = loadAndMutate('mutate_function_call.js');
    const mutated = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'mutate_function_call_expected.js', mutated);
  });

  it('optimizes functions with maglev in V8', () => {
    sandbox.stub(random, 'random').callsFake(() => { return 0.5; });
    // False-path takes 'Maglev'. Other calls to choose should return
    // true. It's also used to determine if a mutator should be chosen.
    sandbox.stub(random, 'choose').callsFake(p => p == 0.7 ? false : true);

    const source = loadAndMutate('mutate_function_call.js');
    const mutated = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'mutate_function_call_maglev_expected.js', mutated);
  });

  it('compiles functions in V8 to baseline', () => {
    sandbox.stub(random, 'random').callsFake(() => { return 0.7; });

    const source = loadAndMutate('mutate_function_call.js');
    const mutated = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'mutate_function_call_baseline_expected.js', mutated);
  });

  it('deoptimizes functions in V8', () => {
    sandbox.stub(random, 'random').callsFake(() => { return 0.8; });

    const source = loadAndMutate('mutate_function_call.js');
    const mutated = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'mutate_function_call_deopt_expected.js', mutated);
  });
});

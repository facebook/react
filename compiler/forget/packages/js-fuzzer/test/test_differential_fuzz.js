// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Tests for differential fuzzing.
 */

'use strict';

const assert = require('assert');
const program = require('commander');
const sinon = require('sinon');

const helpers = require('./helpers.js');
const scriptMutator = require('../script_mutator.js');
const sourceHelpers = require('../source_helpers.js');
const random = require('../random.js');

const { DifferentialFuzzMutator, DifferentialFuzzSuppressions } = require(
    '../mutators/differential_fuzz_mutator.js');
const { DifferentialScriptMutator } = require(
    '../differential_script_mutator.js');

const sandbox = sinon.createSandbox();

function testMutators(settings, mutatorClass, inputFile, expectedFile) {
  const source = helpers.loadTestData('differential_fuzz/' + inputFile);

  const mutator = new mutatorClass(settings);
  mutator.mutate(source);

  const mutated = sourceHelpers.generateCode(source);
  helpers.assertExpectedResult(
      'differential_fuzz/' + expectedFile, mutated);
}

describe('Differential fuzzing', () => {
  beforeEach(() => {
    // Zero settings for all mutators.
    this.settings = scriptMutator.defaultSettings();
    for (const key of Object.keys(this.settings)) {
      this.settings[key] = 0.0;
    }
    // By default, deterministically use all mutations of differential
    // fuzzing.
    this.settings['DIFF_FUZZ_EXTRA_PRINT'] = 1.0;
    this.settings['DIFF_FUZZ_TRACK_CAUGHT'] = 1.0;

    // Fake fuzzer being called with --input_dir flag.
    this.oldInputDir = program.input_dir;
    program.input_dir = helpers.BASE_DIR;
  });

  afterEach(() => {
    sandbox.restore();
    program.input_dir = this.oldInputDir;
  });

  it('applies suppressions', () => {
    // This selects the first random variable when replacing .arguments.
    sandbox.stub(random, 'single').callsFake(a => a[0]);
    testMutators(
        this.settings,
        DifferentialFuzzSuppressions,
        'suppressions.js',
        'suppressions_expected.js');
  });

  it('adds extra printing', () => {
    testMutators(
        this.settings,
        DifferentialFuzzMutator,
        'mutations.js',
        'mutations_expected.js');
  });

  it('does no extra printing', () => {
    this.settings['DIFF_FUZZ_EXTRA_PRINT'] = 0.0;
    testMutators(
        this.settings,
        DifferentialFuzzMutator,
        'exceptions.js',
        'exceptions_expected.js');
  });

  it('runs end to end', () => {
    // Don't choose any zeroed settings or IGNORE_DEFAULT_PROB in try-catch
    // mutator. Choose using original flags with >= 2%.
    const chooseOrigFlagsProb = 0.2;
    sandbox.stub(random, 'choose').callsFake((p) => p >= chooseOrigFlagsProb);

    // Fake build directory from which two json configurations for flags are
    // loaded.
    const env = {
      APP_DIR: 'test_data/differential_fuzz',
      GENERATE: process.env.GENERATE,
    };
    sandbox.stub(process, 'env').value(env);

    // Fake loading resources and instead load one fixed fake file for each.
    sandbox.stub(sourceHelpers, 'loadResource').callsFake(() => {
      return helpers.loadTestData('differential_fuzz/fake_resource.js');
    });

    // Load input files.
    const files = [
      'differential_fuzz/input1.js',
      'differential_fuzz/input2.js',
    ];
    const sources = files.map(helpers.loadTestData);

    // Apply top-level fuzzing, with all probabilistic configs switched off.
    this.settings['DIFF_FUZZ_EXTRA_PRINT'] = 0.0;
    this.settings['DIFF_FUZZ_TRACK_CAUGHT'] = 0.0;
    const mutator = new DifferentialScriptMutator(
        this.settings, helpers.DB_DIR);
    const mutated = mutator.mutateMultiple(sources);
    helpers.assertExpectedResult(
        'differential_fuzz/combined_expected.js', mutated.code);

    // Flags for v8_foozzie.py are calculated from v8_fuzz_experiments.json and
    // v8_fuzz_flags.json in test_data/differential_fuzz.
    const expectedFlags = [
      '--first-config=ignition',
      '--second-config=ignition_turbo',
      '--second-d8=d8',
      '--second-config-extra-flags=--foo1',
      '--second-config-extra-flags=--foo2',
      '--first-config-extra-flags=--flag1',
      '--second-config-extra-flags=--flag1',
      '--first-config-extra-flags=--flag2',
      '--second-config-extra-flags=--flag2',
      '--first-config-extra-flags=--flag3',
      '--second-config-extra-flags=--flag3',
      '--first-config-extra-flags=--flag4',
      '--second-config-extra-flags=--flag4'
    ];
    assert.deepEqual(expectedFlags, mutated.flags);
  });
});

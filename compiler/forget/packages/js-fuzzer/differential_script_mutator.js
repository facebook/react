// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Script mutator for differential fuzzing.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const common = require('./mutators/common.js');
const random = require('./random.js');
const sourceHelpers = require('./source_helpers.js');

const { filterDifferentialFuzzFlags } = require('./exceptions.js');
const { DifferentialFuzzMutator, DifferentialFuzzSuppressions } = require(
    './mutators/differential_fuzz_mutator.js');
const { ScriptMutator } = require('./script_mutator.js');


const USE_ORIGINAL_FLAGS_PROB = 0.2;

/**
 * Randomly chooses a configuration from experiments. The configuration
 * parameters are expected to be passed from a bundled V8 build. Constraints
 * mentioned below are enforced by PRESUBMIT checks on the V8 side.
 *
 * @param {Object[]} experiments List of tuples (probability, first config name,
 *     second config name, second d8 name). The probabilities are integers in
 *     [0,100]. We assume the sum of all probabilities is 100.
 * @param {Object[]} additionalFlags List of tuples (probability, flag strings).
 *     Probability is in [0,1).
 * @return {string[]} List of flags for v8_foozzie.py.
 */
function chooseRandomFlags(experiments, additionalFlags) {
  // Add additional flags to second config based on experiment percentages.
  const extra_flags = [];
  for (const [p, flags] of additionalFlags) {
    if (random.choose(p)) {
      for (const flag of flags.split(' ')) {
        extra_flags.push('--second-config-extra-flags=' + flag);
      }
    }
  }

  // Calculate flags determining the experiment.
  let acc = 0;
  const threshold = random.random() * 100;
  for (let [prob, first_config, second_config, second_d8] of experiments) {
    acc += prob;
    if (acc > threshold) {
      return [
        '--first-config=' + first_config,
        '--second-config=' + second_config,
        '--second-d8=' + second_d8,
      ].concat(extra_flags);
    }
  }
  // Unreachable.
  assert(false);
}

function loadJSONFromBuild(name) {
  assert(process.env.APP_DIR);
  const fullPath = path.join(path.resolve(process.env.APP_DIR), name);
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function hasMjsunit(dependencies) {
  return dependencies.some(dep => dep.relPath.endsWith('mjsunit.js'));
}

function hasJSTests(dependencies) {
  return dependencies.some(dep => dep.relPath.endsWith('jstest_stubs.js'));
}

class DifferentialScriptMutator extends ScriptMutator {
  constructor(settings, db_path) {
    super(settings, db_path);

    // Mutators for differential fuzzing.
    this.differential = [
      new DifferentialFuzzSuppressions(settings),
      new DifferentialFuzzMutator(settings),
    ];

    // Flag configurations from the V8 build directory.
    this.experiments = loadJSONFromBuild('v8_fuzz_experiments.json');
    this.additionalFlags = loadJSONFromBuild('v8_fuzz_flags.json');
  }

  /**
   * Performes the high-level mutation and afterwards adds flags for the
   * v8_foozzie.py harness.
   */
  mutateMultiple(inputs) {
    const result = super.mutateMultiple(inputs);
    const originalFlags = [];

    // Keep original JS flags in some cases. Let the harness pass them to
    // baseline _and_ comparison run.
    if (random.choose(USE_ORIGINAL_FLAGS_PROB)) {
      for (const flag of filterDifferentialFuzzFlags(result.flags)) {
        originalFlags.push('--first-config-extra-flags=' + flag);
        originalFlags.push('--second-config-extra-flags=' + flag);
      }
    }

    // Add flags for the differnetial-fuzzing settings.
    const fuzzFlags = chooseRandomFlags(this.experiments, this.additionalFlags);
    result.flags = fuzzFlags.concat(originalFlags);
    return result;
  }

  /**
   * Mutatates a set of inputs.
   *
   * Additionally we prepare inputs by tagging each with the original source
   * path for later printing. The mutated sources are post-processed by the
   * differential-fuzz mutators, adding extra printing and other substitutions.
   */
  mutateInputs(inputs) {
    inputs.forEach(input => common.setOriginalPath(input, input.relPath));

    const result = super.mutateInputs(inputs);
    this.differential.forEach(mutator => mutator.mutate(result));
    return result;
  }

  /**
   * Adds extra dependencies for differential fuzzing.
   */
  resolveDependencies(inputs) {
    const dependencies = super.resolveDependencies(inputs);
    // The suppression file neuters functions not working with differential
    // fuzzing. It can also be used to temporarily silence some functionality
    // leading to dupes of an active bug.
    dependencies.push(
        sourceHelpers.loadResource('differential_fuzz_suppressions.js'));
    // Extra printing and tracking functionality.
    dependencies.push(
        sourceHelpers.loadResource('differential_fuzz_library.js'));
    // Make Chakra tests print more.
    dependencies.push(
        sourceHelpers.loadResource('differential_fuzz_chakra.js'));

    if (hasMjsunit(dependencies)) {
      // Make V8 tests print more. We guard this as the functionality
      // relies on mjsunit.js.
      dependencies.push(sourceHelpers.loadResource('differential_fuzz_v8.js'));
    }

    if (hasJSTests(dependencies)) {
      dependencies.push(
          sourceHelpers.loadResource('differential_fuzz_jstest.js'));
    }

    return dependencies;
  }
}

module.exports = {
  DifferentialScriptMutator: DifferentialScriptMutator,
};

// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Script mutator.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const common = require('./mutators/common.js');
const db = require('./db.js');
const random = require('./random.js');
const sourceHelpers = require('./source_helpers.js');

const { AddTryCatchMutator } = require('./mutators/try_catch.js');
const { ArrayMutator } = require('./mutators/array_mutator.js');
const { CrossOverMutator } = require('./mutators/crossover_mutator.js');
const { ExpressionMutator } = require('./mutators/expression_mutator.js');
const { FunctionCallMutator } = require('./mutators/function_call_mutator.js');
const { IdentifierNormalizer } = require('./mutators/normalizer.js');
const { NumberMutator } = require('./mutators/number_mutator.js');
const { ObjectMutator } = require('./mutators/object_mutator.js');
const { VariableMutator } = require('./mutators/variable_mutator.js');
const { VariableOrObjectMutator } = require('./mutators/variable_or_object_mutation.js');

const MAX_EXTRA_MUTATIONS = 5;

function defaultSettings() {
  return {
    ADD_VAR_OR_OBJ_MUTATIONS: 0.1,
    DIFF_FUZZ_EXTRA_PRINT: 0.1,
    DIFF_FUZZ_TRACK_CAUGHT: 0.4,
    MUTATE_ARRAYS: 0.1,
    MUTATE_CROSSOVER_INSERT: 0.05,
    MUTATE_EXPRESSIONS: 0.1,
    MUTATE_FUNCTION_CALLS: 0.1,
    MUTATE_NUMBERS: 0.05,
    MUTATE_OBJECTS: 0.1,
    MUTATE_VARIABLES: 0.075,
    SCRIPT_MUTATOR_EXTRA_MUTATIONS: 0.2,
    SCRIPT_MUTATOR_SHUFFLE: 0.2,
  };
}

class Result {
  constructor(code, flags) {
    this.code = code;
    this.flags = flags;
  }
}

class ScriptMutator {
  constructor(settings, db_path=undefined) {
    // Use process.cwd() to bypass pkg's snapshot filesystem.
    this.mutateDb = new db.MutateDb(db_path || path.join(process.cwd(), 'db'));
    this.mutators = [
      new ArrayMutator(settings),
      new ObjectMutator(settings),
      new VariableMutator(settings),
      new NumberMutator(settings),
      new CrossOverMutator(settings, this.mutateDb),
      new ExpressionMutator(settings),
      new FunctionCallMutator(settings),
      new VariableOrObjectMutator(settings),
    ];
    this.trycatch = new AddTryCatchMutator(settings);
    this.settings = settings;
  }

  _addMjsunitIfNeeded(dependencies, input) {
    if (dependencies.has('mjsunit')) {
      return;
    }

    if (!input.absPath.includes('mjsunit')) {
      return;
    }

    // Find mjsunit.js
    let mjsunitPath = input.absPath;
    while (path.dirname(mjsunitPath) != mjsunitPath &&
           path.basename(mjsunitPath) != 'mjsunit') {
      mjsunitPath = path.dirname(mjsunitPath);
    }

    if (path.basename(mjsunitPath) == 'mjsunit') {
      mjsunitPath = path.join(mjsunitPath, 'mjsunit.js');
      dependencies.set('mjsunit', sourceHelpers.loadDependencyAbs(
          input.baseDir, mjsunitPath));
      return;
    }

    console.log('ERROR: Failed to find mjsunit.js');
  }

  _addSpiderMonkeyShellIfNeeded(dependencies, input) {
    // Find shell.js files
    const shellJsPaths = new Array();
    let currentDir = path.dirname(input.absPath);

    while (path.dirname(currentDir) != currentDir) {
      const shellJsPath = path.join(currentDir, 'shell.js');
      if (fs.existsSync(shellJsPath)) {
         shellJsPaths.push(shellJsPath);
      }

      if (currentDir == 'spidermonkey') {
        break;
      }
      currentDir = path.dirname(currentDir);
    }

    // Add shell.js dependencies in reverse to add ones that are higher up in
    // the directory tree first.
    for (let i = shellJsPaths.length - 1; i >= 0; i--) {
      if (!dependencies.has(shellJsPaths[i])) {
        const dependency = sourceHelpers.loadDependencyAbs(
            input.baseDir, shellJsPaths[i]);
        dependencies.set(shellJsPaths[i], dependency);
      }
    }
  }

  _addJSTestStubsIfNeeded(dependencies, input) {
    if (dependencies.has('jstest_stubs') ||
        !input.absPath.includes('JSTests')) {
      return;
    }
    dependencies.set(
        'jstest_stubs', sourceHelpers.loadResource('jstest_stubs.js'));
  }

  mutate(source) {
    let mutators = this.mutators.slice();
    let annotations = [];
    if (random.choose(this.settings.SCRIPT_MUTATOR_SHUFFLE)){
      annotations.push(' Script mutator: using shuffled mutators');
      random.shuffle(mutators);
    }

    if (random.choose(this.settings.SCRIPT_MUTATOR_EXTRA_MUTATIONS)){
      for (let i = random.randInt(1, MAX_EXTRA_MUTATIONS); i > 0; i--) {
        let mutator = random.single(this.mutators);
        mutators.push(mutator);
        annotations.push(` Script mutator: extra ${mutator.constructor.name}`);
      }
    }

    // Try-catch wrapping should always be the last mutation.
    mutators.push(this.trycatch);

    for (const mutator of mutators) {
      mutator.mutate(source);
    }

    for (const annotation of annotations.reverse()) {
      sourceHelpers.annotateWithComment(source.ast, annotation);
    }
  }

  // Returns parsed dependencies for inputs.
  resolveInputDependencies(inputs) {
    const dependencies = new Map();

    // Resolve test harness files.
    inputs.forEach(input => {
      try {
        // TODO(machenbach): Some harness files contain load expressions
        // that are not recursively resolved. We already remove them, but we
        // also need to load the dependencies they point to.
        this._addJSTestStubsIfNeeded(dependencies, input);
        this._addMjsunitIfNeeded(dependencies, input)
        this._addSpiderMonkeyShellIfNeeded(dependencies, input);
      } catch (e) {
        console.log(
            'ERROR: Failed to resolve test harness for', input.relPath);
        throw e;
      }
    });

    // Resolve dependencies loaded within the input files.
    inputs.forEach(input => {
      try {
        input.loadDependencies(dependencies);
      } catch (e) {
        console.log(
            'ERROR: Failed to resolve dependencies for', input.relPath);
        throw e;
      }
    });

    // Map.values() returns values in insertion order.
    return Array.from(dependencies.values());
  }

  // Combines input dependencies with fuzzer resources.
  resolveDependencies(inputs) {
    const dependencies = this.resolveInputDependencies(inputs);

    // Add stubs for non-standard functions in the beginning.
    dependencies.unshift(sourceHelpers.loadResource('stubs.js'));

    // Add our fuzzing support helpers. This also overrides some common test
    // functions from earlier dependencies that cause early bailouts.
    dependencies.push(sourceHelpers.loadResource('fuzz_library.js'));

    return dependencies;
  }

  // Normalizes, combines and mutates multiple inputs.
  mutateInputs(inputs) {
    const normalizerMutator = new IdentifierNormalizer();

    for (const [index, input] of inputs.entries()) {
      try {
        normalizerMutator.mutate(input);
      } catch (e) {
        console.log('ERROR: Failed to normalize ', input.relPath);
        throw e;
      }

      common.setSourceLoc(input, index, inputs.length);
    }

    // Combine ASTs into one. This is so that mutations have more context to
    // cross over content between ASTs (e.g. variables).
    const combinedSource = common.concatPrograms(inputs);
    this.mutate(combinedSource);

    return combinedSource;
  }

  mutateMultiple(inputs) {
    // High level operation:
    // 1) Compute dependencies from inputs.
    // 2) Normalize, combine and mutate inputs.
    // 3) Generate code with dependency code prepended.
    const dependencies = this.resolveDependencies(inputs);
    const combinedSource = this.mutateInputs(inputs);
    const code = sourceHelpers.generateCode(combinedSource, dependencies);
    const flags = common.concatFlags(dependencies.concat([combinedSource]));
    return new Result(code, flags);
  }
}

module.exports = {
  defaultSettings: defaultSettings,
  ScriptMutator: ScriptMutator,
};

// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Description of this file.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const program = require('commander');

const corpus = require('./corpus.js');
const differentialScriptMutator = require('./differential_script_mutator.js');
const random = require('./random.js');
const scriptMutator = require('./script_mutator.js');
const sourceHelpers = require('./source_helpers.js');

// Maximum number of test inputs to use for one fuzz test.
const MAX_TEST_INPUTS_PER_TEST = 10;

// Base implementations for default or differential fuzzing.
const SCRIPT_MUTATORS = {
  default: scriptMutator.ScriptMutator,
  foozzie: differentialScriptMutator.DifferentialScriptMutator,
};

function getRandomInputs(primaryCorpus, secondaryCorpora, count) {
  count = random.randInt(2, count);

  // Choose 40%-80% of inputs from primary corpus.
  const primaryCount = Math.floor(random.uniform(0.4, 0.8) * count);
  count -= primaryCount;

  let inputs = primaryCorpus.getRandomTestcases(primaryCount);

  // Split remainder equally between the secondary corpora.
  const secondaryCount = Math.floor(count / secondaryCorpora.length);

  for (let i = 0; i < secondaryCorpora.length; i++) {
    let currentCount = secondaryCount;
    if (i == secondaryCorpora.length - 1) {
      // Last one takes the remainder.
      currentCount = count;
    }

    count -= currentCount;
    if (currentCount) {
      inputs = inputs.concat(
          secondaryCorpora[i].getRandomTestcases(currentCount));
    }
  }

  return random.shuffle(inputs);
}

function collect(value, total) {
  total.push(value);
  return total;
}

function overrideSettings(settings, settingOverrides) {
  for (const setting of settingOverrides) {
    const parts = setting.split('=');
    settings[parts[0]] = parseFloat(parts[1]);
  }
}

function* randomInputGen(engine) {
  const inputDir = path.resolve(program.input_dir);

  const v8Corpus = new corpus.Corpus(inputDir, 'v8');
  const chakraCorpus = new corpus.Corpus(inputDir, 'chakra');
  const spiderMonkeyCorpus = new corpus.Corpus(inputDir, 'spidermonkey');
  const jscCorpus = new corpus.Corpus(inputDir, 'WebKit/JSTests');
  const crashTestsCorpus = new corpus.Corpus(inputDir, 'CrashTests');

  for (let i = 0; i < program.no_of_files; i++) {
    let inputs;
    if (engine === 'V8') {
      inputs = getRandomInputs(
          v8Corpus,
          random.shuffle([chakraCorpus, spiderMonkeyCorpus, jscCorpus,
                          crashTestsCorpus, v8Corpus]),
          MAX_TEST_INPUTS_PER_TEST);
    } else if (engine == 'chakra') {
      inputs = getRandomInputs(
          chakraCorpus,
          random.shuffle([v8Corpus, spiderMonkeyCorpus, jscCorpus,
                          crashTestsCorpus]),
          MAX_TEST_INPUTS_PER_TEST);
    } else if (engine == 'spidermonkey') {
      inputs = getRandomInputs(
          spiderMonkeyCorpus,
          random.shuffle([v8Corpus, chakraCorpus, jscCorpus,
                          crashTestsCorpus]),
          MAX_TEST_INPUTS_PER_TEST);
    } else {
      inputs = getRandomInputs(
          jscCorpus,
          random.shuffle([chakraCorpus, spiderMonkeyCorpus, v8Corpus,
                          crashTestsCorpus]),
          MAX_TEST_INPUTS_PER_TEST);
    }

    if (inputs.length > 0) {
      yield inputs;
    }
  }
}

function* corpusInputGen() {
  const inputCorpus = new corpus.Corpus(
      path.resolve(program.input_dir),
      program.mutate_corpus,
      program.extra_strict);
  for (const input of inputCorpus.getAllTestcases()) {
    yield [input];
  }
}

function* enumerate(iterable) {
  let i = 0;
  for (const value of iterable) {
    yield [i, value];
    i++;
  }
}

function main() {
  Error.stackTraceLimit = Infinity;

  program
    .version('0.0.1')
    .option('-i, --input_dir <path>', 'Input directory.')
    .option('-o, --output_dir <path>', 'Output directory.')
    .option('-n, --no_of_files <n>', 'Output directory.', parseInt)
    .option('-c, --mutate_corpus <name>', 'Mutate single files in a corpus.')
    .option('-e, --extra_strict', 'Additionally parse files in strict mode.')
    .option('-m, --mutate <path>', 'Mutate a file and output results.')
    .option('-s, --setting [setting]', 'Settings overrides.', collect, [])
    .option('-v, --verbose', 'More verbose printing.')
    .option('-z, --zero_settings', 'Zero all settings.')
    .parse(process.argv);

  const settings = scriptMutator.defaultSettings();
  if (program.zero_settings) {
    for (const key of Object.keys(settings)) {
      settings[key] = 0.0;
    }
  }

  if (program.setting.length > 0) {
    overrideSettings(settings, program.setting);
  }

  let app_name = process.env.APP_NAME;
  if (app_name && app_name.endsWith('.exe')) {
    app_name = app_name.substr(0, app_name.length - 4);
  }

  if (app_name === 'd8' ||
      app_name === 'v8_simple_inspector_fuzzer' ||
      app_name === 'v8_foozzie.py') {
    // V8 supports running the raw d8 executable, the inspector fuzzer or
    // the differential fuzzing harness 'foozzie'.
    settings.engine = 'V8';
  } else if (app_name === 'ch') {
    settings.engine = 'chakra';
  } else if (app_name === 'js') {
    settings.engine = 'spidermonkey';
  } else if (app_name === 'jsc') {
    settings.engine = 'jsc';
  } else {
    console.log('ERROR: Invalid APP_NAME');
    process.exit(1);
  }

  const mode = process.env.FUZZ_MODE || 'default';
  assert(mode in SCRIPT_MUTATORS, `Unknown mode ${mode}`);
  const mutator = new SCRIPT_MUTATORS[mode](settings);

  if (program.mutate) {
    const absPath = path.resolve(program.mutate);
    const baseDir = path.dirname(absPath);
    const fileName = path.basename(absPath);
    const input = sourceHelpers.loadSource(
        baseDir, fileName, program.extra_strict);
    const mutated = mutator.mutateMultiple([input]);
    console.log(mutated.code);
    return;
  }

  let inputGen;

  if (program.mutate_corpus) {
    inputGen = corpusInputGen();
  } else {
    inputGen = randomInputGen(settings.engine);
  }

  for (const [i, inputs] of enumerate(inputGen)) {
    const outputPath = path.join(program.output_dir, 'fuzz-' + i + '.js');

    const start = Date.now();
    const paths = inputs.map(input => input.relPath);

    try {
      const mutated = mutator.mutateMultiple(inputs);
      fs.writeFileSync(outputPath, mutated.code);

      if (settings.engine === 'V8' && mutated.flags && mutated.flags.length > 0) {
        const flagsPath = path.join(program.output_dir, 'flags-' + i + '.js');
        fs.writeFileSync(flagsPath, mutated.flags.join(' '));
      }
    } catch (e) {
      if (e.message.startsWith('ENOSPC')) {
        console.log('ERROR: No space left. Bailing out...');
        console.log(e);
        return;
      }
      console.log(`ERROR: Exception during mutate: ${paths}`);
      console.log(e);
      continue;
    } finally {
      if (program.verbose) {
        const duration = Date.now() - start;
        console.log(`Mutating ${paths} took ${duration} ms.`);
      }
    }
    if ((i + 1)  % 10 == 0) {
      console.log('Up to ', i + 1);
    }
  }
}

main();

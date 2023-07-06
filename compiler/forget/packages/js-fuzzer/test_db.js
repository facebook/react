// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Test all expressions in DB.
 */

const fs = require('fs');
const fsPath = require('path');
const program = require('commander');
const sinon = require('sinon');

const crossOverMutator = require('./mutators/crossover_mutator.js');
const db = require('./db.js');
const random = require('./random.js');
const sourceHelpers = require('./source_helpers.js');

const sandbox = sinon.createSandbox();

function main() {
  program
    .version('0.0.1')
    .option('-i, --input_dir <path>', 'DB directory.')
    .parse(process.argv);

  if (!program.input_dir) {
    console.log('Need to specify DB dir.');
    return;
  }

  const mutateDb = new db.MutateDb(program.input_dir);
  const mutator = new crossOverMutator.CrossOverMutator(
      { MUTATE_CROSSOVER_INSERT: 1.0, testing: true }, mutateDb);

  let nPass = 0;
  let nFail = 0;
  // Iterate over all statements saved in the DB.
  for (const statementPath of mutateDb.index.all) {
    const expression = JSON.parse(fs.readFileSync(
        fsPath.join(program.input_dir, statementPath)), 'utf-8');
    // Stub out choosing random variables in cross-over mutator.
    sandbox.stub(random, 'single').callsFake((a) => { return a[0]; });
    // Ensure we are selecting the statement of the current iteration.
    sandbox.stub(mutateDb, 'getRandomStatement').callsFake(
        () => { return expression; });
    // Use a source that will try to insert one statement, allowing
    // super.
    const source = sourceHelpers.loadSource(
        __dirname,
        'test_data/cross_over_mutator_class_input.js');
    try {
      mutator.mutate(source);
      nPass++;
    } catch (e) {
      console.log('******************************************************')
      console.log(expression);
      console.log(e.message);
      nFail++;
    }
    sandbox.restore();
  }
  console.log(`Result: ${nPass} passed, ${nFail} failed.`)
}

main();

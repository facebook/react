// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Collect JS nodes.
 */

const program = require('commander');

const corpus = require('./corpus.js');
const db = require('./db.js');
const path = require('path');

const sourceHelpers = require('./source_helpers.js');

function main() {
  Error.stackTraceLimit = Infinity;

  program
    .version('0.0.1')
    .option('-i, --input_dir <path>', 'Input directory.')
    .option('-o, --output_dir <path>', 'Output directory.')
    .parse(process.argv);

  if (!program.args.length) {
    console.log('Need to specify corpora.');
    return;
  }

  if (!program.output_dir) {
    console.log('Need to specify output dir.');
    return;
  }

  const mutateDb = new db.MutateDbWriter(program.output_dir);

  const inputDir = path.resolve(program.input_dir);
  for (const corpusName of program.args) {
    const curCorpus = new corpus.Corpus(inputDir, corpusName);
    for (const relPath of curCorpus.relFiles()) {
      let source;
      try {
        source = sourceHelpers.loadSource(inputDir, relPath);
      } catch (e) {
        console.log(e);
        continue;
      }

      if (!source) {
        continue;
      }

      try{
        mutateDb.process(source);
      } catch (e) {
        console.log(e);
      }
    }
  }

  mutateDb.writeIndex();
}

main();

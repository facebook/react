// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Generate exceptions from full corpus test report.
 */

const program = require('commander');

const assert = require('assert');
const babelGenerator = require('@babel/generator').default;
const babelTemplate = require('@babel/template').default;
const babelTypes = require('@babel/types');
const fs = require('fs');
const p = require('path');
const prettier = require("prettier");

const SPLIT_LINES_RE = /^.*([\n\r]+|$)/gm;
const PARSE_RE = /^Parsing (.*) sloppy took (\d+) ms\.\n$/;
const MUTATE_RE = /^Mutating (.*) took (\d+) ms\.\n$/;
const PARSE_FAILED_RE = /^WARNING: failed to sloppy parse (.*)\n$/;
const PARSE_STRICT_FAILED_RE = /^WARNING: failed to strict parse (.*)\n$/;
const MUTATE_FAILED_RE = /^ERROR: Exception during mutate: (.*)\n$/;

// Add tests matching error regexp to result array.
function matchError(regexp, line, resultArray){
  const match = line.match(regexp);
  if (!match) return false;
  const relPath = match[1];
  assert(relPath);
  resultArray.push(relPath);
  return true;
}

// Sum up total duration of tests matching the duration regexp and
// map test -> duration in result map.
function matchDuration(regexp, line, resultMap){
  const match = line.match(regexp);
  if (!match) return false;
  const relPath = match[1];
  assert(relPath);
  resultMap[relPath] = (resultMap[relPath] || 0) + parseInt(match[2]);
  return true;
}

// Create lists of failed and slow tests from stdout of a fuzzer run.
function processFuzzOutput(outputFile){
  const text = fs.readFileSync(outputFile, 'utf-8');
  const lines = text.match(SPLIT_LINES_RE);

  const failedParse = [];
  const failedParseStrict = [];
  const failedMutate = [];
  const durationsMap = {};

  for (const line of lines) {
    if (matchError(PARSE_FAILED_RE, line, failedParse))
      continue;
    if (matchError(PARSE_STRICT_FAILED_RE, line, failedParseStrict))
      continue;
    if (matchError(MUTATE_FAILED_RE, line, failedMutate))
      continue;
    if (matchDuration(PARSE_RE, line, durationsMap))
      continue;
    if (matchDuration(MUTATE_RE, line, durationsMap))
      continue;
  }

  // Tuples (absPath, duration).
  const total = Object.entries(durationsMap);
  // Tuples (absPath, duration) with 2s < duration <= 10s.
  const slow = total.filter(t => t[1] > 2000 && t[1] <= 10000);
  // Tuples (absPath, duration) with 10s < duration.
  const verySlow = total.filter(t => t[1] > 10000);

  // Assert there's nothing horribly wrong with the results.
  // We have at least 2500 tests in the output.
  assert(total.length > 2500);
  // No more than 5% parse/mutation errors.
  assert(failedParse.length + failedMutate.length < total.length / 20);
  // No more than 10% slow tests
  assert(slow.length < total.length / 10);
  // No more than 2% very slow tests.
  assert(verySlow.length < total.length / 50);

  // Sort everything.
  failedParse.sort();
  failedParseStrict.sort();
  failedMutate.sort();

  function slowestFirst(a, b) {
    return b[1] - a[1];
  }

  slow.sort(slowestFirst);
  verySlow.sort(slowestFirst);

  return [failedParse, failedParseStrict, failedMutate, slow, verySlow];
}

// List of string literals of failed tests.
function getLiteralsForFailed(leadingComment, failedList) {
  const result = failedList.map(path => babelTypes.stringLiteral(path));
  if (result.length) {
    babelTypes.addComment(result[0], 'leading', leadingComment);
  }
  return result;
}

// List of string literals of slow tests with duration comments.
function getLiteralsForSlow(leadingComment, slowList) {
  const result = slowList.map(([path, duration]) => {
    const literal = babelTypes.stringLiteral(path);
    babelTypes.addComment(
        literal, 'trailing', ` ${duration / 1000}s`, true);
    return literal;
  });
  if (result.length) {
    babelTypes.addComment(result[0], 'leading', leadingComment);
  }
  return result;
}

function main() {
  program
    .version('0.0.1')
    .parse(process.argv);

  if (!program.args.length) {
    console.log('Need to specify stdout reports of fuzz runs.');
    return;
  }

  let skipped = [];
  let softSkipped = [];
  let sloppy = [];
  for (const outputFile of program.args) {
    const [failedParse, failedParseStrict, failedMutate, slow, verySlow] = (
        processFuzzOutput(outputFile));
    const name = p.basename(outputFile, p.extname(outputFile));

    // Skip tests that fail to parse/mutate or are very slow.
    skipped = skipped.concat(getLiteralsForFailed(
        ` Tests with parse errors from ${name} `, failedParse));
    skipped = skipped.concat(getLiteralsForFailed(
        ` Tests with mutation errors from ${name} `, failedMutate));
    skipped = skipped.concat(getLiteralsForSlow(
        ` Very slow tests from ${name} `, verySlow));

    // Soft-skip slow but not very slow tests.
    softSkipped = softSkipped.concat(getLiteralsForSlow(
        ` Slow tests from ${name} `, slow));

    // Mark sloppy tests.
    sloppy = sloppy.concat(getLiteralsForFailed(
        ` Tests requiring sloppy mode from ${name} `, failedParseStrict));
  }

  const fileTemplate = babelTemplate(`
    /**
     * @fileoverview Autogenerated exceptions. Created with gen_exceptions.js.
     */

    'use strict';

    const skipped = SKIPPED;

    const softSkipped = SOFTSKIPPED;

    const sloppy = SLOPPY;

    module.exports = {
      generatedSkipped: new Set(skipped),
      generatedSoftSkipped: new Set(softSkipped),
      generatedSloppy: new Set(sloppy),
    }
  `, {preserveComments: true});

  const skippedArray = babelTypes.arrayExpression(skipped);
  const softSkippedArray = babelTypes.arrayExpression(softSkipped);
  const sloppyArray = babelTypes.arrayExpression(sloppy);

  const statements = fileTemplate({
    SKIPPED: skippedArray,
    SOFTSKIPPED: softSkippedArray,
    SLOPPY: sloppyArray,
  });

  const resultProgram = babelTypes.program(statements);
  const code = babelGenerator(resultProgram, { comments: true }).code;
  const prettyCode = prettier.format(code, { parser: "babel" });
  fs.writeFileSync('generated/exceptions.js', prettyCode);
}

main();

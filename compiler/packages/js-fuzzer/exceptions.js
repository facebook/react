// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Blacklists for fuzzer.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const random = require('./random.js');

const {generatedSloppy, generatedSoftSkipped, generatedSkipped} = require(
    './generated/exceptions.js');

const SKIPPED_FILES = [
    // Disabled for unexpected test behavior, specific to d8 shell.
    'd8-os.js',
    'd8-readbuffer.js',

    // Passes JS flags.
    'd8-arguments.js',

    // Slow tests or tests that are too large to be used as input.
    /numops-fuzz-part.*.js/,
    'regexp-pcre.js',
    'unicode-test.js',
    'unicodelctest.js',
    'unicodelctest-no-optimization.js',

    // Unsupported modules.
    /^modules.*\.js/,

    // Unsupported property escapes.
    /^regexp-property-.*\.js/,

    // Bad testcases that just loads a script that always throws errors.
    'regress-444805.js',
    'regress-crbug-489597.js',
    'regress-crbug-620253.js',

    // Just recursively loads itself.
    'regress-8510.js',
];

const SKIPPED_DIRECTORIES = [
    // Slow tests or tests that are too large to be used as input.
    'embenchen',
    'poppler',
    'sqlite',

    // Causes lots of failures.
    'test262',

    // Unavailable debug.Debug.
    'v8/test/debugger',
    'v8/test/inspector',

    // Unsupported modules.
    'v8/test/js-perf-test/Modules',

    // Contains tests expected to error out on parsing.
    'v8/test/message',

    // Needs specific dependencies for load of various tests.
    'v8/test/mjsunit/tools',

    // Unsupported e4x standard.
    'mozilla/data/e4x',

    // Bails out fast without ReadableStream support.
    'spidermonkey/non262/ReadableStream',
];

// Files used with a lower probability.
const SOFT_SKIPPED_FILES = [
    // Tests with large binary content.
    /^binaryen.*\.js/,

    // Tests slow to parse.
    // CrashTests:
    /^jquery.*\.js/,
    // Spidermonkey:
    'regress-308085.js',
    'regress-74474-002.js',
    'regress-74474-003.js',
    // V8:
    'object-literal.js',
];

// Flags that lead to false positives or that are already passed by default.
const DISALLOWED_FLAGS = [
    // Disallowed because features prefixed with "experimental" are not
    // stabilized yet and would cause too much noise when enabled.
    /^--experimental-.*/,

    // Disallowed due to noise. We explicitly add --harmony to job
    // definitions, and all of these features are staged before launch.
    /^--harmony-.*/,

    // Disallowed because they are passed explicitly on the command line.
    '--allow-natives-syntax',
    '--debug-code',
    '--harmony',
    '--wasm-staging',
    '--expose-gc',
    '--expose_gc',
    '--icu-data-file',
    '--random-seed',

    // Disallowed due to false positives.
    '--check-handle-count',
    '--correctness-fuzzer-suppressions',
    '--expose-debug-as',
    '--expose-natives-as',
    '--expose-trigger-failure',
    '--mock-arraybuffer-allocator',
    'natives',  // Used in conjuction with --expose-natives-as.
    /^--trace-path.*/,
];

// Flags only used with 25% probability.
const LOW_PROB_FLAGS_PROB = 0.25;
const LOW_PROB_FLAGS = [
    // Flags that lead to slow test performance.
    /^--gc-interval.*/,
    /^--deopt-every-n-times.*/,
];


// Flags printing data, leading to false positives in differential fuzzing.
const DISALLOWED_DIFFERENTIAL_FUZZ_FLAGS = [
    /^--gc-interval.*/,
    /^--perf.*/,
    /^--print.*/,
    /^--stress-runs.*/,
    /^--trace.*/,
    '--expose-externalize-string',
    '--interpreted-frames-native-stack',
    '--validate-asm',
];

const MAX_FILE_SIZE_BYTES = 128 * 1024;  // 128KB
const MEDIUM_FILE_SIZE_BYTES = 32 * 1024;  // 32KB

function _findMatch(iterable, candidate) {
  for (const entry of iterable) {
    if (typeof entry === 'string') {
      if (entry === candidate) {
        return true;
      }
    } else {
      if (entry.test(candidate)) {
        return true;
      }
    }
  }

  return false;
}

function _doesntMatch(iterable, candidate) {
  return !_findMatch(iterable, candidate);
}

// Convert Windows path separators.
function normalize(testPath) {
  return path.normalize(testPath).replace(/\\/g, '/');
}

function isTestSkippedAbs(absPath) {
  const basename = path.basename(absPath);
  if (_findMatch(SKIPPED_FILES, basename)) {
    return true;
  }

  const normalizedTestPath = normalize(absPath);
  for (const entry of SKIPPED_DIRECTORIES) {
    if (normalizedTestPath.includes(entry))  {
      return true;
    }
  }

  // Avoid OOM/hangs through huge inputs.
  const stat = fs.statSync(absPath);
  return (stat && stat.size >= MAX_FILE_SIZE_BYTES);
}

function isTestSkippedRel(relPath) {
  return generatedSkipped.has(normalize(relPath));
}

// For testing.
function getSoftSkipped() {
  return SOFT_SKIPPED_FILES;
}

// For testing.
function getGeneratedSoftSkipped() {
  return generatedSoftSkipped;
}

// For testing.
function getGeneratedSloppy() {
  return generatedSloppy;
}

function isTestSoftSkippedAbs(absPath) {
  const basename = path.basename(absPath);
  if (_findMatch(this.getSoftSkipped(), basename)) {
    return true;
  }

  // Graylist medium size files.
  const stat = fs.statSync(absPath);
  return (stat && stat.size >= MEDIUM_FILE_SIZE_BYTES);
}

function isTestSoftSkippedRel(relPath) {
  return this.getGeneratedSoftSkipped().has(normalize(relPath));
}

function isTestSloppyRel(relPath) {
  return this.getGeneratedSloppy().has(normalize(relPath));
}

function filterFlags(flags) {
  return flags.filter(flag => {
    return (
        _doesntMatch(DISALLOWED_FLAGS, flag) &&
        (_doesntMatch(LOW_PROB_FLAGS, flag) ||
         random.choose(LOW_PROB_FLAGS_PROB)));
  });
}

function filterDifferentialFuzzFlags(flags) {
  return flags.filter(
      flag => _doesntMatch(DISALLOWED_DIFFERENTIAL_FUZZ_FLAGS, flag));
}


module.exports = {
  filterDifferentialFuzzFlags: filterDifferentialFuzzFlags,
  filterFlags: filterFlags,
  getGeneratedSoftSkipped: getGeneratedSoftSkipped,
  getGeneratedSloppy: getGeneratedSloppy,
  getSoftSkipped: getSoftSkipped,
  isTestSkippedAbs: isTestSkippedAbs,
  isTestSkippedRel: isTestSkippedRel,
  isTestSoftSkippedAbs: isTestSoftSkippedAbs,
  isTestSoftSkippedRel: isTestSoftSkippedRel,
  isTestSloppyRel: isTestSloppyRel,
}

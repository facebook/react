/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var spawnSync = require('child_process').spawnSync;
var path = require('path');

describe('ReactClassEquivalence', () => {
  it('tests the same thing for es6 classes and CoffeeScript', () => {
    var result1 = runJest('ReactCoffeeScriptClass-test.coffee');
    var result2 = runJest('ReactES6Class-test.js');
    compareResults(result1, result2);
  });

  it('tests the same thing for es6 classes and TypeScript', () => {
    var result1 = runJest('ReactTypeScriptClass-test.ts');
    var result2 = runJest('ReactES6Class-test.js');
    compareResults(result1, result2);
  });
});

function runJest(testFile) {
  var cwd = process.cwd();
  var extension = process.platform === 'win32' ? '.cmd' : '';
  var jestBin = path.resolve('node_modules', '.bin', 'jest' + extension);
  var setupFile = path.resolve(
    'scripts',
    'jest',
    'setupSpecEquivalenceReporter.js',
  );
  var result = spawnSync(
    jestBin,
    [testFile, '--setupTestFrameworkScriptFile', setupFile],
    {cwd},
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      'jest process exited with: ' +
        result.status +
        '\n' +
        'stdout: ' +
        result.stdout.toString() +
        'stderr: ' +
        result.stderr.toString(),
    );
  }

  return result.stdout.toString();
}

function compareResults(a, b) {
  var regexp = /EQUIVALENCE.*$/gm;
  var aSpecs = (a.match(regexp) || []).sort().join('\n');
  var bSpecs = (b.match(regexp) || []).sort().join('\n');

  if (aSpecs.length === 0 && bSpecs.length === 0) {
    throw new Error('No spec results found in the output');
  }

  expect(aSpecs).toEqual(bSpecs);
}

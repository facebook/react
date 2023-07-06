// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Test normalization.
 */

'use strict';

const sinon = require('sinon');

const helpers = require('./helpers.js');
const sourceHelpers = require('../source_helpers.js');

const { ScriptMutator } = require('../script_mutator.js');

const sandbox = sinon.createSandbox();

function testLoad(testPath, expectedPath) {
  const mutator = new ScriptMutator({}, helpers.DB_DIR);
  const source = helpers.loadTestData(testPath);
  const dependencies = mutator.resolveInputDependencies([source]);
  const code = sourceHelpers.generateCode(source, dependencies);
  helpers.assertExpectedResult(expectedPath, code);
}

describe('V8 dependencies', () => {
  it('test', () => {
    testLoad(
        'mjsunit/test_load.js',
        'mjsunit/test_load_expected.js');

  });
  it('does not loop indefinitely', () => {
    testLoad(
        'mjsunit/test_load_self.js',
        'mjsunit/test_load_self_expected.js');
  });
});

describe('Chakra dependencies', () => {
  it('test', () => {
    testLoad(
        'chakra/load.js',
        'chakra/load_expected.js');
  });
});

describe('JSTest dependencies', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('test', () => {
    const fakeStubs = sourceHelpers.loadSource(
        helpers.BASE_DIR, 'JSTests/fake_stub.js');
    sandbox.stub(sourceHelpers, 'loadResource').callsFake(() => fakeStubs);
    testLoad('JSTests/load.js', 'JSTests/load_expected.js');
  });
});

describe('SpiderMonkey dependencies', () => {
  it('test', () => {
    testLoad(
        'spidermonkey/test/load.js',
        'spidermonkey/test/load_expected.js');
  });
});

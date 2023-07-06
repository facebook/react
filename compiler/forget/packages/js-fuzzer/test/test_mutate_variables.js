// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Tests for mutating variables
 */

'use strict';

const babelTypes = require('@babel/types');
const sinon = require('sinon');

const common = require('../mutators/common.js');
const helpers = require('./helpers.js');
const scriptMutator = require('../script_mutator.js');
const sourceHelpers = require('../source_helpers.js');
const variableMutator = require('../mutators/variable_mutator.js');

const sandbox = sinon.createSandbox();

describe('Mutate variables', () => {
  beforeEach(() => {
    sandbox.stub(
        common, 'randomVariable').callsFake(
            () => { return babelTypes.identifier('REPLACED') });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('test', () => {

    const source = helpers.loadTestData('mutate_variables.js');

    const settings = scriptMutator.defaultSettings();
    settings['MUTATE_VARIABLES'] = 1.0;

    const mutator = new variableMutator.VariableMutator(settings);
    mutator.mutate(source);

    const mutated = sourceHelpers.generateCode(source);
    helpers.assertExpectedResult(
        'mutate_variables_expected.js', mutated);
  });
});

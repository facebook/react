// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Tests for mutating expressions
 */

'use strict';

const assert = require('assert');

const babelTypes = require('@babel/types');
const sinon = require('sinon');

const common = require('../mutators/common.js');
const expressionMutator = require('../mutators/expression_mutator.js');
const helpers = require('./helpers.js');
const scriptMutator = require('../script_mutator.js');
const sourceHelpers = require('../source_helpers.js');
const random = require('../random.js');

const sandbox = sinon.createSandbox();

function testCloneSiblings(expected_file) {
  const source = helpers.loadTestData('mutate_expressions.js');

  const settings = scriptMutator.defaultSettings();
  settings['MUTATE_EXPRESSIONS'] = 1.0;

  const mutator = new expressionMutator.ExpressionMutator(settings);
  mutator.mutate(source);

  const mutated = sourceHelpers.generateCode(source);
  helpers.assertExpectedResult(expected_file, mutated);
}

describe('Mutate expressions', () => {
  beforeEach(() => {
    // Select the previous sibling.
    sandbox.stub(random, 'randInt').callsFake((a, b) => b);
    // This chooses cloning siblings.
    sandbox.stub(random, 'random').callsFake(() => 0.8);
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('clones previous to current', () => {
    // Keep the order of [previous, current], select previous.
    sandbox.stub(random, 'shuffle').callsFake(a => a);
    // Insert after. Keep returning true for the MUTATE_EXPRESSIONS check.
    sandbox.stub(random, 'choose').callsFake(a => a === 1);

    testCloneSiblings('mutate_expressions_previous_expected.js');
  });

  it('clones current to previous', () => {
    // Switch the order of [previous, current], select current.
    sandbox.stub(random, 'shuffle').callsFake(a => [a[1], a[0]]);
    // Insert before.
    sandbox.stub(random, 'choose').callsFake(() => true);

    testCloneSiblings('mutate_expressions_current_expected.js');
  });
});

describe('Cloning', () => {
  // Ensure that the source location we add are not cloned.
  it('is not copying added state', () => {
    const source = helpers.loadTestData('mutate_expressions.js');
    common.setSourceLoc(source, 5, 10);
    const noopNode = source.ast.program.body[0];
    assert.equal(0.5, common.getSourceLoc(noopNode));
    const cloned = babelTypes.cloneDeep(noopNode);
    assert.equal(undefined, common.getSourceLoc(cloned));
  });
});

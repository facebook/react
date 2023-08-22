// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Test random utilities.
 */

'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { twoBucketSample } = require('../random.js');

const sandbox = sinon.createSandbox();


describe('Two-bucket choosing', () => {
  afterEach(() => {
    sandbox.restore();
  });

  it('with one empty', () => {
    sandbox.stub(Math, 'random').callsFake(() => 0.5);
    assert.deepEqual([1, 2], twoBucketSample([0, 1, 2], [], 1, 2));
    assert.deepEqual([1, 2], twoBucketSample([], [0, 1, 2], 1, 2));
    assert.deepEqual([0], twoBucketSample([0], [], 1, 1));
    assert.deepEqual([0], twoBucketSample([], [0], 1, 1));
  });

  it('chooses with 0.3', () => {
    sandbox.stub(Math, 'random').callsFake(() => 0.3);
    assert.deepEqual([1, 2], twoBucketSample([0, 1, 2], [3, 4, 5], 1, 2));
    // Higher factor.
    assert.deepEqual([3, 5], twoBucketSample([0, 1, 2], [3, 4, 5], 4, 2));
  });

  it('chooses with 0.7', () => {
    sandbox.stub(Math, 'random').callsFake(() => 0.7);
    assert.deepEqual([4, 3], twoBucketSample([0, 1, 2], [3, 4, 5], 1, 2));
  });

  it('chooses with 0.5', () => {
    sandbox.stub(Math, 'random').callsFake(() => 0.5);
    assert.deepEqual([3], twoBucketSample([0, 1], [2, 3, 4, 5], 1, 1));
    assert.deepEqual([3], twoBucketSample([0, 1, 2, 3], [4, 5], 1, 1));
    // Higher factor.
    assert.deepEqual([4], twoBucketSample([0, 1, 2, 3], [4, 5], 2, 1));
  });
});

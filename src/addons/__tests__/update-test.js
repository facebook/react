/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

"use strict";

var update = require('update');

describe('update', function() {
  it('should support push', function() {
    expect(update([1], {$push: [7]})).toEqual([1, 7]);
    expect(update.bind(null, [], {$push: 7})).toThrow(
      'Invariant Violation: update(): expected spec of $push to be an ' +
      'array; got 7. Did you forget to wrap your parameter in an array?'
    );
    expect(update.bind(null, 1, {$push: 7})).toThrow(
      'Invariant Violation: update(): expected target of $push to be an ' +
      'array; got 1.'
    );
  });

  it('should support unshift', function() {
    expect(update([1], {$unshift: [7]})).toEqual([7, 1]);
    expect(update.bind(null, [], {$unshift: 7})).toThrow(
      'Invariant Violation: update(): expected spec of $unshift to be an ' +
      'array; got 7. Did you forget to wrap your parameter in an array?'
    );
    expect(update.bind(null, 1, {$unshift: 7})).toThrow(
      'Invariant Violation: update(): expected target of $unshift to be an ' +
      'array; got 1.'
    );
  });

  it('should support splice', function() {
    expect(update([1, 4, 3], {$splice: [[1, 1, 2]]})).toEqual([1, 2, 3]);
    expect(update.bind(null, [], {$splice: 1})).toThrow(
      'Invariant Violation: update(): expected spec of $splice to be an ' +
      'array of arrays; got 1. Did you forget to wrap your parameters in an '+
      'array?'
    );
    expect(update.bind(null, [], {$splice: [1]})).toThrow(
      'Invariant Violation: update(): expected spec of $splice to be an ' +
      'array of arrays; got 1. Did you forget to wrap your parameters in an ' +
      'array?'
    );
    expect(update.bind(null, 1, {$splice: 7})).toThrow(
      'Invariant Violation: Expected $splice target to be an array; got 1'
    );
  });

  it('should support merge', function() {
    expect(update({a: 'b'}, {$merge: {c: 'd'}})).toEqual({a: 'b', c: 'd'});
    expect(update.bind(null, {}, {$merge: 7})).toThrow(
      'Invariant Violation: update(): $merge expects a spec of type ' +
      '\'object\'; got 7'
    );
    expect(update.bind(null, 7, {$merge: {a: 'b'}})).toThrow(
      'Invariant Violation: update(): $merge expects a target of type ' +
      '\'object\'; got 7'
    );
  });

  it('should support set', function() {
    expect(update({a: 'b'}, {$set: {c: 'd'}})).toEqual({c: 'd'});
  });

  it('should support apply', function() {
    expect(update(2, {$apply: function(x) { return x * 2; }})).toEqual(4);
    expect(update.bind(null, 2, {$apply: 123})).toThrow(
      'Invariant Violation: update(): expected spec of $apply to be a ' +
      'function; got 123.'
    );
  });

  it('should support deep updates', function() {
    expect(update({a: 'b', c: {d: 'e'}}, {c: {d: {$set: 'f'}}})).toEqual({
      a: 'b',
      c: {d: 'f'}
    });
  });

  it('should require a command', function() {
    expect(update.bind(null, {a: 'b'}, {a: 'c'})).toThrow(
      'Invariant Violation: update(): You provided a key path to update() ' +
      'that did not contain one of $push, $unshift, $splice, $set, $merge, ' +
      '$apply. Did you forget to include {$set: ...}?'
    );
  });
});

/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

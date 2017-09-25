/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var update = require('update');

describe('update', () => {
  describe('$push', () => {
    it('pushes', () => {
      expect(update([1], {$push: [7]})).toEqual([1, 7]);
    });
    it('does not mutate the original object', () => {
      var obj = [1];
      update(obj, {$push: [7]});
      expect(obj).toEqual([1]);
    });
    it('only pushes an array', () => {
      expect(update.bind(null, [], {$push: 7})).toThrowError(
        'update(): expected spec of $push to be an array; got 7. Did you ' +
          'forget to wrap your parameter in an array?',
      );
    });
    it('only pushes unto an array', () => {
      expect(update.bind(null, 1, {$push: 7})).toThrowError(
        'update(): expected target of $push to be an array; got 1.',
      );
    });
  });

  describe('$unshift', () => {
    it('unshifts', () => {
      expect(update([1], {$unshift: [7]})).toEqual([7, 1]);
    });
    it('does not mutate the original object', () => {
      var obj = [1];
      update(obj, {$unshift: [7]});
      expect(obj).toEqual([1]);
    });
    it('only unshifts an array', () => {
      expect(update.bind(null, [], {$unshift: 7})).toThrowError(
        'update(): expected spec of $unshift to be an array; got 7. Did you ' +
          'forget to wrap your parameter in an array?',
      );
    });
    it('only unshifts unto an array', () => {
      expect(update.bind(null, 1, {$unshift: 7})).toThrowError(
        'update(): expected target of $unshift to be an array; got 1.',
      );
    });
  });

  describe('$splice', () => {
    it('splices', () => {
      expect(update([1, 4, 3], {$splice: [[1, 1, 2]]})).toEqual([1, 2, 3]);
    });
    it('does not mutate the original object', () => {
      var obj = [1, 4, 3];
      update(obj, {$splice: [[1, 1, 2]]});
      expect(obj).toEqual([1, 4, 3]);
    });
    it('only splices an array of arrays', () => {
      expect(update.bind(null, [], {$splice: 1})).toThrowError(
        'update(): expected spec of $splice to be an array of arrays; got 1. ' +
          'Did you forget to wrap your parameters in an array?',
      );
      expect(update.bind(null, [], {$splice: [1]})).toThrowError(
        'update(): expected spec of $splice to be an array of arrays; got 1. ' +
          'Did you forget to wrap your parameters in an array?',
      );
    });
    it('only splices unto an array', () => {
      expect(update.bind(null, 1, {$splice: 7})).toThrowError(
        'Expected $splice target to be an array; got 1',
      );
    });
  });

  describe('$merge', () => {
    it('merges', () => {
      expect(update({a: 'b'}, {$merge: {c: 'd'}})).toEqual({a: 'b', c: 'd'});
    });
    it('does not mutate the original object', () => {
      var obj = {a: 'b'};
      update(obj, {$merge: {c: 'd'}});
      expect(obj).toEqual({a: 'b'});
    });
    it('only merges with an object', () => {
      expect(update.bind(null, {}, {$merge: 7})).toThrowError(
        "update(): $merge expects a spec of type 'object'; got 7",
      );
    });
    it('only merges with an object', () => {
      expect(update.bind(null, 7, {$merge: {a: 'b'}})).toThrowError(
        "update(): $merge expects a target of type 'object'; got 7",
      );
    });
  });

  describe('$set', () => {
    it('sets', () => {
      expect(update({a: 'b'}, {$set: {c: 'd'}})).toEqual({c: 'd'});
    });
    it('does not mutate the original object', () => {
      var obj = {a: 'b'};
      update(obj, {$set: {c: 'd'}});
      expect(obj).toEqual({a: 'b'});
    });
  });

  describe('$apply', () => {
    var applier = function(node) {
      return {v: node.v * 2};
    };
    it('applies', () => {
      expect(update({v: 2}, {$apply: applier})).toEqual({v: 4});
    });
    it('does not mutate the original object', () => {
      var obj = {v: 2};
      update(obj, {$apply: applier});
      expect(obj).toEqual({v: 2});
    });
    it('only applies a function', () => {
      expect(update.bind(null, 2, {$apply: 123})).toThrowError(
        'update(): expected spec of $apply to be a function; got 123.',
      );
    });
  });

  it('should support deep updates', () => {
    expect(
      update(
        {
          a: 'b',
          c: {
            d: 'e',
            f: [1],
            g: [2],
            h: [3],
            i: {j: 'k'},
            l: 4,
          },
        },
        {
          c: {
            d: {$set: 'm'},
            f: {$push: [5]},
            g: {$unshift: [6]},
            h: {$splice: [[0, 1, 7]]},
            i: {$merge: {n: 'o'}},
            l: {$apply: x => x * 2},
          },
        },
      ),
    ).toEqual({
      a: 'b',
      c: {
        d: 'm',
        f: [1, 5],
        g: [6, 2],
        h: [7],
        i: {j: 'k', n: 'o'},
        l: 8,
      },
    });
  });

  it('should require a command', () => {
    expect(update.bind(null, {a: 'b'}, {a: 'c'})).toThrowError(
      'update(): You provided a key path to update() that did not contain ' +
        'one of $push, $unshift, $splice, $set, $merge, $apply. Did you ' +
        'forget to include {$set: ...}?',
    );
  });

  it('should perform safe hasOwnProperty check', () => {
    expect(update({}, {hasOwnProperty: {$set: 'a'}})).toEqual({
      hasOwnProperty: 'a',
    });
  });
});

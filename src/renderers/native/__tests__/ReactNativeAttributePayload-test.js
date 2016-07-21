/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

jest.unmock('ReactNativeAttributePayload');
jest.unmock('ReactNativePropRegistry');
// jest.dontMock('deepDiffer');
// jest.dontMock('flattenStyle');

var ReactNativeAttributePayload = require('ReactNativeAttributePayload');
var ReactNativePropRegistry = require('ReactNativePropRegistry');

var create = ReactNativeAttributePayload.create;
var diff = ReactNativeAttributePayload.diff;

describe('ReactNativeAttributePayload', function() {

  it('should work with simple example', () => {
    expect(diff(
      {a: 1, c: 3},
      {b: 2, c: 3},
      {a: true, b: true, c: true}
    )).toEqual({a: null, b: 2});
  });

  it('should skip fields that are equal', () => {
    expect(diff(
      {a: 1, b: 'two', c: true, d: false, e: undefined, f: 0},
      {a: 1, b: 'two', c: true, d: false, e: undefined, f: 0},
      {a: true, b: true, c: true, d: true, e: true, f: true}
    )).toEqual(null);
  });

  it('should remove fields', () => {
    expect(diff(
      {a: 1},
      {},
      {a: true}
    )).toEqual({a: null});
  });

  it('should remove fields that are set to undefined', () => {
    expect(diff(
      {a: 1},
      {a: undefined},
      {a: true}
    )).toEqual({a: null});
  });

  it('should ignore invalid fields', () => {
    spyOn(console, 'error');

    expect(diff(
      {a: 1},
      {b: 2},
      {}
    )).toEqual(null);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toBe('Warning: unsupported attribute: b');
  });

  it('should use the diff attribute', () => {
    var diffA = jest.fn((a, b) => true);
    var diffB = jest.fn((a, b) => false);
    expect(diff(
      {a: [1], b: [3]},
      {a: [2], b: [4]},
      {a: {diff: diffA}, b: {diff: diffB}}
    )).toEqual({a: [2]});
    expect(diffA).toBeCalledWith([1], [2]);
    expect(diffB).toBeCalledWith([3], [4]);
  });

  it('should not use the diff attribute on addition/removal', () => {
    var diffA = jest.fn();
    var diffB = jest.fn();
    expect(diff(
      {a: [1]},
      {b: [2]},
      {a: {diff: diffA}, b: {diff: diffB}}
    )).toEqual({a: null, b: [2]});
    expect(diffA).not.toBeCalled();
    expect(diffB).not.toBeCalled();
  });

  it('should do deep diffs of Objects by default', () => {
    expect(diff(
      {a: [1], b: {k: [3, 4]}, c: {k: [4, 4]} },
      {a: [2], b: {k: [3, 4]}, c: {k: [4, 5]} },
      {a: true, b: true, c: true}
    )).toEqual({a: [2], c: {k: [4, 5]}});
  });

  it('should work with undefined styles', () => {
    spyOn(console, 'error');

    expect(diff(
      { style: { a: '#ffffff', b: 1 } },
      { style: undefined },
      { style: { b: true } }
    )).toEqual({ b: null });
    expect(diff(
      { style: undefined },
      { style: { a: '#ffffff', b: 1 } },
      { style: { b: true } }
    )).toEqual({ b: 1 });
    expect(diff(
      { style: undefined },
      { style: undefined },
      { style: { b: true } }
    )).toEqual(null);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toBe('Warning: unsupported attribute: a');
  });

  it('should work with empty styles', () => {
    spyOn(console, 'error');

    expect(diff(
      {a: 1, c: 3},
      {},
      {a: true, b: true}
    )).toEqual({a: null});
    expect(diff(
      {},
      {a: 1, c: 3},
      {a: true, b: true}
    )).toEqual({a: 1});
    expect(diff(
      {},
      {},
      {a: true, b: true}
    )).toEqual(null);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toBe('Warning: unsupported attribute: c');
  });

  it('should flatten nested styles and predefined styles', () => {
    var validStyleAttribute = { someStyle: { foo: true, bar: true } };

    expect(diff(
      {},
      { someStyle: [{ foo: 1 }, { bar: 2 }]},
      validStyleAttribute
    )).toEqual({ foo: 1, bar: 2 });

    expect(diff(
      { someStyle: [{ foo: 1 }, { bar: 2 }]},
      {},
      validStyleAttribute
    )).toEqual({ foo: null, bar: null });

    var barStyle = ReactNativePropRegistry.register({
      bar: 3,
    });

    expect(diff(
      {},
      { someStyle: [[{ foo: 1 }, { foo: 2 }], barStyle]},
      validStyleAttribute
    )).toEqual({ foo: 2, bar: 3 });
  });

  it('should reset a value to a previous if it is removed', () => {
    var validStyleAttribute = { someStyle: { foo: true, bar: true } };

    expect(diff(
      { someStyle: [{ foo: 1 }, { foo: 3 }]},
      { someStyle: [{ foo: 1 }, { bar: 2 }]},
      validStyleAttribute
    )).toEqual({ foo: 1, bar: 2 });
  });

  it('should not clear removed props if they are still in another slot', () => {
    var validStyleAttribute = { someStyle: { foo: true, bar: true } };

    expect(diff(
      { someStyle: [{}, { foo: 3, bar: 2 }]},
      { someStyle: [{ foo: 3 }, { bar: 2 }]},
      validStyleAttribute
    )).toEqual({ foo: 3 }); // this should ideally be null. heuristic tradeoff.

    expect(diff(
      { someStyle: [{}, { foo: 3, bar: 2 }]},
      { someStyle: [{ foo: 1, bar: 1 }, { bar: 2 }]},
      validStyleAttribute
    )).toEqual({ bar: 2, foo: 1 });
  });

  it('should clear a prop if a later style is explicit null/undefined', () => {
    var validStyleAttribute = { someStyle: { foo: true, bar: true } };
    expect(diff(
      { someStyle: [{}, { foo: 3, bar: 2 }]},
      { someStyle: [{ foo: 1 }, { bar: 2, foo: null }]},
      validStyleAttribute
    )).toEqual({ foo: null });

    expect(diff(
      { someStyle: [{ foo: 3 }, { foo: null, bar: 2 }]},
      { someStyle: [{ foo: null }, { bar: 2 }]},
      validStyleAttribute
    )).toEqual({ foo: null });

    expect(diff(
      { someStyle: [{ foo: 1 }, { foo: null }]},
      { someStyle: [{ foo: 2 }, { foo: null }]},
      validStyleAttribute
    )).toEqual({ foo: null }); // this should ideally be null. heuristic.

    // Test the same case with object equality because an early bailout doesn't
    // work in this case.
    var fooObj = { foo: 3 };
    expect(diff(
      { someStyle: [{ foo: 1 }, fooObj]},
      { someStyle: [{ foo: 2 }, fooObj]},
      validStyleAttribute
    )).toEqual({ foo: 3 }); // this should ideally be null. heuristic.

    expect(diff(
      { someStyle: [{ foo: 1 }, { foo: 3 }]},
      { someStyle: [{ foo: 2 }, { foo: undefined }]},
      validStyleAttribute
    )).toEqual({ foo: null }); // this should ideally be null. heuristic.
  });

  // Function properties are just markers to native that events should be sent.
  it('should convert functions to booleans', () => {
    // Note that if the property changes from one function to another, we don't
    // need to send an update.
    expect(diff(
      {
        a: function() {
          return 1;
        },
        b: function() {
          return 2;
        },
        c: 3,
      },
      {
        b: function() {
          return 9;
        },
        c: function() {
          return 3;
        },
      },
      {a: true, b: true, c: true}
    )).toEqual({a: null, c: true});
  });

  it('should work with simple example - create', () => {
    expect(create(
      {
        a: 1,
        b: 2,
        c: 3,
      },
      {a: true, b: true, c: true}
    )).toEqual({a: 1, b: 2, c: 3});
  });

  it('should log warning if create is called with invalid attribute', () => {
    spyOn(console, 'error');

    expect(create(
      {
        a: 1,
        b: 2,
        c: 3,
      },
      {a: true, b: true}
    )).toEqual({a: 1, b: 2});

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toBe('Warning: unsupported attribute: c');
  });

  it('should not log warning if create is called with an unvalidated attribute', () => {
    expect(create(
      {
        a: 1,
        children: 2,
        collapsable: 3,
        style: 4,
      },
      {a: true}
    )).toEqual({a: 1});
  });

  it('should log warnings if create is called with multiple invalid attribute', () => {
    spyOn(console, 'error');

    expect(create(
      {
        a: 1,
        b: 2,
        c: 3,
      },
      {}
    )).toEqual(null);

    expect(console.error.calls.count()).toBe(3);
    expect(console.error.calls.argsFor(0)[0]).toBe('Warning: unsupported attribute: a');
    expect(console.error.calls.argsFor(1)[0]).toBe('Warning: unsupported attribute: b');
    expect(console.error.calls.argsFor(2)[0]).toBe('Warning: unsupported attribute: c');
  });

});

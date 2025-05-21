/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */
'use strict';

const {diff, create} = require('../ReactNativeAttributePayloadFabric');

describe('ReactNativeAttributePayloadFabric.create', () => {
  it('should work with simple example', () => {
    expect(create({b: 2, c: 3}, {a: true, b: true})).toEqual({
      b: 2,
    });
  });

  it('should work with complex example', () => {
    const validAttributes = {
      style: {
        position: true,
        zIndex: true,
        flexGrow: true,
        flexShrink: true,
        flexDirection: true,
        overflow: true,
        backgroundColor: true,
      },
    };

    expect(
      create(
        {
          style: [
            {
              flexGrow: 1,
              flexShrink: 1,
              flexDirection: 'row',
              overflow: 'scroll',
            },
            [
              {position: 'relative', zIndex: 2},
              {flexGrow: 0},
              {backgroundColor: 'red'},
            ],
          ],
        },
        validAttributes,
      ),
    ).toEqual({
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: 'row',
      overflow: 'scroll',
      position: 'relative',
      zIndex: 2,
      backgroundColor: 'red',
    });
  });

  it('should nullify previously defined style prop that is subsequently set to null or undefined', () => {
    expect(
      create({style: [{a: 0}, {a: undefined}]}, {style: {a: true}}),
    ).toEqual({a: null});
    expect(create({style: [{a: 0}, {a: null}]}, {style: {a: true}})).toEqual({
      a: null,
    });
  });

  it('should ignore non-style fields that are set to undefined', () => {
    expect(create({}, {a: true})).toEqual(null);
    expect(create({a: undefined}, {a: true})).toEqual(null);
    expect(create({a: undefined, b: undefined}, {a: true, b: true})).toEqual(
      null,
    );
    expect(
      create({a: undefined, b: undefined, c: 1}, {a: true, b: true}),
    ).toEqual(null);
    expect(
      create({a: undefined, b: undefined, c: 1}, {a: true, b: true, c: true}),
    ).toEqual({c: 1});
    expect(
      create({a: 1, b: undefined, c: 2}, {a: true, b: true, c: true}),
    ).toEqual({a: 1, c: 2});
  });

  it('should ignore invalid fields', () => {
    expect(create({b: 2}, {})).toEqual(null);
  });

  it('should not use the diff attribute', () => {
    const diffA = jest.fn();
    expect(create({a: [2]}, {a: {diff: diffA}})).toEqual({a: [2]});
    expect(diffA).not.toBeCalled();
  });

  it('should use the process attribute', () => {
    const processA = jest.fn(a => a + 1);
    expect(create({a: 2}, {a: {process: processA}})).toEqual({a: 3});
    expect(processA).toBeCalledWith(2);
  });

  it('should work with undefined styles', () => {
    expect(create({style: undefined}, {style: {b: true}})).toEqual(null);
    expect(create({style: {a: '#ffffff', b: 1}}, {style: {b: true}})).toEqual({
      b: 1,
    });
  });

  it('should flatten nested styles and predefined styles', () => {
    const validStyleAttribute = {someStyle: {foo: true, bar: true}};
    expect(
      create({someStyle: [{foo: 1}, {bar: 2}]}, validStyleAttribute),
    ).toEqual({foo: 1, bar: 2});
    expect(create({}, validStyleAttribute)).toEqual(null);
    const barStyle = {
      bar: 3,
    };
    expect(
      create(
        {someStyle: [[{foo: 1}, {foo: 2}], barStyle]},
        validStyleAttribute,
      ),
    ).toEqual({foo: 2, bar: 3});
  });

  it('should not flatten nested props if attribute config is a primitive or only has diff/process', () => {
    expect(create({a: {foo: 1, bar: 2}}, {a: true})).toEqual({
      a: {foo: 1, bar: 2},
    });
    expect(create({a: [{foo: 1}, {bar: 2}]}, {a: true})).toEqual({
      a: [{foo: 1}, {bar: 2}],
    });
    expect(create({a: {foo: 1, bar: 2}}, {a: {diff: a => a}})).toEqual({
      a: {foo: 1, bar: 2},
    });
    expect(
      create({a: [{foo: 1}, {bar: 2}]}, {a: {diff: a => a, process: a => a}}),
    ).toEqual({a: [{foo: 1}, {bar: 2}]});
  });

  it('handles attributes defined multiple times', () => {
    const validAttributes = {foo: true, style: {foo: true}};
    expect(create({foo: 4, style: {foo: 2}}, validAttributes)).toEqual({
      foo: 2,
    });
    expect(create({style: {foo: 2}}, validAttributes)).toEqual({
      foo: 2,
    });
    expect(create({style: {foo: 2}, foo: 4}, validAttributes)).toEqual({
      foo: 4,
    });
    expect(create({foo: 4, style: {foo: null}}, validAttributes)).toEqual({
      foo: null, // this should ideally be null.
    });
    expect(
      create({foo: 4, style: [{foo: null}, {foo: 5}]}, validAttributes),
    ).toEqual({
      foo: 5,
    });
  });

  // Function properties are just markers to native that events should be sent.
  it('should convert functions to booleans', () => {
    expect(
      create(
        {
          a: function () {
            return 9;
          },
          b: function () {
            return 3;
          },
        },
        {a: true, b: true},
      ),
    ).toEqual({a: true, b: true});
  });
});

describe('ReactNativeAttributePayloadFabric.diff', () => {
  it('should work with simple example', () => {
    expect(diff({a: 1, c: 3}, {b: 2, c: 3}, {a: true, b: true})).toEqual({
      a: null,
      b: 2,
    });
  });

  it('should skip fields that are equal', () => {
    expect(
      diff(
        {a: 1, b: 'two', c: true, d: false, e: undefined, f: 0},
        {a: 1, b: 'two', c: true, d: false, e: undefined, f: 0},
        {a: true, b: true, c: true, d: true, e: true, f: true},
      ),
    ).toEqual(null);
  });

  it('should remove fields', () => {
    expect(diff({a: 1}, {}, {a: true})).toEqual({a: null});
  });

  it('should remove fields that are set to undefined', () => {
    expect(diff({a: 1}, {a: undefined}, {a: true})).toEqual({a: null});
  });

  it('should ignore invalid fields', () => {
    expect(diff({a: 1}, {b: 2}, {})).toEqual(null);
  });

  // @gate !enableShallowPropDiffing
  it('should use the diff attribute', () => {
    const diffA = jest.fn((a, b) => true);
    const diffB = jest.fn((a, b) => false);
    expect(
      diff(
        {a: [1], b: [3]},
        {a: [2], b: [4]},
        {a: {diff: diffA}, b: {diff: diffB}},
      ),
    ).toEqual({a: [2]});
    expect(diffA).toBeCalledWith([1], [2]);
    expect(diffB).toBeCalledWith([3], [4]);
  });

  it('should not use the diff attribute on addition/removal', () => {
    const diffA = jest.fn();
    const diffB = jest.fn();
    expect(
      diff({a: [1]}, {b: [2]}, {a: {diff: diffA}, b: {diff: diffB}}),
    ).toEqual({a: null, b: [2]});
    expect(diffA).not.toBeCalled();
    expect(diffB).not.toBeCalled();
  });

  // @gate !enableShallowPropDiffing
  it('should do deep diffs of Objects by default', () => {
    expect(
      diff(
        {a: [1], b: {k: [3, 4]}, c: {k: [4, 4]}},
        {a: [2], b: {k: [3, 4]}, c: {k: [4, 5]}},
        {a: true, b: true, c: true},
      ),
    ).toEqual({a: [2], c: {k: [4, 5]}});
  });

  it('should work with undefined styles', () => {
    expect(
      diff(
        {style: {a: '#ffffff', b: 1}},
        {style: undefined},
        {style: {b: true}},
      ),
    ).toEqual({b: null});
    expect(
      diff(
        {style: undefined},
        {style: {a: '#ffffff', b: 1}},
        {style: {b: true}},
      ),
    ).toEqual({b: 1});
    expect(
      diff({style: undefined}, {style: undefined}, {style: {b: true}}),
    ).toEqual(null);
  });

  it('should work with empty styles', () => {
    expect(diff({a: 1, c: 3}, {}, {a: true, b: true})).toEqual({a: null});
    expect(diff({}, {a: 1, c: 3}, {a: true, b: true})).toEqual({a: 1});
    expect(diff({}, {}, {a: true, b: true})).toEqual(null);
  });

  it('should flatten nested styles and predefined styles', () => {
    const validStyleAttribute = {someStyle: {foo: true, bar: true}};

    expect(
      diff({}, {someStyle: [{foo: 1}, {bar: 2}]}, validStyleAttribute),
    ).toEqual({foo: 1, bar: 2});

    expect(
      diff({someStyle: [{foo: 1}, {bar: 2}]}, {}, validStyleAttribute),
    ).toEqual({foo: null, bar: null});

    const barStyle = {
      bar: 3,
    };

    expect(
      diff(
        {},
        {someStyle: [[{foo: 1}, {foo: 2}], barStyle]},
        validStyleAttribute,
      ),
    ).toEqual({foo: 2, bar: 3});
  });

  it('should reset a value to a previous if it is removed', () => {
    const validStyleAttribute = {someStyle: {foo: true, bar: true}};

    expect(
      diff(
        {someStyle: [{foo: 1}, {foo: 3}]},
        {someStyle: [{foo: 1}, {bar: 2}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: 1, bar: 2});
  });

  it('should not clear removed props if they are still in another slot', () => {
    const validStyleAttribute = {someStyle: {foo: true, bar: true}};

    expect(
      diff(
        {someStyle: [{}, {foo: 3, bar: 2}]},
        {someStyle: [{foo: 3}, {bar: 2}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: 3}); // this should ideally be null. heuristic tradeoff.

    expect(
      diff(
        {someStyle: [{}, {foo: 3, bar: 2}]},
        {someStyle: [{foo: 1, bar: 1}, {bar: 2}]},
        validStyleAttribute,
      ),
    ).toEqual({bar: 2, foo: 1});
  });

  it('should clear a prop if a later style is explicit null/undefined', () => {
    const validStyleAttribute = {someStyle: {foo: true, bar: true}};
    expect(
      diff(
        {someStyle: [{}, {foo: 3, bar: 2}]},
        {someStyle: [{foo: 1}, {bar: 2, foo: null}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: null});

    expect(
      diff(
        {someStyle: [{foo: 3}, {foo: null, bar: 2}]},
        {someStyle: [{foo: null}, {bar: 2}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: null});

    expect(
      diff(
        {someStyle: [{foo: 1}, {foo: null}]},
        {someStyle: [{foo: 2}, {foo: null}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: null}); // this should ideally be null. heuristic.

    // Test the same case with object equality because an early bailout doesn't
    // work in this case.
    const fooObj = {foo: 3};
    expect(
      diff(
        {someStyle: [{foo: 1}, fooObj]},
        {someStyle: [{foo: 2}, fooObj]},
        validStyleAttribute,
      ),
    ).toEqual({foo: 3}); // this should ideally be null. heuristic.

    expect(
      diff(
        {someStyle: [{foo: 1}, {foo: 3}]},
        {someStyle: [{foo: 2}, {foo: undefined}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: null}); // this should ideally be null. heuristic.
  });

  it('handles attributes defined multiple times', () => {
    const validAttributes = {foo: true, style: {foo: true}};
    expect(diff({}, {foo: 4, style: {foo: 2}}, validAttributes)).toEqual({
      foo: 2,
    });
    expect(diff({foo: 4}, {style: {foo: 2}}, validAttributes)).toEqual({
      foo: 2,
    });
    expect(diff({style: {foo: 2}}, {foo: 4}, validAttributes)).toEqual({
      foo: 4,
    });
  });

  // Function properties are just markers to native that events should be sent.
  it('should convert functions to booleans', () => {
    // Note that if the property changes from one function to another, we don't
    // need to send an update.
    expect(
      diff(
        {
          a: function () {
            return 1;
          },
          b: function () {
            return 2;
          },
          c: 3,
        },
        {
          b: function () {
            return 9;
          },
          c: function () {
            return 3;
          },
        },
        {a: true, b: true, c: true},
      ),
    ).toEqual({a: null, c: true});
  });

  it('should skip changed functions', () => {
    expect(
      diff(
        {
          a: function () {
            return 1;
          },
        },
        {
          a: function () {
            return 9;
          },
        },
        {a: true},
      ),
    ).toEqual(null);
  });

  // @gate !enableShallowPropDiffing
  it('should skip deeply-nested changed functions', () => {
    expect(
      diff(
        {
          wrapper: {
            a: function () {
              return 1;
            },
          },
        },
        {
          wrapper: {
            a: function () {
              return 9;
            },
          },
        },
        {wrapper: true},
      ),
    ).toEqual(null);
  });
});

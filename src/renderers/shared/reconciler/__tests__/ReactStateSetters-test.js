/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

const React = require('React');
const ReactStateSetters = require('ReactStateSetters');
const ReactTestUtils = require('ReactTestUtils');

let TestComponent;
let TestComponentWithMixin;

describe('ReactStateSetters', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();

    TestComponent = React.createClass({
      getInitialState: function() {
        return {foo: 'foo'};
      },

      render: function() {
        return <div />;
      },
    });

    TestComponentWithMixin = React.createClass({
      mixins: [ReactStateSetters.Mixin],

      getInitialState: function() {
        return {foo: 'foo'};
      },

      render: function() {
        return <div />;
      },
    });
  });

  it('createStateSetter should update state', function() {
    let instance = <TestComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    const setter = ReactStateSetters.createStateSetter(
      instance,
      function(a, b, c) {
        return {
          foo: a + b + c,
          bar: a * b * c,
        };
      }
    );
    expect(instance.state).toEqual({foo: 'foo'});

    setter(1, 2, 3);
    expect(instance.state).toEqual({foo: 6, bar: 6});

    setter(10, 11, 12);
    expect(instance.state).toEqual({foo: 33, bar: 1320});
  });

  it('createStateKeySetter should update state', function() {
    let instance = <TestComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    const setter = ReactStateSetters.createStateKeySetter(instance, 'foo');

    expect(instance.state).toEqual({foo: 'foo'});

    setter('bar');
    expect(instance.state).toEqual({foo: 'bar'});

    setter('baz');
    expect(instance.state).toEqual({foo: 'baz'});
  });

  it('createStateKeySetter is memoized', function() {
    let instance = <TestComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    const foo1 = ReactStateSetters.createStateKeySetter(instance, 'foo');
    const bar1 = ReactStateSetters.createStateKeySetter(instance, 'bar');

    const foo2 = ReactStateSetters.createStateKeySetter(instance, 'foo');
    const bar2 = ReactStateSetters.createStateKeySetter(instance, 'bar');

    expect(foo2).toBe(foo1);
    expect(bar2).toBe(bar1);
  });

  it('createStateSetter should update state from mixin', function() {
    let instance = <TestComponentWithMixin />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    const setter = instance.createStateSetter(
      function(a, b, c) {
        return {
          foo: a + b + c,
          bar: a * b * c,
        };
      }
    );
    expect(instance.state).toEqual({foo: 'foo'});

    setter(1, 2, 3);
    expect(instance.state).toEqual({foo: 6, bar: 6});

    setter(10, 11, 12);
    expect(instance.state).toEqual({foo: 33, bar: 1320});
  });

  it('createStateKeySetter should update state with mixin', function() {
    let instance = <TestComponentWithMixin />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    const setter = instance.createStateKeySetter('foo');

    expect(instance.state).toEqual({foo: 'foo'});

    setter('bar');
    expect(instance.state).toEqual({foo: 'bar'});

    setter('baz');
    expect(instance.state).toEqual({foo: 'baz'});
  });

  it('createStateKeySetter is memoized with mixin', function() {
    let instance = <TestComponentWithMixin />;
    instance = ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    const foo1 = instance.createStateKeySetter('foo');
    const bar1 = instance.createStateKeySetter('bar');

    const foo2 = instance.createStateKeySetter('foo');
    const bar2 = instance.createStateKeySetter('bar');

    expect(foo2).toBe(foo1);
    expect(bar2).toBe(bar1);
  });
});

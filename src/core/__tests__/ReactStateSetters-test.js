/**
 * Copyright 2013 Facebook, Inc.
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
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React = require('React');
var ReactStateSetters = require('ReactStateSetters');
var ReactTestUtils = require('ReactTestUtils');

var TestComponent;
var TestComponentWithMixin;

describe('ReactStateSetters', function() {
  beforeEach(function() {
    require('mock-modules').dumpCache();

    TestComponent = React.createClass({
      getInitialState: function() {
        return {foo: 'foo'};
      },

      render: function() {
        return <div />;
      }
    });

    TestComponentWithMixin = React.createClass({
      mixins: [ReactStateSetters.Mixin],

      getInitialState: function() {
        return {foo: 'foo'};
      },

      render: function() {
        return <div />;
      }
    });
  });

  it('createStateSetter should update state', function() {
    var instance = <TestComponent />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    var setter = ReactStateSetters.createStateSetter(
      instance,
      function(a, b, c) {
        return {
          foo: a + b + c,
          bar: a * b * c
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
    var instance = <TestComponent />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    var setter = ReactStateSetters.createStateKeySetter(instance, 'foo');

    expect(instance.state).toEqual({foo: 'foo'});

    setter('bar');
    expect(instance.state).toEqual({foo: 'bar'});

    setter('baz');
    expect(instance.state).toEqual({foo: 'baz'});
  });

  it('createStateKeySetter is memoized', function() {
    var instance = <TestComponent />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    var foo1 = ReactStateSetters.createStateKeySetter(instance, 'foo');
    var bar1 = ReactStateSetters.createStateKeySetter(instance, 'bar');

    var foo2 = ReactStateSetters.createStateKeySetter(instance, 'foo');
    var bar2 = ReactStateSetters.createStateKeySetter(instance, 'bar');

    expect(foo2).toBe(foo1);
    expect(bar2).toBe(bar1);
  });

  it('createStateSetter should update state from mixin', function() {
    var instance = <TestComponentWithMixin />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    var setter = instance.createStateSetter(
      function(a, b, c) {
        return {
          foo: a + b + c,
          bar: a * b * c
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
    var instance = <TestComponentWithMixin />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    var setter = instance.createStateKeySetter('foo');

    expect(instance.state).toEqual({foo: 'foo'});

    setter('bar');
    expect(instance.state).toEqual({foo: 'bar'});

    setter('baz');
    expect(instance.state).toEqual({foo: 'baz'});
  });

  it('createStateKeySetter is memoized with mixin', function() {
    var instance = <TestComponentWithMixin />;
    ReactTestUtils.renderIntoDocument(instance);
    expect(instance.state).toEqual({foo: 'foo'});

    var foo1 = instance.createStateKeySetter('foo');
    var bar1 = instance.createStateKeySetter('bar');

    var foo2 = instance.createStateKeySetter('foo');
    var bar2 = instance.createStateKeySetter('bar');

    expect(foo2).toBe(foo1);
    expect(bar2).toBe(bar1);
  });
});

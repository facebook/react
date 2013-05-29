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

var mocks = require('mocks');

var React;
var ReactTestUtils;
var reactComponentExpect;

var TestComponent;

describe('ReactCompositeComponent-mixin', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    reactComponentExpect = require('reactComponentExpect');

    var MixinA = {
      componentDidMount: function() {
        this.props.listener('MixinA didMount');
      }
    };

    var MixinB = {
      mixins: [MixinA],
      componentDidMount: function() {
        this.props.listener('MixinB didMount');
      }
    };

    var MixinC = {
      componentDidMount: function() {
        this.props.listener('MixinC didMount');
      }
    };

    TestComponent = React.createClass({
      mixins: [MixinB, MixinC],

      componentDidMount: function() {
        this.props.listener('Component didMount');
      },

      render: function() {
        return <div />;
      }
    });

  });

  it('should support chaining delegate functions', function() {
    var listener = mocks.getMockFunction();
    var instance = <TestComponent listener={listener} />;
    ReactTestUtils.renderIntoDocument(instance);

    expect(listener.mock.calls).toEqual([
      ['MixinA didMount'],
      ['MixinB didMount'],
      ['MixinC didMount'],
      ['Component didMount']
    ]);
  });
});

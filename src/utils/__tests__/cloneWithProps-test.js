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
 * @emails react-core
 * @jsx React.DOM
 */

"use strict";

require('mock-modules').dontMock('cloneWithProps');

var mocks = require('mocks');

var cloneWithProps = require('cloneWithProps');

var React;
var ReactTestUtils;

var onlyChild;

describe('cloneWithProps', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    onlyChild = require('onlyChild');
  });

  it('should clone an object with new props', function() {
    var Grandparent = React.createClass({
      render: function() {
        return <Parent><div className="child" /></Parent>;
      }
    });
    var Parent = React.createClass({
      render: function() {
        return (
          <div className="parent">
            {cloneWithProps(onlyChild(this.props.children), {className: 'xyz'})}
          </div>
        );
      }
    });
    var component = ReactTestUtils.renderIntoDocument(<Grandparent />);
    expect(component.getDOMNode().childNodes[0].className)
      .toBe('child xyz');
  });

  it('should warn when cloning with refs', function() {
    var Grandparent = React.createClass({
      render: function() {
        return <Parent><div ref="yolo" /></Parent>;
      }
    });
    var Parent = React.createClass({
      render: function() {
        return (
          <div>
            {cloneWithProps(onlyChild(this.props.children), {className: 'xyz'})}
          </div>
        );
      }
    });

    var _warn = console.warn;

    try {
      console.warn = mocks.getMockFunction();

      var component = ReactTestUtils.renderIntoDocument(<Grandparent />);
      expect(component.refs).toBe(undefined);
      expect(console.warn.mock.calls.length).toBe(1);
    } finally {
      console.warn = _warn;
    }
  });
});

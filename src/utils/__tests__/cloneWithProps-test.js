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

require('mock-modules')
  .dontMock('cloneWithProps')
  .dontMock('emptyObject');

var mocks = require('mocks');

var React;
var ReactTestUtils;

var onlyChild;
var cloneWithProps;
var emptyObject;

describe('cloneWithProps', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
    onlyChild = require('onlyChild');
    cloneWithProps = require('cloneWithProps');
    emptyObject = require('emptyObject');
  });

  it('should clone a DOM component with new props', function() {
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
      .toBe('xyz child');
  });

  it('should clone a composite component with new props', function() {

    var Child = React.createClass({
      render: function() {
        return <div className={this.props.className} />;
      }
    });

    var Grandparent = React.createClass({
      render: function() {
        return <Parent><Child className="child" /></Parent>;
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
      .toBe('xyz child');
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
      expect(component.refs).toBe(emptyObject);
      expect(console.warn.mock.calls.length).toBe(1);
    } finally {
      console.warn = _warn;
    }
  });

  it('should transfer the key property', function() {
    var Component = React.createClass({
      render: function() {
        return null;
      }
    });
    var clone = cloneWithProps(<Component />, {key: 'xyz'});
    expect(clone.key).toBe('xyz');
  });

  it('should transfer children', function() {
    var Component = React.createClass({
      render: function() {
        expect(this.props.children).toBe('xyz');
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(
      cloneWithProps(<Component />, {children: 'xyz'})
    );
  });

  it('should shallow clone children', function() {
    var Component = React.createClass({
      render: function() {
        expect(this.props.children).toBe('xyz');
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(
      cloneWithProps(<Component>xyz</Component>, {})
    );
  });

  it('should support keys and refs', function() {
    var Component = React.createClass({
      render: function() {
        return <div />;
      }
    });

    var Parent = React.createClass({
      render: function() {
        var clone =
          cloneWithProps(this.props.children, {key: 'xyz', ref: 'xyz'});
        expect(clone.key).toBe('xyz');
        expect(clone.ref).toBe('xyz');
        return <div>{clone}</div>;
      }
    });

    var Grandparent = React.createClass({
      render: function() {
        return <Parent><Component key="abc" /></Parent>;
      }
    });

    ReactTestUtils.renderIntoDocument(<Grandparent />);
  });

  it('should overwrite props', function() {
    var Component = React.createClass({
      render: function() {
        expect(this.props.myprop).toBe('xyz');
        return <div />;
      }
    });

    ReactTestUtils.renderIntoDocument(
      cloneWithProps(<Component myprop="abc" />, {myprop: 'xyz'})
    );
  });
});

/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

require('mock-modules');

var React;
var ReactTestUtils;

describe('ReactElementClone', function() {

  beforeEach(function() {
    React = require('React');
    ReactTestUtils = require('ReactTestUtils');
  });

  it('should clone a DOM component with new props', function() {
    var Grandparent = React.createClass({
      render: function() {
        return <Parent child={<div className="child" />} />;
      },
    });
    var Parent = React.createClass({
      render: function() {
        return (
          <div className="parent">
            {React.cloneElement(this.props.child, { className: 'xyz' })}
          </div>
        );
      },
    });
    var component = ReactTestUtils.renderIntoDocument(<Grandparent />);
    expect(React.findDOMNode(component).childNodes[0].className).toBe('xyz');
  });

  it('should clone a composite component with new props', function() {
    var Child = React.createClass({
      render: function() {
        return <div className={this.props.className} />;
      },
    });
    var Grandparent = React.createClass({
      render: function() {
        return <Parent child={<Child className="child" />} />;
      },
    });
    var Parent = React.createClass({
      render: function() {
        return (
          <div className="parent">
            {React.cloneElement(this.props.child, { className: 'xyz' })}
          </div>
        );
      },
    });
    var component = ReactTestUtils.renderIntoDocument(<Grandparent />);
    expect(React.findDOMNode(component).childNodes[0].className).toBe('xyz');
  });

  it('should keep the original ref if it is not overridden', function() {
    var Grandparent = React.createClass({
      render: function() {
        return <Parent child={<div ref="yolo" />} />;
      },
    });

    var Parent = React.createClass({
      render: function() {
        return (
          <div>
            {React.cloneElement(this.props.child, { className: 'xyz' })}
          </div>
        );
      },
    });

    var component = ReactTestUtils.renderIntoDocument(<Grandparent />);
    expect(component.refs.yolo.tagName).toBe('DIV');
  });

  it('should transfer the key property', function() {
    var Component = React.createClass({
      render: function() {
        return null;
      },
    });
    var clone = React.cloneElement(<Component />, {key: 'xyz'});
    expect(clone.key).toBe('xyz');
  });

  it('should transfer children', function() {
    var Component = React.createClass({
      render: function() {
        expect(this.props.children).toBe('xyz');
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(
      React.cloneElement(<Component />, {children: 'xyz'})
    );
  });

  it('should shallow clone children', function() {
    var Component = React.createClass({
      render: function() {
        expect(this.props.children).toBe('xyz');
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(
      React.cloneElement(<Component>xyz</Component>, {})
    );
  });

  it('should accept children as rest arguments', function() {
    var Component = React.createClass({
      render: function() {
        return null;
      },
    });

    var clone = React.cloneElement(
      <Component>xyz</Component>,
      { children: <Component /> },
      <div />,
      <span />
    );

    expect(clone.props.children).toEqual([
      <div />,
      <span />,
    ]);
  });

  it('should support keys and refs', function() {
    var Parent = React.createClass({
      render: function() {
        var clone =
          React.cloneElement(this.props.children, {key: 'xyz', ref: 'xyz'});
        expect(clone.key).toBe('xyz');
        expect(clone.ref).toBe('xyz');
        return <div>{clone}</div>;
      },
    });

    var Grandparent = React.createClass({
      render: function() {
        return <Parent ref="parent"><span key="abc" /></Parent>;
      },
    });

    var component = ReactTestUtils.renderIntoDocument(<Grandparent />);
    expect(component.refs.parent.refs.xyz.tagName).toBe('SPAN');
  });

  it('should steal the ref if a new ref is specified', function() {
    var Parent = React.createClass({
      render: function() {
        var clone = React.cloneElement(this.props.children, {ref: 'xyz'});
        return <div>{clone}</div>;
      },
    });

    var Grandparent = React.createClass({
      render: function() {
        return <Parent ref="parent"><span ref="child" /></Parent>;
      },
    });

    var component = ReactTestUtils.renderIntoDocument(<Grandparent />);
    expect(component.refs.child).toBeUndefined();
    expect(component.refs.parent.refs.xyz.tagName).toBe('SPAN');
  });

  it('should overwrite props', function() {
    var Component = React.createClass({
      render: function() {
        expect(this.props.myprop).toBe('xyz');
        return <div />;
      },
    });

    ReactTestUtils.renderIntoDocument(
      React.cloneElement(<Component myprop="abc" />, {myprop: 'xyz'})
    );
  });

  it('warns for keys for arrays of elements in rest args', function() {
    spyOn(console, 'error');

    React.cloneElement(<div />, null, [<div />, <div />]);

    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.argsForCall[0][0]).toContain(
      'Each child in an array or iterator should have a unique "key" prop.'
    );
  });

  it('does not warns for arrays of elements with keys', function() {
    spyOn(console, 'error');

    React.cloneElement(<div />, null, [<div key="#1" />, <div key="#2" />]);

    expect(console.error.argsForCall.length).toBe(0);
  });

  it('does not warn when the element is directly in rest args', function() {
    spyOn(console, 'error');

    React.cloneElement(<div />, null, <div />, <div />);

    expect(console.error.argsForCall.length).toBe(0);
  });

  it('does not warn when the array contains a non-element', function() {
    spyOn(console, 'error');

    React.cloneElement(<div />, null, [{}, {}]);

    expect(console.error.argsForCall.length).toBe(0);
  });

  it('should check declared prop types after clone', function() {
    spyOn(console, 'error');
    var Component = React.createClass({
      propTypes: {
        color: React.PropTypes.string.isRequired,
      },
      render: function() {
        return React.createElement('div', null, 'My color is ' + this.color);
      },
    });
    var Parent = React.createClass({
      render: function() {
        return React.cloneElement(this.props.child, {color: 123});
      },
    });
    var GrandParent = React.createClass({
      render: function() {
        return React.createElement(
          Parent,
          { child: React.createElement(Component, {color: 'red'}) }
        );
      },
    });
    ReactTestUtils.renderIntoDocument(React.createElement(GrandParent));
    expect(console.error.argsForCall.length).toBe(1);
    expect(console.error.calls[0].args[0]).toBe(
      'Warning: Failed propType: ' +
      'Invalid prop `color` of type `number` supplied to `Component`, ' +
      'expected `string`. Check the render method of `Parent`.'
    );
  });

});

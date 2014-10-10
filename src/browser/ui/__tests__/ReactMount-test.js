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

var mocks = require('mocks');

describe('ReactMount', function() {
  var React = require('React');
  var ReactMount = require('ReactMount');
  var ReactTestUtils = require('ReactTestUtils');

  describe('constructAndRenderComponentByID', function() {
    it('throws if given an id for a component that doesn\'t exist', function() {
      expect(function() {
        ReactMount.constructAndRenderComponentByID(
          function dummyComponentConstructor() {},
          {},
          'SOME_ID_THAT_DOESNT_EXIST'
        );
      }).toThrow();
    });
  });

  it('throws when given a string', function() {
    expect(function() {
      ReactTestUtils.renderIntoDocument('div');
    }).toThrow(
      'Invariant Violation: renderComponent(): Invalid component element. ' +
      'Instead of passing an element string, make sure to instantiate it ' +
      'by passing it to React.createElement.'
    );
  });

  it('throws when given a factory', function() {
    var Component = React.createClass({
      render: function() {
        return <div />;
      }
    });
    expect(function() {
      ReactTestUtils.renderIntoDocument(Component);
    }).toThrow(
      'Invariant Violation: renderComponent(): Invalid component element. ' +
      'Instead of passing a component class, make sure to instantiate it ' +
      'by passing it to React.createElement.'
    );
  });

  it('should render different components in same root', function() {
    var container = document.createElement('container');
    document.documentElement.appendChild(container);

    ReactMount.render(<div></div>, container);
    expect(container.firstChild.nodeName).toBe('DIV');

    ReactMount.render(<span></span>, container);
    expect(container.firstChild.nodeName).toBe('SPAN');
  });

  it('should unmount and remount if the key changes', function() {
    var container = document.createElement('container');

    var mockMount = mocks.getMockFunction();
    var mockUnmount = mocks.getMockFunction();

    var Component = React.createClass({
      componentDidMount: mockMount,
      componentWillUnmount: mockUnmount,
      render: function() {
        return <span>{this.props.text}</span>;
      }
    });

    expect(mockMount.mock.calls.length).toBe(0);
    expect(mockUnmount.mock.calls.length).toBe(0);

    ReactMount.render(<Component text="orange" key="A" />, container);
    expect(container.firstChild.innerHTML).toBe('orange');
    expect(mockMount.mock.calls.length).toBe(1);
    expect(mockUnmount.mock.calls.length).toBe(0);

    // If we change the key, the component is unmounted and remounted
    ReactMount.render(<Component text="green" key="B" />, container);
    expect(container.firstChild.innerHTML).toBe('green');
    expect(mockMount.mock.calls.length).toBe(2);
    expect(mockUnmount.mock.calls.length).toBe(1);

    // But if we don't change the key, the component instance is reused
    ReactMount.render(<Component text="blue" key="B" />, container);
    expect(container.firstChild.innerHTML).toBe('blue');
    expect(mockMount.mock.calls.length).toBe(2);
    expect(mockUnmount.mock.calls.length).toBe(1);
  });

  it('should reuse markup if rendering to the same target twice', function() {
    var container = document.createElement('container');
    var instance1 = React.render(<div />, container);
    var instance2 = React.render(<div />, container);

    expect(instance1 === instance2).toBe(true);
  });
});

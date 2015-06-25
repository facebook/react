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

var mocks = require('mocks');

describe('ReactMount', function() {
  var React = require('React');
  var ReactMount = require('ReactMount');
  var ReactTestUtils = require('ReactTestUtils');
  var WebComponents = WebComponents;

  try {
    if (WebComponents === undefined && typeof jest !== 'undefined') {
      WebComponents = require('WebComponents');
    }
  } catch(e) {
    // Parse error expected on engines that don't support setters
    // or otherwise aren't supportable by the polyfill.
    // Leave WebComponents undefined.
  }

  describe('unmountComponentAtNode', function() {
    it('throws when given a non-node', function() {
      var nodeArray = document.getElementsByTagName('div');
      expect(function() {
        React.unmountComponentAtNode(nodeArray);
      }).toThrow(
        'Invariant Violation: unmountComponentAtNode(...): Target container ' +
        'is not a DOM element.'
      );
    });
  });

  it('throws when given a string', function() {
    expect(function() {
      ReactTestUtils.renderIntoDocument('div');
    }).toThrow(
      'Invariant Violation: React.render(): Invalid component element. ' +
      'Instead of passing an element string, make sure to instantiate it ' +
      'by passing it to React.createElement.'
    );
  });

  it('throws when given a factory', function() {
    var Component = React.createClass({
      render: function() {
        return <div />;
      },
    });
    expect(function() {
      ReactTestUtils.renderIntoDocument(Component);
    }).toThrow(
      'Invariant Violation: React.render(): Invalid component element. ' +
      'Instead of passing a component class, make sure to instantiate it ' +
      'by passing it to React.createElement.'
    );
  });

  it('should render different components in same root', function() {
    var container = document.createElement('container');
    document.body.appendChild(container);

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
      },
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

  it('should warn if mounting into dirty rendered markup', function() {
    var container = document.createElement('container');
    container.innerHTML = React.renderToString(<div />) + ' ';

    spyOn(console, 'error');
    ReactMount.render(<div />, container);
    expect(console.error.calls.length).toBe(1);

    container.innerHTML = ' ' + React.renderToString(<div />);

    ReactMount.render(<div />, container);
    expect(console.error.calls.length).toBe(2);
  });

  it('should not warn if mounting into non-empty node', function() {
    var container = document.createElement('container');
    container.innerHTML = '<div></div>';

    spyOn(console, 'error');
    ReactMount.render(<div />, container);
    expect(console.error.calls.length).toBe(0);
  });

  it('should warn when mounting into document.body', function () {
    var iFrame = document.createElement('iframe');
    document.body.appendChild(iFrame);
    spyOn(console, 'error');

    ReactMount.render(<div />, iFrame.contentDocument.body);

    expect(console.error.calls.length).toBe(1);
    expect(console.error.calls[0].args[0]).toContain(
      'Rendering components directly into document.body is discouraged'
    );
  });

  if (WebComponents !== undefined) {
    it('should allow mounting/unmounting to document fragment container',
        function() {
      var shadowRoot;
      var proto = Object.create(HTMLElement.prototype, {
        createdCallback: {
          value: function() {
            shadowRoot = this.createShadowRoot();
            React.render(<div>Hi, from within a WC!</div>, shadowRoot);
            expect(shadowRoot.firstChild.tagName).toBe('DIV');
            React.render(<span>Hi, from within a WC!</span>, shadowRoot);
            expect(shadowRoot.firstChild.tagName).toBe('SPAN');
          },
        },
      });
      proto.unmount = function() {
        React.unmountComponentAtNode(shadowRoot);
      };
      document.registerElement('x-foo', {prototype: proto});
      var element = document.createElement('x-foo');
      element.unmount();
    });
  }
});

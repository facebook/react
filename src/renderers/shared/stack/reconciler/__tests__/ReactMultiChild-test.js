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

describe('ReactMultiChild', function() {
  var React;

  var ReactDOM;

  beforeEach(function() {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
  });

  describe('reconciliation', function() {
    it('should update children when possible', function() {
      var container = document.createElement('div');

      var mockMount = jest.fn();
      var mockUpdate = jest.fn();
      var mockUnmount = jest.fn();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentDidUpdate: mockUpdate,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUpdate.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUpdate.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUpdate.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);
    });

    it('should replace children with different constructors', function() {
      var container = document.createElement('div');

      var mockMount = jest.fn();
      var mockUnmount = jest.fn();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><span /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(1);
    });

    it('should NOT replace children with different owners', function() {
      var container = document.createElement('div');

      var mockMount = jest.fn();
      var mockUnmount = jest.fn();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      var WrapperComponent = React.createClass({
        render: function() {
          return this.props.children || <MockComponent />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<WrapperComponent />, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(
        <WrapperComponent><MockComponent /></WrapperComponent>,
        container
      );

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);
    });

    it('should replace children with different keys', function() {
      var container = document.createElement('div');

      var mockMount = jest.fn();
      var mockUnmount = jest.fn();

      var MockComponent = React.createClass({
        componentDidMount: mockMount,
        componentWillUnmount: mockUnmount,
        render: function() {
          return <span />;
        },
      });

      expect(mockMount.mock.calls.length).toBe(0);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent key="A" /></div>, container);

      expect(mockMount.mock.calls.length).toBe(1);
      expect(mockUnmount.mock.calls.length).toBe(0);

      ReactDOM.render(<div><MockComponent key="B" /></div>, container);

      expect(mockMount.mock.calls.length).toBe(2);
      expect(mockUnmount.mock.calls.length).toBe(1);
    });

    it('should warn for duplicated keys with component stack info', function() {
      // NOTE: We're explicitly not using JSX here. This is intended to test
      // the current stack addendum without having source location added by babel.
      spyOn(console, 'error');

      var container = document.createElement('div');

      var WrapperComponent = React.createClass({
        render: function() {
          // <div>{this.props.children}</div>
          return React.createElement('div', null, this.props.children);
        },
      });

      var Parent = React.createClass({
        render: function() {
          // <div><WrapperComponent>{this.props.children}</WrapperComponent></div>
          return React.createElement(
            'div',
            null,
            React.createElement(WrapperComponent, null, this.props.children)
          );
        },
      });

      ReactDOM.render(
        // <Parent>{[<div key="1"/>]}</Parent>,
        React.createElement(Parent, null, [
          React.createElement('div', { key: '1' }),
        ]),
        container
      );

      ReactDOM.render(
        // <Parent>{[<div key="1"/>, <div key="1"/>]}</Parent>,
        React.createElement(Parent, null, [
          React.createElement('div', { key: '1' }),
          React.createElement('div', { key: '1' }),
        ]),
        container
      );

      expect(console.error.argsForCall.length).toBe(1);
      expect(console.error.argsForCall[0][0]).toBe(
        'Warning: flattenChildren(...): ' +
        'Encountered two children with the same key, `1`. ' +
        'Child keys must be unique; when two children share a key, ' +
        'only the first child will be used.\n' +
        '    in div\n' +
        '    in WrapperComponent (created by Parent)\n' +
        '    in div (created by Parent)\n' +
        '    in Parent'
      );
    });
  });
});

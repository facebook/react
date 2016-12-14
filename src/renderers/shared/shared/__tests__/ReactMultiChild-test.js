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

describe('ReactMultiChild', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  var React;
  var ReactDOM;
  var ReactDOMFeatureFlags;

  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
  });

  describe('reconciliation', () => {
    it('should update children when possible', () => {
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

    it('should replace children with different constructors', () => {
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

    it('should NOT replace children with different owners', () => {
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

      class WrapperComponent extends React.Component {
        render() {
          return this.props.children || <MockComponent />;
        }
      }

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

    it('should replace children with different keys', () => {
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

    it('should warn for duplicated keys with component stack info', () => {
      spyOn(console, 'error');

      var container = document.createElement('div');

      class WrapperComponent extends React.Component {
        render() {
          return <div>{this.props.children}</div>;
        }
      }

      class Parent extends React.Component {
        render() {
          return (
            <div>
              <WrapperComponent>
                {this.props.children}
              </WrapperComponent>
            </div>
          );
        }
      }

      ReactDOM.render(
        <Parent>{[<div key="1"/>]}</Parent>,
        container
      );

      ReactDOM.render(
        <Parent>{[<div key="1"/>, <div key="1"/>]}</Parent>,
        container
      );

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
        'Warning: flattenChildren(...): ' +
        'Encountered two children with the same key, `1`. ' +
        'Child keys must be unique; when two children share a key, ' +
        'only the first child will be used.\n' +
        '    in div (at **)\n' +
        '    in WrapperComponent (at **)\n' +
        '    in div (at **)\n' +
        '    in Parent (at **)'
      );
    });

    it('should warn for using maps as children with owner info', () => {
      spyOn(console, 'error');

      class Parent extends React.Component {
        render() {
          return (
            <div>{new Map([['foo', 0], ['bar', 1]])}</div>
          );
        }
      }

      var container = document.createElement('div');
      ReactDOM.render(<Parent />, container);

      expectDev(console.error.calls.count()).toBe(1);
      expectDev(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Using Maps as children is not yet fully supported. It is an ' +
        'experimental feature that might be removed. Convert it to a sequence ' +
        '/ iterable of keyed ReactElements instead. Check the render method of `Parent`.'
      );
    });
  });

  it('should reorder bailed-out children', () => {
    spyOn(console, 'error');

    class LetterInner extends React.Component {
      render() {
        return <div>{this.props.char}</div>;
      }
    }

    class Letter extends React.Component {
      render() {
        return <LetterInner char={this.props.char} />;
      }
      shouldComponentUpdate() {
        return false;
      }
    }

    class Letters extends React.Component {
      render() {
        const letters = this.props.letters.split('');
        return <div>{letters.map((c) => <Letter key={c} char={c} />)}</div>;
      }
    }

    var container = document.createElement('div');

    // Two random strings -- some additions, some removals, some moves
    ReactDOM.render(<Letters letters="XKwHomsNjIkBcQWFbiZU" />, container);
    expect(container.textContent).toBe('XKwHomsNjIkBcQWFbiZU');
    ReactDOM.render(<Letters letters="EHCjpdTUuiybDvhRJwZt" />, container);
    expect(container.textContent).toBe('EHCjpdTUuiybDvhRJwZt');
  });

  it('prepares new children before unmounting old', () => {
    var log = [];

    class Spy extends React.Component {
      componentWillMount() {
        log.push(this.props.name + ' componentWillMount');
      }
      render() {
        log.push(this.props.name + ' render');
        return <div />;
      }
      componentDidMount() {
        log.push(this.props.name + ' componentDidMount');
      }
      componentWillUnmount() {
        log.push(this.props.name + ' componentWillUnmount');
      }
    }

    // These are reference-unequal so they will be swapped even if they have
    // matching keys
    var SpyA = (props) => <Spy {...props} />;
    var SpyB = (props) => <Spy {...props} />;

    var container = document.createElement('div');
    ReactDOM.render(
      <div>
        <SpyA key="one" name="oneA" />
        <SpyA key="two" name="twoA" />
      </div>,
      container
    );
    ReactDOM.render(
      <div>
        <SpyB key="one" name="oneB" />
        <SpyB key="two" name="twoB" />
      </div>,
      container
    );

    expect(log).toEqual([
      'oneA componentWillMount',
      'oneA render',
      'twoA componentWillMount',
      'twoA render',
      'oneA componentDidMount',
      'twoA componentDidMount',

      ...(
        ReactDOMFeatureFlags.useFiber ?
          [
            'oneB componentWillMount',
            'oneB render',
            'twoB componentWillMount',
            'twoB render',
            'oneA componentWillUnmount',
            'twoA componentWillUnmount',
          ] :
          [
            'oneB componentWillMount',
            'oneB render',
            'oneA componentWillUnmount',
            'twoB componentWillMount',
            'twoB render',
            'twoA componentWillUnmount',
          ]
      ),

      'oneB componentDidMount',
      'twoB componentDidMount',
    ]);
  });

});

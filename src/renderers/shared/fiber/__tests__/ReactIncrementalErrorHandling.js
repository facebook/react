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

describe('ReactIncrementalErrorBoundaries', () => {
  var React;
  var ReactNoop;
  var ErrorBoundary;

  beforeEach(() => {
    React = require('React');
    ReactNoop = require('ReactNoop');
  });

  it('can schedule updates after crashing in render on mount', () => {
    var ops = [];

    function BrokenRender() {
      ops.push('BrokenRender');
      throw new Error('Hello.');
    }

    function Foo() {
      ops.push('Foo');
      return null;
    }

    ReactNoop.render(<BrokenRender />);
    expect(() => {
      ReactNoop.flush();
    }).toThrow('Hello.');
    expect(ops).toEqual(['BrokenRender']);

    ops = [];
    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual(['Foo']);
  });

  it('can schedule updates after crashing in render on update', () => {
    var ops = [];

    function BrokenRender(props) {
      ops.push('BrokenRender');
      if (props.throw) {
        throw new Error('Hello.');
      }
    }

    function Foo() {
      ops.push('Foo');
      return null;
    }

    ReactNoop.render(<BrokenRender throw={false} />);
    ReactNoop.flush();
    ops = [];

    expect(() => {
      ReactNoop.render(<BrokenRender throw={true} />);
      ReactNoop.flush();
    }).toThrow('Hello.');
    expect(ops).toEqual(['BrokenRender']);

    ops = [];
    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual(['Foo']);
  });

  it('can schedule updates after crashing during umounting', () => {
    var ops = [];

    class BrokenComponentWillUnmount extends React.Component {
      render() {
        return <div />;
      }
      componentWillUnmount() {
        throw new Error('Hello.');
      }
    }

    function Foo() {
      ops.push('Foo');
      return null;
    }

    ReactNoop.render(<BrokenComponentWillUnmount />);
    ReactNoop.flush();

    expect(() => {
      ReactNoop.render(<div />);
      ReactNoop.flush();
    }).toThrow('Hello.');

    ops = [];
    ReactNoop.render(<Foo />);
    ReactNoop.flush();
    expect(ops).toEqual(['Foo']);
  });

});

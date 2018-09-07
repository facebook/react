/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoop;

// This is a new feature in Fiber so I put it in its own test file. It could
// probably move to one of the other test files once it is official.
describe('ReactTopLevelFragment', function() {
  beforeEach(function() {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should render a simple fragment at the top of a component', function() {
    function Fragment() {
      return [<div key="a">Hello</div>, <div key="b">World</div>];
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();
  });

  it('should preserve state when switching from a single child', function() {
    let instance = null;

    class Stateful extends React.Component {
      render() {
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition ? (
        <Stateful key="a" />
      ) : (
        [<Stateful key="a" />, <div key="b">World</div>]
      );
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    const instanceA = instance;

    expect(instanceA).not.toBe(null);

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    const instanceB = instance;

    expect(instanceB).toBe(instanceA);
  });

  it('should not preserve state when switching to a nested array', function() {
    let instance = null;

    class Stateful extends React.Component {
      render() {
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition ? (
        <Stateful key="a" />
      ) : (
        [[<Stateful key="a" />, <div key="b">World</div>], <div key="c" />]
      );
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    const instanceA = instance;

    expect(instanceA).not.toBe(null);

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    const instanceB = instance;

    expect(instanceB).not.toBe(instanceA);
  });

  it('preserves state if an implicit key slot switches from/to null', function() {
    let instance = null;

    class Stateful extends React.Component {
      render() {
        instance = this;
        return <div>World</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? [null, <Stateful key="a" />]
        : [<div key="b">Hello</div>, <Stateful key="a" />];
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    const instanceA = instance;

    expect(instanceA).not.toBe(null);

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    const instanceB = instance;

    expect(instanceB).toBe(instanceA);

    ReactNoop.render(<Fragment condition={false} />);
    ReactNoop.flush();

    const instanceC = instance;

    expect(instanceC === instanceA).toBe(true);
  });

  it('should preserve state in a reorder', function() {
    let instance = null;

    class Stateful extends React.Component {
      render() {
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? [[<div key="b">World</div>, <Stateful key="a" />]]
        : [[<Stateful key="a" />, <div key="b">World</div>], <div key="c" />];
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    const instanceA = instance;

    expect(instanceA).not.toBe(null);

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    const instanceB = instance;

    expect(instanceB).toBe(instanceA);
  });
});

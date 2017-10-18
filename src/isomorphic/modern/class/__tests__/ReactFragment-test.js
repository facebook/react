/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */
'use strict';

let React;
let ReactNoop;

describe('ReactFragment', () => {
  beforeEach(function() {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function text(val) {
    return {text: val};
  }

  it('should render a single child via noop renderer', () => {
    const element = (
      <React.Fragment>
        <span>foo</span>
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([span()]);
  });

  it('should render multiple children via noop renderer', () => {
    const element = (
      <React.Fragment>
        hello <span>world</span>
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([text('hello '), span()]);
  });

  it('should preserve state of children with 1 level nesting', function() {
    var instance = null;
    var ops = [];

    class Stateful extends React.Component {
      render() {
        ops.push('Stateful render');
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <Stateful key="a" />
        : <React.Fragment>
            <Stateful key="a" />
            <div key="b">World</div>
          </React.Fragment>;
    }

    ReactNoop.render(
      <div>
        <Fragment />
        <div />
      </div>,
    );
    ReactNoop.flush();

    var instanceA = instance;

    ReactNoop.render(
      <div>
        <Fragment condition={true} />
        <div />
      </div>,
    );
    ReactNoop.flush();

    var instanceB = instance;

    expect(ops).toEqual(['Stateful render', 'Stateful render']);
    expect(instanceB).toBe(instanceA);
  });

  it('should not preserve state of children with 2 levels nesting', function() {
    var instance = null;
    var ops = [];

    class Stateful extends React.Component {
      render() {
        ops.push('Stateful render');
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <Stateful key="a" />
        : <React.Fragment>
            <React.Fragment>
              <Stateful key="a" />
              <div key="b">World</div>
              <div key="c" />
            </React.Fragment>
          </React.Fragment>;
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    var instanceA = instance;

    expect(instanceA).not.toBe(null);

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    var instanceB = instance;

    expect(ops).toEqual(['Stateful render', 'Stateful render']);
    expect(instanceB).not.toBe(instanceA);
  });

  it('should preserve state of children in a reorder', function() {
    var instance = null;
    var ops = [];

    class Stateful extends React.Component {
      render() {
        ops.push('Stateful render');
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <React.Fragment>
            <React.Fragment>
              <div key="b">World</div>
              <Stateful key="a" />
            </React.Fragment>
          </React.Fragment>
        : <React.Fragment>
            <React.Fragment>
              <Stateful key="a" />
              <div key="b">World</div>
            </React.Fragment>
            <div key="c" />
          </React.Fragment>;
    }
    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    var instanceA = instance;

    expect(instanceA).not.toBe(null);

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    var instanceB = instance;

    expect(ops).toEqual(['Stateful render', 'Stateful render']);
    expect(instanceB).toBe(instanceA);
  });

  it('should preserve state of children when the keys are same', function() {
    var instance = null;
    var ops = [];

    class Stateful extends React.Component {
      render() {
        ops.push('Stateful render');
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <React.Fragment key="a">
            <Stateful />
          </React.Fragment>
        : <React.Fragment key="a">
            <Stateful />
            <span>World</span>
          </React.Fragment>;
    }

    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    var instanceA = instance;

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    var instanceB = instance;

    expect(ops).toEqual(['Stateful render', 'Stateful render']);
    expect(instanceB).toBe(instanceA);
  });

  it('should not preserve state of children when the keys are different', function() {
    var instance = null;
    var ops = [];

    class Stateful extends React.Component {
      render() {
        ops.push('Stateful render');
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <React.Fragment key="a">
            <Stateful />
          </React.Fragment>
        : <React.Fragment key="b">
            <Stateful />
            <span>World</span>
          </React.Fragment>;
    }

    ReactNoop.render(<Fragment />);
    ReactNoop.flush();

    var instanceA = instance;

    ReactNoop.render(<Fragment condition={true} />);
    ReactNoop.flush();

    var instanceB = instance;

    expect(ops).toEqual(['Stateful render', 'Stateful render']);
    expect(instanceB).not.toBe(instanceA);
  });
});

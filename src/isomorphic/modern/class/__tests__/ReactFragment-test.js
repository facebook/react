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

let React;
let ReactNoop;

describe('ReactFragment', () => {
  beforeEach(function() {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should render a single child via noop renderer', () => {
    const element = (
      <React.Fragment>
        <span>foo</span>
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([
      {type: 'span', children: [], prop: undefined},
    ]);
  });

  it('should render multiple children via noop renderer', () => {
    const element = (
      <React.Fragment>
        hello <span>world</span>
      </React.Fragment>
    );

    ReactNoop.render(element);
    ReactNoop.flush();

    expect(ReactNoop.getChildren()).toEqual([
      {text: 'hello '},
      {type: 'span', children: [], prop: undefined},
    ]);
  });

  it('should preserve state of children', function() {
    var instance = null;

    class Stateful extends React.Component {
      render() {
        instance = this;
        return <div>Hello</div>;
      }
    }

    function Fragment({condition}) {
      return condition
        ? <React.Fragment>
            <Stateful key="a" />
          </React.Fragment>
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

    expect(instanceB).toBe(instanceA);
  });

  it('should not preserve state when switching to a nested fragment', function() {
    var instance = null;

    class Stateful extends React.Component {
      render() {
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

    expect(instanceB).not.toBe(instanceA);
  });

  it('should preserve state in a reorder', function() {
    var instance = null;

    class Stateful extends React.Component {
      render() {
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

    expect(instanceB).toBe(instanceA);
  });
});

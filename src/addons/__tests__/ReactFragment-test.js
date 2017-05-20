/**
 * Copyright 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactDOM;
var ReactFragment;

describe('ReactFragment', () => {
  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactFragment = require('ReactFragment');
  });

  it('should throw if a plain object is used as a child', () => {
    var children = {
      x: <span />,
      y: <span />,
      z: <span />,
    };
    var element = <div>{[children]}</div>;
    var container = document.createElement('div');
    expect(() => ReactDOM.render(element, container)).toThrowError(
      'Objects are not valid as a React child (found: object with keys ' +
        '{x, y, z}). If you meant to render a collection of children, use an ' +
        'array instead or wrap the object using createFragment(object) from ' +
        'the React add-ons.',
    );
  });

  it('should throw if a plain object even if it is in an owner', () => {
    class Foo extends React.Component {
      render() {
        var children = {
          a: <span />,
          b: <span />,
          c: <span />,
        };
        return <div>{[children]}</div>;
      }
    }
    var container = document.createElement('div');
    expect(() => ReactDOM.render(<Foo />, container)).toThrowError(
      'Objects are not valid as a React child (found: object with keys ' +
        '{a, b, c}). If you meant to render a collection of children, use an ' +
        'array instead or wrap the object using createFragment(object) from ' +
        'the React add-ons. Check the render method of `Foo`.',
    );
  });

  it('should throw if a plain object looks like an old element', () => {
    var oldEl = {_isReactElement: true, type: 'span', props: {}};
    var container = document.createElement('div');
    expect(() => ReactDOM.render(<div>{oldEl}</div>, container)).toThrowError(
      'Objects are not valid as a React child (found: object with keys ' +
        "{_isReactElement, type, props}). It looks like you're using an " +
        'element created by a different version of React. Make sure to use ' +
        'only one copy of React.',
    );
  });

  it('warns for numeric keys on objects as children', () => {
    spyOn(console, 'error');

    ReactFragment.create({1: <span />, 2: <span />});

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Child objects should have non-numeric keys so ordering is preserved.',
    );
  });

  it('should warn if passing null to createFragment', () => {
    spyOn(console, 'error');
    ReactFragment.create(null);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment only accepts a single object.',
    );
  });

  it('should warn if passing an array to createFragment', () => {
    spyOn(console, 'error');
    ReactFragment.create([]);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment only accepts a single object.',
    );
  });

  it('should warn if passing a ReactElement to createFragment', () => {
    spyOn(console, 'error');
    ReactFragment.create(<div />);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment does not accept a ReactElement without a ' +
        'wrapper object.',
    );
  });
});

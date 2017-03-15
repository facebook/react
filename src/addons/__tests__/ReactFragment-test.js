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
    React = require('react');
    ReactDOM = require('react-dom');
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
        'the React add-ons.\n\nCheck the render method of `Foo`.',
    );
  });

  it('warns for numeric keys on objects as children', () => {
    spyOn(console, 'error');

    ReactFragment.create({1: <span />, 2: <span />});

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Child objects should have non-numeric keys so ordering is preserved.',
    );
  });

  it('should warn if passing null to createFragment', () => {
    spyOn(console, 'error');
    ReactFragment.create(null);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment only accepts a single object.',
    );
  });

  it('should warn if passing an array to createFragment', () => {
    spyOn(console, 'error');
    ReactFragment.create([]);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment only accepts a single object.',
    );
  });

  it('should warn if passing a ReactElement to createFragment', () => {
    spyOn(console, 'error');
    ReactFragment.create(<div />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'React.addons.createFragment does not accept a ReactElement without a ' +
        'wrapper object.',
    );
  });
});

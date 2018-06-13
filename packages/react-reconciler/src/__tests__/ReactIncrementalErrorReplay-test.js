/**
 * Copyright (c) 2013-present, Facebook, Inc.
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

describe('ReactIncrementalErrorReplay', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function div(...children) {
    children = children.map(c => (typeof c === 'string' ? {text: c} : c));
    return {type: 'div', children, prop: undefined};
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('should fail gracefully on error in the host environment', () => {
    ReactNoop.simulateErrorInHostConfig(() => {
      ReactNoop.render(<span />);
      expect(() => ReactNoop.flush()).toThrow('Error in host config.');
    });
  });

  it("should ignore error if it doesn't throw on retry", () => {
    let didInit = false;

    function badLazyInit() {
      const needsInit = !didInit;
      didInit = true;
      if (needsInit) {
        throw new Error('Hi');
      }
    }

    class App extends React.Component {
      render() {
        badLazyInit();
        return <div />;
      }
    }
    ReactNoop.render(<App />);
    expect(() => ReactNoop.flush()).not.toThrow();
  });
});

/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('Component stack trace displaying', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should provide stack trace to closest directory and index.js', () => {
    class Component extends React.Component {
      render() {
        return [<span>a</span>, <span>b</span>];
      }
    }

    spyOnDev(console, 'error');
    const container = document.createElement('div');
    ReactDOM.render(
      <Component
        __source={{fileName: 'Foo/Bar/Baz/index.js', lineNumber: 25}}
      />,
      container,
    );

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      const args = console.error.calls.argsFor(0);
      const stack = args[args.length - 1];
      expect(stack).toBe('\n    in Component (at Baz/index.js:25)');
    }
  });

  it('should provide stack trace to solely a file when not named index.js', () => {
    class Component extends React.Component {
      render() {
        return [<span>a</span>, <span>b</span>];
      }
    }

    spyOnDev(console, 'error');
    const container = document.createElement('div');
    ReactDOM.render(
      <Component __source={{fileName: 'Foo/Bar/Foo.js', lineNumber: 25}} />,
      container,
    );

    if (__DEV__) {
      const args = console.error.calls.argsFor(0);
      const stack = args[args.length - 1];
      expect(stack).toBe('\n    in Component (at Foo.js:25)');
    }
  });
});

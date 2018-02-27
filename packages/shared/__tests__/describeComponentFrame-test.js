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
let ReactTestUtils;

describe('Component stack trace displaying', () => {
  beforeEach(() => {
    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');
    spyOnDev(console, 'error');
  });

  it('should provide stack trace to closest directory and index.js', () => {
    class Component extends React.Component {
      render() {
        return [<span>a</span>, <span>b</span>];
      }
    }

    ReactTestUtils.renderIntoDocument(
      <Component
        __source={{fileName: 'Foo/Bar/Baz/index.js', lineNumber: 25}}
      />,
    );

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Each child in an array or iterator should have a unique "key" prop. ' +
          'See https://fb.me/react-warning-keys for more information.\n' +
          '    in Component (at Baz/index.js:25)',
      );
    }
  });

  it('should provide stack trace to solely a file when not named index.js', () => {
    class Component extends React.Component {
      render() {
        return [<span>a</span>, <span>b</span>];
      }
    }

    ReactTestUtils.renderIntoDocument(
      <Component __source={{fileName: 'Foo/Bar/Foo.js', lineNumber: 25}} />,
    );

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toBe(
        'Warning: Each child in an array or iterator should have a unique "key" prop. ' +
          'See https://fb.me/react-warning-keys for more information.\n' +
          '    in Component (at Foo.js:25)',
      );
    }
  });
});

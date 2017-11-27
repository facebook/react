/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactTestUtils;

describe('ReactJSXElementValidator', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('warns for fragments with illegal attributes', () => {
    spyOnDev(console, 'error');

    class Foo extends React.Component {
      render() {
        return (
          <React.Fragment a={1} b={2}>
            hello
          </React.Fragment>
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<Foo />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain('Invalid prop `');
      expect(console.error.calls.argsFor(0)[0]).toContain(
        '` supplied to `React.Fragment`. React.Fragment ' +
          'can only have `key` and `children` props.',
      );
    }
  });

  it('warns for fragments with refs', () => {
    spyOnDev(console, 'error');

    class Foo extends React.Component {
      render() {
        return (
          <React.Fragment
            ref={bar => {
              this.foo = bar;
            }}>
            hello
          </React.Fragment>
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<Foo />);

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Invalid attribute `ref` supplied to `React.Fragment`.',
      );
    }
  });

  it('does not warn for fragments of multiple elements without keys', () => {
    ReactTestUtils.renderIntoDocument(
      <React.Fragment>
        <span>1</span>
        <span>2</span>
      </React.Fragment>,
    );
  });

  it('warns for fragments of multiple elements with same key', () => {
    spyOnDev(console, 'error');

    ReactTestUtils.renderIntoDocument(
      <React.Fragment>
        <span key="a">1</span>
        <span key="a">2</span>
        <span key="b">3</span>
      </React.Fragment>,
    );

    if (__DEV__) {
      expect(console.error.calls.count()).toBe(1);
      expect(console.error.calls.argsFor(0)[0]).toContain(
        'Encountered two children with the same key, `a`.',
      );
    }
  });
});

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

function normalizeCodeLocInfo(str) {
  return str && str.replace(/at .+?:\d+/g, 'at **');
}

describe('getComponentStack', () => {
  let React = null;
  let ReactTestRenderer = null;
  let getComponentStack = null;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');

    getComponentStack = React.getComponentStack;
  });

  if (!__DEV__) {
    it('does nothing in production mode', () => {
      expect(getComponentStack()).toBe('');
    });
  }

  if (__DEV__) {
    it('returns an empty component stack when called outside of render', () => {
      expect(getComponentStack()).toBe('');
    });

    it('includes component stack when called from a render method', () => {
      class Parent extends React.Component {
        render() {
          return <Child />;
        }
      }

      let capturedComponentStack = null;
      function Child() {
        capturedComponentStack = getComponentStack();
        return null;
      }

      ReactTestRenderer.create(<Parent />);
      expect(normalizeCodeLocInfo(capturedComponentStack)).toBe(
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });

    it('returns component stack when called from a render phase lifecycle method', () => {
      function Parent() {
        return <Child />;
      }

      let capturedComponentStack = null;
      class Child extends React.Component {
        UNSAFE_componentWillMount() {
          capturedComponentStack = getComponentStack();
        }
        render() {
          return null;
        }
      }

      ReactTestRenderer.create(<Parent />);
      expect(normalizeCodeLocInfo(capturedComponentStack)).toBe(
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });

    it('returns component stack when called from a commit phase lifecycle method', () => {
      function Parent() {
        return <Child />;
      }

      let capturedComponentStack = null;
      class Child extends React.Component {
        componentDidMount() {
          capturedComponentStack = getComponentStack();
        }
        render() {
          return null;
        }
      }

      ReactTestRenderer.create(<Parent />);
      expect(normalizeCodeLocInfo(capturedComponentStack)).toBe(
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });

    it('returns component stack when called from a passive effect handler', () => {
      class Parent extends React.Component {
        render() {
          return <Child />;
        }
      }

      let capturedComponentStack = null;
      function Child() {
        React.useEffect(() => {
          capturedComponentStack = getComponentStack();
        });
        return null;
      }

      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(<Parent />);
      });
      expect(normalizeCodeLocInfo(capturedComponentStack)).toBe(
        '\n    in Child (at **)' + '\n    in Parent (at **)',
      );
    });
  }
});

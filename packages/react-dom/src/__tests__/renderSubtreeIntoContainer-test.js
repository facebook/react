/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const renderSubtreeIntoContainer = require('react-dom')
  .unstable_renderSubtreeIntoContainer;

describe('renderSubtreeIntoContainer', () => {
  it('should throw if parentComponent is invalid', () => {
    const portal = document.createElement('div');

    class Component extends React.Component {
      render() {
        return <div />;
      }
    }

    // ESLint is confused here and thinks Parent is unused, presumably because
    // it is only used inside of the class body?
    // eslint-disable-next-line no-unused-vars
    class Parent extends React.Component {
      render() {
        return null;
      }

      componentDidMount() {
        expect(function() {
          renderSubtreeIntoContainer(<Parent />, <Component />, portal);
        }).toThrowError('parentComponentmust be a valid React Component');
      }
    }
  });

  it('should render portal with non-context-provider parent', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const portal = document.createElement('div');

    class Parent extends React.Component {
      render() {
        return null;
      }

      componentDidMount() {
        renderSubtreeIntoContainer(this, <div>hello</div>, portal);
      }
    }

    ReactDOM.render(<Parent bar="initial" />, container);
    expect(portal.firstChild.innerHTML).toBe('hello');
  });

  it('fails gracefully when mixing React 15 and 16', () => {
    class C extends React.Component {
      render() {
        return <div />;
      }
    }
    const c = ReactDOM.render(<C />, document.createElement('div'));
    // React 15 calls this:
    // https://github.com/facebook/react/blob/77b71fc3c4/src/renderers/dom/client/ReactMount.js#L478-L479
    expect(() => {
      c._reactInternalInstance._processChildContext({});
    }).toThrow(
      __DEV__
        ? '_processChildContext is not available in React 16+. This likely ' +
          'means you have multiple copies of React and are attempting to nest ' +
          'a React 15 tree inside a React 16 tree using ' +
          "unstable_renderSubtreeIntoContainer, which isn't supported. Try to " +
          'make sure you have only one copy of React (and ideally, switch to ' +
          'ReactDOM.createPortal).'
        : "Cannot read property '_processChildContext' of undefined",
    );
  });
});

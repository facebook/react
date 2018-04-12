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
let ReactDOM;

let MockedComponent;
let ReactDOMServer;

describe('ReactMockedComponent', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');

    MockedComponent = class extends React.Component {
      render() {
        throw new Error('Should not get here.');
      }
    };
    // This is close enough to what a Jest mock would give us.
    MockedComponent.prototype.render = jest.fn();
  });

  it('should allow a mocked component to be rendered in dev', () => {
    const container = document.createElement('container');
    if (__DEV__) {
      ReactDOM.render(<MockedComponent />, container);
    } else {
      expect(() => ReactDOM.render(<MockedComponent />, container)).toThrow(
        'Nothing was returned from render.',
      );
    }
  });

  it('should allow a mocked component to be updated in dev', () => {
    const container = document.createElement('container');
    if (__DEV__) {
      ReactDOM.render(<MockedComponent />, container);
    } else {
      expect(() => ReactDOM.render(<MockedComponent />, container)).toThrow(
        'Nothing was returned from render.',
      );
    }
    if (__DEV__) {
      ReactDOM.render(<MockedComponent />, container);
    } else {
      expect(() => ReactDOM.render(<MockedComponent />, container)).toThrow(
        'Nothing was returned from render.',
      );
    }
  });

  it('should allow a mocked component to be rendered in dev (SSR)', () => {
    if (__DEV__) {
      ReactDOMServer.renderToString(<MockedComponent />);
    } else {
      expect(() => ReactDOMServer.renderToString(<MockedComponent />)).toThrow(
        'Nothing was returned from render.',
      );
    }
  });
});

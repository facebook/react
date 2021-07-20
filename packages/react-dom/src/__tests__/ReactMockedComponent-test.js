/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

  it('should allow a mocked component to be rendered', () => {
    const container = document.createElement('container');
    ReactDOM.render(<MockedComponent />, container);
  });

  it('should allow a mocked component to be updated in dev', () => {
    const container = document.createElement('container');
    ReactDOM.render(<MockedComponent />, container);
    ReactDOM.render(<MockedComponent />, container);
  });

  it('should allow a mocked component to be rendered in dev (SSR)', () => {
    ReactDOMServer.renderToString(<MockedComponent />);
  });
});

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
var ReactDOM;

var MockedComponent;
var ReactDOMServer;

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
    var container = document.createElement('container');
    ReactDOM.render(<MockedComponent />, container);
  });

  it('should allow a mocked component to be updated', () => {
    var container = document.createElement('container');
    ReactDOM.render(<MockedComponent />, container);
    ReactDOM.render(<MockedComponent />, container);
  });

  it('should allow a mocked component to be rendered (SSR)', () => {
    ReactDOMServer.renderToString(<MockedComponent />);
  });
});

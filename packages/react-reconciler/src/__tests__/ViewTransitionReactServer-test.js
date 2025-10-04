/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let act;
let ViewTransition;
let React;
let ReactServer;
let ReactNoop;
let ReactNoopFlightClient;
let ReactNoopFlightServer;

describe('ViewTransitionReactServer', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('react', () => require('react/react.react-server'));
    ReactServer = require('react');
    ViewTransition = ReactServer.unstable_ViewTransition;
    ReactNoopFlightServer = require('react-noop-renderer/flight-server');

    jest.resetModules();
    __unmockReact();
    React = require('react');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');
    ReactNoop = require('react-noop-renderer');
    const InternalTestUtils = require('internal-test-utils');
    act = InternalTestUtils.act;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // @gate enableViewTransition || fb
  it('can be rendered in React Server', async () => {
    function App() {
      return ReactServer.createElement(
        ViewTransition,
        {},
        ReactServer.createElement('div', null, 'Hello, Dave!'),
      );
    }

    const transport = ReactNoopFlightServer.render(
      ReactServer.createElement(App, null),
    );

    await act(async () => {
      const app = await ReactNoopFlightClient.read(transport);

      ReactNoop.render(app);
    });

    expect(ReactNoop).toMatchRenderedOutput(<div>Hello, Dave!</div>);
  });
});

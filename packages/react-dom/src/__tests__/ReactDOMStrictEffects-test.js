/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMClient;
let ReactDOMServer;
let act;

describe('StrictEffectsMode', () => {
  beforeEach(() => {
    jest.resetModules();
    act = require('internal-test-utils').act;

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
  });

  it('should double invoke passive effects during hydration', async () => {
    const log = [];
    function App({text}) {
      React.useEffect(() => {
        log.push('useEffect create');
        return () => log.push('useEffect cleanup');
      });

      return null;
    }
    const container = document.createElement('div');
    const element = (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    container.innerHTML = ReactDOMServer.renderToString(element);

    await act(() => {
      ReactDOMClient.hydrateRoot(container, element);
    });

    if (__DEV__) {
      expect(log).toEqual(['useEffect create']);
    } else {
      expect(log).toEqual(['useEffect create']);
    }
  });

  it('should double invoke layout effects during hydration', async () => {
    const log = [];
    function App({text}) {
      React.useLayoutEffect(() => {
        log.push('useLayoutEffect create');
        return () => log.push('useLayoutEffect cleanup');
      });

      return null;
    }
    const container = document.createElement('div');
    const element = (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    container.innerHTML = ReactDOMServer.renderToString(element);

    await act(() => {
      ReactDOMClient.hydrateRoot(container, element);
    });

    if (__DEV__) {
      expect(log).toEqual(['useLayoutEffect create']);
    } else {
      expect(log).toEqual(['useEffect create']);
    }
  });
});

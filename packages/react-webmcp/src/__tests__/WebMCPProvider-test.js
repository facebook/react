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
let act;
let WebMCPProvider;
let useWebMCPStatus;

describe('WebMCPProvider', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;

    const ReactWebMCP = require('react-webmcp');
    WebMCPProvider = ReactWebMCP.WebMCPProvider;
    useWebMCPStatus = ReactWebMCP.useWebMCPStatus;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    if (Object.getOwnPropertyDescriptor(window.navigator, 'modelContext')) {
      delete window.navigator.modelContext;
    }
    if (
      Object.getOwnPropertyDescriptor(window.navigator, 'modelContextTesting')
    ) {
      delete window.navigator.modelContextTesting;
    }
  });

  function installMockModelContext() {
    const mc = {
      registerTool: jest.fn(),
      unregisterTool: jest.fn(),
      provideContext: jest.fn(),
      clearContext: jest.fn(),
    };
    Object.defineProperty(window.navigator, 'modelContext', {
      value: mc,
      configurable: true,
      writable: true,
    });
    return mc;
  }

  function installMockModelContextTesting() {
    const mct = {
      getTools: jest.fn(),
    };
    Object.defineProperty(window.navigator, 'modelContextTesting', {
      value: mct,
      configurable: true,
      writable: true,
    });
    return mct;
  }

  it('renders its children', async () => {
    function App() {
      return React.createElement(
        WebMCPProvider,
        null,
        React.createElement('div', null, 'Hello'),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(container.textContent).toBe('Hello');
  });

  it('provides available: false when modelContext is not present', async () => {
    let capturedStatus;

    function StatusReader() {
      capturedStatus = useWebMCPStatus();
      return null;
    }

    function App() {
      return React.createElement(
        WebMCPProvider,
        null,
        React.createElement(StatusReader),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(capturedStatus.available).toBe(false);
  });

  it('provides available: true when modelContext is present', async () => {
    installMockModelContext();
    let capturedStatus;

    function StatusReader() {
      capturedStatus = useWebMCPStatus();
      return null;
    }

    function App() {
      return React.createElement(
        WebMCPProvider,
        null,
        React.createElement(StatusReader),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(capturedStatus.available).toBe(true);
  });

  it('provides testingAvailable: false when modelContextTesting is not present', async () => {
    let capturedStatus;

    function StatusReader() {
      capturedStatus = useWebMCPStatus();
      return null;
    }

    function App() {
      return React.createElement(
        WebMCPProvider,
        null,
        React.createElement(StatusReader),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(capturedStatus.testingAvailable).toBe(false);
  });

  it('provides testingAvailable: true when modelContextTesting is present', async () => {
    installMockModelContextTesting();
    let capturedStatus;

    function StatusReader() {
      capturedStatus = useWebMCPStatus();
      return null;
    }

    function App() {
      return React.createElement(
        WebMCPProvider,
        null,
        React.createElement(StatusReader),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(capturedStatus.testingAvailable).toBe(true);
  });

  it('provides both available and testingAvailable correctly', async () => {
    installMockModelContext();
    installMockModelContextTesting();
    let capturedStatus;

    function StatusReader() {
      capturedStatus = useWebMCPStatus();
      return null;
    }

    function App() {
      return React.createElement(
        WebMCPProvider,
        null,
        React.createElement(StatusReader),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(capturedStatus.available).toBe(true);
    expect(capturedStatus.testingAvailable).toBe(true);
  });

  it('useWebMCPStatus returns defaults when used outside of WebMCPProvider', async () => {
    let capturedStatus;

    function StatusReader() {
      capturedStatus = useWebMCPStatus();
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(StatusReader));
    });

    // Default context value
    expect(capturedStatus.available).toBe(false);
    expect(capturedStatus.testingAvailable).toBe(false);
  });

  it('renders multiple children', async () => {
    function App() {
      return React.createElement(
        WebMCPProvider,
        null,
        React.createElement('span', null, 'A'),
        React.createElement('span', null, 'B'),
        React.createElement('span', null, 'C'),
      );
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(container.textContent).toBe('ABC');
  });
});

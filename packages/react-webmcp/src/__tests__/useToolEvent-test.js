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
let useToolEvent;

describe('useToolEvent', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;

    useToolEvent = require('react-webmcp').useToolEvent;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  function dispatchToolEvent(eventName, toolName, useDetail) {
    let event;
    if (useDetail) {
      // Event with toolName on event.detail
      event = new CustomEvent(eventName, {detail: {toolName: toolName}});
    } else {
      // Event with toolName directly on the event object
      event = new Event(eventName);
      event.toolName = toolName;
    }
    window.dispatchEvent(event);
  }

  it('listens for toolactivated events', async () => {
    const callback = jest.fn();

    function App() {
      useToolEvent('toolactivated', callback);
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    await act(() => {
      dispatchToolEvent('toolactivated', 'my-tool', false);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('my-tool');
  });

  it('listens for toolcancel events', async () => {
    const callback = jest.fn();

    function App() {
      useToolEvent('toolcancel', callback);
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    await act(() => {
      dispatchToolEvent('toolcancel', 'my-tool', false);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('my-tool');
  });

  it('handles toolName on event.detail', async () => {
    const callback = jest.fn();

    function App() {
      useToolEvent('toolactivated', callback);
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    // Dispatch with toolName on detail
    await act(() => {
      dispatchToolEvent('toolactivated', 'detail-tool', true);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('detail-tool');
  });

  it('filters by toolNameFilter when provided', async () => {
    const callback = jest.fn();

    function App() {
      useToolEvent('toolactivated', callback, 'target-tool');
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    // Should NOT trigger for a different tool name
    await act(() => {
      dispatchToolEvent('toolactivated', 'other-tool', false);
    });
    expect(callback).not.toHaveBeenCalled();

    // SHOULD trigger for the matching tool name
    await act(() => {
      dispatchToolEvent('toolactivated', 'target-tool', false);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('target-tool');
  });

  it('calls callback for any tool when no filter is provided', async () => {
    const callback = jest.fn();

    function App() {
      useToolEvent('toolactivated', callback);
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    await act(() => {
      dispatchToolEvent('toolactivated', 'tool-1', false);
    });
    await act(() => {
      dispatchToolEvent('toolactivated', 'tool-2', false);
    });
    await act(() => {
      dispatchToolEvent('toolactivated', 'tool-3', true);
    });

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenNthCalledWith(1, 'tool-1');
    expect(callback).toHaveBeenNthCalledWith(2, 'tool-2');
    expect(callback).toHaveBeenNthCalledWith(3, 'tool-3');
  });

  it('removes the event listener on unmount', async () => {
    const callback = jest.fn();

    function EventComponent() {
      useToolEvent('toolactivated', callback);
      return React.createElement('div', null, 'Listening');
    }

    function App({show}) {
      if (show) {
        return React.createElement(EventComponent);
      }
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {show: true}));
    });

    // Should respond to events while mounted
    await act(() => {
      dispatchToolEvent('toolactivated', 'tool-a', false);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Unmount
    await act(() => {
      root.render(React.createElement(App, {show: false}));
    });

    // Should NOT respond to events after unmount
    await act(() => {
      dispatchToolEvent('toolactivated', 'tool-b', false);
    });
    expect(callback).toHaveBeenCalledTimes(1); // Still 1
  });

  it('ignores events without a toolName', async () => {
    const callback = jest.fn();

    function App() {
      useToolEvent('toolactivated', callback);
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    // Dispatch event with no toolName
    await act(() => {
      const event = new Event('toolactivated');
      window.dispatchEvent(event);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('prefers toolName directly on event over event.detail', async () => {
    const callback = jest.fn();

    function App() {
      useToolEvent('toolactivated', callback);
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    // Dispatch with toolName on both event and detail
    await act(() => {
      const event = new CustomEvent('toolactivated', {
        detail: {toolName: 'detail-name'},
      });
      event.toolName = 'direct-name';
      window.dispatchEvent(event);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    // Should prefer the direct toolName
    expect(callback).toHaveBeenCalledWith('direct-name');
  });

  it('updates the listener when the event type changes', async () => {
    const callback = jest.fn();

    function App({eventType}) {
      useToolEvent(eventType, callback);
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {eventType: 'toolactivated'}));
    });

    // Should respond to toolactivated
    await act(() => {
      dispatchToolEvent('toolactivated', 'tool-a', false);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Switch to toolcancel
    await act(() => {
      root.render(React.createElement(App, {eventType: 'toolcancel'}));
    });

    // Should NOT respond to toolactivated anymore
    await act(() => {
      dispatchToolEvent('toolactivated', 'tool-b', false);
    });
    expect(callback).toHaveBeenCalledTimes(1); // Still 1

    // Should respond to toolcancel
    await act(() => {
      dispatchToolEvent('toolcancel', 'tool-c', false);
    });
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith('tool-c');
  });
});

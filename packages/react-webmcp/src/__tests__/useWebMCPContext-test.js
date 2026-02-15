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
let assertConsoleWarnDev;
let useWebMCPContext;

describe('useWebMCPContext', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    const InternalTestUtils = require('internal-test-utils');
    assertConsoleWarnDev = InternalTestUtils.assertConsoleWarnDev;

    useWebMCPContext = require('react-webmcp').useWebMCPContext;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    if (Object.getOwnPropertyDescriptor(window.navigator, 'modelContext')) {
      delete window.navigator.modelContext;
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

  function createToolDef(overrides) {
    return {
      name: 'tool-a',
      description: 'Tool A',
      inputSchema: {type: 'object', properties: {x: {type: 'string'}}},
      execute: jest.fn(input => ({result: input.x})),
      ...overrides,
    };
  }

  it('calls provideContext on mount', async () => {
    const mc = installMockModelContext();
    const tools = [createToolDef()];

    function App() {
      useWebMCPContext({tools});
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(mc.provideContext).toHaveBeenCalledTimes(1);
    const call = mc.provideContext.mock.calls[0][0];
    expect(call.tools).toHaveLength(1);
    expect(call.tools[0].name).toBe('tool-a');
    expect(call.tools[0].description).toBe('Tool A');
    expect(typeof call.tools[0].execute).toBe('function');
  });

  it('calls clearContext on unmount', async () => {
    const mc = installMockModelContext();
    const tools = [createToolDef()];

    function ContextComponent() {
      useWebMCPContext({tools});
      return React.createElement('div', null, 'Context');
    }

    function App({show}) {
      if (show) {
        return React.createElement(ContextComponent);
      }
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {show: true}));
    });

    expect(mc.provideContext).toHaveBeenCalledTimes(1);
    expect(mc.clearContext).not.toHaveBeenCalled();

    await act(() => {
      root.render(React.createElement(App, {show: false}));
    });

    expect(mc.clearContext).toHaveBeenCalledTimes(1);
  });

  it('re-calls provideContext when tools change', async () => {
    const mc = installMockModelContext();

    function App({toolName}) {
      useWebMCPContext({
        tools: [createToolDef({name: toolName})],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {toolName: 'tool-a'}));
    });

    expect(mc.provideContext).toHaveBeenCalledTimes(1);

    await act(() => {
      root.render(React.createElement(App, {toolName: 'tool-b'}));
    });

    // Should clear old context and provide new context
    expect(mc.clearContext).toHaveBeenCalled();
    expect(mc.provideContext).toHaveBeenCalledTimes(2);
    expect(mc.provideContext.mock.calls[1][0].tools[0].name).toBe('tool-b');
  });

  it('does NOT re-call provideContext when only execute changes', async () => {
    const mc = installMockModelContext();
    const execute1 = jest.fn();
    const execute2 = jest.fn();

    function App({executeFn}) {
      useWebMCPContext({
        tools: [
          createToolDef({
            execute: executeFn,
          }),
        ],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {executeFn: execute1}));
    });

    expect(mc.provideContext).toHaveBeenCalledTimes(1);

    await act(() => {
      root.render(React.createElement(App, {executeFn: execute2}));
    });

    // Should NOT have re-called provideContext
    expect(mc.provideContext).toHaveBeenCalledTimes(1);
  });

  it('execute wrapper calls the latest handler via ref', async () => {
    const mc = installMockModelContext();
    const execute1 = jest.fn(() => 'result1');
    const execute2 = jest.fn(() => 'result2');

    function App({executeFn}) {
      useWebMCPContext({
        tools: [
          createToolDef({
            execute: executeFn,
          }),
        ],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {executeFn: execute1}));
    });

    // Get the registered tool's execute function
    const registeredTools = mc.provideContext.mock.calls[0][0].tools;
    const registeredExecute = registeredTools[0].execute;

    // Call with execute1
    registeredExecute({x: 'hello'});
    expect(execute1).toHaveBeenCalledWith({x: 'hello'});

    // Update execute function
    await act(() => {
      root.render(React.createElement(App, {executeFn: execute2}));
    });

    // Same registered execute should now call execute2
    registeredExecute({x: 'world'});
    expect(execute2).toHaveBeenCalledWith({x: 'world'});
  });

  it('passes outputSchema for each tool when provided', async () => {
    const mc = installMockModelContext();
    const outputSchema = {
      type: 'object',
      properties: {result: {type: 'string'}},
    };

    function App() {
      useWebMCPContext({
        tools: [
          createToolDef({
            outputSchema: outputSchema,
          }),
        ],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const registeredTools = mc.provideContext.mock.calls[0][0].tools;
    expect(registeredTools[0].outputSchema).toEqual(outputSchema);
  });

  it('does not include outputSchema when not provided', async () => {
    const mc = installMockModelContext();

    function App() {
      useWebMCPContext({
        tools: [createToolDef()],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const registeredTools = mc.provideContext.mock.calls[0][0].tools;
    expect('outputSchema' in registeredTools[0]).toBe(false);
  });

  it('passes annotations for each tool when provided', async () => {
    const mc = installMockModelContext();

    function App() {
      useWebMCPContext({
        tools: [
          createToolDef({
            annotations: {readOnlyHint: true},
          }),
        ],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const registeredTools = mc.provideContext.mock.calls[0][0].tools;
    expect(registeredTools[0].annotations).toEqual({readOnlyHint: true});
  });

  it('does not include annotations when not provided', async () => {
    const mc = installMockModelContext();

    function App() {
      // createToolDef does NOT include annotations by default
      useWebMCPContext({
        tools: [createToolDef()],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const registeredTools = mc.provideContext.mock.calls[0][0].tools;
    // annotations should be absent from the object, not present as undefined
    expect('annotations' in registeredTools[0]).toBe(false);
  });

  it('handles multiple tools', async () => {
    const mc = installMockModelContext();

    function App() {
      useWebMCPContext({
        tools: [
          createToolDef({name: 'search', description: 'Search'}),
          createToolDef({name: 'filter', description: 'Filter'}),
          createToolDef({name: 'sort', description: 'Sort'}),
        ],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const registeredTools = mc.provideContext.mock.calls[0][0].tools;
    expect(registeredTools).toHaveLength(3);
    expect(registeredTools[0].name).toBe('search');
    expect(registeredTools[1].name).toBe('filter');
    expect(registeredTools[2].name).toBe('sort');
  });

  it('does NOT re-call provideContext with inline stable objects', async () => {
    const mc = installMockModelContext();

    function App() {
      // All inline objects — new references each render but same values
      useWebMCPContext({
        tools: [
          {
            name: 'stable',
            description: 'Stable tool',
            inputSchema: {type: 'object', properties: {}},
            execute: () => null,
          },
        ],
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(mc.provideContext).toHaveBeenCalledTimes(1);

    // Re-render with same values
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(mc.provideContext).toHaveBeenCalledTimes(1);
  });

  it('handles missing navigator.modelContext gracefully', async () => {
    // modelContext is NOT installed

    function App() {
      useWebMCPContext({tools: [createToolDef()]});
      return React.createElement('div', null, 'App');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    if (__DEV__) {
      assertConsoleWarnDev([
        '[react-webmcp] useWebMCPContext: navigator.modelContext is not available. ' +
          'Ensure you are running Chrome 146+ with the ' +
          '"WebMCP for testing" flag enabled.' +
          '\n    in App (at **)',
      ]);
    }

    expect(container.textContent).toBe('App');
  });

  it('handles provideContext throwing an error', async () => {
    const mc = installMockModelContext();
    mc.provideContext.mockImplementation(() => {
      throw new Error('Context error');
    });

    function App() {
      useWebMCPContext({tools: [createToolDef()]});
      return React.createElement('div', null, 'App');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    // The console.error from our try/catch passes an Error object as
    // args[0], which React's test infra filters via shouldIgnoreConsoleError.
    // We verify the component renders without crashing.
    expect(container.textContent).toBe('App');
  });

  it('handles clearContext throwing during cleanup', async () => {
    const mc = installMockModelContext();
    mc.clearContext.mockImplementation(() => {
      throw new Error('Clear error');
    });

    function ContextComponent() {
      useWebMCPContext({tools: [createToolDef()]});
      return React.createElement('div', null, 'Context');
    }

    function App({show}) {
      if (show) {
        return React.createElement(ContextComponent);
      }
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {show: true}));
    });

    // Unmount should not throw despite clearContext failing
    await act(() => {
      root.render(React.createElement(App, {show: false}));
    });

    expect(container.textContent).toBe('');
  });
});

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
let assertConsoleErrorDev;
let useWebMCPTool;

describe('useWebMCPTool', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOMClient = require('react-dom/client');
    act = require('internal-test-utils').act;
    const InternalTestUtils = require('internal-test-utils');
    assertConsoleWarnDev = InternalTestUtils.assertConsoleWarnDev;
    assertConsoleErrorDev = InternalTestUtils.assertConsoleErrorDev;

    useWebMCPTool = require('react-webmcp').useWebMCPTool;

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    // Clean up any mocked navigator properties
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

  function createToolConfig(overrides) {
    return {
      name: 'test-tool',
      description: 'A test tool',
      inputSchema: {
        type: 'object',
        properties: {
          query: {type: 'string'},
        },
      },
      execute: jest.fn(input => ({result: input.query})),
      ...overrides,
    };
  }

  it('registers a tool on mount', async () => {
    const mc = installMockModelContext();
    const config = createToolConfig();

    function App() {
      useWebMCPTool(config);
      return React.createElement('div', null, 'App');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);
    const registeredTool = mc.registerTool.mock.calls[0][0];
    expect(registeredTool.name).toBe('test-tool');
    expect(registeredTool.description).toBe('A test tool');
    expect(registeredTool.inputSchema).toEqual({
      type: 'object',
      properties: {
        query: {type: 'string'},
      },
    });
    expect(typeof registeredTool.execute).toBe('function');
  });

  it('unregisters the tool on unmount', async () => {
    const mc = installMockModelContext();
    const config = createToolConfig();

    function App({show}) {
      if (show) {
        return React.createElement(ToolComponent);
      }
      return null;
    }

    function ToolComponent() {
      useWebMCPTool(config);
      return React.createElement('div', null, 'Tool');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {show: true}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);
    expect(mc.unregisterTool).not.toHaveBeenCalled();

    // Unmount the component with the hook
    await act(() => {
      root.render(React.createElement(App, {show: false}));
    });

    expect(mc.unregisterTool).toHaveBeenCalledTimes(1);
    expect(mc.unregisterTool).toHaveBeenCalledWith('test-tool');
  });

  it('re-registers when the tool name changes', async () => {
    const mc = installMockModelContext();

    function App({name}) {
      useWebMCPTool(
        createToolConfig({
          name: name,
        }),
      );
      return React.createElement('div', null, name);
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {name: 'tool-a'}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);
    expect(mc.registerTool.mock.calls[0][0].name).toBe('tool-a');

    // Change the tool name
    await act(() => {
      root.render(React.createElement(App, {name: 'tool-b'}));
    });

    // Should unregister old name and register new name
    expect(mc.unregisterTool).toHaveBeenCalledWith('tool-a');
    expect(mc.registerTool).toHaveBeenCalledTimes(2);
    expect(mc.registerTool.mock.calls[1][0].name).toBe('tool-b');
  });

  it('re-registers when the description changes', async () => {
    const mc = installMockModelContext();

    function App({desc}) {
      useWebMCPTool(
        createToolConfig({
          description: desc,
        }),
      );
      return React.createElement('div', null, desc);
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {desc: 'Version 1'}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);

    await act(() => {
      root.render(React.createElement(App, {desc: 'Version 2'}));
    });

    // Should re-register because fingerprint changed
    expect(mc.registerTool).toHaveBeenCalledTimes(2);
    expect(mc.registerTool.mock.calls[1][0].description).toBe('Version 2');
  });

  it('re-registers when inputSchema changes', async () => {
    const mc = installMockModelContext();

    function App({schema}) {
      useWebMCPTool(
        createToolConfig({
          inputSchema: schema,
        }),
      );
      return null;
    }

    const schemaV1 = {type: 'object', properties: {q: {type: 'string'}}};
    const schemaV2 = {type: 'object', properties: {q: {type: 'number'}}};

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {schema: schemaV1}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);

    await act(() => {
      root.render(React.createElement(App, {schema: schemaV2}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(2);
  });

  it('does NOT re-register when only the execute function changes', async () => {
    const mc = installMockModelContext();
    const execute1 = jest.fn();
    const execute2 = jest.fn();

    function App({executeFn}) {
      useWebMCPTool(
        createToolConfig({
          execute: executeFn,
        }),
      );
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {executeFn: execute1}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);

    // Change only the execute function — fingerprint should NOT change
    await act(() => {
      root.render(React.createElement(App, {executeFn: execute2}));
    });

    // Should NOT have re-registered
    expect(mc.registerTool).toHaveBeenCalledTimes(1);
  });

  it('execute wrapper always calls the latest handler', async () => {
    const mc = installMockModelContext();
    const execute1 = jest.fn(() => 'result1');
    const execute2 = jest.fn(() => 'result2');

    function App({executeFn}) {
      useWebMCPTool(
        createToolConfig({
          execute: executeFn,
        }),
      );
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {executeFn: execute1}));
    });

    // Get the registered execute function
    const registeredTool = mc.registerTool.mock.calls[0][0];

    // First call should use execute1
    registeredTool.execute({query: 'hello'});
    expect(execute1).toHaveBeenCalledWith({query: 'hello'});
    expect(execute2).not.toHaveBeenCalled();

    // Update the execute function
    await act(() => {
      root.render(React.createElement(App, {executeFn: execute2}));
    });

    // Now calling the same registered execute should use execute2
    registeredTool.execute({query: 'world'});
    expect(execute2).toHaveBeenCalledWith({query: 'world'});
  });

  it('does NOT re-register when inline schema objects have the same values', async () => {
    const mc = installMockModelContext();

    function App() {
      // Inline objects create new references each render, but the values
      // are the same, so the fingerprint should be stable.
      useWebMCPTool({
        name: 'stable-tool',
        description: 'Stable',
        inputSchema: {type: 'object', properties: {x: {type: 'string'}}},
        execute: () => null,
      });
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);

    // Re-render with the same values (new object references)
    await act(() => {
      root.render(React.createElement(App));
    });

    // Should NOT have re-registered because fingerprint is the same
    expect(mc.registerTool).toHaveBeenCalledTimes(1);
  });

  it('passes outputSchema when provided', async () => {
    const mc = installMockModelContext();
    const outputSchema = {
      type: 'object',
      properties: {
        result: {type: 'string'},
      },
    };

    function App() {
      useWebMCPTool(
        createToolConfig({
          outputSchema: outputSchema,
        }),
      );
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const registeredTool = mc.registerTool.mock.calls[0][0];
    expect(registeredTool.outputSchema).toEqual(outputSchema);
  });

  it('does not include outputSchema when not provided', async () => {
    const mc = installMockModelContext();

    function App() {
      useWebMCPTool(createToolConfig());
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const registeredTool = mc.registerTool.mock.calls[0][0];
    expect(registeredTool.outputSchema).toBeUndefined();
  });

  it('passes annotations when provided', async () => {
    const mc = installMockModelContext();
    const annotations = {
      readOnlyHint: true,
    };

    function App() {
      useWebMCPTool(
        createToolConfig({
          annotations: annotations,
        }),
      );
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    const registeredTool = mc.registerTool.mock.calls[0][0];
    expect(registeredTool.annotations).toEqual({readOnlyHint: true});
  });

  it('re-registers when annotations change', async () => {
    const mc = installMockModelContext();

    function App({readOnly}) {
      useWebMCPTool(
        createToolConfig({
          annotations: {readOnlyHint: readOnly},
        }),
      );
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {readOnly: true}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);

    await act(() => {
      root.render(React.createElement(App, {readOnly: false}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(2);
    expect(mc.registerTool.mock.calls[1][0].annotations).toEqual({
      readOnlyHint: false,
    });
  });

  it('re-registers when outputSchema changes', async () => {
    const mc = installMockModelContext();

    function App({outputType}) {
      useWebMCPTool(
        createToolConfig({
          outputSchema: {
            type: 'object',
            properties: {
              result: {type: outputType},
            },
          },
        }),
      );
      return null;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {outputType: 'string'}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(1);

    await act(() => {
      root.render(React.createElement(App, {outputType: 'number'}));
    });

    expect(mc.registerTool).toHaveBeenCalledTimes(2);
  });

  it('handles missing navigator.modelContext gracefully', async () => {
    // modelContext is NOT installed
    function App() {
      useWebMCPTool(createToolConfig());
      return React.createElement('div', null, 'App');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    if (__DEV__) {
      assertConsoleWarnDev([
        '[react-webmcp] useWebMCPTool: navigator.modelContext is not available. ' +
          'Ensure you are running Chrome 146+ with the ' +
          '"WebMCP for testing" flag enabled.' +
          '\n    in App (at **)',
      ]);
    }

    // Should render without throwing
    expect(container.textContent).toBe('App');
  });

  it('handles registerTool throwing an error', async () => {
    const mc = installMockModelContext();
    mc.registerTool.mockImplementation(() => {
      throw new Error('Registration failed');
    });

    function App() {
      useWebMCPTool(createToolConfig());
      return React.createElement('div', null, 'App');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App));
    });

    if (__DEV__) {
      assertConsoleErrorDev([
        '[react-webmcp] Failed to register tool "test-tool": Error: Registration failed' +
          '\n    in <stack>',
      ]);
    }

    // Should render without crashing
    expect(container.textContent).toBe('App');
  });

  it('handles unregisterTool throwing during cleanup', async () => {
    const mc = installMockModelContext();
    mc.unregisterTool.mockImplementation(() => {
      throw new Error('Unregistration failed');
    });

    function App({show}) {
      if (show) {
        return React.createElement(ToolComponent);
      }
      return null;
    }

    function ToolComponent() {
      useWebMCPTool(createToolConfig());
      return React.createElement('div', null, 'Tool');
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(React.createElement(App, {show: true}));
    });

    // Unmount should not throw despite unregisterTool failing
    await act(() => {
      root.render(React.createElement(App, {show: false}));
    });

    // Should not crash
    expect(container.textContent).toBe('');
  });
});

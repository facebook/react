/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getVersionedRenderImplementation, normalizeCodeLocInfo} from './utils';

let React;
let ReactDOMClient;
let act;
let fakeConsole;
let mockError;
let mockInfo;
let mockGroup;
let mockGroupCollapsed;
let mockLog;
let mockWarn;
let patchConsole;
let unpatchConsole;
let rendererID;

describe('console', () => {
  beforeEach(() => {
    const Console = require('react-devtools-shared/src/backend/console');

    patchConsole = Console.patch;
    unpatchConsole = Console.unpatch;

    // Patch a fake console so we can verify with tests below.
    // Patching the real console is too complicated,
    // because Jest itself has hooks into it as does our test env setup.
    mockError = jest.fn();
    mockInfo = jest.fn();
    mockGroup = jest.fn();
    mockGroupCollapsed = jest.fn();
    mockLog = jest.fn();
    mockWarn = jest.fn();
    fakeConsole = {
      error: mockError,
      info: mockInfo,
      log: mockLog,
      warn: mockWarn,
      group: mockGroup,
      groupCollapsed: mockGroupCollapsed,
    };

    Console.dangerous_setTargetConsoleForTesting(fakeConsole);
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__.dangerous_setTargetConsoleForTesting(
      fakeConsole,
    );

    const inject = global.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject;
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = internals => {
      rendererID = inject(internals);

      Console.registerRenderer(internals);
      return rendererID;
    };

    React = require('react');
    ReactDOMClient = require('react-dom/client');

    const utils = require('./utils');
    act = utils.act;
  });

  const {render} = getVersionedRenderImplementation();

  // @reactVersion >=18.0
  it('should not patch console methods that are not explicitly overridden', () => {
    expect(fakeConsole.error).not.toBe(mockError);
    expect(fakeConsole.info).toBe(mockInfo);
    expect(fakeConsole.log).toBe(mockLog);
    expect(fakeConsole.warn).not.toBe(mockWarn);
    expect(fakeConsole.group).toBe(mockGroup);
    expect(fakeConsole.groupCollapsed).toBe(mockGroupCollapsed);
  });

  // @reactVersion >=18.0
  it('should patch the console when appendComponentStack is enabled', () => {
    unpatchConsole();

    expect(fakeConsole.error).toBe(mockError);
    expect(fakeConsole.warn).toBe(mockWarn);

    patchConsole({
      appendComponentStack: true,
      breakOnConsoleErrors: false,
      showInlineWarningsAndErrors: false,
    });

    expect(fakeConsole.error).not.toBe(mockError);
    expect(fakeConsole.warn).not.toBe(mockWarn);
  });

  // @reactVersion >=18.0
  it('should patch the console when breakOnConsoleErrors is enabled', () => {
    unpatchConsole();

    expect(fakeConsole.error).toBe(mockError);
    expect(fakeConsole.warn).toBe(mockWarn);

    patchConsole({
      appendComponentStack: false,
      breakOnConsoleErrors: true,
      showInlineWarningsAndErrors: false,
    });

    expect(fakeConsole.error).not.toBe(mockError);
    expect(fakeConsole.warn).not.toBe(mockWarn);
  });

  // @reactVersion >=18.0
  it('should patch the console when showInlineWarningsAndErrors is enabled', () => {
    unpatchConsole();

    expect(fakeConsole.error).toBe(mockError);
    expect(fakeConsole.warn).toBe(mockWarn);

    patchConsole({
      appendComponentStack: false,
      breakOnConsoleErrors: false,
      showInlineWarningsAndErrors: true,
    });

    expect(fakeConsole.error).not.toBe(mockError);
    expect(fakeConsole.warn).not.toBe(mockWarn);
  });

  // @reactVersion >=18.0
  it('should only patch the console once', () => {
    const {error, warn} = fakeConsole;

    patchConsole({
      appendComponentStack: true,
      breakOnConsoleErrors: false,
      showInlineWarningsAndErrors: false,
    });

    expect(fakeConsole.error).toBe(error);
    expect(fakeConsole.warn).toBe(warn);
  });

  // @reactVersion >=18.0
  it('should un-patch when requested', () => {
    expect(fakeConsole.error).not.toBe(mockError);
    expect(fakeConsole.warn).not.toBe(mockWarn);

    unpatchConsole();

    expect(fakeConsole.error).toBe(mockError);
    expect(fakeConsole.warn).toBe(mockWarn);
  });

  // @reactVersion >=18.0
  it('should pass through logs when there is no current fiber', () => {
    expect(mockLog).toHaveBeenCalledTimes(0);
    expect(mockWarn).toHaveBeenCalledTimes(0);
    expect(mockError).toHaveBeenCalledTimes(0);
    fakeConsole.log('log');
    fakeConsole.warn('warn');
    fakeConsole.error('error');
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(1);
    expect(mockError.mock.calls[0][0]).toBe('error');
  });

  // @reactVersion >=18.0
  it('should not append multiple stacks', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = true;

    const Child = ({children}) => {
      fakeConsole.warn('warn\n    in Child (at fake.js:123)');
      fakeConsole.error('error', '\n    in Child (at fake.js:123)');
      return null;
    };

    act(() => render(<Child />));

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe(
      'warn\n    in Child (at fake.js:123)',
    );
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('error');
    expect(mockError.mock.calls[0][1]).toBe('\n    in Child (at fake.js:123)');
  });

  // @reactVersion >=18.0
  it('should append component stacks to errors and warnings logged during render', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = true;

    const Intermediate = ({children}) => children;
    const Parent = ({children}) => (
      <Intermediate>
        <Child />
      </Intermediate>
    );
    const Child = ({children}) => {
      fakeConsole.error('error');
      fakeConsole.log('log');
      fakeConsole.warn('warn');
      return null;
    };

    act(() => render(<Parent />));

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
  });

  // @reactVersion >=18.0
  it('should append component stacks to errors and warnings logged from effects', () => {
    const Intermediate = ({children}) => children;
    const Parent = ({children}) => (
      <Intermediate>
        <Child />
      </Intermediate>
    );
    const Child = ({children}) => {
      React.useLayoutEffect(() => {
        fakeConsole.error('active error');
        fakeConsole.log('active log');
        fakeConsole.warn('active warn');
      });
      React.useEffect(() => {
        fakeConsole.error('passive error');
        fakeConsole.log('passive log');
        fakeConsole.warn('passive warn');
      });
      return null;
    };

    act(() => render(<Parent />));

    expect(mockLog).toHaveBeenCalledTimes(2);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('active log');
    expect(mockLog.mock.calls[1]).toHaveLength(1);
    expect(mockLog.mock.calls[1][0]).toBe('passive log');
    expect(mockWarn).toHaveBeenCalledTimes(2);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('active warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockWarn.mock.calls[1]).toHaveLength(2);
    expect(mockWarn.mock.calls[1][0]).toBe('passive warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[1][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('active error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockError.mock.calls[1]).toHaveLength(2);
    expect(mockError.mock.calls[1][0]).toBe('passive error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[1][1])).toBe(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
  });

  // @reactVersion >=18.0
  it('should append component stacks to errors and warnings logged from commit hooks', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = true;

    const Intermediate = ({children}) => children;
    const Parent = ({children}) => (
      <Intermediate>
        <Child />
      </Intermediate>
    );
    class Child extends React.Component<any> {
      componentDidMount() {
        fakeConsole.error('didMount error');
        fakeConsole.log('didMount log');
        fakeConsole.warn('didMount warn');
      }
      componentDidUpdate() {
        fakeConsole.error('didUpdate error');
        fakeConsole.log('didUpdate log');
        fakeConsole.warn('didUpdate warn');
      }
      render() {
        return null;
      }
    }

    act(() => render(<Parent />));
    act(() => render(<Parent />));

    expect(mockLog).toHaveBeenCalledTimes(2);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('didMount log');
    expect(mockLog.mock.calls[1]).toHaveLength(1);
    expect(mockLog.mock.calls[1][0]).toBe('didUpdate log');
    expect(mockWarn).toHaveBeenCalledTimes(2);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('didMount warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockWarn.mock.calls[1]).toHaveLength(2);
    expect(mockWarn.mock.calls[1][0]).toBe('didUpdate warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[1][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('didMount error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockError.mock.calls[1]).toHaveLength(2);
    expect(mockError.mock.calls[1][0]).toBe('didUpdate error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[1][1])).toBe(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
  });

  // @reactVersion >=18.0
  it('should append component stacks to errors and warnings logged from gDSFP', () => {
    const Intermediate = ({children}) => children;
    const Parent = ({children}) => (
      <Intermediate>
        <Child />
      </Intermediate>
    );
    class Child extends React.Component<any, any> {
      state = {};
      static getDerivedStateFromProps() {
        fakeConsole.error('error');
        fakeConsole.log('log');
        fakeConsole.warn('warn');
        return null;
      }
      render() {
        return null;
      }
    }

    act(() => render(<Parent />));

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
  });

  // @reactVersion >=18.0
  it('should append stacks after being uninstalled and reinstalled', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = false;

    const Child = ({children}) => {
      fakeConsole.warn('warn');
      fakeConsole.error('error');
      return null;
    };

    act(() => render(<Child />));

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(1);
    expect(mockError.mock.calls[0][0]).toBe('error');

    patchConsole({
      appendComponentStack: true,
      breakOnConsoleErrors: false,
      showInlineWarningsAndErrors: false,
    });
    act(() => render(<Child />));

    expect(mockWarn).toHaveBeenCalledTimes(2);
    expect(mockWarn.mock.calls[1]).toHaveLength(2);
    expect(mockWarn.mock.calls[1][0]).toBe('warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[1][1])).toEqual(
      '\n    in Child (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError.mock.calls[1]).toHaveLength(2);
    expect(mockError.mock.calls[1][0]).toBe('error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[1][1])).toBe(
      '\n    in Child (at **)',
    );
  });

  // @reactVersion >=18.0
  it('should be resilient to prepareStackTrace', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = true;

    Error.prepareStackTrace = function (error, callsites) {
      const stack = ['An error occurred:', error.message];
      for (let i = 0; i < callsites.length; i++) {
        const callsite = callsites[i];
        stack.push(
          '\t' + callsite.getFunctionName(),
          '\t\tat ' + callsite.getFileName(),
          '\t\ton line ' + callsite.getLineNumber(),
        );
      }

      return stack.join('\n');
    };

    const Intermediate = ({children}) => children;
    const Parent = ({children}) => (
      <Intermediate>
        <Child />
      </Intermediate>
    );
    const Child = ({children}) => {
      fakeConsole.error('error');
      fakeConsole.log('log');
      fakeConsole.warn('warn');
      return null;
    };

    act(() => render(<Parent />));

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
  });

  // @reactVersion >=18.0
  it('should correctly log Symbols', () => {
    const Component = ({children}) => {
      fakeConsole.warn('Symbol:', Symbol(''));
      return null;
    };

    act(() => render(<Component />));

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0][0]).toBe('Symbol:');
  });

  it('should double log if hideConsoleLogsInStrictMode is disabled in Strict mode', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = false;
    global.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ = false;

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    function App() {
      fakeConsole.log('log');
      fakeConsole.warn('warn');
      fakeConsole.error('error');
      fakeConsole.info('info');
      fakeConsole.group('group');
      fakeConsole.groupCollapsed('groupCollapsed');
      return <div />;
    }

    act(() =>
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      ),
    );
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');
    expect(mockLog.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_LOG_COLOR}`,
      'log',
    ]);

    expect(mockWarn).toHaveBeenCalledTimes(2);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(mockWarn.mock.calls[1]).toHaveLength(3);
    expect(mockWarn.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_WARNING_COLOR}`,
      'warn',
    ]);

    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError.mock.calls[0]).toHaveLength(1);
    expect(mockError.mock.calls[0][0]).toBe('error');
    expect(mockError.mock.calls[1]).toHaveLength(3);
    expect(mockError.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_ERROR_COLOR}`,
      'error',
    ]);

    expect(mockInfo).toHaveBeenCalledTimes(2);
    expect(mockInfo.mock.calls[0]).toHaveLength(1);
    expect(mockInfo.mock.calls[0][0]).toBe('info');
    expect(mockInfo.mock.calls[1]).toHaveLength(3);
    expect(mockInfo.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_LOG_COLOR}`,
      'info',
    ]);

    expect(mockGroup).toHaveBeenCalledTimes(2);
    expect(mockGroup.mock.calls[0]).toHaveLength(1);
    expect(mockGroup.mock.calls[0][0]).toBe('group');
    expect(mockGroup.mock.calls[1]).toHaveLength(3);
    expect(mockGroup.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_LOG_COLOR}`,
      'group',
    ]);

    expect(mockGroupCollapsed).toHaveBeenCalledTimes(2);
    expect(mockGroupCollapsed.mock.calls[0]).toHaveLength(1);
    expect(mockGroupCollapsed.mock.calls[0][0]).toBe('groupCollapsed');
    expect(mockGroupCollapsed.mock.calls[1]).toHaveLength(3);
    expect(mockGroupCollapsed.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_LOG_COLOR}`,
      'groupCollapsed',
    ]);
  });

  it('should not double log if hideConsoleLogsInStrictMode is enabled in Strict mode', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = false;
    global.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ = true;

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    function App() {
      console.log(
        'CALL',
        global.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__,
      );
      fakeConsole.log('log');
      fakeConsole.warn('warn');
      fakeConsole.error('error');
      fakeConsole.info('info');
      fakeConsole.group('group');
      fakeConsole.groupCollapsed('groupCollapsed');
      return <div />;
    }

    act(() =>
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      ),
    );

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');

    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(1);
    expect(mockError.mock.calls[0][0]).toBe('error');

    expect(mockInfo).toHaveBeenCalledTimes(1);
    expect(mockInfo.mock.calls[0]).toHaveLength(1);
    expect(mockInfo.mock.calls[0][0]).toBe('info');

    expect(mockGroup).toHaveBeenCalledTimes(1);
    expect(mockGroup.mock.calls[0]).toHaveLength(1);
    expect(mockGroup.mock.calls[0][0]).toBe('group');

    expect(mockGroupCollapsed).toHaveBeenCalledTimes(1);
    expect(mockGroupCollapsed.mock.calls[0]).toHaveLength(1);
    expect(mockGroupCollapsed.mock.calls[0][0]).toBe('groupCollapsed');
  });

  it('should double log in Strict mode initial render for extension', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = false;
    global.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ = false;

    // This simulates a render that happens before React DevTools have finished
    // their handshake to attach the React DOM renderer functions to DevTools
    // In this case, we should still be able to mock the console in Strict mode
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.set(
      rendererID,
      null,
    );
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    function App() {
      fakeConsole.log('log');
      fakeConsole.warn('warn');
      fakeConsole.error('error');
      return <div />;
    }

    act(() =>
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      ),
    );

    expect(mockLog).toHaveBeenCalledTimes(2);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');
    expect(mockLog.mock.calls[1]).toHaveLength(3);
    expect(mockLog.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_LOG_COLOR}`,
      'log',
    ]);

    expect(mockWarn).toHaveBeenCalledTimes(2);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(mockWarn.mock.calls[1]).toHaveLength(3);
    expect(mockWarn.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_WARNING_COLOR}`,
      'warn',
    ]);

    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError.mock.calls[0]).toHaveLength(1);
    expect(mockError.mock.calls[0][0]).toBe('error');
    expect(mockError.mock.calls[1]).toHaveLength(3);
    expect(mockError.mock.calls[1]).toEqual([
      '%c%s',
      `color: ${process.env.DARK_MODE_DIMMED_ERROR_COLOR}`,
      'error',
    ]);
  });

  it('should not double log in Strict mode initial render for extension', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = false;
    global.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ = true;

    // This simulates a render that happens before React DevTools have finished
    // their handshake to attach the React DOM renderer functions to DevTools
    // In this case, we should still be able to mock the console in Strict mode
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.set(
      rendererID,
      null,
    );
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    function App() {
      fakeConsole.log('log');
      fakeConsole.warn('warn');
      fakeConsole.error('error');
      return <div />;
    }

    act(() =>
      root.render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      ),
    );
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');

    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(1);
    expect(mockError.mock.calls[0][0]).toBe('error');
  });

  it('should properly dim component stacks during strict mode double log', () => {
    global.__REACT_DEVTOOLS_APPEND_COMPONENT_STACK__ = true;
    global.__REACT_DEVTOOLS_HIDE_CONSOLE_LOGS_IN_STRICT_MODE__ = false;

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    const Intermediate = ({children}) => children;
    const Parent = ({children}) => (
      <Intermediate>
        <Child />
      </Intermediate>
    );
    const Child = ({children}) => {
      fakeConsole.error('error');
      fakeConsole.warn('warn');
      return null;
    };

    act(() =>
      root.render(
        <React.StrictMode>
          <Parent />
        </React.StrictMode>,
      ),
    );

    expect(mockWarn).toHaveBeenCalledTimes(2);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockWarn.mock.calls[1]).toHaveLength(4);
    expect(mockWarn.mock.calls[1][0]).toEqual('%c%s %s');
    expect(mockWarn.mock.calls[1][1]).toMatch('color: rgba(');
    expect(mockWarn.mock.calls[1][2]).toEqual('warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[1][3]).trim()).toEqual(
      'in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );

    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
    expect(mockError.mock.calls[1]).toHaveLength(4);
    expect(mockError.mock.calls[1][0]).toEqual('%c%s %s');
    expect(mockError.mock.calls[1][1]).toMatch('color: rgba(');
    expect(mockError.mock.calls[1][2]).toEqual('error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[1][3]).trim()).toEqual(
      'in Child (at **)\n    in Intermediate (at **)\n    in Parent (at **)',
    );
  });
});

describe('console error', () => {
  beforeEach(() => {
    jest.resetModules();

    const Console = require('react-devtools-shared/src/backend/console');
    patchConsole = Console.patch;
    unpatchConsole = Console.unpatch;

    // Patch a fake console so we can verify with tests below.
    // Patching the real console is too complicated,
    // because Jest itself has hooks into it as does our test env setup.
    mockError = jest.fn();
    mockInfo = jest.fn();
    mockGroup = jest.fn();
    mockGroupCollapsed = jest.fn();
    mockLog = jest.fn();
    mockWarn = jest.fn();
    fakeConsole = {
      error: mockError,
      info: mockInfo,
      log: mockLog,
      warn: mockWarn,
      group: mockGroup,
      groupCollapsed: mockGroupCollapsed,
    };

    Console.dangerous_setTargetConsoleForTesting(fakeConsole);

    const inject = global.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject;
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = internals => {
      inject(internals);

      Console.registerRenderer(internals, () => {
        throw Error('foo');
      });
    };

    React = require('react');
    ReactDOMClient = require('react-dom/client');

    const utils = require('./utils');
    act = utils.act;
  });

  // @reactVersion >=18.0
  it('error in console log throws without interfering with logging', () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    function App() {
      fakeConsole.log('log');
      fakeConsole.warn('warn');
      fakeConsole.error('error');
      return <div />;
    }

    patchConsole({
      appendComponentStack: true,
      breakOnConsoleErrors: false,
      showInlineWarningsAndErrors: true,
      hideConsoleLogsInStrictMode: false,
    });

    expect(() => {
      act(() => {
        root.render(<App />);
      });
    }).toThrowError('foo');

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');

    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(1);
    expect(mockError.mock.calls[0][0]).toBe('error');
  });
});

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

describe('console', () => {
  let React;
  let ReactDOM;
  let act;
  let fakeConsole;
  let mockError;
  let mockInfo;
  let mockLog;
  let mockWarn;
  let patchConsole;
  let unpatchConsole;

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
    mockLog = jest.fn();
    mockWarn = jest.fn();
    fakeConsole = {
      error: mockError,
      info: mockInfo,
      log: mockLog,
      warn: mockWarn,
    };

    Console.dangerous_setTargetConsoleForTesting(fakeConsole);

    // Note the Console module only patches once,
    // so it's important to patch the test console before injection.
    patchConsole();

    const inject = global.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject;
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__.inject = internals => {
      inject(internals);

      Console.registerRenderer(internals);
    };

    React = require('react');
    ReactDOM = require('react-dom');

    const utils = require('./utils');
    act = utils.act;
  });

  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  it('should not patch console methods that do not receive component stacks', () => {
    expect(fakeConsole.error).not.toBe(mockError);
    expect(fakeConsole.info).toBe(mockInfo);
    expect(fakeConsole.log).toBe(mockLog);
    expect(fakeConsole.warn).not.toBe(mockWarn);
  });

  it('should only patch the console once', () => {
    const {error, warn} = fakeConsole;

    patchConsole();

    expect(fakeConsole.error).toBe(error);
    expect(fakeConsole.warn).toBe(warn);
  });

  it('should un-patch when requested', () => {
    expect(fakeConsole.error).not.toBe(mockError);
    expect(fakeConsole.warn).not.toBe(mockWarn);

    unpatchConsole();

    expect(fakeConsole.error).toBe(mockError);
    expect(fakeConsole.warn).toBe(mockWarn);
  });

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

  it('should not append multiple stacks', () => {
    const Child = () => {
      fakeConsole.warn('warn\n    in Child (at fake.js:123)');
      fakeConsole.error('error', '\n    in Child (at fake.js:123)');
      return null;
    };

    act(() => ReactDOM.render(<Child />, document.createElement('div')));

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

  it('should append component stacks to errors and warnings logged during render', () => {
    const Intermediate = ({children}) => children;
    const Parent = () => (
      <Intermediate>
        <Child />
      </Intermediate>
    );
    const Child = () => {
      fakeConsole.error('error');
      fakeConsole.log('log');
      fakeConsole.warn('warn');
      return null;
    };

    act(() => ReactDOM.render(<Parent />, document.createElement('div')));

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
  });

  it('should append component stacks to errors and warnings logged from effects', () => {
    const Intermediate = ({children}) => children;
    const Parent = () => (
      <Intermediate>
        <Child />
      </Intermediate>
    );
    const Child = () => {
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

    act(() => ReactDOM.render(<Parent />, document.createElement('div')));

    expect(mockLog).toHaveBeenCalledTimes(2);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('active log');
    expect(mockLog.mock.calls[1]).toHaveLength(1);
    expect(mockLog.mock.calls[1][0]).toBe('passive log');
    expect(mockWarn).toHaveBeenCalledTimes(2);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('active warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
    expect(mockWarn.mock.calls[1]).toHaveLength(2);
    expect(mockWarn.mock.calls[1][0]).toBe('passive warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[1][1])).toEqual(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('active error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
    expect(mockError.mock.calls[1]).toHaveLength(2);
    expect(mockError.mock.calls[1][0]).toBe('passive error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[1][1])).toBe(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
  });

  it('should append component stacks to errors and warnings logged from commit hooks', () => {
    const Intermediate = ({children}) => children;
    const Parent = () => (
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

    const container = document.createElement('div');
    act(() => ReactDOM.render(<Parent />, container));
    act(() => ReactDOM.render(<Parent />, container));

    expect(mockLog).toHaveBeenCalledTimes(2);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('didMount log');
    expect(mockLog.mock.calls[1]).toHaveLength(1);
    expect(mockLog.mock.calls[1][0]).toBe('didUpdate log');
    expect(mockWarn).toHaveBeenCalledTimes(2);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('didMount warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
    expect(mockWarn.mock.calls[1]).toHaveLength(2);
    expect(mockWarn.mock.calls[1][0]).toBe('didUpdate warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[1][1])).toEqual(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(2);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('didMount error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
    expect(mockError.mock.calls[1]).toHaveLength(2);
    expect(mockError.mock.calls[1][0]).toBe('didUpdate error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[1][1])).toBe(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
  });

  it('should append component stacks to errors and warnings logged from gDSFP', () => {
    const Intermediate = ({children}) => children;
    const Parent = () => (
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

    act(() => ReactDOM.render(<Parent />, document.createElement('div')));

    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0]).toHaveLength(1);
    expect(mockLog.mock.calls[0][0]).toBe('log');
    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(2);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(normalizeCodeLocInfo(mockWarn.mock.calls[0][1])).toEqual(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(2);
    expect(mockError.mock.calls[0][0]).toBe('error');
    expect(normalizeCodeLocInfo(mockError.mock.calls[0][1])).toBe(
      '\n    in Child (at **)\n    in Parent (at **)',
    );
  });

  it('should append stacks after being uninstalled and reinstalled', () => {
    const Child = () => {
      fakeConsole.warn('warn');
      fakeConsole.error('error');
      return null;
    };

    unpatchConsole();
    act(() => ReactDOM.render(<Child />, document.createElement('div')));

    expect(mockWarn).toHaveBeenCalledTimes(1);
    expect(mockWarn.mock.calls[0]).toHaveLength(1);
    expect(mockWarn.mock.calls[0][0]).toBe('warn');
    expect(mockError).toHaveBeenCalledTimes(1);
    expect(mockError.mock.calls[0]).toHaveLength(1);
    expect(mockError.mock.calls[0][0]).toBe('error');

    patchConsole();
    act(() => ReactDOM.render(<Child />, document.createElement('div')));

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
});

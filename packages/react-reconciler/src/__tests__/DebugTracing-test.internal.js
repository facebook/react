/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('DebugTracing', () => {
  let React;
  let ReactNoop;
  let waitForPaint;
  let waitForAll;
  let act;

  let logs;

  const SYNC_LANE_STRING = '0b0000000000000000000000000000010';
  const DEFAULT_LANE_STRING = '0b0000000000000000000000000100000';
  const RETRY_LANE_STRING = '0b0000000010000000000000000000000';

  global.IS_REACT_ACT_ENVIRONMENT = true;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    const InternalTestUtils = require('internal-test-utils');
    waitForPaint = InternalTestUtils.waitForPaint;
    waitForAll = InternalTestUtils.waitForAll;
    act = InternalTestUtils.act;

    logs = [];

    const groups = [];

    spyOnDevAndProd(console, 'log').mockImplementation(message => {
      logs.push(`log: ${message.replace(/%c/g, '')}`);
    });
    spyOnDevAndProd(console, 'group').mockImplementation(message => {
      logs.push(`group: ${message.replace(/%c/g, '')}`);
      groups.push(message);
    });
    spyOnDevAndProd(console, 'groupEnd').mockImplementation(() => {
      const message = groups.pop();
      logs.push(`groupEnd: ${message.replace(/%c/g, '')}`);
    });
  });

  // @gate enableDebugTracing
  it('should not log anything for sync render without suspends or state updates', async () => {
    await act(() => {
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <div />
        </React.unstable_DebugTracingMode>,
      );
    });

    expect(logs).toEqual([]);
  });

  // @gate experimental && enableDebugTracing
  it('should not log anything for concurrent render without suspends or state updates', async () => {
    await act(() =>
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <div />
        </React.unstable_DebugTracingMode>,
      ),
    );
    expect(logs).toEqual([]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && !disableLegacyMode
  it('should log sync render with suspense, legacy', async () => {
    let resolveFakeSuspensePromise;
    let didResolve = false;
    const fakeSuspensePromise = new Promise(resolve => {
      resolveFakeSuspensePromise = () => {
        didResolve = true;
        resolve();
      };
    });

    function Example() {
      if (!didResolve) {
        throw fakeSuspensePromise;
      }
      return null;
    }

    ReactNoop.renderLegacySyncRoot(
      <React.unstable_DebugTracingMode>
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>
      </React.unstable_DebugTracingMode>,
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${SYNC_LANE_STRING})`,
      'log: ⚛️ Example suspended',
      `groupEnd: ⚛️ render (${SYNC_LANE_STRING})`,
    ]);

    logs.splice(0);

    resolveFakeSuspensePromise();
    await waitForAll([]);

    expect(logs).toEqual(['log: ⚛️ Example resolved']);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableCPUSuspense && !disableLegacyMode
  it('should log sync render with CPU suspense, legacy', async () => {
    function Example() {
      console.log('<Example/>');
      return null;
    }

    function Wrapper({children}) {
      console.log('<Wrapper/>');
      return children;
    }

    ReactNoop.renderLegacySyncRoot(
      <React.unstable_DebugTracingMode>
        <Wrapper>
          <React.Suspense fallback={null} unstable_expectedLoadTime={1}>
            <Example />
          </React.Suspense>
        </Wrapper>
      </React.unstable_DebugTracingMode>,
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${SYNC_LANE_STRING})`,
      'log: <Wrapper/>',
      `groupEnd: ⚛️ render (${SYNC_LANE_STRING})`,
    ]);

    logs.splice(0);

    await waitForPaint([]);

    expect(logs).toEqual([
      `group: ⚛️ render (${RETRY_LANE_STRING})`,
      'log: <Example/>',
      `groupEnd: ⚛️ render (${RETRY_LANE_STRING})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log concurrent render with suspense', async () => {
    let isResolved = false;
    let resolveFakeSuspensePromise;
    const fakeSuspensePromise = new Promise(resolve => {
      resolveFakeSuspensePromise = () => {
        resolve();
        isResolved = true;
      };
    });

    function Example() {
      if (!isResolved) {
        throw fakeSuspensePromise;
      }
      return null;
    }

    await act(() =>
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>
        </React.unstable_DebugTracingMode>,
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${DEFAULT_LANE_STRING})`,
      'log: ⚛️ Example suspended',
      `groupEnd: ⚛️ render (${DEFAULT_LANE_STRING})`,
    ]);

    logs.splice(0);

    await act(async () => await resolveFakeSuspensePromise());
    expect(logs).toEqual(['log: ⚛️ Example resolved']);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableCPUSuspense
  it('should log concurrent render with CPU suspense', async () => {
    function Example() {
      console.log('<Example/>');
      return null;
    }

    function Wrapper({children}) {
      console.log('<Wrapper/>');
      return children;
    }

    await act(() =>
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <Wrapper>
            <React.Suspense fallback={null} unstable_expectedLoadTime={1}>
              <Example />
            </React.Suspense>
          </Wrapper>
        </React.unstable_DebugTracingMode>,
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${DEFAULT_LANE_STRING})`,
      'log: <Wrapper/>',
      `groupEnd: ⚛️ render (${DEFAULT_LANE_STRING})`,
      `group: ⚛️ render (${RETRY_LANE_STRING})`,
      'log: <Example/>',
      `groupEnd: ⚛️ render (${RETRY_LANE_STRING})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log cascading class component updates', async () => {
    class Example extends React.Component {
      state = {didMount: false};
      componentDidMount() {
        this.setState({didMount: true});
      }
      render() {
        return null;
      }
    }

    await act(() =>
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ commit (${DEFAULT_LANE_STRING})`,
      `group: ⚛️ layout effects (${DEFAULT_LANE_STRING})`,
      `log: ⚛️ Example updated state (${SYNC_LANE_STRING})`,
      `groupEnd: ⚛️ layout effects (${DEFAULT_LANE_STRING})`,
      `groupEnd: ⚛️ commit (${DEFAULT_LANE_STRING})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log render phase state updates for class component', async () => {
    class Example extends React.Component {
      state = {didRender: false};
      render() {
        if (this.state.didRender === false) {
          this.setState({didRender: true});
        }
        return null;
      }
    }

    await expect(async () => {
      await act(() => {
        ReactNoop.render(
          <React.unstable_DebugTracingMode>
            <Example />
          </React.unstable_DebugTracingMode>,
        );
      });
    }).toErrorDev(
      'Cannot update during an existing state transition (such as within `render`). Render methods should be a pure function of props and state.',
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${DEFAULT_LANE_STRING})`,
      `log: ⚛️ Example updated state (${DEFAULT_LANE_STRING})`,
      `groupEnd: ⚛️ render (${DEFAULT_LANE_STRING})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log cascading layout updates', async () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    await act(() =>
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ commit (${DEFAULT_LANE_STRING})`,
      `group: ⚛️ layout effects (${DEFAULT_LANE_STRING})`,
      `log: ⚛️ Example updated state (${SYNC_LANE_STRING})`,
      `groupEnd: ⚛️ layout effects (${DEFAULT_LANE_STRING})`,
      `groupEnd: ⚛️ commit (${DEFAULT_LANE_STRING})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log cascading passive updates', async () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    await act(() => {
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
      );
    });
    expect(logs).toEqual([
      `group: ⚛️ passive effects (${DEFAULT_LANE_STRING})`,
      `log: ⚛️ Example updated state (${DEFAULT_LANE_STRING})`,
      `groupEnd: ⚛️ passive effects (${DEFAULT_LANE_STRING})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log render phase updates', async () => {
    function Example() {
      const [didRender, setDidRender] = React.useState(false);
      if (!didRender) {
        setDidRender(true);
      }
      return didRender;
    }

    await act(() => {
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
      );
    });

    expect(logs).toEqual([
      `group: ⚛️ render (${DEFAULT_LANE_STRING})`,
      `log: ⚛️ Example updated state (${DEFAULT_LANE_STRING})`,
      `groupEnd: ⚛️ render (${DEFAULT_LANE_STRING})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log when user code logs', async () => {
    function Example() {
      console.log('Hello from user code');
      return null;
    }

    await act(() =>
      ReactNoop.render(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${DEFAULT_LANE_STRING})`,
      'log: Hello from user code',
      `groupEnd: ⚛️ render (${DEFAULT_LANE_STRING})`,
    ]);
  });

  // @gate experimental && enableDebugTracing
  it('should not log anything outside of a unstable_DebugTracingMode subtree', async () => {
    function ExampleThatCascades() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    const fakeSuspensePromise = {then() {}};

    function ExampleThatSuspends() {
      throw fakeSuspensePromise;
    }

    function Example() {
      return null;
    }

    await act(() =>
      ReactNoop.render(
        <React.Fragment>
          <ExampleThatCascades />
          <React.Suspense fallback={null}>
            <ExampleThatSuspends />
          </React.Suspense>
          <React.unstable_DebugTracingMode>
            <Example />
          </React.unstable_DebugTracingMode>
        </React.Fragment>,
      ),
    );

    expect(logs).toEqual([]);
  });
});

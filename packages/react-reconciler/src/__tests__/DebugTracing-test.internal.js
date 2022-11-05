/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('DebugTracing', () => {
  let React;
  let ReactTestRenderer;
  let Scheduler;

  let logs;

  const SYNC_LANE_STRING = '0b0000000000000000000000000000001';
  const RETRY_LANE_STRING = '0b0000000010000000000000000000000';
  const DEFAULT_EVENT_PRIORITY = 3;

  global.IS_REACT_ACT_ENVIRONMENT = true;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');

    logs = [];

    const groups = [];

    spyOnDevAndProd(console, 'log').and.callFake(message => {
      logs.push(`log: ${message.replace(/%c/g, '')}`);
    });
    spyOnDevAndProd(console, 'group').and.callFake(message => {
      logs.push(`group: ${message.replace(/%c/g, '')}`);
      groups.push(message);
    });
    spyOnDevAndProd(console, 'groupEnd').and.callFake(() => {
      const message = groups.pop();
      logs.push(`groupEnd: ${message.replace(/%c/g, '')}`);
    });
  });

  // @gate enableDebugTracing
  it('should not log anything for sync render without suspends or state updates', () => {
    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <div />
      </React.unstable_DebugTracingMode>,
    );

    expect(logs).toEqual([]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should not log anything for concurrent render without suspends or state updates', () => {
    ReactTestRenderer.act(() =>
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <div />
        </React.unstable_DebugTracingMode>,
        {unstable_isConcurrent: true},
      ),
    );
    expect(logs).toEqual([]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log sync render with suspense', async () => {
    const fakeSuspensePromise = Promise.resolve(true);
    function Example() {
      throw fakeSuspensePromise;
    }

    ReactTestRenderer.act(() =>
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>
        </React.unstable_DebugTracingMode>,
      ),
    );

    expect(logs).toEqual([
      'group: ⚛️ render (0b0000000000000000000000000000001) (1)',
      'log: ⚛️ Example suspended',
      'groupEnd: ⚛️ render (0b0000000000000000000000000000001) (1)',
    ]);

    logs.splice(0);

    await fakeSuspensePromise;
    expect(logs).toEqual(['log: ⚛️ Example resolved']);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableCPUSuspense
  it('should log sync render with CPU suspense', () => {
    function Example() {
      console.log('<Example/>');
      return null;
    }

    function Wrapper({children}) {
      console.log('<Wrapper/>');
      return children;
    }

    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <Wrapper>
          <React.Suspense fallback={null} unstable_expectedLoadTime={1}>
            <Example />
          </React.Suspense>
        </Wrapper>
      </React.unstable_DebugTracingMode>,
    );

    expect(logs).toEqual([
      'group: ⚛️ render (0b0000000000000000000000000000001) (1)',
      'log: <Wrapper/>',
      'groupEnd: ⚛️ render (0b0000000000000000000000000000001) (1)',
    ]);

    logs.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(logs).toEqual([
      `group: ⚛️ render (${RETRY_LANE_STRING}) (0)`,
      'log: <Example/>',
      `groupEnd: ⚛️ render (${RETRY_LANE_STRING}) (0)`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableUnifiedSyncLane
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

    ReactTestRenderer.act(() =>
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>
        </React.unstable_DebugTracingMode>,
        {unstable_isConcurrent: true},
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      'log: ⚛️ Example suspended',
      `groupEnd: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
    ]);

    logs.splice(0);

    await ReactTestRenderer.act(async () => await resolveFakeSuspensePromise());
    expect(logs).toEqual(['log: ⚛️ Example resolved']);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableCPUSuspense && enableUnifiedSyncLane
  it('should log concurrent render with CPU suspense', () => {
    function Example() {
      console.log('<Example/>');
      return null;
    }

    function Wrapper({children}) {
      console.log('<Wrapper/>');
      return children;
    }

    ReactTestRenderer.act(() =>
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <Wrapper>
            <React.Suspense fallback={null} unstable_expectedLoadTime={1}>
              <Example />
            </React.Suspense>
          </Wrapper>
        </React.unstable_DebugTracingMode>,
        {unstable_isConcurrent: true},
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      'log: <Wrapper/>',
      `groupEnd: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      `group: ⚛️ render (${RETRY_LANE_STRING}) (0)`,
      'log: <Example/>',
      `groupEnd: ⚛️ render (${RETRY_LANE_STRING}) (0)`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableUnifiedSyncLane
  it('should log cascading class component updates', () => {
    class Example extends React.Component {
      state = {didMount: false};
      componentDidMount() {
        this.setState({didMount: true});
      }
      render() {
        return null;
      }
    }

    ReactTestRenderer.act(() =>
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
        {unstable_isConcurrent: true},
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ commit (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      `group: ⚛️ layout effects (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      'log: ⚛️ Example updated state (0b0000000000000000000000000000001)',
      `groupEnd: ⚛️ layout effects (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      `groupEnd: ⚛️ commit (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableUnifiedSyncLane
  it('should log render phase state updates for class component', () => {
    class Example extends React.Component {
      state = {didRender: false};
      render() {
        if (this.state.didRender === false) {
          this.setState({didRender: true});
        }
        return null;
      }
    }

    expect(() => {
      ReactTestRenderer.act(() =>
        ReactTestRenderer.create(
          <React.unstable_DebugTracingMode>
            <Example />
          </React.unstable_DebugTracingMode>,
          {unstable_isConcurrent: true},
        ),
      );
    }).toErrorDev('Cannot update during an existing state transition');

    expect(logs).toEqual([
      `group: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      `log: ⚛️ Example updated state (${SYNC_LANE_STRING})`,
      `groupEnd: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableUnifiedSyncLane
  it('should log cascading layout updates', () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    ReactTestRenderer.act(() =>
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
        {unstable_isConcurrent: true},
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ commit (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      `group: ⚛️ layout effects (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      'log: ⚛️ Example updated state (0b0000000000000000000000000000001)',
      `groupEnd: ⚛️ layout effects (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      `groupEnd: ⚛️ commit (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableUnifiedSyncLane
  it('should log cascading passive updates', () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
        {unstable_isConcurrent: true},
      );
    });
    expect(logs).toEqual([
      // TODO: why does this become 0?
      `group: ⚛️ passive effects (${SYNC_LANE_STRING}) (0)`,
      `log: ⚛️ Example updated state (${SYNC_LANE_STRING})`,
      `groupEnd: ⚛️ passive effects (${SYNC_LANE_STRING}) (0)`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableUnifiedSyncLane
  it('should log render phase updates', () => {
    function Example() {
      const [didRender, setDidRender] = React.useState(false);
      if (!didRender) {
        setDidRender(true);
      }
      return didRender;
    }

    ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
        {unstable_isConcurrent: true},
      );
    });

    expect(logs).toEqual([
      `group: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      `log: ⚛️ Example updated state (${SYNC_LANE_STRING})`,
      `groupEnd: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing && enableUnifiedSyncLane
  it('should log when user code logs', () => {
    function Example() {
      console.log('Hello from user code');
      return null;
    }

    ReactTestRenderer.act(() =>
      ReactTestRenderer.create(
        <React.unstable_DebugTracingMode>
          <Example />
        </React.unstable_DebugTracingMode>,
        {unstable_isConcurrent: true},
      ),
    );

    expect(logs).toEqual([
      `group: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
      'log: Hello from user code',
      `groupEnd: ⚛️ render (${SYNC_LANE_STRING}) (${DEFAULT_EVENT_PRIORITY})`,
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should not log anything outside of a unstable_DebugTracingMode subtree', () => {
    function ExampleThatCascades() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    const fakeSuspensePromise = new Promise(() => {});
    function ExampleThatSuspends() {
      throw fakeSuspensePromise;
    }

    function Example() {
      return null;
    }

    ReactTestRenderer.act(() =>
      ReactTestRenderer.create(
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

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

  // @gate experimental
  it('should not log anything for sync render without suspends or state updates', () => {
    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <div />
      </React.unstable_DebugTracingMode>,
    );

    expect(logs).toEqual([]);
  });

  // @gate experimental
  it('should not log anything for concurrent render without suspends or state updates', () => {
    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <div />
      </React.unstable_DebugTracingMode>,
      {unstable_isConcurrent: true},
    );

    expect(logs).toEqual([]);

    logs.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(logs).toEqual([]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log sync render with suspense', async () => {
    const fakeSuspensPromise = Promise.resolve(true);
    function Example() {
      throw fakeSuspensPromise;
    }

    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>
      </React.unstable_DebugTracingMode>,
    );

    expect(logs).toEqual([
      'group: ⚛️ render (priority: immediate)',
      'log: ⚛️ Example suspended',
      'groupEnd: ⚛️ render (priority: immediate)',
    ]);

    logs.splice(0);

    await fakeSuspensPromise;
    expect(logs).toEqual(['log: ⚛️ Example resolved']);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log concurrent render with suspense', async () => {
    const fakeSuspensPromise = Promise.resolve(true);
    function Example() {
      throw fakeSuspensPromise;
    }

    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <React.Suspense fallback={null}>
          <Example />
        </React.Suspense>
      </React.unstable_DebugTracingMode>,
      {unstable_isConcurrent: true},
    );

    expect(logs).toEqual([]);

    logs.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(logs).toEqual([
      'group: ⚛️ render (priority: normal)',
      'log: ⚛️ Example suspended',
      'groupEnd: ⚛️ render (priority: normal)',
    ]);

    logs.splice(0);

    await fakeSuspensPromise;
    expect(logs).toEqual(['log: ⚛️ Example resolved']);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
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

    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <Example />
      </React.unstable_DebugTracingMode>,
      {unstable_isConcurrent: true},
    );

    expect(logs).toEqual([]);

    logs.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(logs).toEqual([
      'group: ⚛️ commit (priority: normal)',
      'group: ⚛️ layout effects (priority: immediate)',
      'log: ⚛️ Example updated state (priority: immediate)',
      'groupEnd: ⚛️ layout effects (priority: immediate)',
      'groupEnd: ⚛️ commit (priority: normal)',
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
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

    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <Example />
      </React.unstable_DebugTracingMode>,
      {unstable_isConcurrent: true},
    );

    expect(logs).toEqual([]);

    logs.splice(0);

    expect(() => {
      expect(Scheduler).toFlushUntilNextPaint([]);
    }).toErrorDev('Cannot update during an existing state transition');

    expect(logs).toEqual([
      'group: ⚛️ render (priority: normal)',
      'log: ⚛️ Example updated state (priority: normal)',
      'log: ⚛️ Example updated state (priority: normal)',
      'groupEnd: ⚛️ render (priority: normal)',
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log cascading layout updates', () => {
    function Example() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <Example />
      </React.unstable_DebugTracingMode>,
      {unstable_isConcurrent: true},
    );

    expect(logs).toEqual([]);

    logs.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(logs).toEqual([
      'group: ⚛️ commit (priority: normal)',
      'group: ⚛️ layout effects (priority: immediate)',
      'log: ⚛️ Example updated state (priority: immediate)',
      'groupEnd: ⚛️ layout effects (priority: immediate)',
      'groupEnd: ⚛️ commit (priority: normal)',
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
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
      'group: ⚛️ passive effects (priority: normal)',
      'log: ⚛️ Example updated state (priority: normal)',
      'groupEnd: ⚛️ passive effects (priority: normal)',
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
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
      'group: ⚛️ render (priority: normal)',
      'log: ⚛️ Example updated state (priority: normal)',
      'log: ⚛️ Example updated state (priority: normal)', // debugRenderPhaseSideEffectsForStrictMode
      'groupEnd: ⚛️ render (priority: normal)',
    ]);
  });

  // @gate experimental && build === 'development' && enableDebugTracing
  it('should log when user code logs', () => {
    function Example() {
      console.log('Hello from user code');
      return null;
    }

    ReactTestRenderer.create(
      <React.unstable_DebugTracingMode>
        <Example />
      </React.unstable_DebugTracingMode>,
      {unstable_isConcurrent: true},
    );

    expect(logs).toEqual([]);

    logs.splice(0);

    expect(Scheduler).toFlushUntilNextPaint([]);

    expect(logs).toEqual([
      'group: ⚛️ render (priority: normal)',
      'log: Hello from user code',
      'groupEnd: ⚛️ render (priority: normal)',
    ]);
  });

  // @gate experimental
  it('should not log anything outside of a unstable_DebugTracingMode subtree', () => {
    function ExampleThatCascades() {
      const [didMount, setDidMount] = React.useState(false);
      React.useLayoutEffect(() => {
        setDidMount(true);
      }, []);
      return didMount;
    }

    const fakeSuspensPromise = new Promise(() => {});
    function ExampleThatSuspends() {
      throw fakeSuspensPromise;
    }

    function Example() {
      return null;
    }

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
    );

    expect(logs).toEqual([]);
  });
});

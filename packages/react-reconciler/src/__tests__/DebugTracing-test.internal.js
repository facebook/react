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
  let ReactFeatureFlags;
  let ReactTestRenderer;
  let Scheduler;

  let logs;

  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableDebugTracing = true;

    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');

    const groups = [];

    spyOnDevAndProd(console, 'log').and.callFake(message => {
      Scheduler.unstable_yieldValue(`log: ${message.replace(/%c/g, '')}`);
    });
    spyOnDevAndProd(console, 'group').and.callFake(message => {
      Scheduler.unstable_yieldValue(`group: ${message.replace(/%c/g, '')}`);
      groups.push(message);
    });
    spyOnDevAndProd(console, 'groupEnd').and.callFake(() => {
      const message = groups.pop();
      Scheduler.unstable_yieldValue(`groupEnd: ${message.replace(/%c/g, '')}`);
    });
  });

  if (!__DEV__) {
    it('empty test', () => {
      // Empty test to prevent "Your test suite must contain at least one test." error.
    });
  } else {
    it('should not log anything for sync render without suspends or state updates', () => {
      ReactTestRenderer.create(
        <React.DebugTraceMode>
          <div />
        </React.DebugTraceMode>,
      );

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: immediate)',
      ]);
    });

    it('should not log anything for concurrent render without suspends or state updates', () => {
      ReactTestRenderer.create(<div />, {unstable_isConcurrent: true});

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: normal)',
      ]);

      expect(Scheduler).toFlushUntilNextPaint([]);

      expect(Scheduler).toHaveYielded([]);
    });

    it('should log sync render with suspense', () => {
      const fakeSuspensePromise = new Promise(() => {});
      function Example({}) {
        throw fakeSuspensePromise;
      }

      ReactTestRenderer.create(
        <React.DebugTraceMode>
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>
        </React.DebugTraceMode>,
      );

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: immediate)',
        'group: ⚛️ render (priority: immediate)',
        'log: ⚛️ Example suspended',
        'groupEnd: ⚛️ render (priority: immediate)',
      ]);
    });

    it('should log concurrent render with suspense', () => {
      const fakeSuspensePromise = new Promise(() => {});
      function Example({}) {
        throw fakeSuspensePromise;
      }

      ReactTestRenderer.create(
        <React.DebugTraceMode>
          <React.Suspense fallback={null}>
            <Example />
          </React.Suspense>
        </React.DebugTraceMode>,
        {unstable_isConcurrent: true},
      );

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: normal)',
      ]);

      expect(Scheduler).toFlushUntilNextPaint([
        'group: ⚛️ render (priority: normal)',
        'log: ⚛️ Example suspended',
        'groupEnd: ⚛️ render (priority: normal)',
      ]);
    });

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
        <React.DebugTraceMode>
          <Example />
        </React.DebugTraceMode>,
        {unstable_isConcurrent: true},
      );

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: normal)',
      ]);

      expect(Scheduler).toFlushUntilNextPaint([
        'group: ⚛️ commit (priority: normal)',
        'group: ⚛️ layout effects (priority: immediate)',
        'log: ⚛️ Example updated state (priority: immediate)',
        'groupEnd: ⚛️ layout effects (priority: immediate)',
        'groupEnd: ⚛️ commit (priority: normal)',
      ]);
    });

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
        <React.DebugTraceMode>
          <Example />
        </React.DebugTraceMode>,
        {unstable_isConcurrent: true},
      );

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: normal)',
      ]);

      expect(() => {
        expect(Scheduler).toFlushUntilNextPaint([
          'group: ⚛️ render (priority: normal)',
          'log: ⚛️ Example updated state (priority: normal)',
          'groupEnd: ⚛️ render (priority: normal)',
        ]);
      }).toErrorDev('Cannot update during an existing state transition');
    });

    it('should log cascading layout updates', () => {
      function Example({}) {
        const [didMount, setDidMount] = React.useState(false);
        React.useLayoutEffect(() => {
          setDidMount(true);
        }, []);
        return didMount;
      }

      ReactTestRenderer.create(
        <React.DebugTraceMode>
          <Example />
        </React.DebugTraceMode>,
        {unstable_isConcurrent: true},
      );

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: normal)',
      ]);

      expect(Scheduler).toFlushUntilNextPaint([
        'group: ⚛️ commit (priority: normal)',
        'group: ⚛️ layout effects (priority: immediate)',
        'log: ⚛️ Example updated state (priority: immediate)',
        'groupEnd: ⚛️ layout effects (priority: immediate)',
        'groupEnd: ⚛️ commit (priority: normal)',
      ]);
    });

    it('should log cascading passive updates', () => {
      function Example({}) {
        const [didMount, setDidMount] = React.useState(false);
        React.useEffect(() => {
          setDidMount(true);
        }, []);
        return didMount;
      }

      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
          <React.DebugTraceMode>
            <Example />
          </React.DebugTraceMode>,
          {unstable_isConcurrent: true},
        );
      });
      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: normal)',
        'group: ⚛️ passive effects (priority: normal)',
        'log: ⚛️ Example updated state (priority: normal)',
        'groupEnd: ⚛️ passive effects (priority: normal)',
      ]);
    });

    it('should log render phase updates', () => {
      function Example({}) {
        const [didRender, setDidRender] = React.useState(false);
        if (!didRender) {
          setDidRender(true);
        }
        return didRender;
      }

      ReactTestRenderer.act(() => {
        ReactTestRenderer.create(
          <React.DebugTraceMode>
            <Example />
          </React.DebugTraceMode>,
          {unstable_isConcurrent: true},
        );
      });
      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: normal)',
        'group: ⚛️ render (priority: normal)',
        'log: ⚛️ Example updated state (priority: normal)',
        'log: ⚛️ Example updated state (priority: normal)', // TODO: why?
        'groupEnd: ⚛️ render (priority: normal)',
      ]);
    });

    it('should log when user code logs', () => {
      function Example({}) {
        console.log('Hello from user code');
        return null;
      }

      ReactTestRenderer.create(
        <React.DebugTraceMode>
          <Example />
        </React.DebugTraceMode>,
        {unstable_isConcurrent: true},
      );

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: normal)',
      ]);

      expect(Scheduler).toFlushUntilNextPaint([
        'group: ⚛️ render (priority: normal)',
        'log: Hello from user code',
        'groupEnd: ⚛️ render (priority: normal)',
      ]);
    });

    it('should not log anything outside of a DebugTraceMode subtree', () => {
      function ExampleThatCascades({}) {
        const [didMount, setDidMount] = React.useState(false);
        React.useLayoutEffect(() => {
          setDidMount(true);
        }, []);
        return didMount;
      }

      const fakeSuspensePromise = new Promise(() => {});
      function ExampleThatSuspends({}) {
        throw fakeSuspensePromise;
      }

      function Example({}) {
        return null;
      }

      ReactTestRenderer.create(
        <React.Fragment>
          <ExampleThatCascades />
          <React.Suspense fallback={null}>
            <ExampleThatSuspends />
          </React.Suspense>
          <React.DebugTraceMode>
            <Example />
          </React.DebugTraceMode>
        </React.Fragment>,
      );

      expect(Scheduler).toHaveYielded([
        'log: ⚛️ render scheduled (priority: immediate)',
      ]);
    });
  }
});

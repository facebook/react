/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let ReactFeatureFlags;
let React;
let ReactNoop;
let Scheduler;
let Suspense;
let useState;
let useTransition;
let act;

describe('ReactTransition', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableSchedulerTracing = true;
    ReactFeatureFlags.flushSuspenseFallbacksInTests = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useState = React.useState;
    useTransition = React.useTransition;
    Suspense = React.Suspense;
    act = ReactNoop.act;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  function createAsyncText(text) {
    let resolved = false;
    let Component = function() {
      if (!resolved) {
        Scheduler.unstable_yieldValue('Suspend! [' + text + ']');
        throw promise;
      }
      return <Text text={text} />;
    };
    let promise = new Promise(resolve => {
      Component.resolve = function() {
        resolved = true;
        return resolve();
      };
    });
    return Component;
  }

  it.experimental(
    'isPending works even if called from outside an input event',
    async () => {
      const Async = createAsyncText('Async');
      let start;
      function App() {
        const [show, setShow] = useState(false);
        const [startTransition, isPending] = useTransition();
        start = () => startTransition(() => setShow(true));
        return (
          <Suspense fallback={<Text text="Loading..." />}>
            {isPending ? <Text text="Pending..." /> : null}
            {show ? <Async /> : <Text text="(empty)" />}
          </Suspense>
        );
      }

      const root = ReactNoop.createRoot();

      await act(async () => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['(empty)']);
      expect(root).toMatchRenderedOutput('(empty)');

      await act(async () => {
        start();

        expect(Scheduler).toFlushAndYield([
          // Render pending state
          'Pending...',
          '(empty)',
          // Try rendering transition
          'Suspend! [Async]',
          'Loading...',
        ]);

        expect(root).toMatchRenderedOutput('Pending...(empty)');

        await Async.resolve();
      });
      expect(Scheduler).toHaveYielded(['Async']);
      expect(root).toMatchRenderedOutput('Async');
    },
  );

  it.experimental(
    'nothing is scheduled if `startTransition` does not include any updates',
    async () => {
      let startTransition;
      function App() {
        const [_startTransition, isPending] = useTransition();
        startTransition = _startTransition;
        return <Text text={'Pending: ' + isPending} />;
      }

      const root = ReactNoop.createRoot();

      await act(async () => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['Pending: false']);
      expect(root).toMatchRenderedOutput('Pending: false');

      await act(async () => {
        startTransition(() => {
          // No-op
        });
      });
      // Nothing is scheduled
      expect(Scheduler).toHaveYielded([]);
      expect(root).toMatchRenderedOutput('Pending: false');
    },
  );

  it.experimental(
    'works if two transitions happen one right after the other',
    async () => {
      // Tests an implementation path where two transitions get batched into the
      // same render. This is an edge case in our current expiration times
      // implementation but will be the normal case if/when we replace expiration
      // times with a different model that puts all transitions into the same
      // batch by default.
      const CONFIG = {
        timeoutMs: 100000,
      };

      let setTab;
      let startTransition;
      function App() {
        const [tab, _setTab] = useState(1);
        const [_startTransition, isPending] = useTransition(CONFIG);
        startTransition = _startTransition;
        setTab = _setTab;
        return (
          <Text text={'Tab ' + tab + (isPending ? ' (pending...)' : '')} />
        );
      }

      const root = ReactNoop.createRoot();

      await act(async () => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['Tab 1']);
      expect(root).toMatchRenderedOutput('Tab 1');

      await act(async () => {
        startTransition(() => setTab(2));
      });
      expect(Scheduler).toHaveYielded(['Tab 1 (pending...)', 'Tab 2']);
      expect(root).toMatchRenderedOutput('Tab 2');

      // Because time has not advanced, this will fall into the same bucket
      // as the previous transition.
      await act(async () => {
        startTransition(() => setTab(3));
      });
      expect(Scheduler).toHaveYielded(['Tab 2 (pending...)', 'Tab 3']);
      expect(root).toMatchRenderedOutput('Tab 3');
    },
  );

  it.experimental(
    'when multiple transitions update the same queue, only the most recent one is considered pending',
    async () => {
      const CONFIG = {
        timeoutMs: 100000,
      };

      const Tab = React.forwardRef(({label, setTab}, ref) => {
        const [startTransition, isPending] = useTransition(CONFIG);

        React.useImperativeHandle(
          ref,
          () => ({
            go() {
              startTransition(() => setTab(label));
            },
          }),
          [label],
        );

        return (
          <Text text={'Tab ' + label + (isPending ? ' (pending...)' : '')} />
        );
      });

      const tabButtonA = React.createRef(null);
      const tabButtonB = React.createRef(null);
      const tabButtonC = React.createRef(null);

      const ContentA = createAsyncText('A');
      const ContentB = createAsyncText('B');
      const ContentC = createAsyncText('C');

      function App() {
        const [tab, setTab] = useState('A');

        let content;
        switch (tab) {
          case 'A':
            content = <ContentA />;
            break;
          case 'B':
            content = <ContentB />;
            break;
          case 'C':
            content = <ContentC />;
            break;
          default:
            content = <ContentA />;
            break;
        }

        return (
          <>
            <ul>
              <li>
                <Tab ref={tabButtonA} label="A" setTab={setTab} />
              </li>
              <li>
                <Tab ref={tabButtonB} label="B" setTab={setTab} />
              </li>
              <li>
                <Tab ref={tabButtonC} label="C" setTab={setTab} />
              </li>
            </ul>
            <Suspense fallback={<Text text="Loading..." />}>{content}</Suspense>
          </>
        );
      }

      // Initial render
      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(<App />);
        await ContentA.resolve();
      });
      expect(Scheduler).toHaveYielded(['Tab A', 'Tab B', 'Tab C', 'A']);
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C</li>
          </ul>
          A
        </>,
      );

      // Navigate to tab B
      await act(async () => {
        tabButtonB.current.go();
      });
      expect(Scheduler).toHaveYielded([
        'Tab B (pending...)',
        'Tab A',
        'Tab B',
        'Tab C',
        'Suspend! [B]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B (pending...)</li>
            <li>Tab C</li>
          </ul>
          A
        </>,
      );

      // Before B resolves, navigate to tab C. B should no longer be pending.
      await act(async () => {
        tabButtonC.current.go();
      });
      expect(Scheduler).toHaveYielded([
        // Turn `isPending` off for tab B, and on for tab C
        'Tab B',
        'Tab C (pending...)',
        // Try finishing the transition
        'Tab A',
        'Tab B',
        'Tab C',
        'Suspend! [C]',
        'Loading...',
      ]);
      // Tab B is no longer pending. Only C.
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C (pending...)</li>
          </ul>
          A
        </>,
      );

      // Finish loading C
      await act(async () => {
        ContentC.resolve();
      });
      expect(Scheduler).toHaveYielded(['Tab A', 'Tab B', 'Tab C', 'C']);
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C</li>
          </ul>
          C
        </>,
      );
    },
  );

  // Same as previous test, but for class update queue.
  it.experimental(
    'when multiple transitions update the same queue, only the most recent one is considered pending (classes)',
    async () => {
      const CONFIG = {
        timeoutMs: 100000,
      };

      const Tab = React.forwardRef(({label, setTab}, ref) => {
        const [startTransition, isPending] = useTransition(CONFIG);

        React.useImperativeHandle(
          ref,
          () => ({
            go() {
              startTransition(() => setTab(label));
            },
          }),
          [label],
        );

        return (
          <Text text={'Tab ' + label + (isPending ? ' (pending...)' : '')} />
        );
      });

      const tabButtonA = React.createRef(null);
      const tabButtonB = React.createRef(null);
      const tabButtonC = React.createRef(null);

      const ContentA = createAsyncText('A');
      const ContentB = createAsyncText('B');
      const ContentC = createAsyncText('C');

      class App extends React.Component {
        state = {tab: 'A'};
        setTab = tab => {
          this.setState({tab});
        };

        render() {
          let content;
          switch (this.state.tab) {
            case 'A':
              content = <ContentA />;
              break;
            case 'B':
              content = <ContentB />;
              break;
            case 'C':
              content = <ContentC />;
              break;
            default:
              content = <ContentA />;
              break;
          }

          return (
            <>
              <ul>
                <li>
                  <Tab ref={tabButtonA} label="A" setTab={this.setTab} />
                </li>
                <li>
                  <Tab ref={tabButtonB} label="B" setTab={this.setTab} />
                </li>
                <li>
                  <Tab ref={tabButtonC} label="C" setTab={this.setTab} />
                </li>
              </ul>
              <Suspense fallback={<Text text="Loading..." />}>
                {content}
              </Suspense>
            </>
          );
        }
      }

      // Initial render
      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(<App />);
        await ContentA.resolve();
      });
      expect(Scheduler).toHaveYielded(['Tab A', 'Tab B', 'Tab C', 'A']);
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C</li>
          </ul>
          A
        </>,
      );

      // Navigate to tab B
      await act(async () => {
        tabButtonB.current.go();
      });
      expect(Scheduler).toHaveYielded([
        'Tab B (pending...)',
        'Tab A',
        'Tab B',
        'Tab C',
        'Suspend! [B]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B (pending...)</li>
            <li>Tab C</li>
          </ul>
          A
        </>,
      );

      // Before B resolves, navigate to tab C. B should no longer be pending.
      await act(async () => {
        tabButtonC.current.go();
      });
      expect(Scheduler).toHaveYielded([
        // Turn `isPending` off for tab B, and on for tab C
        'Tab B',
        'Tab C (pending...)',
        // Try finishing the transition
        'Tab A',
        'Tab B',
        'Tab C',
        'Suspend! [C]',
        'Loading...',
      ]);
      // Tab B is no longer pending. Only C.
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C (pending...)</li>
          </ul>
          A
        </>,
      );

      // Finish loading C
      await act(async () => {
        ContentC.resolve();
      });
      expect(Scheduler).toHaveYielded(['Tab A', 'Tab B', 'Tab C', 'C']);
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C</li>
          </ul>
          C
        </>,
      );
    },
  );

  it.experimental(
    'when multiple transitions update the same queue, only the most recent ' +
      'one is allowed to finish (no intermediate states)',
    async () => {
      const CONFIG = {
        timeoutMs: 100000,
      };

      const Tab = React.forwardRef(({label, setTab}, ref) => {
        const [startTransition, isPending] = useTransition(CONFIG);

        React.useImperativeHandle(
          ref,
          () => ({
            go() {
              startTransition(() => setTab(label));
            },
          }),
          [label],
        );

        return (
          <Text text={'Tab ' + label + (isPending ? ' (pending...)' : '')} />
        );
      });

      const tabButtonA = React.createRef(null);
      const tabButtonB = React.createRef(null);
      const tabButtonC = React.createRef(null);

      const ContentA = createAsyncText('A');
      const ContentB = createAsyncText('B');
      const ContentC = createAsyncText('C');

      function App() {
        Scheduler.unstable_yieldValue('App');

        const [tab, setTab] = useState('A');

        let content;
        switch (tab) {
          case 'A':
            content = <ContentA />;
            break;
          case 'B':
            content = <ContentB />;
            break;
          case 'C':
            content = <ContentC />;
            break;
          default:
            content = <ContentA />;
            break;
        }

        return (
          <>
            <ul>
              <li>
                <Tab ref={tabButtonA} label="A" setTab={setTab} />
              </li>
              <li>
                <Tab ref={tabButtonB} label="B" setTab={setTab} />
              </li>
              <li>
                <Tab ref={tabButtonC} label="C" setTab={setTab} />
              </li>
            </ul>
            <Suspense fallback={<Text text="Loading..." />}>{content}</Suspense>
          </>
        );
      }

      // Initial render
      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(<App />);
        await ContentA.resolve();
      });
      expect(Scheduler).toHaveYielded(['App', 'Tab A', 'Tab B', 'Tab C', 'A']);
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C</li>
          </ul>
          A
        </>,
      );

      await act(async () => {
        // Navigate to tab B
        tabButtonB.current.go();
        expect(Scheduler).toFlushAndYield([
          // Turn on B's pending state
          'Tab B (pending...)',
          'App',
          'Tab A',
          'Tab B',
          'Tab C',
          'Suspend! [B]',
          'Loading...',
        ]);

        jest.advanceTimersByTime(2000);
        Scheduler.unstable_advanceTime(2000);

        // Navigate to tab C
        tabButtonC.current.go();
        expect(Scheduler).toFlushAndYield([
          // Turn off B's pending state, and turn on C's
          'Tab B',
          'Tab C (pending...)',
          // Partially render B
          'App',
          'Tab A',
          'Tab B',
          'Tab C',
          'Suspend! [C]',
          'Loading...',
        ]);

        // Finish loading B.
        await ContentB.resolve();
        // B is not able to finish because C is in the same batch.
        expect(Scheduler).toFlushAndYield([
          'App',
          'Tab A',
          'Tab B',
          'Tab C',
          'Suspend! [C]',
          'Loading...',
        ]);

        // Finish loading C.
        await ContentC.resolve();
        expect(Scheduler).toFlushAndYield([
          'App',
          'Tab A',
          'Tab B',
          'Tab C',
          'C',
        ]);
      });
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C</li>
          </ul>
          C
        </>,
      );
    },
  );

  // Same as previous test, but for class update queue.
  it.experimental(
    'when multiple transitions update the same queue, only the most recent ' +
      'one is allowed to finish (no intermediate states) (classes)',
    async () => {
      const CONFIG = {
        timeoutMs: 100000,
      };

      const Tab = React.forwardRef(({label, setTab}, ref) => {
        const [startTransition, isPending] = useTransition(CONFIG);

        React.useImperativeHandle(
          ref,
          () => ({
            go() {
              startTransition(() => setTab(label));
            },
          }),
          [label],
        );

        return (
          <Text text={'Tab ' + label + (isPending ? ' (pending...)' : '')} />
        );
      });

      const tabButtonA = React.createRef(null);
      const tabButtonB = React.createRef(null);
      const tabButtonC = React.createRef(null);

      const ContentA = createAsyncText('A');
      const ContentB = createAsyncText('B');
      const ContentC = createAsyncText('C');

      class App extends React.Component {
        state = {tab: 'A'};
        setTab = tab => this.setState({tab});
        render() {
          Scheduler.unstable_yieldValue('App');

          let content;
          switch (this.state.tab) {
            case 'A':
              content = <ContentA />;
              break;
            case 'B':
              content = <ContentB />;
              break;
            case 'C':
              content = <ContentC />;
              break;
            default:
              content = <ContentA />;
              break;
          }

          return (
            <>
              <ul>
                <li>
                  <Tab ref={tabButtonA} label="A" setTab={this.setTab} />
                </li>
                <li>
                  <Tab ref={tabButtonB} label="B" setTab={this.setTab} />
                </li>
                <li>
                  <Tab ref={tabButtonC} label="C" setTab={this.setTab} />
                </li>
              </ul>
              <Suspense fallback={<Text text="Loading..." />}>
                {content}
              </Suspense>
            </>
          );
        }
      }

      // Initial render
      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(<App />);
        await ContentA.resolve();
      });
      expect(Scheduler).toHaveYielded(['App', 'Tab A', 'Tab B', 'Tab C', 'A']);
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C</li>
          </ul>
          A
        </>,
      );

      await act(async () => {
        // Navigate to tab B
        tabButtonB.current.go();
        expect(Scheduler).toFlushAndYield([
          // Turn on B's pending state
          'Tab B (pending...)',
          'App',
          'Tab A',
          'Tab B',
          'Tab C',
          'Suspend! [B]',
          'Loading...',
        ]);

        jest.advanceTimersByTime(2000);
        Scheduler.unstable_advanceTime(2000);

        // Navigate to tab C
        tabButtonC.current.go();
        expect(Scheduler).toFlushAndYield([
          // Turn off B's pending state, and turn on C's
          'Tab B',
          'Tab C (pending...)',
          // Partially render B
          'App',
          'Tab A',
          'Tab B',
          'Tab C',
          'Suspend! [C]',
          'Loading...',
        ]);

        // Finish loading B.
        await ContentB.resolve();
        // B is not able to finish because C is in the same batch.
        expect(Scheduler).toFlushAndYield([
          'App',
          'Tab A',
          'Tab B',
          'Tab C',
          'Suspend! [C]',
          'Loading...',
        ]);

        // Finish loading C.
        await ContentC.resolve();
        expect(Scheduler).toFlushAndYield([
          'App',
          'Tab A',
          'Tab B',
          'Tab C',
          'C',
        ]);
      });
      expect(root).toMatchRenderedOutput(
        <>
          <ul>
            <li>Tab A</li>
            <li>Tab B</li>
            <li>Tab C</li>
          </ul>
          C
        </>,
      );
    },
  );
});

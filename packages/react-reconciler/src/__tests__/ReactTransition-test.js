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

let React;
let ReactNoop;
let Scheduler;
let Suspense;
let useState;
let useTransition;
let startTransition;
let act;
let getCacheForType;

let caches;
let seededCache;

describe('ReactTransition', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    useState = React.useState;
    useTransition = React.unstable_useTransition;
    Suspense = React.Suspense;
    startTransition = React.unstable_startTransition;
    getCacheForType = React.unstable_getCacheForType;
    act = ReactNoop.act;

    caches = [];
    seededCache = null;
  });

  function createTextCache() {
    if (seededCache !== null) {
      // Trick to seed a cache before it exists.
      // TODO: Need a built-in API to seed data before the initial render (i.e.
      // not a refresh because nothing has mounted yet).
      const cache = seededCache;
      seededCache = null;
      return cache;
    }

    const data = new Map();
    const version = caches.length + 1;
    const cache = {
      version,
      data,
      resolve(text) {
        const record = data.get(text);
        if (record === undefined) {
          const newRecord = {
            status: 'resolved',
            value: text,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          const thenable = record.value;
          record.status = 'resolved';
          record.value = text;
          thenable.pings.forEach(t => t());
        }
      },
      reject(text, error) {
        const record = data.get(text);
        if (record === undefined) {
          const newRecord = {
            status: 'rejected',
            value: error,
          };
          data.set(text, newRecord);
        } else if (record.status === 'pending') {
          const thenable = record.value;
          record.status = 'rejected';
          record.value = error;
          thenable.pings.forEach(t => t());
        }
      },
    };
    caches.push(cache);
    return cache;
  }

  function readText(text) {
    const textCache = getCacheForType(createTextCache);
    const record = textCache.data.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          Scheduler.unstable_yieldValue(`Error! [${text}]`);
          throw record.value;
        case 'resolved':
          return textCache.version;
      }
    } else {
      Scheduler.unstable_yieldValue(`Suspend! [${text}]`);

      const thenable = {
        pings: [],
        then(resolve) {
          if (newRecord.status === 'pending') {
            thenable.pings.push(resolve);
          } else {
            Promise.resolve().then(() => resolve(newRecord.value));
          }
        },
      };

      const newRecord = {
        status: 'pending',
        value: thenable,
      };
      textCache.data.set(text, newRecord);

      throw thenable;
    }
  }

  function Text({text}) {
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  function AsyncText({text}) {
    readText(text);
    Scheduler.unstable_yieldValue(text);
    return text;
  }

  function seedNextTextCache(text) {
    if (seededCache === null) {
      seededCache = createTextCache();
    }
    seededCache.resolve(text);
  }

  function resolveText(text) {
    if (caches.length === 0) {
      throw Error('Cache does not exist.');
    } else {
      // Resolve the most recently created cache. An older cache can by
      // resolved with `caches[index].resolve(text)`.
      caches[caches.length - 1].resolve(text);
    }
  }

  // @gate experimental
  // @gate enableCache
  test('isPending works even if called from outside an input event', async () => {
    let start;
    function App() {
      const [show, setShow] = useState(false);
      const [_start, isPending] = useTransition();
      start = () => _start(() => setShow(true));
      return (
        <Suspense fallback={<Text text="Loading..." />}>
          {isPending ? <Text text="Pending..." /> : null}
          {show ? <AsyncText text="Async" /> : <Text text="(empty)" />}
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
        'Pending...',
        '(empty)',
        'Suspend! [Async]',
        'Loading...',
      ]);

      expect(root).toMatchRenderedOutput('Pending...(empty)');

      await resolveText('Async');
    });
    expect(Scheduler).toHaveYielded(['Async']);
    expect(root).toMatchRenderedOutput('Async');
  });

  // @gate experimental
  // @gate enableCache
  test(
    'when multiple transitions update the same queue, only the most recent ' +
      'one is allowed to finish (no intermediate states)',
    async () => {
      let update;
      function App() {
        const [startContentChange, isContentPending] = useTransition();
        const [label, setLabel] = useState('A');
        const [contents, setContents] = useState('A');
        update = value => {
          ReactNoop.discreteUpdates(() => {
            setLabel(value);
            startContentChange(() => {
              setContents(value);
            });
          });
        };
        return (
          <>
            <Text
              text={
                label + ' label' + (isContentPending ? ' (loading...)' : '')
              }
            />
            <div>
              <Suspense fallback={<Text text="Loading..." />}>
                <AsyncText text={contents + ' content'} />
              </Suspense>
            </div>
          </>
        );
      }

      // Initial render
      const root = ReactNoop.createRoot();
      await act(async () => {
        seedNextTextCache('A content');
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['A label', 'A content']);
      expect(root).toMatchRenderedOutput(
        <>
          A label<div>A content</div>
        </>,
      );

      // Switch to B
      await act(async () => {
        update('B');
      });
      expect(Scheduler).toHaveYielded([
        // Commit pending state
        'B label (loading...)',
        'A content',

        // Attempt to render B, but it suspends
        'B label',
        'Suspend! [B content]',
        'Loading...',
      ]);
      // This is a refresh transition so it shouldn't show a fallback
      expect(root).toMatchRenderedOutput(
        <>
          B label (loading...)<div>A content</div>
        </>,
      );

      // Before B finishes loading, switch to C
      await act(async () => {
        update('C');
      });
      expect(Scheduler).toHaveYielded([
        // Commit pending state
        'C label (loading...)',
        'A content',

        // Attempt to render C, but it suspends
        'C label',
        'Suspend! [C content]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput(
        <>
          C label (loading...)<div>A content</div>
        </>,
      );

      // Finish loading B. But we're not allowed to render B because it's
      // entangled with C. So we're still pending.
      await act(async () => {
        resolveText('B content');
      });
      expect(Scheduler).toHaveYielded([
        // Attempt to render C, but it suspends
        'C label',
        'Suspend! [C content]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput(
        <>
          C label (loading...)<div>A content</div>
        </>,
      );

      // Now finish loading C. This is the terminal update, so it can finish.
      await act(async () => {
        resolveText('C content');
      });
      expect(Scheduler).toHaveYielded(['C label', 'C content']);
      expect(root).toMatchRenderedOutput(
        <>
          C label<div>C content</div>
        </>,
      );
    },
  );

  // Same as previous test, but for class update queue.
  // @gate experimental
  // @gate enableCache
  test(
    'when multiple transitions update the same queue, only the most recent ' +
      'one is allowed to finish (no intermediate states) (classes)',
    async () => {
      let update;
      class App extends React.Component {
        state = {
          label: 'A',
          contents: 'A',
        };
        render() {
          update = value => {
            ReactNoop.discreteUpdates(() => {
              this.setState({label: value});
              startTransition(() => {
                this.setState({contents: value});
              });
            });
          };
          const label = this.state.label;
          const contents = this.state.contents;
          const isContentPending = label !== contents;
          return (
            <>
              <Text
                text={
                  label + ' label' + (isContentPending ? ' (loading...)' : '')
                }
              />
              <div>
                <Suspense fallback={<Text text="Loading..." />}>
                  <AsyncText text={contents + ' content'} />
                </Suspense>
              </div>
            </>
          );
        }
      }

      // Initial render
      const root = ReactNoop.createRoot();
      await act(async () => {
        seedNextTextCache('A content');
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded(['A label', 'A content']);
      expect(root).toMatchRenderedOutput(
        <>
          A label<div>A content</div>
        </>,
      );

      // Switch to B
      await act(async () => {
        update('B');
      });
      expect(Scheduler).toHaveYielded([
        // Commit pending state
        'B label (loading...)',
        'A content',

        // Attempt to render B, but it suspends
        'B label',
        'Suspend! [B content]',
        'Loading...',
      ]);
      // This is a refresh transition so it shouldn't show a fallback
      expect(root).toMatchRenderedOutput(
        <>
          B label (loading...)<div>A content</div>
        </>,
      );

      // Before B finishes loading, switch to C
      await act(async () => {
        update('C');
      });
      expect(Scheduler).toHaveYielded([
        // Commit pending state
        'C label (loading...)',
        'A content',

        // Attempt to render C, but it suspends
        'C label',
        'Suspend! [C content]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput(
        <>
          C label (loading...)<div>A content</div>
        </>,
      );

      // Finish loading B. But we're not allowed to render B because it's
      // entangled with C. So we're still pending.
      await act(async () => {
        resolveText('B content');
      });
      expect(Scheduler).toHaveYielded([
        // Attempt to render C, but it suspends
        'C label',
        'Suspend! [C content]',
        'Loading...',
      ]);
      expect(root).toMatchRenderedOutput(
        <>
          C label (loading...)<div>A content</div>
        </>,
      );

      // Now finish loading C. This is the terminal update, so it can finish.
      await act(async () => {
        resolveText('C content');
      });
      expect(Scheduler).toHaveYielded(['C label', 'C content']);
      expect(root).toMatchRenderedOutput(
        <>
          C label<div>C content</div>
        </>,
      );
    },
  );

  // @gate experimental
  // @gate enableCache
  test(
    'when multiple transitions update overlapping queues, all the transitions ' +
      'across all the queues are entangled',
    async () => {
      let setShowA;
      let setShowB;
      let setShowC;
      function App() {
        const [showA, _setShowA] = useState(false);
        const [showB, _setShowB] = useState(false);
        const [showC, _setShowC] = useState(false);
        setShowA = _setShowA;
        setShowB = _setShowB;
        setShowC = _setShowC;

        // Only one of these children should be visible at a time. Except
        // instead of being modeled as a single state, it's three separate
        // states that are updated simultaneously. This may seem a bit
        // contrived, but it's more common than you might think. Usually via
        // a framework or indirection. For example, consider a tooltip manager
        // that only shows a single tooltip at a time. Or a router that
        // highlights links to the active route.
        return (
          <>
            <Suspense fallback={<Text text="Loading..." />}>
              {showA ? <AsyncText text="A" /> : null}
              {showB ? <AsyncText text="B" /> : null}
              {showC ? <AsyncText text="C" /> : null}
            </Suspense>
          </>
        );
      }

      // Initial render. Start with all children hidden.
      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(<App />);
      });
      expect(Scheduler).toHaveYielded([]);
      expect(root).toMatchRenderedOutput(null);

      // Switch to A.
      await act(async () => {
        startTransition(() => {
          setShowA(true);
        });
      });
      expect(Scheduler).toHaveYielded(['Suspend! [A]', 'Loading...']);
      expect(root).toMatchRenderedOutput(null);

      // Before A loads, switch to B. This should entangle A with B.
      await act(async () => {
        startTransition(() => {
          setShowA(false);
          setShowB(true);
        });
      });
      expect(Scheduler).toHaveYielded(['Suspend! [B]', 'Loading...']);
      expect(root).toMatchRenderedOutput(null);

      // Before A or B loads, switch to C. This should entangle C with B, and
      // transitively entangle C with A.
      await act(async () => {
        startTransition(() => {
          setShowB(false);
          setShowC(true);
        });
      });
      expect(Scheduler).toHaveYielded(['Suspend! [C]', 'Loading...']);
      expect(root).toMatchRenderedOutput(null);

      // Now the data starts resolving out of order.

      // First resolve B. This will attempt to render C, since everything is
      // entangled.
      await act(async () => {
        startTransition(() => {
          resolveText('B');
        });
      });
      expect(Scheduler).toHaveYielded(['Suspend! [C]', 'Loading...']);
      expect(root).toMatchRenderedOutput(null);

      // Now resolve A. Again, this will attempt to render C, since everything
      // is entangled.
      await act(async () => {
        startTransition(() => {
          resolveText('A');
        });
      });
      expect(Scheduler).toHaveYielded(['Suspend! [C]', 'Loading...']);
      expect(root).toMatchRenderedOutput(null);

      // Finally, resolve C. This time we can finish.
      await act(async () => {
        startTransition(() => {
          resolveText('C');
        });
      });
      expect(Scheduler).toHaveYielded(['C']);
      expect(root).toMatchRenderedOutput('C');
    },
  );
});

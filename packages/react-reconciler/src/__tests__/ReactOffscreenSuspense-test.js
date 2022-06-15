let React;
let ReactNoop;
let Scheduler;
let act;
let Offscreen;
let Suspense;
let useState;
let useEffect;
let textCache;

describe('ReactOffscreen', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    act = require('jest-react').act;
    Offscreen = React.unstable_Offscreen;
    Suspense = React.Suspense;
    useState = React.useState;
    useEffect = React.useEffect;

    textCache = new Map();
  });

  function resolveText(text) {
    const record = textCache.get(text);
    if (record === undefined) {
      const newRecord = {
        status: 'resolved',
        value: text,
      };
      textCache.set(text, newRecord);
    } else if (record.status === 'pending') {
      const thenable = record.value;
      record.status = 'resolved';
      record.value = text;
      thenable.pings.forEach(t => t());
    }
  }

  function readText(text) {
    const record = textCache.get(text);
    if (record !== undefined) {
      switch (record.status) {
        case 'pending':
          Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
          throw record.value;
        case 'rejected':
          throw record.value;
        case 'resolved':
          return record.value;
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
      textCache.set(text, newRecord);

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

  // Only works in new reconciler
  // @gate variant
  test('detect updates to a hidden tree during a concurrent event', async () => {
    // This is a pretty complex test case. It relates to how we detect if an
    // update is made to a hidden tree: when scheduling the update, we walk up
    // the fiber return path to see if any of the parents is a hidden Offscreen
    // component. This doesn't work if there's already a render in progress,
    // because the tree might be about to flip to hidden. To avoid a data race,
    // queue updates atomically: wait to queue the update until after the
    // current render has finished.

    let setInner;
    function Child({outer}) {
      const [inner, _setInner] = useState(0);
      setInner = _setInner;

      useEffect(() => {
        // Inner and outer values are always updated simultaneously, so they
        // should always be consistent.
        if (inner !== outer) {
          Scheduler.unstable_yieldValue(
            'Tearing! Inner and outer are inconsistent!',
          );
        } else {
          Scheduler.unstable_yieldValue('Inner and outer are consistent');
        }
      }, [inner, outer]);

      return <Text text={'Inner: ' + inner} />;
    }

    let setOuter;
    function App({show}) {
      const [outer, _setOuter] = useState(0);
      setOuter = _setOuter;
      return (
        <>
          <span>
            <Text text={'Outer: ' + outer} />
          </span>
          <Offscreen mode={show ? 'visible' : 'hidden'}>
            <span>
              <Child outer={outer} />
            </span>
          </Offscreen>
          <Suspense fallback={<Text text="Loading..." />}>
            <span>
              <AsyncText text={'Async: ' + outer} />
            </span>
          </Suspense>
        </>
      );
    }

    // Render a hidden tree
    const root = ReactNoop.createRoot();
    resolveText('Async: 0');
    await act(async () => {
      root.render(<App show={true} />);
    });
    expect(Scheduler).toHaveYielded([
      'Outer: 0',
      'Inner: 0',
      'Async: 0',
      'Inner and outer are consistent',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Outer: 0</span>
        <span>Inner: 0</span>
        <span>Async: 0</span>
      </>,
    );

    await act(async () => {
      // Update a value both inside and outside the hidden tree. These values
      // must always be consistent.
      setOuter(1);
      setInner(1);
      // In the same render, also hide the offscreen tree.
      root.render(<App show={false} />);

      expect(Scheduler).toFlushAndYieldThrough([
        // The outer update will commit, but the inner update is deferred until
        // a later render.
        'Outer: 1',

        // Something suspended. This means we won't commit immediately; there
        // will be an async gap between render and commit. In this test, we will
        // use this property to schedule a concurrent update. The fact that
        // we're using Suspense to schedule a concurrent update is not directly
        // relevant to the test — we could also use time slicing, but I've
        // chosen to use Suspense the because implementation details of time
        // slicing are more volatile.
        'Suspend! [Async: 1]',

        'Loading...',
      ]);
      // Assert that we haven't committed quite yet
      expect(root).toMatchRenderedOutput(
        <>
          <span>Outer: 0</span>
          <span>Inner: 0</span>
          <span>Async: 0</span>
        </>,
      );

      // Before the tree commits, schedule a concurrent event. The inner update
      // is to a tree that's just about to be hidden.
      setOuter(2);
      setInner(2);

      // Commit the previous render.
      jest.runAllTimers();
      expect(root).toMatchRenderedOutput(
        <>
          <span>Outer: 1</span>
          <span hidden={true}>Inner: 0</span>
          <span hidden={true}>Async: 0</span>
          Loading...
        </>,
      );

      // Now reveal the hidden tree at high priority.
      ReactNoop.flushSync(() => {
        root.render(<App show={true} />);
      });
      expect(Scheduler).toHaveYielded([
        'Outer: 1',

        // There are two pending updates on Inner, but only the first one
        // is processed, even though they share the same lane. If the second
        // update were erroneously processed, then Inner would be inconsistent
        // with Outer.
        'Inner: 1',

        'Suspend! [Async: 1]',
        'Loading...',
        'Inner and outer are consistent',
      ]);
    });
    expect(Scheduler).toHaveYielded([
      'Outer: 2',
      'Inner: 2',
      'Suspend! [Async: 2]',
      'Loading...',
      'Inner and outer are consistent',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <span>Outer: 2</span>
        <span>Inner: 2</span>
        <span hidden={true}>Async: 0</span>
        Loading...
      </>,
    );
  });
});

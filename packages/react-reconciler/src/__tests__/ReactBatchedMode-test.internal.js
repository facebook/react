let React;
let ReactFeatureFlags;
let ReactNoop;
let act;
let Scheduler;
let ReactCache;
let Suspense;
let TextResource;

describe('ReactBatchedMode', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    act = ReactNoop.act;
    Scheduler = require('scheduler');
    ReactCache = require('react-cache');
    Suspense = React.Suspense;

    TextResource = ReactCache.unstable_createResource(([text, ms = 0]) => {
      return new Promise((resolve, reject) =>
        setTimeout(() => {
          Scheduler.yieldValue(`Promise resolved [${text}]`);
          resolve(text);
        }, ms),
      );
    }, ([text, ms]) => text);
  });

  function Text(props) {
    Scheduler.yieldValue(props.text);
    return props.text;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      TextResource.read([props.text, props.ms]);
      Scheduler.yieldValue(text);
      return props.text;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        Scheduler.yieldValue(`Suspend! [${text}]`);
      } else {
        Scheduler.yieldValue(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  it('updates flush without yielding in the next event', () => {
    const root = ReactNoop.createSyncRoot();

    root.render(
      <React.Fragment>
        <Text text="A" />
        <Text text="B" />
        <Text text="C" />
      </React.Fragment>,
    );

    // Nothing should have rendered yet
    expect(root).toMatchRenderedOutput(null);

    // Everything should render immediately in the next event
    expect(Scheduler).toFlushExpired(['A', 'B', 'C']);
    expect(root).toMatchRenderedOutput('ABC');
  });

  it('layout updates flush synchronously in same event', () => {
    const {useLayoutEffect} = React;

    function App() {
      useLayoutEffect(() => {
        Scheduler.yieldValue('Layout effect');
      });
      return <Text text="Hi" />;
    }

    const root = ReactNoop.createSyncRoot();
    root.render(<App />);
    expect(root).toMatchRenderedOutput(null);

    expect(Scheduler).toFlushExpired(['Hi', 'Layout effect']);
    expect(root).toMatchRenderedOutput('Hi');
  });

  it('uses proper Suspense semantics, not legacy ones', async () => {
    const root = ReactNoop.createSyncRoot();
    root.render(
      <Suspense fallback={<Text text="Loading..." />}>
        <span>
          <Text text="A" />
        </span>
        <span>
          <AsyncText text="B" />
        </span>
        <span>
          <Text text="C" />
        </span>
      </Suspense>,
    );

    expect(Scheduler).toFlushExpired(['A', 'Suspend! [B]', 'C', 'Loading...']);
    // In Legacy Mode, A and B would mount in a hidden primary tree. In Batched
    // and Concurrent Mode, nothing in the primary tree should mount. But the
    // fallback should mount immediately.
    expect(root).toMatchRenderedOutput('Loading...');

    await jest.advanceTimersByTime(1000);
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(Scheduler).toFlushExpired(['A', 'B', 'C']);
    expect(root).toMatchRenderedOutput(
      <React.Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </React.Fragment>,
    );
  });

  it('flushSync does not flush batched work', () => {
    const {useState, forwardRef, useImperativeHandle} = React;
    const root = ReactNoop.createSyncRoot();

    const Foo = forwardRef(({label}, ref) => {
      const [step, setStep] = useState(0);
      useImperativeHandle(ref, () => ({setStep}));
      return <Text text={label + step} />;
    });

    const foo1 = React.createRef(null);
    const foo2 = React.createRef(null);
    root.render(
      <React.Fragment>
        <Foo label="A" ref={foo1} />
        <Foo label="B" ref={foo2} />
      </React.Fragment>,
    );

    // Mount
    expect(Scheduler).toFlushExpired(['A0', 'B0']);
    expect(root).toMatchRenderedOutput('A0B0');

    // Schedule a batched update to the first sibling
    act(() => foo1.current.setStep(1));

    // Before it flushes, update the second sibling inside flushSync
    act(() =>
      ReactNoop.flushSync(() => {
        foo2.current.setStep(1);
      }),
    );

    // Only the second update should have flushed synchronously
    expect(Scheduler).toHaveYielded(['B1']);
    expect(root).toMatchRenderedOutput('A0B1');

    // Now flush the first update
    expect(Scheduler).toFlushExpired(['A1']);
    expect(root).toMatchRenderedOutput('A1B1');
  });
});

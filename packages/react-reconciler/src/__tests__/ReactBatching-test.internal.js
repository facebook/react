let React;
let ReactFeatureFlags;
let ReactNoop;
let Scheduler;
let ReactCache;
let Suspense;
let TextResource;

describe('ReactBlockingMode', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');

    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    ReactCache = require('react-cache');
    Suspense = React.Suspense;

    TextResource = ReactCache.unstable_createResource(
      ([text, ms = 0]) => {
        return new Promise((resolve, reject) =>
          setTimeout(() => {
            Scheduler.unstable_yieldValue(`Promise resolved [${text}]`);
            resolve(text);
          }, ms),
        );
      },
      ([text, ms]) => text,
    );
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return props.text;
  }

  function AsyncText(props) {
    const text = props.text;
    try {
      TextResource.read([props.text, props.ms]);
      Scheduler.unstable_yieldValue(text);
      return props.text;
    } catch (promise) {
      if (typeof promise.then === 'function') {
        Scheduler.unstable_yieldValue(`Suspend! [${text}]`);
      } else {
        Scheduler.unstable_yieldValue(`Error! [${text}]`);
      }
      throw promise;
    }
  }

  it('updates flush without yielding in the next event', () => {
    const root = ReactNoop.createRoot();

    root.render(
      <>
        <Text text="A" />
        <Text text="B" />
        <Text text="C" />
      </>,
    );

    // Nothing should have rendered yet
    expect(root).toMatchRenderedOutput(null);

    // Everything should render immediately in the next event
    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);
    expect(root).toMatchRenderedOutput('ABC');
  });

  it('layout updates flush synchronously in same event', () => {
    const {useLayoutEffect} = React;

    function App() {
      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Layout effect');
      });
      return <Text text="Hi" />;
    }

    const root = ReactNoop.createRoot();
    root.render(<App />);
    expect(root).toMatchRenderedOutput(null);
    expect(Scheduler).toHaveYielded([]);

    expect(Scheduler).toFlushAndYield(['Hi', 'Layout effect']);
    expect(root).toMatchRenderedOutput('Hi');
  });

  it('uses proper Suspense semantics, not legacy ones', async () => {
    const root = ReactNoop.createRoot();
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

    expect(Scheduler).toFlushAndYield(['A', 'Suspend! [B]', 'C', 'Loading...']);
    // In Legacy Mode, A and B would mount in a hidden primary tree. In
    // Concurrent Mode, nothing in the primary tree should mount. But the
    // fallback should mount immediately.
    expect(root).toMatchRenderedOutput('Loading...');

    await jest.advanceTimersByTime(1000);
    expect(Scheduler).toHaveYielded(['Promise resolved [B]']);
    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);
    expect(root).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
    );
  });

  it('flushSync does not flush batched work', () => {
    const {useState, forwardRef, useImperativeHandle} = React;
    const root = ReactNoop.createRoot();

    const Foo = forwardRef(({label}, ref) => {
      const [step, setStep] = useState(0);
      useImperativeHandle(ref, () => ({setStep}));
      return <Text text={label + step} />;
    });

    const foo1 = React.createRef(null);
    const foo2 = React.createRef(null);
    root.render(
      <>
        <Foo label="A" ref={foo1} />
        <Foo label="B" ref={foo2} />
      </>,
    );

    // Mount
    expect(Scheduler).toFlushAndYield(['A0', 'B0']);
    expect(root).toMatchRenderedOutput('A0B0');

    // Schedule a batched update to the first sibling
    ReactNoop.batchedUpdates(() => foo1.current.setStep(1));

    // Before it flushes, update the second sibling inside flushSync
    ReactNoop.batchedUpdates(() =>
      ReactNoop.flushSync(() => {
        foo2.current.setStep(1);
      }),
    );

    // Only the second update should have flushed synchronously
    expect(Scheduler).toHaveYielded(['B1']);
    expect(root).toMatchRenderedOutput('A0B1');

    // Now flush the first update
    expect(Scheduler).toFlushAndYield(['A1']);
    expect(root).toMatchRenderedOutput('A1B1');
  });
});

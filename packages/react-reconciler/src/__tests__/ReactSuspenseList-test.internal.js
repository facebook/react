let React;
let ReactFeatureFlags;
let Fragment;
let ReactNoop;
let Scheduler;
let Suspense;
let SuspenseList;

describe('ReactSuspenseList', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    Fragment = React.Fragment;
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
    SuspenseList = React.unstable_SuspenseList;
  });

  function Text(props) {
    Scheduler.yieldValue(props.text);
    return <span>{props.text}</span>;
  }

  function createAsyncText(text) {
    let resolved = false;
    let Component = function() {
      if (!resolved) {
        Scheduler.yieldValue('Suspend! [' + text + ']');
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

  it('warns if an unsupported revealOrder option is used', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="something">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.flushAll()).toWarnDev([
      'Warning: "something" is not a supported revealOrder on ' +
        '<SuspenseList />. Did you mean "together"?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('shows content independently by default', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList>
          <Suspense fallback={<Text text="Loading A" />}>
            <A />
          </Suspense>
          <Suspense fallback={<Text text="Loading B" />}>
            <B />
          </Suspense>
          <Suspense fallback={<Text text="Loading C" />}>
            <C />
          </Suspense>
        </SuspenseList>
      );
    }

    await A.resolve();

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Suspend! [C]',
      'Loading C',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>Loading B</span>
        <span>C</span>
      </Fragment>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });

  it('shows content independently in legacy mode regardless of option', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="together">
          <Suspense fallback={<Text text="Loading A" />}>
            <A />
          </Suspense>
          <Suspense fallback={<Text text="Loading B" />}>
            <B />
          </Suspense>
          <Suspense fallback={<Text text="Loading C" />}>
            <C />
          </Suspense>
        </SuspenseList>
      );
    }

    await A.resolve();

    ReactNoop.renderLegacySyncRoot(<Foo />);

    expect(Scheduler).toHaveYielded([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Suspend! [C]',
      'Loading C',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>Loading B</span>
        <span>C</span>
      </Fragment>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });

  it('displays all "together"', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="together">
          <Suspense fallback={<Text text="Loading A" />}>
            <A />
          </Suspense>
          <Suspense fallback={<Text text="Loading B" />}>
            <B />
          </Suspense>
          <Suspense fallback={<Text text="Loading C" />}>
            <C />
          </Suspense>
        </SuspenseList>
      );
    }

    await A.resolve();

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Suspend! [C]',
      'Loading C',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'Suspend! [C]']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });

  it('displays all "together" even when nested as siblings', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="together">
          <div>
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
          </div>
          <div>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </div>
        </SuspenseList>
      );
    }

    await A.resolve();

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Suspend! [C]',
      'Loading C',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <div>
          <span>Loading A</span>
          <span>Loading B</span>
        </div>
        <div>
          <span>Loading C</span>
        </div>
      </Fragment>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'Suspend! [C]']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <div>
          <span>Loading A</span>
          <span>Loading B</span>
        </div>
        <div>
          <span>Loading C</span>
        </div>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <div>
          <span>A</span>
          <span>B</span>
        </div>
        <div>
          <span>C</span>
        </div>
      </Fragment>,
    );
  });

  it('displays all "together" in nested SuspenseLists', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="together">
          <Suspense fallback={<Text text="Loading A" />}>
            <A />
          </Suspense>
          <SuspenseList revealOrder="together">
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </SuspenseList>
      );
    }

    await A.resolve();
    await B.resolve();

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'B',
      'Suspend! [C]',
      'Loading C',
      'Loading B',
      'Loading C',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });

  it('displays all "together" in nested SuspenseLists where the inner is default', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="together">
          <Suspense fallback={<Text text="Loading A" />}>
            <A />
          </Suspense>
          <SuspenseList>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          </SuspenseList>
        </SuspenseList>
      );
    }

    await A.resolve();
    await B.resolve();

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'B',
      'Suspend! [C]',
      'Loading C',
      'Loading A',
      'Loading B',
      'Loading C',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });

  it('avoided boundaries can be coordinate with SuspenseList', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo({showMore}) {
      return (
        <Suspense fallback={<Text text="Loading" />}>
          <SuspenseList revealOrder="together">
            <Suspense
              unstable_avoidThisFallback={true}
              fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
            {showMore ? (
              <Fragment>
                <Suspense
                  unstable_avoidThisFallback={true}
                  fallback={<Text text="Loading B" />}>
                  <B />
                </Suspense>
                <Suspense
                  unstable_avoidThisFallback={true}
                  fallback={<Text text="Loading C" />}>
                  <C />
                </Suspense>
              </Fragment>
            ) : null}
          </SuspenseList>
        </Suspense>
      );
    }

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading']);

    expect(ReactNoop).toMatchRenderedOutput(<span>Loading</span>);

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A']);

    expect(ReactNoop).toMatchRenderedOutput(<span>A</span>);

    // Let's do an update that should consult the avoided boundaries.
    ReactNoop.render(<Foo showMore={true} />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Suspend! [C]',
      'Loading C',
    ]);

    // This will suspend, since the boundaries are avoided. Give them
    // time to display their loading states.
    jest.advanceTimersByTime(500);

    // A is already showing content so it doesn't turn into a fallback.
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B']);

    // Even though we could now show B, we're still waiting on C.
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });
});

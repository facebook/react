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

  it('warns if an unsupported displayOrder option is used', () => {
    function Foo() {
      return (
        <SuspenseList displayOrder="something">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.flushAll()).toWarnDev([
      'Warning: "something" is not a supported displayOrder on ' +
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

  it('displays all "together"', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList displayOrder="together">
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
});

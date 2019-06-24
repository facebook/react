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
        '<SuspenseList />. Did you mean "together", "forwards" or "backwards"?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('warns if a upper case revealOrder option is used', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="TOGETHER">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.flushAll()).toWarnDev([
      'Warning: "TOGETHER" is not a valid value for revealOrder on ' +
        '<SuspenseList />. Use lowercase "together" instead.' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('warns if a misspelled revealOrder option is used', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="forward">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.flushAll()).toWarnDev([
      'Warning: "forward" is not a valid value for revealOrder on ' +
        '<SuspenseList />. React uses the -s suffix in the spelling. ' +
        'Use "forwards" instead.' +
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

  it('displays each items in "forwards" order', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="forwards">
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

    await C.resolve();

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
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

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'Suspend! [B]']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });

  it('displays each items in "backwards" order', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="backwards">
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
      'Suspend! [C]',
      'Loading C',
      'Loading B',
      'Loading A',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C', 'Suspend! [B]']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>C</span>
      </Fragment>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'A']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });

  it('displays added row at the top "together" and the bottom in "forwards" order', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');
    let D = createAsyncText('D');
    let E = createAsyncText('E');
    let F = createAsyncText('F');

    function Foo({items}) {
      return (
        <SuspenseList revealOrder="forwards">
          {items.map(([key, Component]) => (
            <Suspense key={key} fallback={<Text text={'Loading ' + key} />}>
              <Component />
            </Suspense>
          ))}
        </SuspenseList>
      );
    }

    await B.resolve();
    await D.resolve();

    ReactNoop.render(<Foo items={[['B', B], ['D', D]]} />);

    expect(Scheduler).toFlushAndYield(['B', 'D']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>B</span>
        <span>D</span>
      </Fragment>,
    );

    // Insert items in the beginning, middle and end.
    ReactNoop.render(
      <Foo
        items={[['A', A], ['B', B], ['C', C], ['D', D], ['E', E], ['F', F]]}
      />,
    );

    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      'Loading A',
      'B',
      'Suspend! [C]',
      'Loading C',
      'D',
      'Suspend! [E]',
      'Loading E',
      'Loading F',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>Loading A</span>
        <span>B</span>
        <span>Loading C</span>
        <span>D</span>
        <span>Loading E</span>
        <span>Loading F</span>
      </Fragment>,
    );

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'Suspend! [C]']);

    // Even though we could show A, it is still in a fallback state because
    // C is not yet resolved. We need to resolve everything in the head first.
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>Loading A</span>
        <span>B</span>
        <span>Loading C</span>
        <span>D</span>
        <span>Loading E</span>
        <span>Loading F</span>
      </Fragment>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'C', 'Suspend! [E]']);

    // We can now resolve the full head.
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>Loading E</span>
        <span>Loading F</span>
      </Fragment>,
    );

    await E.resolve();

    expect(Scheduler).toFlushAndYield(['E', 'Suspend! [F]']);

    // In the tail we can resolve one-by-one.
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>Loading F</span>
      </Fragment>,
    );

    await F.resolve();

    // We can also delete some items.
    ReactNoop.render(<Foo items={[['D', D], ['E', E], ['F', F]]} />);

    expect(Scheduler).toFlushAndYield(['D', 'E', 'F']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </Fragment>,
    );
  });

  it('displays added row at the top "together" and the bottom in "forwards" order', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let D = createAsyncText('D');
    let F = createAsyncText('F');

    function createSyncText(text) {
      return function() {
        return <Text text={text} />;
      };
    }

    let As = createSyncText('A');
    let Bs = createSyncText('B');
    let Cs = createSyncText('C');
    let Ds = createSyncText('D');
    let Es = createSyncText('E');
    let Fs = createSyncText('F');

    function Foo({items}) {
      return (
        <SuspenseList revealOrder="backwards">
          {items.map(([key, Component]) => (
            <Suspense key={key} fallback={<Text text={'Loading ' + key} />}>
              <Component />
            </Suspense>
          ))}
        </SuspenseList>
      );
    }

    // The first pass doesn't suspend.
    ReactNoop.render(
      <Foo
        items={[
          ['A', As],
          ['B', Bs],
          ['C', Cs],
          ['D', Ds],
          ['E', Es],
          ['F', Fs],
        ]}
      />,
    );
    expect(Scheduler).toFlushAndYield(['F', 'E', 'D', 'C', 'B', 'A']);
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </Fragment>,
    );

    // Update items in the beginning, middle and end to start suspending.
    ReactNoop.render(
      <Foo
        items={[['A', A], ['B', B], ['C', Cs], ['D', D], ['E', Es], ['F', F]]}
      />,
    );

    expect(Scheduler).toFlushAndYield([
      'Suspend! [A]',
      'Loading A',
      'Suspend! [B]',
      'Loading B',
      'C',
      'Suspend! [D]',
      'Loading D',
      'E',
      'Suspend! [F]',
      'Loading F',
    ]);

    // This will suspend, since the boundaries are avoided. Give them
    // time to display their loading states.
    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span hidden={true}>A</span>
        <span>Loading A</span>
        <span hidden={true}>B</span>
        <span>Loading B</span>
        <span>C</span>
        <span hidden={true}>D</span>
        <span>Loading D</span>
        <span>E</span>
        <span hidden={true}>F</span>
        <span>Loading F</span>
      </Fragment>,
    );

    await F.resolve();

    expect(Scheduler).toFlushAndYield(['F']);

    // Even though we could show F, it is still in a fallback state because
    // E is not yet resolved. We need to resolve everything in the head first.
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span hidden={true}>A</span>
        <span>Loading A</span>
        <span hidden={true}>B</span>
        <span>Loading B</span>
        <span>C</span>
        <span hidden={true}>D</span>
        <span>Loading D</span>
        <span>E</span>
        <span hidden={true}>F</span>
        <span>Loading F</span>
      </Fragment>,
    );

    await D.resolve();

    expect(Scheduler).toFlushAndYield(['D', 'F', 'Suspend! [B]']);

    // We can now resolve the full head.
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span hidden={true}>A</span>
        <span>Loading A</span>
        <span hidden={true}>B</span>
        <span>Loading B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </Fragment>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'Suspend! [A]']);

    // In the tail we can resolve one-by-one.
    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span hidden={true}>A</span>
        <span>Loading A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </Fragment>,
    );

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A']);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </Fragment>,
    );
  });

  it('switches to rendering fallbacks if the tail takes long CPU time', async () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="forwards">
          <Suspense fallback={<Text text="Loading A" />}>
            <Text text="A" />
          </Suspense>
          <Suspense fallback={<Text text="Loading B" />}>
            <Text text="B" />
          </Suspense>
          <Suspense fallback={<Text text="Loading C" />}>
            <Text text="C" />
          </Suspense>
        </SuspenseList>
      );
    }

    // This render is only CPU bound. Nothing suspends.
    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYieldThrough(['A']);

    Scheduler.advanceTime(300);
    jest.advanceTimersByTime(300);

    expect(Scheduler).toFlushAndYieldThrough(['B']);

    Scheduler.advanceTime(300);
    jest.advanceTimersByTime(300);

    // We've still not been able to show anything on the screen even though
    // we have two items ready.
    expect(ReactNoop).toMatchRenderedOutput(null);

    // Time has now elapsed for so long that we're just going to give up
    // rendering the rest of the content. So that we can at least show
    // something.
    expect(Scheduler).toFlushAndYieldThrough([
      'Loading C',
      'C', // I'll flush through into the next render so that the first commits.
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>Loading C</span>
      </Fragment>,
    );

    // Then we do a second pass to commit the last item.
    expect(Scheduler).toFlushAndYield([]);

    expect(ReactNoop).toMatchRenderedOutput(
      <Fragment>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </Fragment>,
    );
  });
});

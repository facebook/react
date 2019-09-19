let React;
let ReactFeatureFlags;
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
    ReactFeatureFlags.enableSuspenseServerRenderer = true;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
    SuspenseList = React.unstable_SuspenseList;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span>{props.text}</span>;
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

  it('warns if an unsupported revealOrder option is used', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="something">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
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

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
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

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
      'Warning: "forward" is not a valid value for revealOrder on ' +
        '<SuspenseList />. React uses the -s suffix in the spelling. ' +
        'Use "forwards" instead.' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('warns if a single element is passed to a "forwards" list', () => {
    function Foo({children}) {
      return <SuspenseList revealOrder="forwards">{children}</SuspenseList>;
    }

    ReactNoop.render(<Foo />);
    // No warning
    Scheduler.unstable_flushAll();

    ReactNoop.render(<Foo>{null}</Foo>);
    // No warning
    Scheduler.unstable_flushAll();

    ReactNoop.render(<Foo>{false}</Foo>);
    // No warning
    Scheduler.unstable_flushAll();

    ReactNoop.render(
      <Foo>
        <Suspense fallback="Loading">Child</Suspense>
      </Foo>,
    );

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
      'Warning: A single row was passed to a <SuspenseList revealOrder="forwards" />. ' +
        'This is not useful since it needs multiple rows. ' +
        'Did you mean to pass multiple children or an array?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('warns if a single fragment is passed to a "backwards" list', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="backwards">
          <>{[]}</>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
      'Warning: A single row was passed to a <SuspenseList revealOrder="backwards" />. ' +
        'This is not useful since it needs multiple rows. ' +
        'Did you mean to pass multiple children or an array?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('warns if a nested array is passed to a "forwards" list', () => {
    function Foo({items}) {
      return (
        <SuspenseList revealOrder="forwards">
          {items.map(name => (
            <Suspense key={name} fallback="Loading">
              {name}
            </Suspense>
          ))}
          <div>Tail</div>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo items={['A', 'B']} />);

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
      'Warning: A nested array was passed to row #0 in <SuspenseList />. ' +
        'Wrap it in an additional SuspenseList to configure its revealOrder: ' +
        '<SuspenseList revealOrder=...> ... ' +
        '<SuspenseList revealOrder=...>{array}</SuspenseList> ... ' +
        '</SuspenseList>' +
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
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>C</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
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
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>C</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
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
      <>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'Suspend! [C]']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
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
      <>
        <div>
          <span>Loading A</span>
          <span>Loading B</span>
        </div>
        <div>
          <span>Loading C</span>
        </div>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'Suspend! [C]']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>
          <span>Loading A</span>
          <span>Loading B</span>
        </div>
        <div>
          <span>Loading C</span>
        </div>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <div>
          <span>A</span>
          <span>B</span>
        </div>
        <div>
          <span>C</span>
        </div>
      </>,
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
      <>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
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
      <>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
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
              <>
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
              </>
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
      'A',
      'Loading B',
      'Loading C',
    ]);

    // This will suspend, since the boundaries are avoided. Give them
    // time to display their loading states.
    jest.advanceTimersByTime(500);

    // A is already showing content so it doesn't turn into a fallback.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'Suspend! [C]']);

    // Even though we could now show B, we're still waiting on C.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
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
      <>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'Suspend! [B]']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
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
      <>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C', 'Suspend! [B]']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>C</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'A']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
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
      <>
        <span>B</span>
        <span>D</span>
      </>,
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
      'Loading A',
      'B',
      'Loading C',
      'D',
      'Loading E',
      'Loading F',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading A</span>
        <span>B</span>
        <span>Loading C</span>
        <span>D</span>
        <span>Loading E</span>
        <span>Loading F</span>
      </>,
    );

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'Suspend! [C]']);

    // Even though we could show A, it is still in a fallback state because
    // C is not yet resolved. We need to resolve everything in the head first.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading A</span>
        <span>B</span>
        <span>Loading C</span>
        <span>D</span>
        <span>Loading E</span>
        <span>Loading F</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'C', 'Suspend! [E]']);

    // We can now resolve the full head.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>Loading E</span>
        <span>Loading F</span>
      </>,
    );

    await E.resolve();

    expect(Scheduler).toFlushAndYield(['E', 'Suspend! [F]']);

    // In the tail we can resolve one-by-one.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>Loading F</span>
      </>,
    );

    await F.resolve();

    // We can also delete some items.
    ReactNoop.render(<Foo items={[['D', D], ['E', E], ['F', F]]} />);

    expect(Scheduler).toFlushAndYield(['D', 'E', 'F']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
    );
  });

  it('displays added row at the top "together" and the bottom in "backwards" order', async () => {
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
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
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
      <>
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
      </>,
    );

    await F.resolve();

    expect(Scheduler).toFlushAndYield(['Suspend! [D]', 'F']);

    // Even though we could show F, it is still in a fallback state because
    // E is not yet resolved. We need to resolve everything in the head first.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
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
      </>,
    );

    await D.resolve();

    expect(Scheduler).toFlushAndYield(['D', 'F', 'Suspend! [B]']);

    // We can now resolve the full head.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span hidden={true}>A</span>
        <span>Loading A</span>
        <span hidden={true}>B</span>
        <span>Loading B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'Suspend! [A]']);

    // In the tail we can resolve one-by-one.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span hidden={true}>A</span>
        <span>Loading A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
    );

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
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

    Scheduler.unstable_advanceTime(300);
    jest.advanceTimersByTime(300);

    expect(Scheduler).toFlushAndYieldThrough(['B']);

    Scheduler.unstable_advanceTime(300);
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
      <>
        <span>A</span>
        <span>B</span>
        <span>Loading C</span>
      </>,
    );

    // Then we do a second pass to commit the last item.
    expect(Scheduler).toFlushAndYield([]);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
    );
  });

  it('only shows one loading state at a time for "collapsed" tail insertions', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="forwards" tail="collapsed">
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

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading A']);

    expect(ReactNoop).toMatchRenderedOutput(<span>Loading A</span>);

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'Suspend! [B]', 'Loading B']);

    // Incremental loading is suspended.
    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'Suspend! [C]', 'Loading C']);

    // Incremental loading is suspended.
    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>Loading C</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
    );
  });

  it('warns if an unsupported tail option is used', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="forwards" tail="collapse">
          <Suspense fallback="Loading">A</Suspense>
          <Suspense fallback="Loading">B</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
      'Warning: "collapse" is not a supported value for tail on ' +
        '<SuspenseList />. Did you mean "collapsed" or "hidden"?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('warns if a tail option is used with "together"', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="together" tail="collapsed">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toWarnDev([
      'Warning: <SuspenseList tail="collapsed" /> is only valid if ' +
        'revealOrder is "forwards" or "backwards". ' +
        'Did you mean to specify revealOrder="forwards"?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  it('renders one "collapsed" fallback even if CPU time elapsed', async () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="forwards" tail="collapsed">
          <Suspense fallback={<Text text="Loading A" />}>
            <Text text="A" />
          </Suspense>
          <Suspense fallback={<Text text="Loading B" />}>
            <Text text="B" />
          </Suspense>
          <Suspense fallback={<Text text="Loading C" />}>
            <Text text="C" />
          </Suspense>
          <Suspense fallback={<Text text="Loading D" />}>
            <Text text="D" />
          </Suspense>
        </SuspenseList>
      );
    }

    // This render is only CPU bound. Nothing suspends.
    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYieldThrough(['A']);

    Scheduler.unstable_advanceTime(300);
    jest.advanceTimersByTime(300);

    expect(Scheduler).toFlushAndYieldThrough(['B']);

    Scheduler.unstable_advanceTime(300);
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
      <>
        <span>A</span>
        <span>B</span>
        <span>Loading C</span>
      </>,
    );

    // Then we do a second pass to commit the last two items.
    expect(Scheduler).toFlushAndYield(['D']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
      </>,
    );
  });

  it('adding to the middle does not collapse insertions (forwards)', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');
    let D = createAsyncText('D');
    let E = createAsyncText('E');
    let F = createAsyncText('F');

    function Foo({items}) {
      return (
        <SuspenseList revealOrder="forwards" tail="collapsed">
          {items.map(([key, Component]) => (
            <Suspense key={key} fallback={<Text text={'Loading ' + key} />}>
              <Component />
            </Suspense>
          ))}
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo items={[['A', A], ['D', D]]} />);

    await A.resolve();
    await D.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'D']);

    // First render commits A and D.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>D</span>
      </>,
    );

    // For the second render, we're going to insert items in the middle and end.
    ReactNoop.render(
      <Foo
        items={[['A', A], ['B', B], ['C', C], ['D', D], ['E', E], ['F', F]]}
      />,
    );

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Suspend! [C]',
      'Loading C',
      'D',
      'A',
      'Loading B',
      'Loading C',
      'D',
      'Loading E',
    ]);

    // B and C don't get collapsed, but F gets collapsed with E.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
        <span>D</span>
        <span>Loading E</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'Suspend! [C]']);

    // Incremental loading is suspended.
    jest.advanceTimersByTime(500);

    // Even though B is unsuspended, it's still in loading state because
    // it is blocked by C.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
        <span>D</span>
        <span>Loading E</span>
      </>,
    );

    await C.resolve();
    await E.resolve();

    expect(Scheduler).toFlushAndYield([
      'B',
      'C',
      'E',
      'Suspend! [F]',
      'Loading F',
    ]);

    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>Loading F</span>
      </>,
    );

    await F.resolve();

    expect(Scheduler).toFlushAndYield(['F']);

    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
    );
  });

  it('adding to the middle does not collapse insertions (backwards)', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');
    let D = createAsyncText('D');
    let E = createAsyncText('E');
    let F = createAsyncText('F');

    function Foo({items}) {
      return (
        <SuspenseList revealOrder="backwards" tail="collapsed">
          {items.map(([key, Component]) => (
            <Suspense key={key} fallback={<Text text={'Loading ' + key} />}>
              <Component />
            </Suspense>
          ))}
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo items={[['C', C], ['F', F]]} />);

    await C.resolve();
    await F.resolve();

    expect(Scheduler).toFlushAndYield(['F', 'C']);

    // First render commits C and F.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>C</span>
        <span>F</span>
      </>,
    );

    // For the second render, we're going to insert items in the middle and end.
    ReactNoop.render(
      <Foo
        items={[['A', A], ['B', B], ['C', C], ['D', D], ['E', E], ['F', F]]}
      />,
    );

    expect(Scheduler).toFlushAndYield([
      'C',
      'Suspend! [D]',
      'Loading D',
      'Suspend! [E]',
      'Loading E',
      'F',
      'C',
      'Loading D',
      'Loading E',
      'F',
      'Loading B',
    ]);

    // D and E don't get collapsed, but A gets collapsed with B.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading B</span>
        <span>C</span>
        <span>Loading D</span>
        <span>Loading E</span>
        <span>F</span>
      </>,
    );

    await D.resolve();

    expect(Scheduler).toFlushAndYield(['D', 'Suspend! [E]']);

    // Incremental loading is suspended.
    jest.advanceTimersByTime(500);

    // Even though D is unsuspended, it's still in loading state because
    // it is blocked by E.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading B</span>
        <span>C</span>
        <span>Loading D</span>
        <span>Loading E</span>
        <span>F</span>
      </>,
    );

    await C.resolve();
    await E.resolve();

    await B.resolve();
    await C.resolve();
    await D.resolve();
    await E.resolve();

    expect(Scheduler).toFlushAndYield([
      'D',
      'E',
      'B',
      'Suspend! [A]',
      'Loading A',
    ]);

    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
    );

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A']);

    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
    );
  });

  it('adding to the middle of committeed tail does not collapse insertions', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');
    let D = createAsyncText('D');
    let E = createAsyncText('E');
    let F = createAsyncText('F');

    function SyncD() {
      return <Text text="D" />;
    }

    function Foo({items}) {
      return (
        <SuspenseList revealOrder="forwards" tail="collapsed">
          {items.map(([key, Component]) => (
            <Suspense key={key} fallback={<Text text={'Loading ' + key} />}>
              <Component />
            </Suspense>
          ))}
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo items={[['A', A], ['D', SyncD]]} />);

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'D']);

    // First render commits A and D.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>D</span>
      </>,
    );

    // For the second render, we're going to insert items in the middle and end.
    // Note that D now suspends even though it didn't in the first pass.
    ReactNoop.render(
      <Foo
        items={[['A', A], ['B', B], ['C', C], ['D', D], ['E', E], ['F', F]]}
      />,
    );

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Suspend! [C]',
      'Loading C',
      'Suspend! [D]',
      'Loading D',
      'A',
      'Loading B',
      'Loading C',
      'Suspend! [D]',
      'Loading D',
      'Loading E',
    ]);

    // This is suspended due to the update to D causing a loading state.
    jest.advanceTimersByTime(500);

    // B and C don't get collapsed, but F gets collapsed with E.
    // Even though everything in the bottom of the list is suspended, we don't
    // collapse them because D was an update. Not an insertion.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
        <span hidden={true}>D</span>
        <span>Loading D</span>
        <span>Loading E</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'Suspend! [C]']);

    // Incremental loading is suspended.
    jest.advanceTimersByTime(500);

    // B is able to unblock here because it's part of the tail.
    // If D was still visible it wouldn't be part of the tail
    // and would be blocked on C like in the other test.
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>Loading C</span>
        <span hidden={true}>D</span>
        <span>Loading D</span>
        <span>Loading E</span>
      </>,
    );

    await C.resolve();
    await D.resolve();
    await E.resolve();

    expect(Scheduler).toFlushAndYield([
      'C',
      'D',
      'E',
      'Suspend! [F]',
      'Loading F',
    ]);

    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>Loading F</span>
      </>,
    );

    await F.resolve();

    expect(Scheduler).toFlushAndYield(['F']);

    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
    );
  });

  it('only shows no initial loading state "hidden" tail insertions', async () => {
    let A = createAsyncText('A');
    let B = createAsyncText('B');
    let C = createAsyncText('C');

    function Foo() {
      return (
        <SuspenseList revealOrder="forwards" tail="hidden">
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

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield(['Suspend! [A]', 'Loading A']);

    expect(ReactNoop).toMatchRenderedOutput(null);

    await A.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'Suspend! [B]', 'Loading B']);

    // Incremental loading is suspended.
    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(<span>A</span>);

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['B', 'Suspend! [C]', 'Loading C']);

    // Incremental loading is suspended.
    jest.advanceTimersByTime(500);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
      </>,
    );

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
    );
  });

  it('can do unrelated adjacent updates', async () => {
    let updateAdjacent;
    function Adjacent() {
      let [text, setText] = React.useState('-');
      updateAdjacent = setText;
      return <Text text={text} />;
    }

    function Foo() {
      return (
        <div>
          <SuspenseList revealOrder="forwards">
            <Text text="A" />
            <Text text="B" />
          </SuspenseList>
          <Adjacent />
        </div>
      );
    }

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield(['A', 'B', '-']);

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>A</span>
        <span>B</span>
        <span>-</span>
      </div>,
    );

    // Update the row adjacent to the list
    ReactNoop.act(() => updateAdjacent('C'));

    expect(Scheduler).toHaveYielded(['C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <div>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </div>,
    );
  });
});

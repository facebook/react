let React;
let ReactNoop;
let Scheduler;
let Profiler;
let Suspense;
let SuspenseList;

describe('ReactSuspenseList', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Profiler = React.Profiler;
    Suspense = React.Suspense;
    SuspenseList = React.unstable_SuspenseList;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span>{props.text}</span>;
  }

  function createAsyncText(text) {
    let resolved = false;
    const Component = function() {
      if (!resolved) {
        Scheduler.unstable_yieldValue('Suspend! [' + text + ']');
        throw promise;
      }
      return <Text text={text} />;
    };
    const promise = new Promise(resolve => {
      Component.resolve = function() {
        resolved = true;
        return resolve();
      };
    });
    return Component;
  }

  // @gate experimental
  it('warns if an unsupported revealOrder option is used', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="something">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: "something" is not a supported revealOrder on ' +
        '<SuspenseList />. Did you mean "together", "forwards" or "backwards"?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  // @gate experimental
  it('warns if a upper case revealOrder option is used', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="TOGETHER">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: "TOGETHER" is not a valid value for revealOrder on ' +
        '<SuspenseList />. Use lowercase "together" instead.' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  // @gate experimental
  it('warns if a misspelled revealOrder option is used', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="forward">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: "forward" is not a valid value for revealOrder on ' +
        '<SuspenseList />. React uses the -s suffix in the spelling. ' +
        'Use "forwards" instead.' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  // @gate experimental
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

    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: A single row was passed to a <SuspenseList revealOrder="forwards" />. ' +
        'This is not useful since it needs multiple rows. ' +
        'Did you mean to pass multiple children or an array?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  // @gate experimental
  it('warns if a single fragment is passed to a "backwards" list', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="backwards">
          <>{[]}</>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: A single row was passed to a <SuspenseList revealOrder="backwards" />. ' +
        'This is not useful since it needs multiple rows. ' +
        'Did you mean to pass multiple children or an array?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  // @gate experimental
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

    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: A nested array was passed to row #0 in <SuspenseList />. ' +
        'Wrap it in an additional SuspenseList to configure its revealOrder: ' +
        '<SuspenseList revealOrder=...> ... ' +
        '<SuspenseList revealOrder=...>{array}</SuspenseList> ... ' +
        '</SuspenseList>' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  // @gate experimental
  it('shows content independently by default', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('shows content independently in legacy mode regardless of option', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('displays all "together"', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('displays all "together" even when nested as siblings', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('displays all "together" in nested SuspenseLists', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('displays all "together" in nested SuspenseLists where the inner is default', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('displays all "together" during an update', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');
    const D = createAsyncText('D');

    function Foo({step}) {
      return (
        <SuspenseList revealOrder="together">
          {step === 0 && (
            <Suspense fallback={<Text text="Loading A" />}>
              <A />
            </Suspense>
          )}
          {step === 0 && (
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
          )}
          {step === 1 && (
            <Suspense fallback={<Text text="Loading C" />}>
              <C />
            </Suspense>
          )}
          {step === 1 && (
            <Suspense fallback={<Text text="Loading D" />}>
              <D />
            </Suspense>
          )}
        </SuspenseList>
      );
    }

    // Mount
    await A.resolve();
    ReactNoop.render(<Foo step={0} />);
    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Loading A',
      'Loading B',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading A</span>
        <span>Loading B</span>
      </>,
    );
    await B.resolve();
    expect(Scheduler).toFlushAndYield(['A', 'B']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
      </>,
    );

    // Update
    await C.resolve();
    ReactNoop.render(<Foo step={1} />);
    expect(Scheduler).toFlushAndYield([
      'C',
      'Suspend! [D]',
      'Loading D',
      'Loading C',
      'Loading D',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading C</span>
        <span>Loading D</span>
      </>,
    );
    await D.resolve();
    expect(Scheduler).toFlushAndYield(['C', 'D']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>C</span>
        <span>D</span>
      </>,
    );
  });

  // @gate experimental
  it('avoided boundaries can be coordinate with SuspenseList', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('displays each items in "forwards" order', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('displays each items in "backwards" order', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('displays added row at the top "together" and the bottom in "forwards" order', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');
    const D = createAsyncText('D');
    const E = createAsyncText('E');
    const F = createAsyncText('F');

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

    ReactNoop.render(
      <Foo
        items={[
          ['B', B],
          ['D', D],
        ]}
      />,
    );

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
        items={[
          ['A', A],
          ['B', B],
          ['C', C],
          ['D', D],
          ['E', E],
          ['F', F],
        ]}
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
    ReactNoop.render(
      <Foo
        items={[
          ['D', D],
          ['E', E],
          ['F', F],
        ]}
      />,
    );

    expect(Scheduler).toFlushAndYield(['D', 'E', 'F']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>D</span>
        <span>E</span>
        <span>F</span>
      </>,
    );
  });

  // @gate experimental
  it('displays added row at the top "together" and the bottom in "backwards" order', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const D = createAsyncText('D');
    const F = createAsyncText('F');

    function createSyncText(text) {
      return function() {
        return <Text text={text} />;
      };
    }

    const As = createSyncText('A');
    const Bs = createSyncText('B');
    const Cs = createSyncText('C');
    const Ds = createSyncText('D');
    const Es = createSyncText('E');
    const Fs = createSyncText('F');

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
        items={[
          ['A', A],
          ['B', B],
          ['C', Cs],
          ['D', D],
          ['E', Es],
          ['F', F],
        ]}
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

  // @gate experimental
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

    Scheduler.unstable_advanceTime(200);
    jest.advanceTimersByTime(200);

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

  // @gate experimental
  it('only shows one loading state at a time for "collapsed" tail insertions', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
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

    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: "collapse" is not a supported value for tail on ' +
        '<SuspenseList />. Did you mean "collapsed" or "hidden"?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  // @gate experimental
  it('warns if a tail option is used with "together"', () => {
    function Foo() {
      return (
        <SuspenseList revealOrder="together" tail="collapsed">
          <Suspense fallback="Loading">Content</Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(() => Scheduler.unstable_flushAll()).toErrorDev([
      'Warning: <SuspenseList tail="collapsed" /> is only valid if ' +
        'revealOrder is "forwards" or "backwards". ' +
        'Did you mean to specify revealOrder="forwards"?' +
        '\n    in SuspenseList (at **)' +
        '\n    in Foo (at **)',
    ]);
  });

  // @gate experimental
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

    Scheduler.unstable_advanceTime(200);
    jest.advanceTimersByTime(200);

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

  // @gate experimental
  it('adding to the middle does not collapse insertions (forwards)', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');
    const D = createAsyncText('D');
    const E = createAsyncText('E');
    const F = createAsyncText('F');

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

    ReactNoop.render(
      <Foo
        items={[
          ['A', A],
          ['D', D],
        ]}
      />,
    );

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
        items={[
          ['A', A],
          ['B', B],
          ['C', C],
          ['D', D],
          ['E', E],
          ['F', F],
        ]}
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

  // @gate experimental
  it('adding to the middle does not collapse insertions (backwards)', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');
    const D = createAsyncText('D');
    const E = createAsyncText('E');
    const F = createAsyncText('F');

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

    ReactNoop.render(
      <Foo
        items={[
          ['C', C],
          ['F', F],
        ]}
      />,
    );

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
        items={[
          ['A', A],
          ['B', B],
          ['C', C],
          ['D', D],
          ['E', E],
          ['F', F],
        ]}
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

  // @gate experimental
  it('adding to the middle of committed tail does not collapse insertions', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');
    const D = createAsyncText('D');
    const E = createAsyncText('E');
    const F = createAsyncText('F');

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

    ReactNoop.render(
      <Foo
        items={[
          ['A', A],
          ['D', SyncD],
        ]}
      />,
    );

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
        items={[
          ['A', A],
          ['B', B],
          ['C', C],
          ['D', D],
          ['E', E],
          ['F', F],
        ]}
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

  // @gate experimental
  it('only shows no initial loading state "hidden" tail insertions', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');

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

  // @gate experimental
  it('eventually resolves a nested forwards suspense list', async () => {
    const B = createAsyncText('B');

    function Foo() {
      return (
        <SuspenseList revealOrder="together">
          <SuspenseList revealOrder="forwards">
            <Suspense fallback={<Text text="Loading A" />}>
              <Text text="A" />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
            <Suspense fallback={<Text text="Loading C" />}>
              <Text text="C" />
            </Suspense>
          </SuspenseList>
          <Suspense fallback={<Text text="Loading D" />}>
            <Text text="D" />
          </Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Loading C',
      'D',
      // The second pass forces the fallbacks
      'Loading A',
      'Loading B',
      'Loading C',
      'Loading D',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading A</span>
        <span>Loading B</span>
        <span>Loading C</span>
        <span>Loading D</span>
      </>,
    );

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C', 'D']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
      </>,
    );
  });

  // @gate experimental
  it('eventually resolves a nested forwards suspense list with a hidden tail', async () => {
    const B = createAsyncText('B');

    function Foo() {
      return (
        <SuspenseList revealOrder="together">
          <SuspenseList revealOrder="forwards" tail="hidden">
            <Suspense fallback={<Text text="Loading A" />}>
              <Text text="A" />
            </Suspense>
            <Suspense fallback={<Text text="Loading B" />}>
              <B />
            </Suspense>
          </SuspenseList>
          <Suspense fallback={<Text text="Loading C" />}>
            <Text text="C" />
          </Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'C',
      'Loading C',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(<span>Loading C</span>);

    await B.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
    );
  });

  // @gate experimental
  it('eventually resolves two nested forwards suspense lists with a hidden tail', async () => {
    const B = createAsyncText('B');

    function Foo({showB}) {
      return (
        <SuspenseList revealOrder="forwards">
          <SuspenseList revealOrder="forwards" tail="hidden">
            <Suspense fallback={<Text text="Loading A" />}>
              <Text text="A" />
            </Suspense>
            {showB ? (
              <Suspense fallback={<Text text="Loading B" />}>
                <B />
              </Suspense>
            ) : null}
          </SuspenseList>
          <Suspense fallback={<Text text="Loading C" />}>
            <Text text="C" />
          </Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo showB={false} />);

    expect(Scheduler).toFlushAndYield(['A', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>C</span>
      </>,
    );

    // Showing the B later means that C has already committed
    // so we're now effectively in "together" mode for the head.
    ReactNoop.render(<Foo showB={true} />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'C',
      'A',
      'C',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
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

  // @gate experimental
  it('can do unrelated adjacent updates', async () => {
    let updateAdjacent;
    function Adjacent() {
      const [text, setText] = React.useState('-');
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

  // @gate experimental
  it('is able to re-suspend the last rows during an update with hidden', async () => {
    const AsyncB = createAsyncText('B');

    let setAsyncB;

    function B() {
      const [shouldBeAsync, setAsync] = React.useState(false);
      setAsyncB = setAsync;

      return shouldBeAsync ? (
        <Suspense fallback={<Text text="Loading B" />}>
          <AsyncB />
        </Suspense>
      ) : (
        <Text text="Sync B" />
      );
    }

    function Foo({updateList}) {
      return (
        <SuspenseList revealOrder="forwards" tail="hidden">
          <Suspense key="A" fallback={<Text text="Loading A" />}>
            <Text text="A" />
          </Suspense>
          <B key="B" updateList={updateList} />
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield(['A', 'Sync B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Sync B</span>
      </>,
    );

    const previousInst = setAsyncB;

    // During an update we suspend on B.
    ReactNoop.act(() => setAsyncB(true));

    expect(Scheduler).toHaveYielded([
      'Suspend! [B]',
      'Loading B',
      // The second pass is the "force hide" pass
      'Loading B',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
      </>,
    );

    // Before we resolve we'll rerender the whole list.
    // This should leave the tree intact.
    ReactNoop.act(() => ReactNoop.render(<Foo updateList={true} />));

    expect(Scheduler).toHaveYielded(['A', 'Suspend! [B]', 'Loading B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
      </>,
    );

    await AsyncB.resolve();

    expect(Scheduler).toFlushAndYield(['B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
      </>,
    );

    // This should be the same instance. I.e. it didn't
    // remount.
    expect(previousInst).toBe(setAsyncB);
  });

  // @gate experimental
  it('is able to re-suspend the last rows during an update with hidden', async () => {
    const AsyncB = createAsyncText('B');

    let setAsyncB;

    function B() {
      const [shouldBeAsync, setAsync] = React.useState(false);
      setAsyncB = setAsync;

      return shouldBeAsync ? (
        <Suspense fallback={<Text text="Loading B" />}>
          <AsyncB />
        </Suspense>
      ) : (
        <Text text="Sync B" />
      );
    }

    function Foo({updateList}) {
      return (
        <SuspenseList revealOrder="forwards" tail="hidden">
          <Suspense key="A" fallback={<Text text="Loading A" />}>
            <Text text="A" />
          </Suspense>
          <B key="B" updateList={updateList} />
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield(['A', 'Sync B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Sync B</span>
      </>,
    );

    const previousInst = setAsyncB;

    // During an update we suspend on B.
    ReactNoop.act(() => setAsyncB(true));

    expect(Scheduler).toHaveYielded([
      'Suspend! [B]',
      'Loading B',
      // The second pass is the "force hide" pass
      'Loading B',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
      </>,
    );

    // Before we resolve we'll rerender the whole list.
    // This should leave the tree intact.
    ReactNoop.act(() => ReactNoop.render(<Foo updateList={true} />));

    expect(Scheduler).toHaveYielded(['A', 'Suspend! [B]', 'Loading B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
      </>,
    );

    await AsyncB.resolve();

    expect(Scheduler).toFlushAndYield(['B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
      </>,
    );

    // This should be the same instance. I.e. it didn't
    // remount.
    expect(previousInst).toBe(setAsyncB);
  });

  // @gate experimental
  it('is able to interrupt a partially rendered tree and continue later', async () => {
    const AsyncA = createAsyncText('A');

    let updateLowPri;
    let updateHighPri;

    function Bar() {
      const [highPriState, setHighPriState] = React.useState(false);
      updateHighPri = setHighPriState;
      return highPriState ? <AsyncA /> : null;
    }

    function Foo() {
      const [lowPriState, setLowPriState] = React.useState(false);
      updateLowPri = setLowPriState;
      return (
        <SuspenseList revealOrder="forwards" tail="hidden">
          <Suspense key="A" fallback={<Text text="Loading A" />}>
            <Bar />
          </Suspense>
          {lowPriState ? <Text text="B" /> : null}
          {lowPriState ? <Text text="C" /> : null}
          {lowPriState ? <Text text="D" /> : null}
        </SuspenseList>
      );
    }

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([]);

    expect(ReactNoop).toMatchRenderedOutput(null);

    ReactNoop.act(() => {
      // Add a few items at the end.
      updateLowPri(true);

      // Flush partially through.
      expect(Scheduler).toFlushAndYieldThrough(['B', 'C']);

      // Schedule another update at higher priority.
      Scheduler.unstable_runWithPriority(
        Scheduler.unstable_UserBlockingPriority,
        () => updateHighPri(true),
      );

      // That will intercept the previous render.
    });

    jest.runAllTimers();

    expect(Scheduler).toHaveYielded([
      // First attempt at high pri.
      'Suspend! [A]',
      'Loading A',
      // Re-render at forced.
      'Suspend! [A]',
      'Loading A',
      // We auto-commit this on DEV.
      // Try again on low-pri.
      'Suspend! [A]',
      'Loading A',
      // Re-render at forced.
      'Suspend! [A]',
      'Loading A',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(<span>Loading A</span>);

    await AsyncA.resolve();

    expect(Scheduler).toFlushAndYield(['A', 'B', 'C', 'D']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>D</span>
      </>,
    );
  });

  // @gate experimental
  it('can resume class components when revealed together', async () => {
    const A = createAsyncText('A');
    const B = createAsyncText('B');

    class ClassComponent extends React.Component {
      render() {
        return this.props.children;
      }
    }

    function Foo() {
      return (
        <Suspense fallback={<Text text="Loading" />}>
          <SuspenseList revealOrder="together">
            <ClassComponent>
              <Suspense fallback={<Text text="Loading A" />}>
                <A />
              </Suspense>
            </ClassComponent>
            <ClassComponent>
              <Suspense fallback={<Text text="Loading B" />}>
                <B />
              </Suspense>
            </ClassComponent>
          </SuspenseList>
        </Suspense>
      );
    }

    await A.resolve();

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield([
      'A',
      'Suspend! [B]',
      'Loading B',
      'Loading A',
      'Loading B',
    ]);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>Loading A</span>
        <span>Loading B</span>
      </>,
    );

    await B.resolve();

    ReactNoop.render(<Foo />);

    expect(Scheduler).toFlushAndYield(['A', 'B']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
      </>,
    );
  });

  // @gate experimental
  it('should be able to progressively show CPU expensive rows with two pass rendering', async () => {
    function TwoPass({text}) {
      const [pass, setPass] = React.useState(0);
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Mount ' + text);
        setPass(1);
      }, []);
      return <Text text={pass === 0 ? 'First Pass ' + text : text} />;
    }

    function Sleep({time, children}) {
      Scheduler.unstable_advanceTime(time);
      return children;
    }

    function App() {
      Scheduler.unstable_yieldValue('App');
      return (
        <SuspenseList revealOrder="forwards" tail="hidden">
          <Suspense fallback={<Text text="Loading A" />}>
            <Sleep time={600}>
              <TwoPass text="A" />
            </Sleep>
          </Suspense>
          <Suspense fallback={<Text text="Loading B" />}>
            <Sleep time={600}>
              <TwoPass text="B" />
            </Sleep>
          </Suspense>
          <Sleep time={600}>
            <Text text="C" />
          </Sleep>
        </SuspenseList>
      );
    }

    ReactNoop.render(<App />);

    expect(Scheduler).toFlushAndYieldThrough([
      'App',
      'First Pass A',
      'Mount A',
      'A',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(<span>A</span>);

    expect(Scheduler).toFlushAndYieldThrough(['First Pass B', 'Mount B', 'B']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
      </>,
    );

    expect(Scheduler).toFlushAndYield(['C']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
    );
  });

  // @gate experimental
  it('should be able to progressively show rows with two pass rendering and visible', async () => {
    function TwoPass({text}) {
      const [pass, setPass] = React.useState(0);
      React.useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Mount ' + text);
        setPass(1);
      }, []);
      return <Text text={pass === 0 ? 'First Pass ' + text : text} />;
    }

    function Sleep({time, children}) {
      Scheduler.unstable_advanceTime(time);
      return children;
    }

    function App() {
      Scheduler.unstable_yieldValue('App');
      return (
        <SuspenseList revealOrder="forwards">
          <Suspense fallback={<Text text="Loading A" />}>
            <Sleep time={600}>
              <TwoPass text="A" />
            </Sleep>
          </Suspense>
          <Suspense fallback={<Text text="Loading B" />}>
            <Sleep time={600}>
              <TwoPass text="B" />
            </Sleep>
          </Suspense>
          <Suspense fallback={<Text text="Loading C" />}>
            <Sleep time={600}>
              <Text text="C" />
            </Sleep>
          </Suspense>
        </SuspenseList>
      );
    }

    ReactNoop.render(<App />);

    expect(Scheduler).toFlushAndYieldThrough([
      'App',
      'First Pass A',
      'Loading B',
      'Loading C',
      'Mount A',
      'A',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>Loading B</span>
        <span>Loading C</span>
      </>,
    );

    expect(Scheduler).toFlushAndYieldThrough(['First Pass B', 'Mount B', 'B']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>Loading C</span>
      </>,
    );

    expect(Scheduler).toFlushAndYield(['C']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
    );
  });

  // @gate experimental && enableProfilerTimer
  it('counts the actual duration when profiling a SuspenseList', async () => {
    // Order of parameters: id, phase, actualDuration, treeBaseDuration
    const onRender = jest.fn();

    const Fallback = () => {
      Scheduler.unstable_yieldValue('Fallback');
      Scheduler.unstable_advanceTime(3);
      return <span>Loading...</span>;
    };

    const A = createAsyncText('A');
    const B = createAsyncText('B');
    const C = createAsyncText('C');
    const D = createAsyncText('D');
    await A.resolve();
    await B.resolve();

    function Sleep({time, children}) {
      Scheduler.unstable_advanceTime(time);
      return children;
    }

    function App({addRow, suspendTail}) {
      Scheduler.unstable_yieldValue('App');
      return (
        <Profiler id="root" onRender={onRender}>
          <SuspenseList revealOrder="forwards">
            <Suspense fallback={<Fallback />}>
              <Sleep time={1}>
                <A />
              </Sleep>
            </Suspense>
            <Suspense fallback={<Fallback />}>
              <Sleep time={4}>
                <B />
              </Sleep>
            </Suspense>
            <Suspense fallback={<Fallback />}>
              <Sleep time={5}>{suspendTail ? <C /> : <Text text="C" />}</Sleep>
            </Suspense>
            {addRow ? (
              <Suspense fallback={<Fallback />}>
                <Sleep time={12}>
                  <D />
                </Sleep>
              </Suspense>
            ) : null}
          </SuspenseList>
        </Profiler>
      );
    }

    ReactNoop.render(<App suspendTail={true} />);

    expect(Scheduler).toFlushAndYield([
      'App',
      'A',
      'B',
      'Suspend! [C]',
      'Fallback',
    ]);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>Loading...</span>
      </>,
    );
    expect(onRender).toHaveBeenCalledTimes(1);

    // The treeBaseDuration should be the time to render each child. The last
    // one counts the fallback time.
    // The actualDuration should also include the 5ms spent rendering the
    // last suspended row.

    // actualDuration
    expect(onRender.mock.calls[0][2]).toBe(1 + 4 + 5 + 3);
    // treeBaseDuration
    expect(onRender.mock.calls[0][3]).toBe(1 + 4 + 3);

    ReactNoop.render(<App suspendTail={false} />);

    expect(Scheduler).toFlushAndYield(['App', 'A', 'B', 'C']);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
      </>,
    );
    expect(onRender).toHaveBeenCalledTimes(2);

    // actualDuration
    expect(onRender.mock.calls[1][2]).toBe(1 + 4 + 5);
    // treeBaseDuration
    expect(onRender.mock.calls[1][3]).toBe(1 + 4 + 5);

    ReactNoop.render(<App addRow={true} suspendTail={true} />);

    expect(Scheduler).toFlushAndYield([
      'App',
      'A',
      'B',
      'Suspend! [C]',
      'Fallback',
      // We rendered in together mode for the head, now we re-render with forced suspense.
      'A',
      'B',
      'Suspend! [C]',
      'Fallback',
      // Lastly we render the tail.
      'Fallback',
    ]);

    // Flush suspended time.
    jest.advanceTimersByTime(1000);

    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span hidden={true}>C</span>
        <span>Loading...</span>
        <span>Loading...</span>
      </>,
    );
    expect(onRender).toHaveBeenCalledTimes(3);

    // The treeBaseDuration should be the time to render the first two
    // children and then two fallbacks.
    // The actualDuration should also include rendering the content of
    // the first fallback, as well as the second pass to render the head
    // with force fallback mode.

    // actualDuration
    expect(onRender.mock.calls[2][2]).toBe((1 + 4 + 5 + 3) * 2 + 3);
    // treeBaseDuration
    expect(onRender.mock.calls[2][3]).toBe(1 + 4 + 3 + 3);

    await C.resolve();

    expect(Scheduler).toFlushAndYield(['C', 'Suspend! [D]']);
    expect(ReactNoop).toMatchRenderedOutput(
      <>
        <span>A</span>
        <span>B</span>
        <span>C</span>
        <span>Loading...</span>
      </>,
    );
    expect(onRender).toHaveBeenCalledTimes(4);

    // actualDuration
    expect(onRender.mock.calls[3][2]).toBe(5 + 12);
    // treeBaseDuration
    expect(onRender.mock.calls[3][3]).toBe(1 + 4 + 5 + 3);
  });
});

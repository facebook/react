let React;
let startTransition;
let ReactNoop;
let resolveSuspenseyThing;
let getSuspenseyThingStatus;
let Suspense;
let SuspenseList;
let Scheduler;
let act;
let assertLog;

describe('ReactSuspenseyCommitPhase', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
    SuspenseList = React.SuspenseList;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.SuspenseList;
    }
    startTransition = React.startTransition;
    resolveSuspenseyThing = ReactNoop.resolveSuspenseyThing;
    getSuspenseyThingStatus = ReactNoop.getSuspenseyThingStatus;

    const InternalTestUtils = require('internal-test-utils');
    act = InternalTestUtils.act;
    assertLog = InternalTestUtils.assertLog;
  });

  function Text({text}) {
    Scheduler.log(text);
    return text;
  }

  function SuspenseyImage({src}) {
    return (
      <suspensey-thing
        src={src}
        onLoadStart={() => Scheduler.log(`Image requested [${src}]`)}
      />
    );
  }

  test('suspend commit during initial mount', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <SuspenseyImage src="A" />
          </Suspense>,
        );
      });
    });
    assertLog(['Image requested [A]', 'Loading...']);
    expect(getSuspenseyThingStatus('A')).toBe('pending');
    expect(root).toMatchRenderedOutput('Loading...');

    // This should synchronously commit
    resolveSuspenseyThing('A');
    expect(root).toMatchRenderedOutput(<suspensey-thing src="A" />);
  });

  test('suspend commit during update', async () => {
    const root = ReactNoop.createRoot();
    await act(() => resolveSuspenseyThing('A'));
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <SuspenseyImage src="A" />
          </Suspense>,
        );
      });
    });
    expect(root).toMatchRenderedOutput(<suspensey-thing src="A" />);

    // Update to a new image src. The transition should suspend because
    // the src hasn't loaded yet, and the image is in an already-visible tree.
    await act(async () => {
      startTransition(() => {
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <SuspenseyImage src="B" />
          </Suspense>,
        );
      });
    });
    assertLog(['Image requested [B]']);
    expect(getSuspenseyThingStatus('B')).toBe('pending');
    // Should remain on previous screen
    expect(root).toMatchRenderedOutput(<suspensey-thing src="A" />);

    // This should synchronously commit
    resolveSuspenseyThing('B');
    expect(root).toMatchRenderedOutput(<suspensey-thing src="B" />);
  });

  test('does not suspend commit during urgent update', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Suspense fallback={<Text text="Loading..." />}>
          <SuspenseyImage src="A" />
        </Suspense>,
      );
    });
    // NOTE: `shouldSuspendCommit` is called even during synchronous renders
    // because if this node is ever hidden, then revealed again, we want to know
    // whether it's capable of suspending the commit. We track this using a
    // fiber flag.
    assertLog(['Image requested [A]']);
    expect(getSuspenseyThingStatus('A')).toBe('pending');
    expect(root).toMatchRenderedOutput(<suspensey-thing src="A" />);
  });

  test('an urgent update interrupts a suspended commit', async () => {
    const root = ReactNoop.createRoot();

    // Mount an image. This transition will suspend because it's not inside a
    // Suspense boundary.
    await act(() => {
      startTransition(() => {
        root.render(<SuspenseyImage src="A" />);
      });
    });
    assertLog(['Image requested [A]']);
    // Nothing showing yet.
    expect(root).toMatchRenderedOutput(null);

    // If there's an urgent update, it should interrupt the suspended commit.
    await act(() => {
      root.render(<Text text="Something else" />);
    });
    assertLog(['Something else']);
    expect(root).toMatchRenderedOutput('Something else');
  });

  test('a non-urgent update does not interrupt a suspended commit', async () => {
    const root = ReactNoop.createRoot();

    // Mount an image. This transition will suspend because it's not inside a
    // Suspense boundary.
    await act(() => {
      startTransition(() => {
        root.render(<SuspenseyImage src="A" />);
      });
    });
    assertLog(['Image requested [A]']);
    // Nothing showing yet.
    expect(root).toMatchRenderedOutput(null);

    // If there's another transition update, it should not interrupt the
    // suspended commit.
    await act(() => {
      startTransition(() => {
        root.render(<Text text="Something else" />);
      });
    });
    // Still suspended.
    expect(root).toMatchRenderedOutput(null);

    await act(() => {
      // Resolving the image should result in an immediate, synchronous commit.
      resolveSuspenseyThing('A');
      expect(root).toMatchRenderedOutput(<suspensey-thing src="A" />);
    });
    // Then the second transition is unblocked.
    // TODO: Right now the only way to unsuspend a commit early is to proceed
    // with the commit even if everything isn't ready. Maybe there should also
    // be a way to abort a commit so that it can be interrupted by
    // another transition.
    assertLog(['Something else']);
    expect(root).toMatchRenderedOutput('Something else');
  });

  // @gate enableSuspenseList
  test('demonstrate current behavior when used with SuspenseList (not ideal)', async () => {
    function App() {
      return (
        <SuspenseList revealOrder="forwards">
          <Suspense fallback={<Text text="Loading A" />}>
            <SuspenseyImage src="A" />
          </Suspense>
          <Suspense fallback={<Text text="Loading B" />}>
            <SuspenseyImage src="B" />
          </Suspense>
          <Suspense fallback={<Text text="Loading C" />}>
            <SuspenseyImage src="C" />
          </Suspense>
        </SuspenseList>
      );
    }

    const root = ReactNoop.createRoot();
    await act(() => {
      startTransition(() => {
        root.render(<App />);
      });
    });
    assertLog([
      'Image requested [A]',
      'Loading A',
      'Loading B',
      'Loading C',
      'Image requested [B]',
      'Image requested [C]',
    ]);
    expect(root).toMatchRenderedOutput('Loading ALoading BLoading C');

    // TODO: Notice that none of these items appear until they've all loaded.
    // That's not ideal; we should commit each row as it becomes ready to
    // commit. That means we need to prepare both the fallback and the primary
    // tree during the render phase. Related to Offscreen, too.
    resolveSuspenseyThing('A');
    expect(root).toMatchRenderedOutput('Loading ALoading BLoading C');
    resolveSuspenseyThing('B');
    expect(root).toMatchRenderedOutput('Loading ALoading BLoading C');
    resolveSuspenseyThing('C');
    expect(root).toMatchRenderedOutput(
      <>
        <suspensey-thing src="A" />
        <suspensey-thing src="B" />
        <suspensey-thing src="C" />
      </>,
    );
  });
});

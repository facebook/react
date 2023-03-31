let React;
let startTransition;
let ReactNoop;
let resolveSuspenseyThing;
let getSuspenseyThingStatus;
let Suspense;
let Offscreen;
let SuspenseList;
let useMemo;
let Scheduler;
let act;
let assertLog;
let waitForPaint;

describe('ReactSuspenseyCommitPhase', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    Suspense = React.Suspense;
    if (gate(flags => flags.enableSuspenseList)) {
      SuspenseList = React.SuspenseList;
    }
    Offscreen = React.unstable_Offscreen;
    useMemo = React.useMemo;
    startTransition = React.startTransition;
    resolveSuspenseyThing = ReactNoop.resolveSuspenseyThing;
    getSuspenseyThingStatus = ReactNoop.getSuspenseyThingStatus;

    const InternalTestUtils = require('internal-test-utils');
    act = InternalTestUtils.act;
    assertLog = InternalTestUtils.assertLog;
    waitForPaint = InternalTestUtils.waitForPaint;
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
    // We intentionally don't preload during an urgent update because the
    // resource will be inserted synchronously, anyway.
    // TODO: Maybe we should, though? Could be that the browser is able to start
    // the preload in background even though the main thread is blocked. Likely
    // a micro-optimization either way because typically new content is loaded
    // during a transition, not an urgent render.
    expect(getSuspenseyThingStatus('A')).toBe(null);
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

    // If there's an update, it should interrupt the suspended commit.
    await act(() => {
      root.render(<Text text="Something else" />);
    });
    assertLog(['Something else']);
    expect(root).toMatchRenderedOutput('Something else');
  });

  test('a transition update interrupts a suspended commit', async () => {
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

    // If there's an update, it should interrupt the suspended commit.
    await act(() => {
      startTransition(() => {
        root.render(<Text text="Something else" />);
      });
    });
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

  test('avoid triggering a fallback if resource loads immediately', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      startTransition(() => {
        // Intentionally rendering <suspensey-thing>s in a variety of tree
        // positions to test that the work loop resumes correctly in each case.
        root.render(
          <Suspense fallback={<Text text="Loading..." />}>
            <suspensey-thing
              src="A"
              onLoadStart={() => Scheduler.log('Request [A]')}>
              <suspensey-thing
                src="B"
                onLoadStart={() => Scheduler.log('Request [B]')}
              />
            </suspensey-thing>
            <suspensey-thing
              src="C"
              onLoadStart={() => Scheduler.log('Request [C]')}
            />
          </Suspense>,
        );
      });
      // React will yield right after the resource suspends.
      // TODO: The child is preloaded first because we preload in the complete
      // phase. Ideally it should be in the begin phase, but we currently don't
      // create the instance until complete. However, it's unclear if we even
      // need the instance for preloading. So we should probably move this to
      // the begin phase.
      await waitForPaint(['Request [B]']);
      // Resolve in an immediate task. This could happen if the resource is
      // already loaded into the cache.
      resolveSuspenseyThing('B');
      await waitForPaint(['Request [A]']);
      resolveSuspenseyThing('A');
      await waitForPaint(['Request [C]']);
      resolveSuspenseyThing('C');
    });
    expect(root).toMatchRenderedOutput(
      <>
        <suspensey-thing src="A">
          <suspensey-thing src="B" />
        </suspensey-thing>
        <suspensey-thing src="C" />
      </>,
    );
  });

  // @gate enableOffscreen
  test("host instances don't suspend during prerendering, but do suspend when they are revealed", async () => {
    function More() {
      Scheduler.log('More');
      return <SuspenseyImage src="More" />;
    }

    function Details({showMore}) {
      Scheduler.log('Details');
      const more = useMemo(() => <More />, []);
      return (
        <>
          <div>Main Content</div>
          <Offscreen mode={showMore ? 'visible' : 'hidden'}>{more}</Offscreen>
        </>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Details showMore={false} />);
      // First render the outer component, without the hidden content
      await waitForPaint(['Details']);
      expect(root).toMatchRenderedOutput(<div>Main Content</div>);
    });
    // Then prerender the hidden content.
    assertLog(['More', 'Image requested [More]']);
    // The prerender should commit even though the image is still loading,
    // because it's hidden.
    expect(root).toMatchRenderedOutput(
      <>
        <div>Main Content</div>
        <suspensey-thing hidden={true} src="More" />
      </>,
    );

    // Reveal the prerendered content. This update should suspend, because the
    // image that is being revealed still hasn't loaded.
    await act(() => {
      startTransition(() => {
        root.render(<Details showMore={true} />);
      });
    });
    // The More component should not render again, because it was memoized,
    // and it already prerendered.
    assertLog(['Details']);
    expect(root).toMatchRenderedOutput(
      <>
        <div>Main Content</div>
        <suspensey-thing hidden={true} src="More" />
      </>,
    );

    // Now resolve the image. The transition should complete.
    resolveSuspenseyThing('More');
    expect(root).toMatchRenderedOutput(
      <>
        <div>Main Content</div>
        <suspensey-thing src="More" />
      </>,
    );
  });
});

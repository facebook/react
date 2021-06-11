let React;
let ReactNoop;
let Scheduler;
let LegacyHidden;
let Offscreen;
let useState;
let useLayoutEffect;

describe('ReactOffscreen', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');
    LegacyHidden = React.unstable_LegacyHidden;
    Offscreen = React.unstable_Offscreen;
    useState = React.useState;
    useLayoutEffect = React.useLayoutEffect;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  // @gate experimental || www
  it('unstable-defer-without-hiding should never toggle the visibility of its children', async () => {
    function App({mode}) {
      return (
        <>
          <Text text="Normal" />
          <LegacyHidden mode={mode}>
            <Text text="Deferred" />
          </LegacyHidden>
        </>
      );
    }

    // Test the initial mount
    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(<App mode="unstable-defer-without-hiding" />);
      expect(Scheduler).toFlushUntilNextPaint(['Normal']);
      expect(root).toMatchRenderedOutput(<span prop="Normal" />);
    });
    expect(Scheduler).toHaveYielded(['Deferred']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Normal" />
        <span prop="Deferred" />
      </>,
    );

    // Now try after an update
    await ReactNoop.act(async () => {
      root.render(<App mode="visible" />);
    });
    expect(Scheduler).toHaveYielded(['Normal', 'Deferred']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Normal" />
        <span prop="Deferred" />
      </>,
    );

    await ReactNoop.act(async () => {
      root.render(<App mode="unstable-defer-without-hiding" />);
      expect(Scheduler).toFlushUntilNextPaint(['Normal']);
      expect(root).toMatchRenderedOutput(
        <>
          <span prop="Normal" />
          <span prop="Deferred" />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded(['Deferred']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Normal" />
        <span prop="Deferred" />
      </>,
    );
  });

  // @gate experimental || www
  it('does not defer in legacy mode', async () => {
    let setState;
    function Foo() {
      const [state, _setState] = useState('A');
      setState = _setState;
      return <Text text={state} />;
    }

    const root = ReactNoop.createLegacyRoot();
    await ReactNoop.act(async () => {
      root.render(
        <>
          <LegacyHidden mode="hidden">
            <Foo />
          </LegacyHidden>
          <Text text="Outside" />
        </>,
      );

      ReactNoop.flushSync();

      // Should not defer the hidden tree
      expect(Scheduler).toHaveYielded(['A', 'Outside']);
    });
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="A" />
        <span prop="Outside" />
      </>,
    );

    // Test that the children can be updated
    await ReactNoop.act(async () => {
      setState('B');
    });
    expect(Scheduler).toHaveYielded(['B']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="B" />
        <span prop="Outside" />
      </>,
    );
  });

  // @gate experimental || www
  it('does defer in concurrent mode', async () => {
    let setState;
    function Foo() {
      const [state, _setState] = useState('A');
      setState = _setState;
      return <Text text={state} />;
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(
        <>
          <LegacyHidden mode="hidden">
            <Foo />
          </LegacyHidden>
          <Text text="Outside" />
        </>,
      );
      // Should defer the hidden tree.
      expect(Scheduler).toFlushUntilNextPaint(['Outside']);
    });

    // The hidden tree was rendered at lower priority.
    expect(Scheduler).toHaveYielded(['A']);

    expect(root).toMatchRenderedOutput(
      <>
        <span prop="A" />
        <span prop="Outside" />
      </>,
    );

    // Test that the children can be updated
    await ReactNoop.act(async () => {
      setState('B');
    });
    expect(Scheduler).toHaveYielded(['B']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="B" />
        <span prop="Outside" />
      </>,
    );
  });

  // @gate experimental || www
  // @gate enableSuspenseLayoutEffectSemantics
  it('mounts without layout effects when hidden', async () => {
    function Child({text}) {
      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Mount layout');
        return () => {
          Scheduler.unstable_yieldValue('Unmount layout');
        };
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createRoot();

    // Mount hidden tree.
    await ReactNoop.act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    // No layout effect.
    expect(Scheduler).toHaveYielded(['Child']);
    // TODO: Offscreen does not yet hide/unhide children correctly. Until we do,
    // it should only be used inside a host component wrapper whose visibility
    // is toggled simultaneously.
    expect(root).toMatchRenderedOutput(<span prop="Child" />);

    // Unhide the tree. The layout effect is mounted.
    await ReactNoop.act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child', 'Mount layout']);
    expect(root).toMatchRenderedOutput(<span prop="Child" />);
  });

  // @gate experimental || www
  // @gate enableSuspenseLayoutEffectSemantics
  it('mounts/unmounts layout effects when visibility changes (starting visible)', async () => {
    function Child({text}) {
      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Mount layout');
        return () => {
          Scheduler.unstable_yieldValue('Unmount layout');
        };
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child', 'Mount layout']);
    expect(root).toMatchRenderedOutput(<span prop="Child" />);

    // Hide the tree. The layout effect is unmounted.
    await ReactNoop.act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Unmount layout', 'Child']);
    // TODO: Offscreen does not yet hide/unhide children correctly. Until we do,
    // it should only be used inside a host component wrapper whose visibility
    // is toggled simultaneously.
    expect(root).toMatchRenderedOutput(<span prop="Child" />);

    // Unhide the tree. The layout effect is re-mounted.
    await ReactNoop.act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child', 'Mount layout']);
    expect(root).toMatchRenderedOutput(<span prop="Child" />);
  });

  // @gate experimental || www
  // @gate enableSuspenseLayoutEffectSemantics
  it('mounts/unmounts layout effects when visibility changes (starting hidden)', async () => {
    function Child({text}) {
      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Mount layout');
        return () => {
          Scheduler.unstable_yieldValue('Unmount layout');
        };
      }, []);
      return <Text text="Child" />;
    }

    const root = ReactNoop.createRoot();
    await ReactNoop.act(async () => {
      // Start the tree hidden. The layout effect is not mounted.
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child']);
    // TODO: Offscreen does not yet hide/unhide children correctly. Until we do,
    // it should only be used inside a host component wrapper whose visibility
    // is toggled simultaneously.
    expect(root).toMatchRenderedOutput(<span prop="Child" />);

    // Show the tree. The layout effect is mounted.
    await ReactNoop.act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child', 'Mount layout']);
    expect(root).toMatchRenderedOutput(<span prop="Child" />);

    // Hide the tree again. The layout effect is un-mounted.
    await ReactNoop.act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Unmount layout', 'Child']);
    // TODO: Offscreen does not yet hide/unhide children correctly. Until we do,
    // it should only be used inside a host component wrapper whose visibility
    // is toggled simultaneously.
    expect(root).toMatchRenderedOutput(<span prop="Child" />);
  });
});

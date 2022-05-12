let React;
let ReactNoop;
let Scheduler;
let act;
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
    act = require('jest-react').act;
    LegacyHidden = React.unstable_LegacyHidden;
    Offscreen = React.unstable_Offscreen;
    useState = React.useState;
    useLayoutEffect = React.useLayoutEffect;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  // @gate www
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
    await act(async () => {
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
    await act(async () => {
      root.render(<App mode="visible" />);
    });
    expect(Scheduler).toHaveYielded(['Normal', 'Deferred']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Normal" />
        <span prop="Deferred" />
      </>,
    );

    await act(async () => {
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

  // @gate www
  it('does not defer in legacy mode', async () => {
    let setState;
    function Foo() {
      const [state, _setState] = useState('A');
      setState = _setState;
      return <Text text={state} />;
    }

    const root = ReactNoop.createLegacyRoot();
    await act(async () => {
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
    await act(async () => {
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

  // @gate www
  it('does defer in concurrent mode', async () => {
    let setState;
    function Foo() {
      const [state, _setState] = useState('A');
      setState = _setState;
      return <Text text={state} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
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
    await act(async () => {
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
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    // No layout effect.
    expect(Scheduler).toHaveYielded(['Child']);
    expect(root).toMatchRenderedOutput(<span hidden={true} prop="Child" />);

    // Unhide the tree. The layout effect is mounted.
    await act(async () => {
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
    await act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child', 'Mount layout']);
    expect(root).toMatchRenderedOutput(<span prop="Child" />);

    // Hide the tree. The layout effect is unmounted.
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Unmount layout', 'Child']);
    expect(root).toMatchRenderedOutput(<span hidden={true} prop="Child" />);

    // Unhide the tree. The layout effect is re-mounted.
    await act(async () => {
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
    await act(async () => {
      // Start the tree hidden. The layout effect is not mounted.
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child']);
    expect(root).toMatchRenderedOutput(<span hidden={true} prop="Child" />);

    // Show the tree. The layout effect is mounted.
    await act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child', 'Mount layout']);
    expect(root).toMatchRenderedOutput(<span prop="Child" />);

    // Hide the tree again. The layout effect is un-mounted.
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Unmount layout', 'Child']);
    expect(root).toMatchRenderedOutput(<span hidden={true} prop="Child" />);
  });

  // @gate experimental || www
  // @gate enableSuspenseLayoutEffectSemantics
  it('hides children of offscreen after layout effects are destroyed', async () => {
    const root = ReactNoop.createRoot();
    function Child({text}) {
      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Mount layout');
        return () => {
          // The child should not be hidden yet.
          expect(root).toMatchRenderedOutput(<span prop="Child" />);
          Scheduler.unstable_yieldValue('Unmount layout');
        };
      }, []);
      return <Text text="Child" />;
    }

    await act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child', 'Mount layout']);
    expect(root).toMatchRenderedOutput(<span prop="Child" />);

    // Hide the tree. The layout effect is unmounted.
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['Unmount layout', 'Child']);

    // After the layout effect is unmounted, the child is hidden.
    expect(root).toMatchRenderedOutput(<span hidden={true} prop="Child" />);
  });

  // @gate www
  it('does not toggle effects for LegacyHidden component', async () => {
    // LegacyHidden is meant to be the same as offscreen except it doesn't
    // do anything to effects. Only used by www, as a temporary migration step.
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
    await act(async () => {
      root.render(
        <LegacyHidden mode="visible">
          <Child />
        </LegacyHidden>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child', 'Mount layout']);

    await act(async () => {
      root.render(
        <LegacyHidden mode="hidden">
          <Child />
        </LegacyHidden>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child']);

    await act(async () => {
      root.render(
        <LegacyHidden mode="visible">
          <Child />
        </LegacyHidden>,
      );
    });
    expect(Scheduler).toHaveYielded(['Child']);

    await act(async () => {
      root.render(null);
    });
    expect(Scheduler).toHaveYielded(['Unmount layout']);
  });

  // @gate experimental || www
  it('hides new insertions into an already hidden tree', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <span>Hi</span>
        </Offscreen>,
      );
    });
    expect(root).toMatchRenderedOutput(<span hidden={true}>Hi</span>);

    // Insert a new node into the hidden tree
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <span>Hi</span>
          <span>Something new</span>
        </Offscreen>,
      );
    });
    expect(root).toMatchRenderedOutput(
      <>
        <span hidden={true}>Hi</span>
        {/* This new node should also be hidden */}
        <span hidden={true}>Something new</span>
      </>,
    );
  });

  // @gate experimental || www
  it('hides updated nodes inside an already hidden tree', async () => {
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <span>Hi</span>
        </Offscreen>,
      );
    });
    expect(root).toMatchRenderedOutput(<span hidden={true}>Hi</span>);

    // Set the `hidden` prop to on an already hidden node
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <span hidden={false}>Hi</span>
        </Offscreen>,
      );
    });
    // It should still be hidden, because the Offscreen container overrides it
    expect(root).toMatchRenderedOutput(<span hidden={true}>Hi</span>);

    // Unhide the boundary
    await act(async () => {
      root.render(
        <Offscreen mode="visible">
          <span hidden={true}>Hi</span>
        </Offscreen>,
      );
    });
    // It should still be hidden, because of the prop
    expect(root).toMatchRenderedOutput(<span hidden={true}>Hi</span>);

    // Remove the `hidden` prop
    await act(async () => {
      root.render(
        <Offscreen mode="visible">
          <span>Hi</span>
        </Offscreen>,
      );
    });
    // Now it's visible
    expect(root).toMatchRenderedOutput(<span>Hi</span>);
  });
});

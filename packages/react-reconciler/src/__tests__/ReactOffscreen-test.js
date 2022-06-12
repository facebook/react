let React;
let ReactNoop;
let Scheduler;
let act;
let LegacyHidden;
let Offscreen;
let useState;
let useLayoutEffect;
let useEffect;

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
    useEffect = React.useEffect;
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

  // Only works in new reconciler
  // @gate variant
  it('revealing a hidden tree at high priority does not cause tearing', async () => {
    // When revealing an offscreen tree, we need to include updates that were
    // previously deferred because the tree was hidden, even if they are lower
    // priority than the current render. However, we should *not* include low
    // priority updates that are entangled with updates outside of the hidden
    // tree, because that can cause tearing.
    //
    // This test covers a scenario where an update multiple updates inside a
    // hidden tree share the same lane, but are processed at different times
    // because of the timing of when they were scheduled.

    let setInner;
    function Child({outer}) {
      const [inner, _setInner] = useState(0);
      setInner = _setInner;

      useEffect(() => {
        // Inner and outer values are always updated simultaneously, so they
        // should always be consistent.
        if (inner !== outer) {
          Scheduler.unstable_yieldValue(
            'Tearing! Inner and outer are inconsistent!',
          );
        } else {
          Scheduler.unstable_yieldValue('Inner and outer are consistent');
        }
      }, [inner, outer]);

      return <Text text={'Inner: ' + inner} />;
    }

    let setOuter;
    function App({show}) {
      const [outer, _setOuter] = useState(0);
      setOuter = _setOuter;
      return (
        <>
          <Text text={'Outer: ' + outer} />
          <Offscreen mode={show ? 'visible' : 'hidden'}>
            <Child outer={outer} />
          </Offscreen>
        </>
      );
    }

    // Render a hidden tree
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App show={false} />);
    });
    expect(Scheduler).toHaveYielded([
      'Outer: 0',
      'Inner: 0',
      'Inner and outer are consistent',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Outer: 0" />
        <span hidden={true} prop="Inner: 0" />
      </>,
    );

    await act(async () => {
      // Update a value both inside and outside the hidden tree. These values
      // must always be consistent.
      setOuter(1);
      setInner(1);
      // Only the outer updates finishes because the inner update is inside a
      // hidden tree. The outer update is deferred to a later render.
      expect(Scheduler).toFlushUntilNextPaint(['Outer: 1']);
      expect(root).toMatchRenderedOutput(
        <>
          <span prop="Outer: 1" />
          <span hidden={true} prop="Inner: 0" />
        </>,
      );

      // Before the inner update can finish, we receive another pair of updates.
      setOuter(2);
      setInner(2);

      // Also, before either of these new updates are processed, the hidden
      // tree is revealed at high priority.
      ReactNoop.flushSync(() => {
        root.render(<App show={true} />);
      });

      expect(Scheduler).toHaveYielded([
        'Outer: 1',

        // There are two pending updates on Inner, but only the first one
        // is processed, even though they share the same lane. If the second
        // update were erroneously processed, then Inner would be inconsistent
        // with Outer.
        'Inner: 1',

        'Inner and outer are consistent',
      ]);
      expect(root).toMatchRenderedOutput(
        <>
          <span prop="Outer: 1" />
          <span prop="Inner: 1" />
        </>,
      );
    });
    expect(Scheduler).toHaveYielded([
      'Outer: 2',
      'Inner: 2',
      'Inner and outer are consistent',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Outer: 2" />
        <span prop="Inner: 2" />
      </>,
    );
  });
});

let React;
let ReactNoop;
let Scheduler;
let act;
let LegacyHidden;
let Offscreen;
let useState;
let useLayoutEffect;
let useEffect;
let useMemo;
let useRef;
let startTransition;

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
    useMemo = React.useMemo;
    useRef = React.useRef;
    startTransition = React.startTransition;
  });

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  // @gate enableLegacyHidden
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

  // @gate enableOffscreen
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

  // @gate enableOffscreen
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

  // @gate enableOffscreen
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

  // @gate enableOffscreen
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

  // @gate enableLegacyHidden
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

  // @gate enableOffscreen
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

  // @gate enableOffscreen
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

  // @gate enableOffscreen
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

    // This functions checks whether the "outer" and "inner" states are
    // consistent in the rendered output.
    let currentOuter = null;
    let currentInner = null;
    function areOuterAndInnerConsistent() {
      return (
        currentOuter === null ||
        currentInner === null ||
        currentOuter === currentInner
      );
    }

    let setInner;
    function Child() {
      const [inner, _setInner] = useState(0);
      setInner = _setInner;

      useEffect(() => {
        currentInner = inner;
        return () => {
          currentInner = null;
        };
      }, [inner]);

      return <Text text={'Inner: ' + inner} />;
    }

    let setOuter;
    function App({show}) {
      const [outer, _setOuter] = useState(0);
      setOuter = _setOuter;

      useEffect(() => {
        currentOuter = outer;
        return () => {
          currentOuter = null;
        };
      }, [outer]);

      return (
        <>
          <Text text={'Outer: ' + outer} />
          <Offscreen mode={show ? 'visible' : 'hidden'}>
            <Child />
          </Offscreen>
        </>
      );
    }

    // Render a hidden tree
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App show={false} />);
    });
    expect(Scheduler).toHaveYielded(['Outer: 0', 'Inner: 0']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Outer: 0" />
        <span hidden={true} prop="Inner: 0" />
      </>,
    );
    expect(areOuterAndInnerConsistent()).toBe(true);

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
      ]);
      expect(root).toMatchRenderedOutput(
        <>
          <span prop="Outer: 1" />
          <span prop="Inner: 1" />
        </>,
      );
      expect(areOuterAndInnerConsistent()).toBe(true);
    });
    expect(Scheduler).toHaveYielded(['Outer: 2', 'Inner: 2']);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Outer: 2" />
        <span prop="Inner: 2" />
      </>,
    );
    expect(areOuterAndInnerConsistent()).toBe(true);
  });

  // @gate enableOffscreen
  it('regression: Offscreen instance is sometimes null during setState', async () => {
    let setState;
    function Child() {
      const [state, _setState] = useState('Initial');
      setState = _setState;
      return <Text text={state} />;
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<Offscreen hidden={false} />);
    });
    expect(Scheduler).toHaveYielded([]);
    expect(root).toMatchRenderedOutput(null);

    await act(async () => {
      // Partially render a component
      startTransition(() => {
        root.render(
          <Offscreen hidden={false}>
            <Child />
            <Text text="Sibling" />
          </Offscreen>,
        );
      });
      expect(Scheduler).toFlushAndYieldThrough(['Initial']);

      // Before it finishes rendering, the whole tree gets deleted
      ReactNoop.flushSync(() => {
        root.render(null);
      });

      // Something attempts to update the never-mounted component. When this
      // regression test was written, we would walk up the component's return
      // path and reach an unmounted Offscreen component fiber. Its `stateNode`
      // would be null because it was nulled out when it was deleted, but there
      // was no null check before we accessed it. A weird edge case but we must
      // account for it.
      expect(() => {
        setState('Updated');
      }).toErrorDev(
        "Can't perform a React state update on a component that hasn't mounted yet",
      );
    });
    expect(root).toMatchRenderedOutput(null);
  });

  // @gate enableOffscreen
  it('class component setState callbacks do not fire until tree is visible', async () => {
    const root = ReactNoop.createRoot();

    let child;
    class Child extends React.Component {
      state = {text: 'A'};
      render() {
        child = this;
        return <Text text={this.state.text} />;
      }
    }

    // Initial render
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['A']);
    expect(root).toMatchRenderedOutput(<span hidden={true} prop="A" />);

    // Schedule an update to a hidden class component. The update will finish
    // rendering in the background, but the callback shouldn't fire yet, because
    // the component isn't visible.
    await act(async () => {
      child.setState({text: 'B'}, () => {
        Scheduler.unstable_yieldValue('B update finished');
      });
    });
    expect(Scheduler).toHaveYielded(['B']);
    expect(root).toMatchRenderedOutput(<span hidden={true} prop="B" />);

    // Now reveal the hidden component. Simultaneously, schedule another
    // update with a callback to the same component. When the component is
    // revealed, both the B callback and C callback should fire, in that order.
    await act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
      child.setState({text: 'C'}, () => {
        Scheduler.unstable_yieldValue('C update finished');
      });
    });
    expect(Scheduler).toHaveYielded([
      'C',
      'B update finished',
      'C update finished',
    ]);
    expect(root).toMatchRenderedOutput(<span prop="C" />);
  });

  // @gate enableOffscreen
  it('does not call componentDidUpdate when reappearing a hidden class component', async () => {
    class Child extends React.Component {
      componentDidMount() {
        Scheduler.unstable_yieldValue('componentDidMount');
      }
      componentDidUpdate() {
        Scheduler.unstable_yieldValue('componentDidUpdate');
      }
      componentWillUnmount() {
        Scheduler.unstable_yieldValue('componentWillUnmount');
      }
      render() {
        return 'Child';
      }
    }

    // Initial mount
    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['componentDidMount']);

    // Hide the class component
    await act(async () => {
      root.render(
        <Offscreen mode="hidden">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['componentWillUnmount']);

    // Reappear the class component. componentDidMount should fire, not
    // componentDidUpdate.
    await act(async () => {
      root.render(
        <Offscreen mode="visible">
          <Child />
        </Offscreen>,
      );
    });
    expect(Scheduler).toHaveYielded(['componentDidMount']);
  });

  // @gate enableOffscreen
  it(
    'when reusing old components (hidden -> visible), layout effects fire ' +
      'with same timing as if it were brand new',
    async () => {
      function Child({label}) {
        useLayoutEffect(() => {
          Scheduler.unstable_yieldValue('Mount ' + label);
          return () => {
            Scheduler.unstable_yieldValue('Unmount ' + label);
          };
        }, [label]);
        return label;
      }

      // Initial mount
      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(
          <Offscreen mode="visible">
            <Child key="B" label="B" />
          </Offscreen>,
        );
      });
      expect(Scheduler).toHaveYielded(['Mount B']);

      // Hide the component
      await act(async () => {
        root.render(
          <Offscreen mode="hidden">
            <Child key="B" label="B" />
          </Offscreen>,
        );
      });
      expect(Scheduler).toHaveYielded(['Unmount B']);

      // Reappear the component and also add some new siblings.
      await act(async () => {
        root.render(
          <Offscreen mode="visible">
            <Child key="A" label="A" />
            <Child key="B" label="B" />
            <Child key="C" label="C" />
          </Offscreen>,
        );
      });
      // B's effect should fire in between A and C even though it's been reused
      // from a previous render. In other words, it's the same order as if all
      // three siblings were brand new.
      expect(Scheduler).toHaveYielded(['Mount A', 'Mount B', 'Mount C']);
    },
  );

  // @gate enableOffscreen
  it(
    'when reusing old components (hidden -> visible), layout effects fire ' +
      'with same timing as if it were brand new (includes setState callback)',
    async () => {
      class Child extends React.Component {
        componentDidMount() {
          Scheduler.unstable_yieldValue('Mount ' + this.props.label);
        }
        componentWillUnmount() {
          Scheduler.unstable_yieldValue('Unmount ' + this.props.label);
        }
        render() {
          return this.props.label;
        }
      }

      // Initial mount
      const bRef = React.createRef();
      const root = ReactNoop.createRoot();
      await act(async () => {
        root.render(
          <Offscreen mode="visible">
            <Child key="B" ref={bRef} label="B" />
          </Offscreen>,
        );
      });
      expect(Scheduler).toHaveYielded(['Mount B']);

      // We're going to schedule an update on a hidden component, so stash a
      // reference to its setState before the ref gets detached
      const setStateB = bRef.current.setState.bind(bRef.current);

      // Hide the component
      await act(async () => {
        root.render(
          <Offscreen mode="hidden">
            <Child key="B" ref={bRef} label="B" />
          </Offscreen>,
        );
      });
      expect(Scheduler).toHaveYielded(['Unmount B']);

      // Reappear the component and also add some new siblings.
      await act(async () => {
        setStateB(null, () => {
          Scheduler.unstable_yieldValue('setState callback B');
        });
        root.render(
          <Offscreen mode="visible">
            <Child key="A" label="A" />
            <Child key="B" ref={bRef} label="B" />
            <Child key="C" label="C" />
          </Offscreen>,
        );
      });
      // B's effect should fire in between A and C even though it's been reused
      // from a previous render. In other words, it's the same order as if all
      // three siblings were brand new.
      expect(Scheduler).toHaveYielded([
        'Mount A',
        'Mount B',
        'setState callback B',
        'Mount C',
      ]);
    },
  );

  // @gate enableOffscreen
  it('defer passive effects when prerendering a new Offscreen tree', async () => {
    function Child({label}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Unmount ' + label);
        };
      }, [label]);
      return <Text text={label} />;
    }

    function App({showMore}) {
      return (
        <>
          <Child label="Shell" />
          <Offscreen mode={showMore ? 'visible' : 'hidden'}>
            <Child label="More" />
          </Offscreen>
        </>
      );
    }

    const root = ReactNoop.createRoot();

    // Mount the app without showing the extra content
    await act(async () => {
      root.render(<App showMore={false} />);
    });
    expect(Scheduler).toHaveYielded([
      // First mount the outer visible shell
      'Shell',
      'Mount Shell',

      // Then prerender the hidden extra context. The passive effects in the
      // hidden tree should not fire
      'More',
      // Does not fire
      // 'Mount More',
    ]);
    // The hidden content has been prerendered
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Shell" />
        <span hidden={true} prop="More" />
      </>,
    );

    // Reveal the prerendered tree
    await act(async () => {
      root.render(<App showMore={true} />);
    });
    expect(Scheduler).toHaveYielded([
      'Shell',
      'More',

      // Mount the passive effects in the newly revealed tree, the ones that
      // were skipped during pre-rendering.
      'Mount More',
    ]);
  });

  // @gate enableOffscreen
  it('passive effects are connected and disconnected when the visibility changes', async () => {
    function Child({step}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue(`Commit mount [${step}]`);
        return () => {
          Scheduler.unstable_yieldValue(`Commit unmount [${step}]`);
        };
      }, [step]);
      return <Text text={step} />;
    }

    function App({show, step}) {
      return (
        <Offscreen mode={show ? 'visible' : 'hidden'}>
          {useMemo(
            () => (
              <Child step={step} />
            ),
            [step],
          )}
        </Offscreen>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App show={true} step={1} />);
    });
    expect(Scheduler).toHaveYielded([1, 'Commit mount [1]']);
    expect(root).toMatchRenderedOutput(<span prop={1} />);

    // Hide the tree. This will unmount the effect.
    await act(async () => {
      root.render(<App show={false} step={1} />);
    });
    expect(Scheduler).toHaveYielded(['Commit unmount [1]']);
    expect(root).toMatchRenderedOutput(<span hidden={true} prop={1} />);

    // Update.
    await act(async () => {
      root.render(<App show={false} step={2} />);
    });
    // The update is prerendered but no effects are fired
    expect(Scheduler).toHaveYielded([2]);
    expect(root).toMatchRenderedOutput(<span hidden={true} prop={2} />);

    // Reveal the tree.
    await act(async () => {
      root.render(<App show={true} step={2} />);
    });
    // The update doesn't render because it was already prerendered, but we do
    // fire the effect.
    expect(Scheduler).toHaveYielded(['Commit mount [2]']);
    expect(root).toMatchRenderedOutput(<span prop={2} />);
  });

  // @gate enableOffscreen
  it('passive effects are unmounted on hide in the same order as during a deletion: parent before child', async () => {
    function Child({label}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount Child');
        return () => {
          Scheduler.unstable_yieldValue('Unmount Child');
        };
      }, []);
      return <div>Hi</div>;
    }
    function Parent() {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount Parent');
        return () => {
          Scheduler.unstable_yieldValue('Unmount Parent');
        };
      }, []);
      return <Child />;
    }

    function App({show}) {
      return (
        <Offscreen mode={show ? 'visible' : 'hidden'}>
          <Parent />
        </Offscreen>
      );
    }

    const root = ReactNoop.createRoot();
    await act(async () => {
      root.render(<App show={true} />);
    });
    expect(Scheduler).toHaveYielded(['Mount Child', 'Mount Parent']);

    // First demonstrate what happens during a normal deletion
    await act(async () => {
      root.render(null);
    });
    expect(Scheduler).toHaveYielded(['Unmount Parent', 'Unmount Child']);

    // Now redo the same thing but hide instead of deleting
    await act(async () => {
      root.render(<App show={true} />);
    });
    expect(Scheduler).toHaveYielded(['Mount Child', 'Mount Parent']);
    await act(async () => {
      root.render(<App show={false} />);
    });
    // The order is the same as during a deletion: parent before child
    expect(Scheduler).toHaveYielded(['Unmount Parent', 'Unmount Child']);
  });

  // TODO: As of now, there's no way to hide a tree without also unmounting its
  // effects. (Except for Suspense, which has its own tests associated with it.)
  // Re-enable this test once we add this ability. For example, we'll likely add
  // either an option or a heuristic to mount passive effects inside a hidden
  // tree after a delay.
  // @gate enableOffscreen
  it.skip("don't defer passive effects when prerendering in a tree whose effects are already connected", async () => {
    function Child({label}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Unmount ' + label);
        };
      }, [label]);
      return <Text text={label} />;
    }

    function App({showMore, step}) {
      return (
        <>
          <Child label={'Shell ' + step} />
          <Offscreen mode={showMore ? 'visible' : 'hidden'}>
            <Child label={'More ' + step} />
          </Offscreen>
        </>
      );
    }

    const root = ReactNoop.createRoot();

    // Mount the app, including the extra content
    await act(async () => {
      root.render(<App showMore={true} step={1} />);
    });
    expect(Scheduler).toHaveYielded([
      'Shell 1',
      'More 1',
      'Mount Shell 1',
      'Mount More 1',
    ]);
    expect(root).toMatchRenderedOutput(
      <>
        <span prop="Shell 1" />
        <span prop="More 1" />
      </>,
    );

    // Hide the extra content. while also updating one of its props
    await act(async () => {
      root.render(<App showMore={false} step={2} />);
    });
    expect(Scheduler).toHaveYielded([
      // First update the outer visible shell
      'Shell 2',
      'Unmount Shell 1',
      'Mount Shell 2',

      // Then prerender the update to the hidden content. Since the effects
      // are already connected inside the hidden tree, we don't defer updates
      // to them.
      'More 2',
      'Unmount More 1',
      'Mount More 2',
    ]);
  });

  // @gate enableOffscreen
  it('does not mount effects when prerendering a nested Offscreen boundary', async () => {
    function Child({label}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Unmount ' + label);
        };
      }, [label]);
      return <Text text={label} />;
    }

    function App({showOuter, showInner}) {
      return (
        <Offscreen mode={showOuter ? 'visible' : 'hidden'}>
          {useMemo(
            () => (
              <div>
                <Child label="Outer" />
                {showInner ? (
                  <Offscreen mode="visible">
                    <div>
                      <Child label="Inner" />
                    </div>
                  </Offscreen>
                ) : null}
              </div>
            ),
            [showInner],
          )}
        </Offscreen>
      );
    }

    const root = ReactNoop.createRoot();

    // Prerender the outer contents. No effects should mount.
    await act(async () => {
      root.render(<App showOuter={false} showInner={false} />);
    });
    expect(Scheduler).toHaveYielded(['Outer']);
    expect(root).toMatchRenderedOutput(
      <div hidden={true}>
        <span prop="Outer" />
      </div>,
    );

    // Prerender the inner contents. No effects should mount.
    await act(async () => {
      root.render(<App showOuter={false} showInner={true} />);
    });
    expect(Scheduler).toHaveYielded(['Outer', 'Inner']);
    expect(root).toMatchRenderedOutput(
      <div hidden={true}>
        <span prop="Outer" />
        <div>
          <span prop="Inner" />
        </div>
      </div>,
    );

    // Reveal the prerendered tree
    await act(async () => {
      root.render(<App showOuter={true} showInner={true} />);
    });
    // The effects fire, but the tree is not re-rendered because it already
    // prerendered.
    expect(Scheduler).toHaveYielded(['Mount Outer', 'Mount Inner']);
    expect(root).toMatchRenderedOutput(
      <div>
        <span prop="Outer" />
        <div>
          <span prop="Inner" />
        </div>
      </div>,
    );
  });

  // @gate enableOffscreen
  it('reveal an outer Offscreen boundary without revealing an inner one', async () => {
    function Child({label}) {
      useEffect(() => {
        Scheduler.unstable_yieldValue('Mount ' + label);
        return () => {
          Scheduler.unstable_yieldValue('Unmount ' + label);
        };
      }, [label]);
      return <Text text={label} />;
    }

    function App({showOuter, showInner}) {
      return (
        <Offscreen mode={showOuter ? 'visible' : 'hidden'}>
          {useMemo(
            () => (
              <div>
                <Child label="Outer" />
                <Offscreen mode={showInner ? 'visible' : 'hidden'}>
                  <div>
                    <Child label="Inner" />
                  </div>
                </Offscreen>
              </div>
            ),
            [showInner],
          )}
        </Offscreen>
      );
    }

    const root = ReactNoop.createRoot();

    // Prerender the whole tree.
    await act(async () => {
      root.render(<App showOuter={false} showInner={false} />);
    });
    expect(Scheduler).toHaveYielded(['Outer', 'Inner']);
    // Both the inner and the outer tree should be hidden. Hiding the inner tree
    // is arguably redundant, but the advantage of hiding both is that later you
    // can reveal the outer tree without having to examine the inner one.
    expect(root).toMatchRenderedOutput(
      <div hidden={true}>
        <span prop="Outer" />
        <div hidden={true}>
          <span prop="Inner" />
        </div>
      </div>,
    );

    // Reveal the outer contents. The inner tree remains hidden.
    await act(async () => {
      root.render(<App showOuter={true} showInner={false} />);
    });
    expect(Scheduler).toHaveYielded(['Mount Outer']);
    expect(root).toMatchRenderedOutput(
      <div>
        <span prop="Outer" />
        <div hidden={true}>
          <span prop="Inner" />
        </div>
      </div>,
    );
  });

  describe('manual interactivity', () => {
    // @gate enableOffscreen
    it('should attach ref only for mode null', async () => {
      let offscreenRef;

      function App({mode}) {
        offscreenRef = useRef(null);
        return (
          <Offscreen
            mode={mode}
            ref={ref => {
              offscreenRef.current = ref;
            }}>
            <div />
          </Offscreen>
        );
      }

      const root = ReactNoop.createRoot();

      await act(async () => {
        root.render(<App mode={'manual'} />);
      });

      expect(offscreenRef.current).not.toBeNull();

      await act(async () => {
        root.render(<App mode={'visible'} />);
      });

      expect(offscreenRef.current).toBeNull();

      await act(async () => {
        root.render(<App mode={'hidden'} />);
      });

      expect(offscreenRef.current).toBeNull();

      await act(async () => {
        root.render(<App mode={'manual'} />);
      });

      expect(offscreenRef.current).not.toBeNull();
    });
  });

  // @gate enableOffscreen
  it('should detach ref if Offscreen is unmounted', async () => {
    let offscreenRef;

    function App({showOffscreen}) {
      offscreenRef = useRef(null);
      return showOffscreen ? (
        <Offscreen
          mode={'manual'}
          ref={ref => {
            offscreenRef.current = ref;
          }}>
          <div />
        </Offscreen>
      ) : null;
    }

    const root = ReactNoop.createRoot();

    await act(async () => {
      root.render(<App showOffscreen={true} />);
    });

    expect(offscreenRef.current).not.toBeNull();

    await act(async () => {
      root.render(<App showOffscreen={false} />);
    });

    expect(offscreenRef.current).toBeNull();

    await act(async () => {
      root.render(<App showOffscreen={true} />);
    });

    expect(offscreenRef.current).not.toBeNull();
  });

  // @gate enableOffscreen
  it('should detach ref when parent Offscreen is hidden', async () => {
    let offscreenRef;

    function App({mode}) {
      offscreenRef = useRef(null);
      return (
        <Offscreen mode={mode}>
          <Offscreen mode={'manual'} ref={offscreenRef}>
            <div />
          </Offscreen>
        </Offscreen>
      );
    }

    const root = ReactNoop.createRoot();

    await act(async () => {
      root.render(<App mode={'hidden'} />);
    });

    expect(offscreenRef.current).toBeNull();

    await act(async () => {
      root.render(<App mode={'visible'} />);
    });

    expect(offscreenRef.current).not.toBeNull();

    await act(async () => {
      root.render(<App mode={'hidden'} />);
    });

    expect(offscreenRef.current).toBeNull();
  });

  // TODO: When attach/detach methods are implemented. Add tests for nested Offscreen case.
});

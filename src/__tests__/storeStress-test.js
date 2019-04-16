// @flow

describe('StoreStress', () => {
  let React;
  let ReactDOM;
  let TestUtils;
  let bridge;
  let store;
  let print;

  const act = (callback: Function) => {
    TestUtils.act(() => {
      callback();
    });
    jest.runAllTimers(); // Flush Bridge operations
  };

  beforeEach(() => {
    bridge = global.bridge;
    store = global.store;

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');

    print = require('./storeSerializer').print;
  });

  // This is a stress test for the tree mount/update/unmount traversal.
  // It renders different trees that should produce the same output.
  it('should handle a stress test with different tree operations', () => {
    let setShowX;
    const A = () => 'a';
    const B = () => 'b';
    const C = () => {
      // We'll be manually flipping this component back and forth in the test.
      // We only do this for a single node in order to verify that DevTools
      // can handle a subtree switching alternates while other subtrees are memoized.
      let [showX, _setShowX] = React.useState(false);
      setShowX = _setShowX;
      return showX ? <X /> : 'c';
    };
    const D = () => 'd';
    const E = () => 'e';
    const X = () => 'x';
    const a = <A key="a" />;
    const b = <B key="b" />;
    const c = <C key="c" />;
    const d = <D key="d" />;
    const e = <E key="e" />;

    function Parent({ children }) {
      return children;
    }

    // 1. Render a normal version of [a, b, c, d, e].
    let container = document.createElement('div');
    act(() => ReactDOM.render(<Parent>{[a, b, c, d, e]}</Parent>, container));
    expect(store).toMatchSnapshot('1: abcde');
    expect(container.textContent).toMatch('abcde');
    const snapshotForABCDE = print(store);

    // 2. Render a version where <C /> renders an <X /> child instead of 'c'.
    // This is how we'll test an update to a single component.
    act(() => {
      setShowX(true);
    });
    expect(store).toMatchSnapshot('2: abxde');
    expect(container.textContent).toMatch('abxde');
    const snapshotForABXDE = print(store);

    // 3. Verify flipping it back produces the original result.
    act(() => {
      setShowX(false);
    });
    expect(container.textContent).toMatch('abcde');
    expect(print(store)).toBe(snapshotForABCDE);

    // 4. Clean up.
    act(() => ReactDOM.unmountComponentAtNode(container));
    expect(print(store)).toBe('');

    // Now comes the interesting part.
    // All of these cases are equivalent to [a, b, c, d, e] in output.
    // We'll verify that DevTools produces the same snapshots for them.
    // These cases are picked so that rendering them sequentially in the same
    // container results in a combination of mounts, updates, unmounts, and reorders.
    // prettier-ignore
    let cases = [
      [a, b, c, d, e],
      [[a], b, c, d, e],
      [[a, b], c, d, e],
      [[a, b], c, [d, e]],
      [[a, b], c, [d, '', e]],
      [[a], b, c, d, [e]],
      [a, b, [[c]], d, e],
      [[a, ''], [b], [c], [d], [e]],
      [a, b, [c, [d, ['', e]]]],
      [a, b, c, d, e],
      [<div key="0">{a}</div>, b, c, d, e],
      [<div key="0">{a}{b}</div>, c, d, e],
      [<div key="0">{a}{b}</div>, c, <div key="1">{d}{e}</div>],
      [<div key="1">{a}{b}</div>, c, <div key="0">{d}{e}</div>],
      [<div key="0">{a}{b}</div>, c, <div key="1">{d}{e}</div>],
      [<div key="2">{a}{b}</div>, c, <div key="3">{d}{e}</div>],
      [<span key="0">{a}</span>, b, c, d, [e]],
      [a, b, <span key="0"><span>{c}</span></span>, d, e],
      [<div key="0">{a}</div>, [b], <span key="1">{c}</span>, [d], <div key="2">{e}</div>],
      [a, b, [c, <div key="0">{d}<span>{e}</span></div>], ''],
      [a, [[]], b, c, [d, [[]], e]],
      [[[a, b, c, d], e]],
      [a, b, c, d, e]
    ];

    // 5. Test fresh mount for each case.
    for (let i = 0; i < cases.length; i++) {
      // Ensure fresh mount.
      container = document.createElement('div');

      // Verify mounting 'abcde'.
      act(() => ReactDOM.render(<Parent>{cases[i]}</Parent>, container));
      expect(container.textContent).toMatch('abcde');
      expect(print(store)).toEqual(snapshotForABCDE);

      // Verify switching to 'abxde'.
      act(() => {
        setShowX(true);
      });
      expect(container.textContent).toMatch('abxde');
      expect(print(store)).toBe(snapshotForABXDE);

      // Verify switching back to 'abcde'.
      act(() => {
        setShowX(false);
      });
      expect(container.textContent).toMatch('abcde');
      expect(print(store)).toBe(snapshotForABCDE);

      // Clean up.
      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(print(store)).toBe('');
    }

    // 6. Verify *updates* by reusing the container between iterations.
    // There'll be no unmounting until the very end.
    container = document.createElement('div');
    for (let i = 0; i < cases.length; i++) {
      // Verify mounting 'abcde'.
      act(() => ReactDOM.render(<Parent>{cases[i]}</Parent>, container));
      expect(container.textContent).toMatch('abcde');
      expect(print(store)).toEqual(snapshotForABCDE);

      // Verify switching to 'abxde'.
      act(() => {
        setShowX(true);
      });
      expect(container.textContent).toMatch('abxde');
      expect(print(store)).toBe(snapshotForABXDE);

      // Verify switching back to 'abcde'.
      act(() => {
        setShowX(false);
      });
      expect(container.textContent).toMatch('abcde');
      expect(print(store)).toBe(snapshotForABCDE);
      // Don't unmount. Reuse the container between iterations.
    }
    act(() => ReactDOM.unmountComponentAtNode(container));
    expect(print(store)).toBe('');

    // 7. Same as the previous step, but for Concurrent Mode.
    container = document.createElement('div');
    // $FlowFixMe
    let root = ReactDOM.unstable_createRoot(container);
    for (let i = 0; i < cases.length; i++) {
      // Verify mounting 'abcde'.
      act(() => root.render(<Parent>{cases[i]}</Parent>));
      expect(container.textContent).toMatch('abcde');
      expect(print(store)).toEqual(snapshotForABCDE);

      // Verify switching to 'abxde'.
      act(() => {
        setShowX(true);
      });
      expect(container.textContent).toMatch('abxde');
      expect(print(store)).toBe(snapshotForABXDE);

      // Verify switching back to 'abcde'.
      act(() => {
        setShowX(false);
      });
      expect(container.textContent).toMatch('abcde');
      expect(print(store)).toBe(snapshotForABCDE);
      // Don't unmount. Reuse the container between iterations.
    }
    act(() => root.unmount());
    expect(print(store)).toBe('');
  });

  it('should handle stress test with reordering', () => {
    const A = () => 'a';
    const B = () => 'b';
    const C = () => 'c';
    const D = () => 'd';
    const E = () => 'e';
    const a = <A key="a" />;
    const b = <B key="b" />;
    const c = <C key="c" />;
    const d = <D key="d" />;
    const e = <E key="e" />;

    // prettier-ignore
    let steps = [
      a,
      b,
      c,
      d,
      e,
      [a],
      [b],
      [c],
      [d],
      [e],
      [a, b],
      [b, a],
      [b, c],
      [c, b],
      [a, c],
      [c, a],
    ];

    const Root = ({ children }) => {
      return children;
    };

    // 1. Capture the expected render result.
    let snapshots = [];
    let container = document.createElement('div');
    for (let i = 0; i < steps.length; i++) {
      act(() => ReactDOM.render(<Root>{steps[i]}</Root>, container));
      // We snapshot each step once so it doesn't regress.
      expect(store).toMatchSnapshot();
      snapshots.push(print(store));
      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(print(store)).toBe('');
    }

    // 2. Verify that we can update from every step to every other step and back.
    for (let i = 0; i < steps.length; i++) {
      for (let j = 0; j < steps.length; j++) {
        let container = document.createElement('div');
        act(() => ReactDOM.render(<Root>{steps[i]}</Root>, container));
        expect(print(store)).toMatch(snapshots[i]);
        act(() => ReactDOM.render(<Root>{steps[j]}</Root>, container));
        expect(print(store)).toMatch(snapshots[j]);
        act(() => ReactDOM.render(<Root>{steps[i]}</Root>, container));
        expect(print(store)).toMatch(snapshots[i]);
        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(print(store)).toBe('');
      }
    }

    // 3. Same test as above, but this time we wrap children in a host component.
    for (let i = 0; i < steps.length; i++) {
      for (let j = 0; j < steps.length; j++) {
        let container = document.createElement('div');
        act(() =>
          ReactDOM.render(
            <Root>
              <div>{steps[i]}</div>
            </Root>,
            container
          )
        );
        expect(print(store)).toMatch(snapshots[i]);
        act(() =>
          ReactDOM.render(
            <Root>
              <div>{steps[j]}</div>
            </Root>,
            container
          )
        );
        expect(print(store)).toMatch(snapshots[j]);
        act(() =>
          ReactDOM.render(
            <Root>
              <div>{steps[i]}</div>
            </Root>,
            container
          )
        );
        expect(print(store)).toMatch(snapshots[i]);
        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(print(store)).toBe('');
      }
    }
  });

  it('should handle a stress test for Suspense', async () => {
    const A = () => 'a';
    const B = () => 'b';
    const C = () => 'c';
    const X = () => 'x';
    const Y = () => 'y';
    const Z = () => 'z';
    const a = <A key="a" />;
    const b = <B key="b" />;
    const c = <C key="c" />;
    // const x = <X key="x" />;
    // const y = <Y key="y" />;
    const z = <Z key="z" />;

    // prettier-ignore
    const steps = [
      a,
      [a],
      [a, b, c],
      [c, b, a],
      [c, null, a],
      <React.Fragment>{c}{a}</React.Fragment>,
      <div>{c}{a}</div>,
      <div><span>{a}</span>{b}</div>,
      [[a]],
      null,
      b,
      a
    ];

    const Never = () => {
      throw new Promise(() => {});
    };

    const Root = ({ children }) => {
      return children;
    };

    // 1. For each step, check Suspense can render them as initial primary content.
    // This is the only step where we use Jest snapshots.
    let snapshots = [];
    let container = document.createElement('div');
    for (let i = 0; i < steps.length; i++) {
      act(() =>
        ReactDOM.render(
          <Root>
            <X />
            <React.Suspense fallback={z}>{steps[i]}</React.Suspense>
            <Y />
          </Root>,
          container
        )
      );
      // We snapshot each step once so it doesn't regress.
      expect(store).toMatchSnapshot();
      snapshots.push(print(store));
      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(print(store)).toBe('');
    }

    // 2. Verify check Suspense can render same steps as initial fallback content.
    for (let i = 0; i < steps.length; i++) {
      act(() =>
        ReactDOM.render(
          <Root>
            <X />
            <React.Suspense fallback={steps[i]}>
              <Z />
              <Never />
              <Z />
            </React.Suspense>
            <Y />
          </Root>,
          container
        )
      );
      expect(print(store)).toEqual(snapshots[i]);
      act(() => ReactDOM.unmountComponentAtNode(container));
      expect(print(store)).toBe('');
    }

    // 3. Verify we can update from each step to each step in primary mode.
    for (let i = 0; i < steps.length; i++) {
      for (let j = 0; j < steps.length; j++) {
        // Always start with a fresh container and steps[i].
        container = document.createElement('div');
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={z}>{steps[i]}</React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[i]);
        // Re-render with steps[j].
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={z}>{steps[j]}</React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        // Verify the successful transition to steps[j].
        expect(print(store)).toEqual(snapshots[j]);
        // Check that we can transition back again.
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={z}>{steps[i]}</React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[i]);
        // Clean up after every iteration.
        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(print(store)).toBe('');
      }
    }

    // 4. Verify we can update from each step to each step in fallback mode.
    for (let i = 0; i < steps.length; i++) {
      for (let j = 0; j < steps.length; j++) {
        // Always start with a fresh container and steps[i].
        container = document.createElement('div');
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[i]}>
                <Z />
                <Never />
                <Z />
              </React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[i]);
        // Re-render with steps[j].
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[j]}>
                <Z />
                <Never />
                <Z />
              </React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        // Verify the successful transition to steps[j].
        expect(print(store)).toEqual(snapshots[j]);
        // Check that we can transition back again.
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[i]}>
                <Z />
                <Never />
                <Z />
              </React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[i]);
        // Clean up after every iteration.
        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(print(store)).toBe('');
      }
    }

    // 5. Verify we can update from each step to each step when moving primary -> fallback.
    for (let i = 0; i < steps.length; i++) {
      for (let j = 0; j < steps.length; j++) {
        // Always start with a fresh container and steps[i].
        container = document.createElement('div');
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={z}>{steps[i]}</React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[i]);
        // Re-render with steps[j].
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[j]}>
                <Z />
                <Never />
                <Z />
              </React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        // Verify the successful transition to steps[j].
        expect(print(store)).toEqual(snapshots[j]);
        // Check that we can transition back again.
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={z}>{steps[i]}</React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[i]);
        // Clean up after every iteration.
        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(print(store)).toBe('');
      }
    }

    // 6. Verify we can update from each step to each step when moving fallback -> primary.
    for (let i = 0; i < steps.length; i++) {
      for (let j = 0; j < steps.length; j++) {
        // Always start with a fresh container and steps[i].
        container = document.createElement('div');
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[i]}>
                <Z />
                <Never />
                <Z />
              </React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[i]);
        // Re-render with steps[j].
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={z}>{steps[j]}</React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        // Verify the successful transition to steps[j].
        expect(print(store)).toEqual(snapshots[j]);
        // Check that we can transition back again.
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[i]}>
                <Z />
                <Never />
                <Z />
              </React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[i]);
        // Clean up after every iteration.
        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(print(store)).toBe('');
      }
    }

    // 7. Verify we can update from each step to each step when toggling Suspense.
    for (let i = 0; i < steps.length; i++) {
      for (let j = 0; j < steps.length; j++) {
        // Always start with a fresh container and steps[i].
        container = document.createElement('div');
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[j]}>{steps[i]}</React.Suspense>
              <Y />
            </Root>,
            container
          )
        );

        // We get ID from the index in the tree above:
        // Root, X, Suspense, ...
        //          ^ (index is 2)
        const suspenseID = store.getElementIDAtIndex(2);

        // Force fallback.
        expect(print(store)).toEqual(snapshots[i]);
        act(() => {
          const suspenseID = store.getElementIDAtIndex(2);
          bridge.send('overrideSuspense', {
            id: suspenseID,
            rendererID: store.getRendererIDForElement(suspenseID),
            forceFallback: true,
          });
        });
        expect(print(store)).toEqual(snapshots[j]);

        // Stop forcing fallback.
        act(() => {
          bridge.send('overrideSuspense', {
            id: suspenseID,
            rendererID: store.getRendererIDForElement(suspenseID),
            forceFallback: false,
          });
        });
        expect(print(store)).toEqual(snapshots[i]);

        // Trigger actual fallback.
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[j]}>
                <Z />
                <Never />
                <Z />
              </React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        expect(print(store)).toEqual(snapshots[j]);

        // Force fallback while we're in fallback mode.
        act(() => {
          bridge.send('overrideSuspense', {
            id: suspenseID,
            rendererID: store.getRendererIDForElement(suspenseID),
            forceFallback: true,
          });
        });
        // Keep seeing fallback content.
        expect(print(store)).toEqual(snapshots[j]);

        // Switch to primary mode.
        act(() =>
          ReactDOM.render(
            <Root>
              <X />
              <React.Suspense fallback={steps[j]}>{steps[i]}</React.Suspense>
              <Y />
            </Root>,
            container
          )
        );
        // Fallback is still forced though.
        expect(print(store)).toEqual(snapshots[j]);

        // Stop forcing fallback. This reverts to primary content.
        act(() => {
          bridge.send('overrideSuspense', {
            id: suspenseID,
            rendererID: store.getRendererIDForElement(suspenseID),
            forceFallback: false,
          });
        });
        // Now we see primary content.
        expect(print(store)).toEqual(snapshots[i]);

        // Clean up after every iteration.
        act(() => ReactDOM.unmountComponentAtNode(container));
        expect(print(store)).toBe('');
      }
    }
    // TODO: Test Concurrent Mode
  });
});

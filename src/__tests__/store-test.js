// @flow

describe('Store', () => {
  let React;
  let ReactDOM;
  let TestUtils;
  let store;
  let print;

  const act = (callback: Function) => {
    TestUtils.act(() => {
      callback();
    });
    jest.runAllTimers(); // Flush Bridge operations
  };

  beforeEach(() => {
    store = global.store;

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');

    print = require('./storeSerializer').print;
  });

  it('should support mount and update operations', () => {
    const Grandparent = ({ count }) => (
      <React.Fragment>
        <Parent count={count} />
        <Parent count={count} />
      </React.Fragment>
    );
    const Parent = ({ count }) =>
      new Array(count).fill(true).map((_, index) => <Child key={index} />);
    const Child = () => <div>Hi!</div>;

    const container = document.createElement('div');

    act(() => ReactDOM.render(<Grandparent count={4} />, container));
    expect(store).toMatchSnapshot('1: mount');

    act(() => ReactDOM.render(<Grandparent count={2} />, container));
    expect(store).toMatchSnapshot('2: update');

    act(() => ReactDOM.unmountComponentAtNode(container));
    expect(store).toMatchSnapshot('3: unmount');
  });

  it('should support mount and update operations for multiple roots', () => {
    const Parent = ({ count }) =>
      new Array(count).fill(true).map((_, index) => <Child key={index} />);
    const Child = () => <div>Hi!</div>;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    act(() => {
      ReactDOM.render(<Parent key="A" count={3} />, containerA);
      ReactDOM.render(<Parent key="B" count={2} />, containerB);
    });
    expect(store).toMatchSnapshot('1: mount');

    act(() => {
      ReactDOM.render(<Parent key="A" count={4} />, containerA);
      ReactDOM.render(<Parent key="B" count={1} />, containerB);
    });
    expect(store).toMatchSnapshot('2: update');

    act(() => ReactDOM.unmountComponentAtNode(containerB));
    expect(store).toMatchSnapshot('3: unmount B');

    act(() => ReactDOM.unmountComponentAtNode(containerA));
    expect(store).toMatchSnapshot('4: unmount A');
  });

  it('should filter DOM nodes from the store tree', () => {
    const Grandparent = () => (
      <div>
        <div>
          <Parent />
        </div>
        <Parent />
      </div>
    );
    const Parent = () => (
      <div>
        <Child />
      </div>
    );
    const Child = () => <div>Hi!</div>;

    act(() =>
      ReactDOM.render(<Grandparent count={4} />, document.createElement('div'))
    );
    expect(store).toMatchSnapshot('1: mount');
  });

  // TODO We should write more complex Suspense tests than just this
  it('should display Suspense nodes properly in various states', async done => {
    const Loading = () => <div>Loading...</div>;
    const SuspendingComponent = () => {
      throw new Promise(() => {});
    };
    const Component = () => {
      return <div>Hello</div>;
    };
    const Wrapper = ({ shouldSuspense }) => (
      <React.Fragment>
        <Component key="Outside" />
        <React.Suspense fallback={<Loading />}>
          {shouldSuspense ? (
            <SuspendingComponent />
          ) : (
            <Component key="Inside" />
          )}
        </React.Suspense>
      </React.Fragment>
    );

    const container = document.createElement('div');
    act(() => ReactDOM.render(<Wrapper shouldSuspense={true} />, container));
    expect(store).toMatchSnapshot('1: loading');

    act(async () => {
      ReactDOM.render(<Wrapper shouldSuspense={false} />, container);
    });
    expect(store).toMatchSnapshot('2: resolved');

    done();
  });

  it('should support collapsing parts of the tree', () => {
    const Grandparent = ({ count }) => (
      <React.Fragment>
        <Parent count={count} />
        <Parent count={count} />
      </React.Fragment>
    );
    const Parent = ({ count }) =>
      new Array(count).fill(true).map((_, index) => <Child key={index} />);
    const Child = () => <div>Hi!</div>;

    act(() =>
      ReactDOM.render(<Grandparent count={2} />, document.createElement('div'))
    );
    expect(store).toMatchSnapshot('1: mount');

    const grandparentID = store.getElementIDAtIndex(0);
    const parentOneID = store.getElementIDAtIndex(1);
    const parentTwoID = store.getElementIDAtIndex(4);

    act(() => store.toggleIsCollapsed(parentOneID, true));
    expect(store).toMatchSnapshot('2: collapse first Parent');

    act(() => store.toggleIsCollapsed(parentTwoID, true));
    expect(store).toMatchSnapshot('3: collapse second Parent');

    act(() => store.toggleIsCollapsed(parentOneID, false));
    expect(store).toMatchSnapshot('4: expand first Parent');

    act(() => store.toggleIsCollapsed(grandparentID, true));
    expect(store).toMatchSnapshot('5: collapse Grandparent');

    act(() => store.toggleIsCollapsed(grandparentID, false));
    expect(store).toMatchSnapshot('6: expand Grandparent');
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
});

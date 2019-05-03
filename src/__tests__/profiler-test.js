// @flow

describe('Profiler', () => {
  let React;
  let ReactDOM;
  let TestRenderer;
  let TestUtils;
  let agent;
  let store;

  const act = (callback: Function) => {
    TestUtils.act(() => {
      callback();
    });
    jest.runAllTimers(); // Flush Bridge operations
  };

  const renderAndResolve = async (root, element) => {
    // $FlowFixMe Flow doens't know about "await act()" yet
    await TestUtils.act(async () => {
      root.update(element);

      // Resolve pending suspense promises
      jest.runAllTimers();
    });

    // Re-render after resolved promises
    jest.runAllTimers();
  };

  beforeEach(() => {
    agent = global.agent;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');

    // Hide the hook before requiring TestRenderer, so we don't end up with a loop.
    const hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    delete global.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    TestRenderer = require('react-test-renderer');
    global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook;
  });

  it('should collect basic profiling metrics', async done => {
    const Parent = ({ count }) =>
      new Array(count).fill(true).map((_, index) => <Child key={index} />);
    const Child = () => {
      jest.advanceTimersByTime(1);
      return null;
    };

    const container = document.createElement('div');

    act(() => ReactDOM.render(<Parent key="A" count={2} />, container));
    expect(store).toMatchSnapshot('1: mount');

    act(() => store.startProfiling());

    act(() => ReactDOM.render(<Parent key="A" count={3} />, container));
    expect(store).toMatchSnapshot('2: add child');

    act(() => ReactDOM.render(<Parent key="A" count={1} />, container));
    expect(store).toMatchSnapshot('3: remove children');

    act(() => store.stopProfiling());
    expect(store).toMatchSnapshot('4: profiling stopped');

    let profilingSummary;
    function Suspender({ rendererID, rootID }) {
      profilingSummary = store.profilingCache.ProfilingSummary.read({
        rendererID,
        rootID,
      });
      return null;
    }

    // HACK There's only one renderer for this test
    const rendererID = Object.keys(agent._rendererInterfaces)[0];
    const rootID = store.roots[0];

    let root = TestRenderer.create();
    await renderAndResolve(
      root,
      <React.Suspense fallback={null}>
        <Suspender rendererID={rendererID} rootID={rootID} />
      </React.Suspense>
    );

    // HACK root.toTree() doesn't handle Suspense yet
    // but Jest serializer wouldn't work with a JSON string
    expect(profilingSummary).toMatchSnapshot('ProfilingSummary');

    done();
  });

  it('should clean up after a root has been unmounted', async () => {
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

    act(() => store.startProfiling());
    expect(store).toMatchSnapshot('2: profiling started');

    act(() => {
      ReactDOM.render(<Parent key="A" count={4} />, containerA);
      ReactDOM.render(<Parent key="B" count={1} />, containerB);
    });
    expect(store).toMatchSnapshot('3: update');

    act(() => ReactDOM.unmountComponentAtNode(containerB));
    expect(store).toMatchSnapshot('4: unmount B');

    act(() => ReactDOM.unmountComponentAtNode(containerA));
    expect(store).toMatchSnapshot('5: unmount A');

    act(() => store.stopProfiling());
    expect(store).toMatchSnapshot('6: profiling stopped');
  });
});

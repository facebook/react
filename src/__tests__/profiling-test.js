// @flow

describe('profiling', () => {
  let React;
  let ReactDOM;
  let Scheduler;
  let TestRenderer;
  let store;
  let utils;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
    TestRenderer = utils.requireTestRenderer();
  });

  describe('profilingSummary', () => {
    it('should be collected for each commit', async done => {
      const Parent = ({ count }) => {
        Scheduler.advanceTime(10);
        return new Array(count)
          .fill(true)
          .map((_, index) => <Child key={index} />);
      };
      const Child = () => {
        Scheduler.advanceTime(2);
        return null;
      };

      const container = document.createElement('div');

      utils.act(() => ReactDOM.render(<Parent key="A" count={2} />, container));
      expect(store).toMatchSnapshot('1: mount');

      utils.act(() => store.startProfiling());

      utils.act(() => ReactDOM.render(<Parent key="A" count={3} />, container));
      expect(store).toMatchSnapshot('2: add child');

      utils.act(() => ReactDOM.render(<Parent key="A" count={1} />, container));
      expect(store).toMatchSnapshot('3: remove children');

      utils.act(() => store.stopProfiling());
      expect(store).toMatchSnapshot('4: profiling stopped');

      let profilingSummary;
      function Suspender({ rendererID, rootID }) {
        profilingSummary = store.profilingCache.ProfilingSummary.read({
          rendererID,
          rootID,
        });
        return null;
      }

      const rendererID = utils.getRendererID();
      const rootID = store.roots[0];

      await utils.actSuspense(() =>
        TestRenderer.create(
          <React.Suspense fallback={null}>
            <Suspender rendererID={rendererID} rootID={rootID} />
          </React.Suspense>
        )
      );

      expect(profilingSummary).toMatchSnapshot('ProfilingSummary');

      done();
    });
  });

  it('should remove profiling data when roots are unmounted', async () => {
    const Parent = ({ count }) =>
      new Array(count).fill(true).map((_, index) => <Child key={index} />);
    const Child = () => <div>Hi!</div>;

    const containerA = document.createElement('div');
    const containerB = document.createElement('div');

    utils.act(() => {
      ReactDOM.render(<Parent key="A" count={3} />, containerA);
      ReactDOM.render(<Parent key="B" count={2} />, containerB);
    });

    utils.act(() => store.startProfiling());

    utils.act(() => {
      ReactDOM.render(<Parent key="A" count={4} />, containerA);
      ReactDOM.render(<Parent key="B" count={1} />, containerB);
    });

    utils.act(() => ReactDOM.unmountComponentAtNode(containerB));

    utils.act(() => ReactDOM.unmountComponentAtNode(containerA));

    utils.act(() => store.stopProfiling());

    // Assert all maps are empty
    store.assertExpectedRootMapSizes();
  });
});

// @flow

import typeof TestRendererType from 'react-test-renderer';
import type Store from 'src/devtools/store';

describe('commit tree', () => {
  let React;
  let ReactDOM;
  let Scheduler;
  let TestRenderer: TestRendererType;
  let store: Store;
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

  it('should be able to rebuild the store tree for each commit', () => {
    const Parent = ({ count }) => {
      Scheduler.advanceTime(10);
      return new Array(count)
        .fill(true)
        .map((_, index) => <Child key={index} />);
    };
    const Child = React.memo(function Child() {
      Scheduler.advanceTime(2);
      return null;
    });

    const container = document.createElement('div');

    utils.act(() => store.profilerStore.startProfiling());
    utils.act(() => ReactDOM.render(<Parent count={1} />, container));
    utils.act(() => ReactDOM.render(<Parent count={3} />, container));
    utils.act(() => ReactDOM.render(<Parent count={2} />, container));
    utils.act(() => ReactDOM.render(<Parent count={0} />, container));
    utils.act(() => store.profilerStore.stopProfiling());

    let renderFinished = false;

    function Validator({ commitIndex, rootID }) {
      const commitTree = store.profilerStore.profilingCache.getCommitTree({
        commitIndex,
        rootID,
      });
      expect(commitTree).toMatchSnapshot(`${commitIndex}: CommitTree`);
      renderFinished = true;
      return null;
    }

    const rootID = store.roots[0];

    for (let commitIndex = 0; commitIndex < 4; commitIndex++) {
      renderFinished = false;

      utils.act(() => {
        TestRenderer.create(
          <Validator commitIndex={commitIndex} rootID={rootID} />
        );
      });

      expect(renderFinished).toBe(true);
    }
  });
});

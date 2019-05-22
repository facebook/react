// @flow

import type Store from 'src/devtools/store';

describe('ProfilerStore', () => {
  let React;
  let ReactDOM;
  let store: Store;
  let utils;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should not remove profiling data when roots are unmounted', async () => {
    const Parent = ({ count }) =>
      new Array(count)
        .fill(true)
        .map((_, index) => <Child key={index} duration={index} />);
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

    utils.act(() => store.stopProfiling());

    const rootA = store.roots[0];
    const rootB = store.roots[1];

    utils.act(() => ReactDOM.unmountComponentAtNode(containerB));

    expect(store.profilerStore.getDataForRoot(rootA)).not.toBeNull();

    utils.act(() => ReactDOM.unmountComponentAtNode(containerA));

    expect(store.profilerStore.getDataForRoot(rootB)).not.toBeNull();
  });
});

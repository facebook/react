/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type Store from 'react-devtools-shared/src/devtools/store';

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
    store.recordChangeDescriptions = true;

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should not remove profiling data when roots are unmounted', async () => {
    const Parent = ({count}) =>
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

    utils.act(() => store.profilerStore.startProfiling());

    utils.act(() => {
      ReactDOM.render(<Parent key="A" count={4} />, containerA);
      ReactDOM.render(<Parent key="B" count={1} />, containerB);
    });

    utils.act(() => store.profilerStore.stopProfiling());

    const rootA = store.roots[0];
    const rootB = store.roots[1];

    utils.act(() => ReactDOM.unmountComponentAtNode(containerB));

    expect(store.profilerStore.getDataForRoot(rootA)).not.toBeNull();

    utils.act(() => ReactDOM.unmountComponentAtNode(containerA));

    expect(store.profilerStore.getDataForRoot(rootB)).not.toBeNull();
  });

  it('should not allow new/saved profiling data to be set while profiling is in progress', () => {
    utils.act(() => store.profilerStore.startProfiling());
    const fauxProfilingData = {
      dataForRoots: new Map(),
    };
    spyOn(console, 'warn');
    store.profilerStore.profilingData = fauxProfilingData;
    expect(store.profilerStore.profilingData).not.toBe(fauxProfilingData);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      'Profiling data cannot be updated while profiling is in progress.',
    );
    utils.act(() => store.profilerStore.stopProfiling());
    store.profilerStore.profilingData = fauxProfilingData;
    expect(store.profilerStore.profilingData).toBe(fauxProfilingData);
  });

  // This test covers current broken behavior (arguably) with the synthetic event system.
  it('should filter empty commits', () => {
    const inputRef = React.createRef();
    const ControlledInput = () => {
      const [name, setName] = React.useState('foo');
      const handleChange = event => setName(event.target.value);
      return <input ref={inputRef} value={name} onChange={handleChange} />;
    };

    const container = document.createElement('div');

    // This element has to be in the <body> for the event system to work.
    document.body.appendChild(container);

    // It's important that this test uses legacy sync mode.
    // The root API does not trigger this particular failing case.
    ReactDOM.render(<ControlledInput />, container);

    utils.act(() => store.profilerStore.startProfiling());

    // Sets a value in a way that React doesn't see,
    // so that a subsequent "change" event will trigger the event handler.
    const setUntrackedValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    ).set;

    const target = inputRef.current;
    setUntrackedValue.call(target, 'bar');
    target.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
    expect(target.value).toBe('bar');

    utils.act(() => store.profilerStore.stopProfiling());

    // Only one commit should have been recorded (in response to the "change" event).
    const root = store.roots[0];
    const data = store.profilerStore.getDataForRoot(root);
    expect(data.commitData).toHaveLength(1);
    expect(data.operations).toHaveLength(1);
  });
});

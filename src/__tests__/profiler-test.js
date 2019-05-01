// @flow

describe('Profiler', () => {
  let React;
  let ReactDOM;
  let TestUtils;
  let store;

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
  });

  it('should start and stop profiling, handle root unmounting', async () => {
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
      store.startProfiling();
    });
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

    act(() => {
      store.stopProfiling();
    });
    expect(store).toMatchSnapshot('6: profiling stopped');
  });
});

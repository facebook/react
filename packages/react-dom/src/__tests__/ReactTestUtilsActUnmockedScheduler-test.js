/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

// sanity tests to make sure act() works without a mocked scheduler

let React;
let ReactDOM;
let act;
let container;
let yields;

function clearYields() {
  try {
    return yields;
  } finally {
    yields = [];
  }
}

function render(el, dom) {
  ReactDOM.render(el, dom);
}

function unmount(dom) {
  ReactDOM.unmountComponentAtNode(dom);
}

beforeEach(() => {
  jest.resetModules();
  jest.mock('scheduler', () =>
    require.requireActual('scheduler/unstable_no_dom'),
  );
  yields = [];
  React = require('react');
  ReactDOM = require('react-dom');
  act = require('react-dom/test-utils').act;
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  unmount(container);
  document.body.removeChild(container);
});

it('can use act to flush effects', () => {
  function App() {
    React.useEffect(() => {
      yields.push(100);
    });
    return null;
  }

  act(() => {
    render(<App />, container);
  });

  expect(clearYields()).toEqual([100]);
});

it('flushes effects on every call', () => {
  function App() {
    const [ctr, setCtr] = React.useState(0);
    React.useEffect(() => {
      yields.push(ctr);
    });
    return (
      <button id="button" onClick={() => setCtr(x => x + 1)}>
        {ctr}
      </button>
    );
  }

  act(() => {
    render(<App />, container);
  });

  expect(clearYields()).toEqual([0]);

  const button = container.querySelector('#button');
  function click() {
    button.dispatchEvent(new MouseEvent('click', {bubbles: true}));
  }

  act(() => {
    click();
    click();
    click();
  });
  // it consolidates the 3 updates, then fires the effect
  expect(clearYields()).toEqual([3]);
  act(click);
  expect(clearYields()).toEqual([4]);
  act(click);
  expect(clearYields()).toEqual([5]);
  expect(button.innerHTML).toEqual('5');
});

it("should keep flushing effects until they're done", () => {
  function App() {
    const [ctr, setCtr] = React.useState(0);
    React.useEffect(() => {
      if (ctr < 5) {
        setCtr(x => x + 1);
      }
    });
    return ctr;
  }

  act(() => {
    render(<App />, container);
  });

  expect(container.innerHTML).toEqual('5');
});

it('should flush effects only on exiting the outermost act', () => {
  function App() {
    React.useEffect(() => {
      yields.push(0);
    });
    return null;
  }
  // let's nest a couple of act() calls
  act(() => {
    act(() => {
      render(<App />, container);
    });
    // the effect wouldn't have yielded yet because
    // we're still inside an act() scope
    expect(clearYields()).toEqual([]);
  });
  // but after exiting the last one, effects get flushed
  expect(clearYields()).toEqual([0]);
});

it('can handle cascading promises', async () => {
  // this component triggers an effect, that waits a tick,
  // then sets state. repeats this 5 times.
  function App() {
    const [state, setState] = React.useState(0);
    async function ticker() {
      await null;
      setState(x => x + 1);
    }
    React.useEffect(() => {
      yields.push(state);
      ticker();
    }, [Math.min(state, 4)]);
    return state;
  }

  await act(async () => {
    render(<App />, container);
  });
  // all 5 ticks present and accounted for
  expect(clearYields()).toEqual([0, 1, 2, 3, 4]);
  expect(container.innerHTML).toBe('5');
});
